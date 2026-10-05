import Link from "next/link";
import { ArrowRight, CalendarCheck2 } from "lucide-react";
import { MetricCard } from "@/components/metric-card";
import { LineChart } from "@/components/line-chart";
import { bootstrapPlan, getActivePlan, getProgressSnapshot, getTodayBundle } from "@/lib/learning";

export default async function DashboardPage() {
  await bootstrapPlan();
  const plan = await getActivePlan();
  if (!plan) return <p>Could not initialize your learning plan.</p>;

  const [snapshot, today] = await Promise.all([
    getProgressSnapshot(plan.id),
    getTodayBundle(plan.id),
  ]);

  const first = snapshot.attempts.filter((a: any) => a.attempt_type === "first").map((a: any) => a.comprehension_score);
  const final = snapshot.attempts.filter((a: any) => a.attempt_type === "final").map((a: any) => a.comprehension_score);
  const completed = snapshot.completions.filter((x: any) => x.completed).length;
  const speakingMinutes = Math.round(snapshot.speaking.reduce((sum: number, x: any) => sum + (x.duration_seconds ?? 0), 0) / 60);
  const activeChunks = snapshot.chunks.filter((x: any) => x.status !== "new").length;
  const week = today?.day?.week_number ?? plan.current_week ?? 1;

  const steps = today ? [
    ["Anki review", today.completion?.anki_done],
    ["First listen", today.completion?.first_listen_done],
    ["Transcript pass", today.completion?.transcript_done],
    ["Final listen ≥70%", today.completion?.final_listen_done],
    ["Mine 5–10 chunks", today.completion?.chunks_done],
    ["Speaking 10 min", today.completion?.speaking_done],
  ] : [];

  const nextTasks = steps.filter(([, done]) => !done).slice(0, 3);

  return (
    <>
      <div className="page-header">
        <div>
          <div className="eyebrow">Dashboard</div>
          <h1>Your English system, at a glance.</h1>
          <p>Focus on the next action. Trends matter more than vanity totals.</p>
        </div>
        <span className="tag">Week {week} / 4</span>
      </div>

      <section className="hero" style={{marginBottom:18}}>
        <div className="eyebrow">Today · Week {today?.day?.week_number ?? 1}, Day {today?.day?.day_number ?? 1}</div>
        <h1 style={{color:"white",marginTop:8}}>{today?.day?.topic ?? "Today's session"}</h1>
        <p>{today?.day?.objective ?? "Open today's session to continue your learning loop."}</p>
        <div className="row" style={{flexWrap:"wrap",marginTop:18}}>
          <Link className="btn" href="/today">Continue today <ArrowRight size={16}/></Link>
          <span className="tag" style={{background:"rgba(255,255,255,.15)", color:"white"}}>{today?.day?.difficulty}</span>
        </div>
      </section>

      <div className="grid grid-4" style={{marginBottom:18}}>
        <MetricCard label="Completed days" value={`${completed}/28`} note={completed ? "Keep the chain moving" : "Start with today's session"}/>
        <MetricCard label="First-listen latest" value={first.length ? `${first.at(-1)}%` : "—"} note="Target: trend upward"/>
        <MetricCard label="Speaking time" value={`${speakingMinutes}m`} note="10 min/day target"/>
        <MetricCard label="Active chunks" value={`${activeChunks}`} note="Use them, don't just recognize them"/>
      </div>

      <div className="grid grid-2">
        <section className="card">
          <div className="row-between"><h2>Next actions</h2><span className="small muted">Only the next 3</span></div>
          <div className="stack">
            {nextTasks.length ? nextTasks.map(([label], idx) => (
              <div className={`step ${idx === 0 ? "current" : ""}`} key={String(label)}>
                <div className="step-title"><span>{label}</span><span className="tag">{idx === 0 ? "Now" : "Next"}</span></div>
              </div>
            )) : <div className="step done"><div className="step-title"><span>Today's outcomes complete</span><span className="check">✓</span></div></div>}
          </div>
        </section>

        <section className="card">
          <div className="row-between"><h2>Listening comprehension</h2><span className="small muted">First vs final</span></div>
          <LineChart primary={final.length ? final : first} secondary={final.length ? first : undefined}/>
          <div className="row" style={{justifyContent:"flex-end"}}><span className="tag"><CalendarCheck2 size={13}/> Weekly checkpoint on Sunday</span></div>
        </section>
      </div>
    </>
  );
}
