import { Check, ExternalLink, Plus, TimerReset } from "lucide-react";
import { addChunk, saveContent, saveListeningScore, saveSpeaking, toggleStep } from "@/actions/learning";
import { bootstrapPlan, getActivePlan, getTodayBundle } from "@/lib/learning";

function StepState({ done }: { done?: boolean }) {
  return done ? <span className="check"><Check size={13}/></span> : <span className="tag">Upcoming</span>;
}

export default async function TodayPage() {
  await bootstrapPlan();
  const plan = await getActivePlan();
  if (!plan) return null;
  const bundle = await getTodayBundle(plan.id);
  if (!bundle) return <p>No learning day found.</p>;

  const { day, completion, content, attempts, chunks, speaking } = bundle as any;
  const firstAttempt = attempts.find((x:any) => x.attempt_type === "first");
  const finalAttempt = [...attempts].reverse().find((x:any) => x.attempt_type === "final");
  const completedCount = [completion?.anki_done, completion?.first_listen_done, completion?.transcript_done, completion?.final_listen_done, completion?.chunks_done, completion?.speaking_done].filter(Boolean).length;

  return (
    <>
      <div className="page-header">
        <div>
          <div className="eyebrow">Today · Week {day.week_number}, Day {day.day_number}</div>
          <h1>{day.topic}</h1>
          <p>{day.objective}</p>
        </div>
        <div style={{minWidth:220}}>
          <div className="row-between small"><span>Session progress</span><strong>{completedCount}/6</strong></div>
          <div className="progress-track" style={{marginTop:8}}><div className="progress-fill" style={{width:`${Math.round(completedCount/6*100)}%`}}/></div>
        </div>
      </div>

      <div className="grid" style={{gridTemplateColumns:"minmax(0,1.4fr) minmax(300px,.6fr)",alignItems:"start"}}>
        <div className="stack">
          <section className="card">
            <div className="row-between"><div><div className="eyebrow">Today's content</div><h2>{content?.title ?? "Add a native-speaker video"}</h2></div>{content?.source_url ? <a className="btn secondary" href={content.source_url} target="_blank" rel="noreferrer">Watch original <ExternalLink size={15}/></a> : null}</div>
            {content ? (
              <>
                <p>{content.source ?? "Source"} · {content.content_type ?? "native video"}</p>
                {content.transcript ? <div className="card flat" style={{background:"var(--surface-2)",maxHeight:280,overflow:"auto",marginTop:14}}><div className="eyebrow">Transcript</div><p style={{whiteSpace:"pre-wrap",color:"var(--text)"}}>{content.transcript}</p><div className="tag">Tip: copy any useful phrase into Quick Capture below</div></div> : <p className="small">No transcript saved yet. You can replace this content and paste one when available.</p>}
              </>
            ) : (
              <form action={saveContent} className="stack" style={{marginTop:16}}>
                <input type="hidden" name="day_id" value={day.id}/>
                <div className="form-grid"><div><label className="label">Title</label><input className="input" name="title" placeholder="Video title" required/></div><div><label className="label">Source URL</label><input className="input" name="source_url" placeholder="https://youtube.com/..."/></div></div>
                <div className="form-grid"><div><label className="label">Source</label><input className="input" name="source" defaultValue="YouTube"/></div><div><label className="label">Content type</label><input className="input" name="content_type" defaultValue="native-video"/></div></div>
                <div><label className="label">Transcript (optional)</label><textarea className="textarea" name="transcript" placeholder="Paste English transcript here"/></div>
                <button className="btn" type="submit">Save today's content</button>
              </form>
            )}
          </section>

          <section className={`step ${completion?.anki_done ? "done" : "current"}`}>
            <div className="step-title"><span>1. Anki Review · target 10 min</span><StepState done={completion?.anki_done}/></div>
            <p className="step-meta">Finish due cards first. New cards come after the input session.</p>
            {!completion?.anki_done ? <form action={toggleStep}><input type="hidden" name="day_id" value={day.id}/><input type="hidden" name="field" value="anki_done"/><input type="hidden" name="value" value="true"/><button className="btn secondary" type="submit">Mark Anki done</button></form> : null}
          </section>

          <section className={`step ${completion?.first_listen_done ? "done" : "current"}`}>
            <div className="step-title"><span>2. First Listen · no subtitles</span><StepState done={completion?.first_listen_done}/></div>
            <p className="step-meta">One uninterrupted pass. Estimate meaning, not individual words.</p>
            <form action={saveListeningScore} className="row" style={{alignItems:"end",flexWrap:"wrap"}}>
              <input type="hidden" name="day_id" value={day.id}/><input type="hidden" name="attempt_type" value="first"/><input type="hidden" name="subtitle_used" value="false"/>
              <div style={{minWidth:220}}><label className="label">Comprehension %</label><input className="input" type="number" min="0" max="100" name="score" defaultValue={firstAttempt?.comprehension_score ?? 45}/></div>
              <button className="btn" type="submit">Save first listen</button>
            </form>
          </section>

          <section className={`step ${completion?.transcript_done ? "done" : ""}`}>
            <div className="step-title"><span>3. Transcript Pass · English only</span><StepState done={completion?.transcript_done}/></div>
            <p className="step-meta">Listen again with English transcript/subtitles. Resolve only the parts blocking comprehension.</p>
            {!completion?.transcript_done ? <form action={toggleStep}><input type="hidden" name="day_id" value={day.id}/><input type="hidden" name="field" value="transcript_done"/><input type="hidden" name="value" value="true"/><button className="btn secondary" type="submit">Transcript pass done</button></form> : null}
          </section>

          <section className="card">
            <div className="row-between"><div><div className="eyebrow">4. Final listen · no subtitles</div><h2>Prove the input became easier.</h2></div>{finalAttempt ? <span className={completion?.final_listen_done ? "tag success" : "tag warning"}>{finalAttempt.comprehension_score}%</span> : null}</div>
            <form action={saveListeningScore} className="row" style={{alignItems:"end",flexWrap:"wrap"}}>
              <input type="hidden" name="day_id" value={day.id}/><input type="hidden" name="attempt_type" value="final"/><input type="hidden" name="subtitle_used" value="false"/>
              <div style={{minWidth:220}}><label className="label">Final comprehension %</label><input className="input" type="number" min="0" max="100" name="score" defaultValue={finalAttempt?.comprehension_score ?? 75}/></div>
              <button className="btn secondary" type="submit">Save final listen</button>
            </form>
          </section>

          <section className={`step ${completion?.chunks_done ? "done" : ""}`}>
            <div className="step-title"><span>5. Mine useful chunks · 5–10 items</span><StepState done={completion?.chunks_done}/></div>
            <p className="step-meta">Capture phrases you can realistically hear or use. Prefer chunks over isolated words.</p>
            <form action={addChunk} className="stack">
              <input type="hidden" name="day_id" value={day.id}/>
              <div className="form-grid"><div><label className="label">Phrase</label><input className="input" name="phrase" placeholder="it turns out that..." required/></div><div><label className="label">Meaning</label><input className="input" name="meaning" placeholder="cuối cùng phát hiện ra rằng..."/></div></div>
              <div><label className="label">Source sentence</label><input className="input" name="source_sentence" placeholder="It turns out that the battery wasn't the problem."/></div>
              <div><label className="label">Your transfer sentence</label><input className="input" name="personal_sentence" placeholder="It turns out that Redis wasn't the root cause."/></div>
              <button className="btn secondary" type="submit"><Plus size={15}/> Quick capture</button>
            </form>
            {chunks.length ? <div className="stack" style={{marginTop:14}}>{chunks.map((c:any)=><div className="card flat" key={c.id} style={{padding:12}}><strong>{c.phrase}</strong><div className="small muted">{c.personal_sentence || c.source_sentence || c.meaning}</div></div>)}</div> : null}
          </section>

          <section className={`step ${completion?.speaking_done ? "done" : ""}`}>
            <div className="step-title"><span>6. Speaking · 10 minutes</span><StepState done={completion?.speaking_done}/></div>
            <p className="step-meta">3 min shadowing → 4 min retelling → 3 min transfer. A 2-minute retell can satisfy the outcome gate.</p>
            <form action={saveSpeaking} className="stack">
              <input type="hidden" name="day_id" value={day.id}/>
              <div className="form-grid"><div><label className="label">Total seconds</label><input className="input" type="number" name="duration_seconds" defaultValue={speaking?.duration_seconds ?? 600}/></div><div><label className="label">Retell seconds</label><input className="input" type="number" name="retell_duration_seconds" defaultValue={speaking?.retell_duration_seconds ?? 120}/></div></div>
              <div className="form-grid"><div><label className="label">Self score 1–5</label><input className="input" type="number" min="1" max="5" name="self_score" defaultValue={speaking?.self_score ?? 3}/></div><div><label className="label">No-sub score 1–5</label><input className="input" type="number" min="1" max="5" name="no_sub_score" defaultValue={speaking?.no_sub_score ?? 3}/></div></div>
              <div><label className="label">Notes</label><textarea className="textarea" name="notes" defaultValue={speaking?.notes ?? ""} placeholder="What was hard? Which chunks did you reuse?"/></div>
              <button className="btn" type="submit"><TimerReset size={15}/> Save speaking session</button>
            </form>
          </section>
        </div>

        <aside className="stack" style={{position:"sticky",top:92}}>
          <section className="card"><div className="eyebrow">Outcome gate</div><h2>{completion?.completed ? "Day complete ✓" : "Not complete yet"}</h2><div className="stack">{[
            ["Anki due cards",completion?.anki_done],["First listen logged",completion?.first_listen_done],["Transcript pass",completion?.transcript_done],["Final listen ≥70%",completion?.final_listen_done],["5+ chunks captured",completion?.chunks_done],["Speaking outcome",completion?.speaking_done]
          ].map(([label,done])=><div className="row-between small" key={String(label)}><span>{label}</span><span className={done ? "tag success":"tag"}>{done ? "Done":"Pending"}</span></div>)}</div></section>
          <section className="card"><div className="eyebrow">Actual vs target</div><h2>60-minute routine</h2><p className="small">Anki 10 · First listen 10 · Transcript 10 · Final + mining 10 · Speaking 10 · tracking/buffer 10.</p></section>
          <section className="card"><div className="eyebrow">Listening change</div><div className="metric-value">{firstAttempt ? `${firstAttempt.comprehension_score}%` : "—"} → {finalAttempt ? `${finalAttempt.comprehension_score}%` : "—"}</div><p className="small">Target after study: roughly 75–85% comprehension.</p></section>
        </aside>
      </div>
    </>
  );
}
