import { LineChart } from "@/components/line-chart";
import { MetricCard } from "@/components/metric-card";
import { bootstrapPlan, getActivePlan, getProgressSnapshot } from "@/lib/learning";

export default async function ProgressPage() {
  await bootstrapPlan();
  const plan = await getActivePlan(); if(!plan) return null;
  const s = await getProgressSnapshot(plan.id);
  const first = s.attempts.filter((x:any)=>x.attempt_type==='first').map((x:any)=>x.comprehension_score);
  const final = s.attempts.filter((x:any)=>x.attempt_type==='final').map((x:any)=>x.comprehension_score);
  const completed = s.completions.filter((x:any)=>x.completed).length;
  const speakingMinutes = Math.round(s.speaking.reduce((sum:number,x:any)=>sum+(x.duration_seconds??0),0)/60);
  const avgFirst = first.length ? Math.round(first.reduce((a:number,b:number)=>a+b,0)/first.length) : 0;
  const avgFinal = final.length ? Math.round(final.reduce((a:number,b:number)=>a+b,0)/final.length) : 0;
  return <>
    <div className="page-header"><div><div className="eyebrow">Progress</div><h1>Track trends, not study theater.</h1><p>The important question is whether unseen native English becomes easier and your retell becomes longer.</p></div></div>
    <div className="grid grid-4" style={{marginBottom:18}}><MetricCard label="Days complete" value={`${completed}/28`}/><MetricCard label="Avg first listen" value={first.length?`${avgFirst}%`:'—'}/><MetricCard label="Avg final listen" value={final.length?`${avgFinal}%`:'—'}/><MetricCard label="Speaking total" value={`${speakingMinutes}m`}/></div>
    <div className="grid grid-2"><section className="card"><div className="row-between"><h2>Comprehension trend</h2><span className="small muted">solid = final · dashed = first</span></div><LineChart primary={final.length?final:first} secondary={final.length?first:undefined}/></section><section className="card"><h2>Weekly checkpoints</h2><div className="stack">{s.checkpoints.length ? s.checkpoints.map((c:any)=><div className="step" key={c.id}><div className="row-between"><strong>Week {c.week_number}</strong><span className={`tag ${c.recommendation==='difficulty_up'?'success':'warning'}`}>{c.recommendation}</span></div><p className="small">First listen {c.first_listen_score ?? '—'}% · Retell {c.retell_seconds ?? 0}s · Active chunks {c.active_chunks_used ?? 0}</p></div>) : <p>No checkpoint yet. Sunday is your independent test.</p>}</div></section></div>
  </>;
}
