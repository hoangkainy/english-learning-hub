import { createClient } from "@/lib/supabase/server";

export default async function SpeakingPage() {
  const supabase = await createClient();
  const { data } = await supabase.from("speaking_sessions").select("*,learning_days(date,topic)").order("created_at", {ascending:false}).limit(30);
  const sessions = data ?? [];
  const totalMinutes = Math.round(sessions.reduce((s:number,x:any)=>s+(x.duration_seconds??0),0)/60);
  const avgScore = sessions.length ? (sessions.reduce((s:number,x:any)=>s+(x.self_score??0),0)/sessions.length).toFixed(1) : "—";
  return <>
    <div className="page-header"><div><div className="eyebrow">Speaking Log</div><h1>Prove you can retrieve English.</h1><p>Shadowing builds rhythm; retelling and transfer build active language.</p></div></div>
    <div className="grid grid-3" style={{marginBottom:18}}><section className="card flat"><div className="metric-label">Recent speaking</div><div className="metric-value">{totalMinutes}m</div></section><section className="card flat"><div className="metric-label">Average self score</div><div className="metric-value">{avgScore}/5</div></section><section className="card flat"><div className="metric-label">Sessions logged</div><div className="metric-value">{sessions.length}</div></section></div>
    <div className="table-wrap"><table><thead><tr><th>Date</th><th>Topic</th><th>Total</th><th>Retell</th><th>Self</th><th>No-sub</th><th>Notes</th></tr></thead><tbody>{sessions.length ? sessions.map((s:any)=><tr key={s.id}><td>{s.learning_days?.date ?? "—"}</td><td>{s.learning_days?.topic ?? "—"}</td><td>{Math.round((s.duration_seconds??0)/60)}m</td><td>{s.retell_duration_seconds ?? 0}s</td><td>{s.self_score ?? "—"}/5</td><td>{s.no_sub_score ?? "—"}/5</td><td>{s.notes ?? "—"}</td></tr>) : <tr><td colSpan={7}>No speaking sessions yet.</td></tr>}</tbody></table></div>
  </>;
}
