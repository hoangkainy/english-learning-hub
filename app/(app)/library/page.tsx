import { bootstrapPlan, getActivePlan } from "@/lib/learning";
import { createClient } from "@/lib/supabase/server";

export default async function LibraryPage() {
  await bootstrapPlan();
  const plan = await getActivePlan();
  if (!plan) return null;
  const supabase = await createClient();
  const { data: days } = await supabase.from("learning_days").select("id,date,topic,week_number,day_number").eq("plan_id", plan.id).order("date", {ascending:false});
  const ids = (days ?? []).map((d:any)=>d.id);
  const [{ data: contents }, { data: attempts }, { data: chunks }] = ids.length ? await Promise.all([
    supabase.from("content_items").select("*").in("learning_day_id", ids).eq("is_active", true),
    supabase.from("listening_attempts").select("*").in("learning_day_id", ids),
    supabase.from("chunks").select("id,learning_day_id").in("learning_day_id", ids),
  ]) : [{data:[]},{data:[]},{data:[]} ] as any;

  const rows = (days ?? []).map((day:any) => {
    const c = (contents ?? []).find((x:any)=>x.learning_day_id===day.id);
    const first = (attempts ?? []).filter((x:any)=>x.learning_day_id===day.id && x.attempt_type==='first').at(-1);
    const final = (attempts ?? []).filter((x:any)=>x.learning_day_id===day.id && x.attempt_type==='final').at(-1);
    const count = (chunks ?? []).filter((x:any)=>x.learning_day_id===day.id).length;
    return { day, c, first, final, count };
  }).filter((x:any)=>x.c || x.first || x.final || x.count);

  return <>
    <div className="page-header"><div><div className="eyebrow">Input Library</div><h1>Everything you have studied.</h1><p>Content stays connected to comprehension attempts and mined chunks.</p></div></div>
    <div className="table-wrap"><table><thead><tr><th>Date</th><th>Topic</th><th>Content</th><th>First</th><th>Final</th><th>Chunks</th></tr></thead><tbody>
      {rows.length ? rows.map(({day,c,first,final,count}:any)=><tr key={day.id}><td>{day.date}</td><td>{day.topic}</td><td><strong>{c?.title ?? "No saved title"}</strong><div className="small muted">{c?.source ?? ""}</div></td><td>{first ? `${first.comprehension_score}%` : "—"}</td><td>{final ? `${final.comprehension_score}%` : "—"}</td><td>{count}</td></tr>) : <tr><td colSpan={6}>Your library will fill up as you study.</td></tr>}
    </tbody></table></div>
  </>;
}
