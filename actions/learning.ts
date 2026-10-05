"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { requireUser } from "@/lib/auth";

const completionFields = new Set([
  "anki_done",
  "first_listen_done",
  "transcript_done",
  "final_listen_done",
  "chunks_done",
  "speaking_done",
]);

async function refreshCompletion(dayId: string) {
  const supabase = await createClient();
  const { data } = await supabase
    .from("daily_completion")
    .select("*")
    .eq("learning_day_id", dayId)
    .maybeSingle();

  if (!data) return;
  const completed = Boolean(
    data.anki_done &&
    data.first_listen_done &&
    data.transcript_done &&
    data.final_listen_done &&
    data.chunks_done &&
    data.speaking_done,
  );

  await supabase
    .from("daily_completion")
    .update({ completed, updated_at: new Date().toISOString() })
    .eq("learning_day_id", dayId);

  await supabase
    .from("learning_days")
    .update({ status: completed ? "completed" : "in_progress" })
    .eq("id", dayId);
}

export async function toggleStep(formData: FormData) {
  const user = await requireUser();
  const dayId = String(formData.get("day_id") ?? "");
  const field = String(formData.get("field") ?? "");
  const value = String(formData.get("value") ?? "false") === "true";
  if (!dayId || !completionFields.has(field)) throw new Error("Invalid completion field");

  const supabase = await createClient();
  await supabase.from("daily_completion").upsert({
    learning_day_id: dayId,
    user_id: user.id,
    [field]: value,
    updated_at: new Date().toISOString(),
  }, { onConflict: "learning_day_id" });

  await refreshCompletion(dayId);
  revalidatePath("/today");
  revalidatePath("/dashboard");
  revalidatePath("/plan");
}

export async function saveListeningScore(formData: FormData) {
  const user = await requireUser();
  const dayId = String(formData.get("day_id") ?? "");
  const attemptType = String(formData.get("attempt_type") ?? "first");
  const score = Math.max(0, Math.min(100, Number(formData.get("score") ?? 0)));
  const subtitleUsed = String(formData.get("subtitle_used") ?? "false") === "true";
  if (!dayId) throw new Error("Missing day");

  const supabase = await createClient();
  await supabase.from("listening_attempts").insert({
    user_id: user.id,
    learning_day_id: dayId,
    attempt_type: attemptType,
    comprehension_score: score,
    subtitle_used: subtitleUsed,
  });

  if (attemptType === "first") {
    await supabase.from("daily_completion").upsert({
      learning_day_id: dayId,
      user_id: user.id,
      first_listen_done: true,
      updated_at: new Date().toISOString(),
    }, { onConflict: "learning_day_id" });
  }

  if (attemptType === "final") {
    await supabase.from("daily_completion").upsert({
      learning_day_id: dayId,
      user_id: user.id,
      final_listen_done: score >= 70,
      updated_at: new Date().toISOString(),
    }, { onConflict: "learning_day_id" });
  }

  await refreshCompletion(dayId);
  revalidatePath("/today");
  revalidatePath("/dashboard");
  revalidatePath("/progress");
}

export async function saveContent(formData: FormData) {
  const user = await requireUser();
  const dayId = String(formData.get("day_id") ?? "");
  const title = String(formData.get("title") ?? "").trim();
  const source = String(formData.get("source") ?? "YouTube").trim();
  const sourceUrl = String(formData.get("source_url") ?? "").trim();
  const contentType = String(formData.get("content_type") ?? "native-video").trim();
  const transcript = String(formData.get("transcript") ?? "").trim();
  if (!dayId || !title) throw new Error("Day and title are required");

  const supabase = await createClient();
  await supabase.from("content_items").update({ is_active: false }).eq("learning_day_id", dayId);
  await supabase.from("content_items").insert({
    user_id: user.id,
    learning_day_id: dayId,
    title,
    source,
    source_url: sourceUrl || null,
    transcript: transcript || null,
    content_type: contentType,
    is_active: true,
  });
  revalidatePath("/today");
  revalidatePath("/library");
}

export async function addChunk(formData: FormData) {
  const user = await requireUser();
  const dayId = String(formData.get("day_id") ?? "");
  const phrase = String(formData.get("phrase") ?? "").trim();
  const meaning = String(formData.get("meaning") ?? "").trim();
  const sourceSentence = String(formData.get("source_sentence") ?? "").trim();
  const personalSentence = String(formData.get("personal_sentence") ?? "").trim();
  if (!dayId || !phrase) throw new Error("Phrase is required");

  const supabase = await createClient();
  await supabase.from("chunks").insert({
    user_id: user.id,
    learning_day_id: dayId,
    phrase,
    meaning: meaning || null,
    source_sentence: sourceSentence || null,
    personal_sentence: personalSentence || null,
    status: "new",
  });

  const { count } = await supabase
    .from("chunks")
    .select("id", { count: "exact", head: true })
    .eq("learning_day_id", dayId);
  if ((count ?? 0) >= 5) {
    await supabase.from("daily_completion").upsert({
      learning_day_id: dayId,
      user_id: user.id,
      chunks_done: true,
      updated_at: new Date().toISOString(),
    }, { onConflict: "learning_day_id" });
    await refreshCompletion(dayId);
  }

  revalidatePath("/today");
  revalidatePath("/chunks");
  revalidatePath("/dashboard");
}

export async function saveSpeaking(formData: FormData) {
  const user = await requireUser();
  const dayId = String(formData.get("day_id") ?? "");
  const duration = Math.max(0, Number(formData.get("duration_seconds") ?? 0));
  const retell = Math.max(0, Number(formData.get("retell_duration_seconds") ?? 0));
  const selfScore = Math.max(1, Math.min(5, Number(formData.get("self_score") ?? 3)));
  const noSubScore = Math.max(1, Math.min(5, Number(formData.get("no_sub_score") ?? 3)));
  const notes = String(formData.get("notes") ?? "").trim();
  if (!dayId) throw new Error("Missing day");

  const supabase = await createClient();
  await supabase.from("speaking_sessions").insert({
    user_id: user.id,
    learning_day_id: dayId,
    duration_seconds: duration,
    retell_duration_seconds: retell,
    self_score: selfScore,
    no_sub_score: noSubScore,
    notes: notes || null,
  });

  if (duration >= 600 || retell >= 120) {
    await supabase.from("daily_completion").upsert({
      learning_day_id: dayId,
      user_id: user.id,
      speaking_done: true,
      updated_at: new Date().toISOString(),
    }, { onConflict: "learning_day_id" });
  }
  await refreshCompletion(dayId);
  revalidatePath("/today");
  revalidatePath("/speaking");
  revalidatePath("/progress");
  revalidatePath("/dashboard");
}

export async function saveCheckpoint(formData: FormData) {
  const user = await requireUser();
  const planId = String(formData.get("plan_id") ?? "");
  const week = Number(formData.get("week_number") ?? 1);
  const first = Math.max(0, Math.min(100, Number(formData.get("first_listen_score") ?? 0)));
  const retell = Math.max(0, Number(formData.get("retell_seconds") ?? 0));
  const activeChunks = Math.max(0, Number(formData.get("active_chunks_used") ?? 0));
  const recommendation = String(formData.get("recommendation") ?? "hold");

  const supabase = await createClient();
  await supabase.from("weekly_checkpoints").upsert({
    user_id: user.id,
    plan_id: planId,
    week_number: week,
    first_listen_score: first,
    retell_seconds: retell,
    active_chunks_used: activeChunks,
    recommendation,
  }, { onConflict: "plan_id,week_number" });

  revalidatePath("/checkpoint");
  revalidatePath("/progress");
}
