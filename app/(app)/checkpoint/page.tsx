import { saveCheckpoint } from "@/actions/learning";
import { bootstrapPlan, getActivePlan, getProgressSnapshot, getTodayBundle } from "@/lib/learning";

export default async function CheckpointPage() {
  await bootstrapPlan(); const plan=await getActivePlan(); if(!plan) return null;
  const [s, today] = await Promise.all([getProgressSnapshot(plan.id), getTodayBundle(plan.id)]);
  const currentWeek = Math.min(4, Math.max(1, Number(today?.day?.week_number ?? plan.current_week ?? 1)));
  const existing = s.checkpoints.find((x:any)=>x.week_number===currentWeek);
  return <>
    <div className="page-header"><div><div className="eyebrow">Weekly Checkpoint</div><h1>Use unseen content.</h1><p>No coaching during the first pass. This is the test that separates real progress from familiarity with one clip.</p></div><span className="tag warning">Week {currentWeek}</span></div>
    <div className="grid grid-2">
      <section className="card"><h2>Checkpoint protocol</h2><div className="stack"><div className="step"><strong>1. Unseen native content</strong><p className="small">Same general difficulty as this week. No Vietnamese subtitles.</p></div><div className="step"><strong>2. First listen</strong><p className="small">Log comprehension before transcript or replay.</p></div><div className="step"><strong>3. Retell 2–5 minutes</strong><p className="small">Speak without reading a script.</p></div><div className="step"><strong>4. Reuse prior chunks</strong><p className="small">Count how many older chunks appear naturally.</p></div></div></section>
      <section className="card"><h2>Log result</h2><form action={saveCheckpoint} className="stack"><input type="hidden" name="plan_id" value={plan.id}/><input type="hidden" name="week_number" value={currentWeek}/><div><label className="label">First-listen comprehension %</label><input className="input" type="number" min="0" max="100" name="first_listen_score" defaultValue={existing?.first_listen_score ?? 45}/></div><div><label className="label">Retell seconds</label><input className="input" type="number" min="0" name="retell_seconds" defaultValue={existing?.retell_seconds ?? 120}/></div><div><label className="label">Prior chunks used actively</label><input className="input" type="number" min="0" name="active_chunks_used" defaultValue={existing?.active_chunks_used ?? 3}/></div><div><label className="label">Recommendation</label><select className="select" name="recommendation" defaultValue={existing?.recommendation ?? 'hold'}><option value="hold">Hold difficulty</option><option value="difficulty_up">Increase difficulty</option><option value="repeat_week">Repeat this level</option></select></div><button className="btn" type="submit">Save checkpoint</button></form></section>
    </div>
  </>;
}
