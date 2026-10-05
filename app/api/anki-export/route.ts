import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

function clean(value: string | null | undefined) {
  return (value ?? "").replace(/\t/g, " ").replace(/\r?\n/g, " ");
}

export async function GET() {
  const supabase = await createClient();
  const { data: userData } = await supabase.auth.getUser();
  if (!userData.user) return NextResponse.json({error:"Unauthorized"},{status:401});

  const { data: chunks } = await supabase.from("chunks").select("*").eq("exported_to_anki", false).order("created_at");
  const rows = (chunks ?? []).map((c:any)=>[
    clean(c.phrase),
    clean(c.meaning),
    clean(c.source_sentence),
    clean(c.personal_sentence),
  ].join("\t"));
  const body = ["Phrase\tMeaning\tSource sentence\tTransfer sentence", ...rows].join("\n");

  if (chunks?.length) {
    await supabase.from("chunks").update({exported_to_anki:true}).in("id", chunks.map((c:any)=>c.id));
    await supabase.from("anki_exports").insert({user_id:userData.user.id,item_count:chunks.length,format:"tsv"});
  }

  return new NextResponse(body, {
    headers: {
      "Content-Type":"text/tab-separated-values; charset=utf-8",
      "Content-Disposition":`attachment; filename="english-learning-hub-anki-${new Date().toISOString().slice(0,10)}.tsv"`,
    },
  });
}
