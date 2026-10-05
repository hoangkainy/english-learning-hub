import { createClient } from "@/lib/supabase/server";

export async function bootstrapPlan() {
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("bootstrap_learning_plan");
  if (error) throw error;
  return data as string;
}

export async function getActivePlan() {
  const supabase = await createClient();
  const { data } = await supabase
    .from("learning_plans")
    .select("*")
    .eq("status", "active")
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  return data;
}

export async function getPlanDays(planId: string) {
  const supabase = await createClient();
  const { data } = await supabase
    .from("learning_days")
    .select("*")
    .eq("plan_id", planId)
    .order("date", { ascending: true });
  return data ?? [];
}

export async function getTodayBundle(planId: string) {
  const supabase = await createClient();
  const today = new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Ho_Chi_Minh" }).format(new Date());

  let { data: day } = await supabase
    .from("learning_days")
    .select("*")
    .eq("plan_id", planId)
    .eq("date", today)
    .maybeSingle();

  if (!day) {
    const fallback = await supabase
      .from("learning_days")
      .select("*")
      .eq("plan_id", planId)
      .gte("date", today)
      .order("date", { ascending: true })
      .limit(1)
      .maybeSingle();
    day = fallback.data;
  }

  if (!day) return null;

  const [{ data: completion }, { data: content }, { data: attempts }, { data: chunks }, { data: speaking }] = await Promise.all([
    supabase.from("daily_completion").select("*").eq("learning_day_id", day.id).maybeSingle(),
    supabase.from("content_items").select("*").eq("learning_day_id", day.id).eq("is_active", true).maybeSingle(),
    supabase.from("listening_attempts").select("*").eq("learning_day_id", day.id).order("created_at", { ascending: true }),
    supabase.from("chunks").select("*").eq("learning_day_id", day.id).order("created_at", { ascending: true }),
    supabase.from("speaking_sessions").select("*").eq("learning_day_id", day.id).order("created_at", { ascending: false }).limit(1).maybeSingle(),
  ]);

  return { day, completion, content, attempts: attempts ?? [], chunks: chunks ?? [], speaking };
}

export async function getProgressSnapshot(planId: string) {
  const supabase = await createClient();
  const { data: days } = await supabase.from("learning_days").select("id,date,week_number,day_number,topic,status").eq("plan_id", planId).order("date");
  const ids = (days ?? []).map(d => d.id);
  if (!ids.length) return { days: [], completions: [], attempts: [], chunks: [], speaking: [], checkpoints: [] };

  const [{ data: completions }, { data: attempts }, { data: chunks }, { data: speaking }, { data: checkpoints }] = await Promise.all([
    supabase.from("daily_completion").select("*").in("learning_day_id", ids),
    supabase.from("listening_attempts").select("*").in("learning_day_id", ids).order("created_at"),
    supabase.from("chunks").select("*").in("learning_day_id", ids),
    supabase.from("speaking_sessions").select("*").in("learning_day_id", ids),
    supabase.from("weekly_checkpoints").select("*").eq("plan_id", planId).order("week_number"),
  ]);
  return { days: days ?? [], completions: completions ?? [], attempts: attempts ?? [], chunks: chunks ?? [], speaking: speaking ?? [], checkpoints: checkpoints ?? [] };
}
