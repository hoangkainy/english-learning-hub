import Link from "next/link";
import { Download } from "lucide-react";
import { createClient } from "@/lib/supabase/server";

export default async function ChunksPage() {
  const supabase = await createClient();
  const { data: chunks } = await supabase.from("chunks").select("*").order("created_at", {ascending:false});
  return <>
    <div className="page-header"><div><div className="eyebrow">Chunks / Anki</div><h1>Usable English, not word lists.</h1><p>Mine collocations, sentence patterns, phrasal verbs, and phrases you can reuse.</p></div><Link className="btn" href="/api/anki-export"><Download size={16}/> Export TSV</Link></div>
    <div className="grid grid-3" style={{marginBottom:18}}>
      <section className="card flat"><div className="metric-label">Total chunks</div><div className="metric-value">{chunks?.length ?? 0}</div></section>
      <section className="card flat"><div className="metric-label">Learning / mature</div><div className="metric-value">{(chunks ?? []).filter((x:any)=>x.status!=='new').length}</div></section>
      <section className="card flat"><div className="metric-label">Exported to Anki</div><div className="metric-value">{(chunks ?? []).filter((x:any)=>x.exported_to_anki).length}</div></section>
    </div>
    <div className="table-wrap"><table><thead><tr><th>Phrase</th><th>Meaning</th><th>Source context</th><th>Your transfer sentence</th><th>Status</th></tr></thead><tbody>
      {chunks?.length ? chunks.map((c:any)=><tr key={c.id}><td><strong>{c.phrase}</strong></td><td>{c.meaning ?? "—"}</td><td>{c.source_sentence ?? "—"}</td><td>{c.personal_sentence ?? "—"}</td><td><span className={`tag ${c.status==='mature'?'success':''}`}>{c.status}</span></td></tr>) : <tr><td colSpan={5}>No chunks yet. Mine 5–10 from your next session.</td></tr>}
    </tbody></table></div>
  </>;
}
