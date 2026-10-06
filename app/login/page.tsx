import { signInWithPassword } from "./actions";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | undefined>>;
}) {
  const params = await searchParams;

  return (
    <main className="login-shell">
      <section className="login-card">
        <div className="eyebrow">Private learning workspace</div>
        <h1>English Learning Hub</h1>
        <p>Sign in to continue your native-input, speaking, and progress workflow.</p>

        {params.error ? (
          <div className="tag warning" style={{ marginBottom: 14 }}>
            {params.error}
          </div>
        ) : null}

        <form action={signInWithPassword} className="stack">
          <div>
            <label className="label" htmlFor="username">Username</label>
            <input className="input" id="username" name="username" autoComplete="username" placeholder="hoangkainy" required />
          </div>

          <div>
            <label className="label" htmlFor="password">Password</label>
            <input className="input" id="password" type="password" name="password" autoComplete="current-password" required />
          </div>

          <button className="btn" type="submit">Sign in</button>
        </form>

        <p className="small">Single-user login. No public sign-up and no email magic link.</p>
      </section>
    </main>
  );
}
