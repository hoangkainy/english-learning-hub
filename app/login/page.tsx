import { sendMagicLink } from "./actions";

export default async function LoginPage({ searchParams }: { searchParams: Promise<Record<string, string | undefined>> }) {
  const params = await searchParams;
  return (
    <main className="login-shell">
      <section className="login-card">
        <div className="eyebrow">Private learning workspace</div>
        <h1>English Learning Hub</h1>
        <p>One focused system for native input, speaking practice, chunks, and measurable progress.</p>
        {params.sent ? <div className="tag success" style={{marginBottom:14}}>Magic link sent to {params.email}</div> : null}
        {params.error ? <div className="tag warning" style={{marginBottom:14}}>{params.error}</div> : null}
        <form action={sendMagicLink} className="stack">
          <div>
            <label className="label" htmlFor="email">Email</label>
            <input className="input" id="email" type="email" name="email" placeholder="you@example.com" required />
          </div>
          <button className="btn" type="submit">Send magic link</button>
        </form>
        <p className="small">No password. Your data is protected by Supabase Auth + Row Level Security.</p>
      </section>
    </main>
  );
}
