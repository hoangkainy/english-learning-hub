# English Learning Hub

A private, production-style English learning app built around:

- Native-first comprehensible input
- 60-minute structured daily sessions
- 5–10 useful chunks/day
- 10 minutes speaking/day
- Anki as the spaced-repetition engine
- Weekly unseen-content checkpoints
- Progress tracking based on listening and speaking outcomes

## Stack

- Next.js App Router + TypeScript
- Supabase Postgres + Auth + Row Level Security
- `@supabase/ssr` cookie-based sessions
- Vercel-ready deployment
- Plain CSS design system (easy to swap for shadcn/Tailwind later)

## 1. Create Supabase project

Create a Supabase project, then open **SQL Editor** and run:

`supabase/migrations/001_init.sql`

This creates the learning schema, RLS policies, user profile trigger, and the idempotent 4-week plan bootstrap function.

## 2. Configure Auth

In Supabase Auth URL configuration, add:

- Local site URL: `http://localhost:3000`
- Local redirect: `http://localhost:3000/dashboard`
- Production redirect: `https://YOUR-VERCEL-DOMAIN/dashboard`

Magic-link login is used by default.
### Magic Link template for SSR

Because this app stores sessions in cookies via `@supabase/ssr`, update the **Magic Link** email template to point at the server verification route:

```html
<h2>Sign in to English Learning Hub</h2>
<p><a href="{{ .SiteURL }}/auth/confirm?token_hash={{ .TokenHash }}&type=email&next={{ .RedirectTo }}">Sign in</a></p>
```

This lets `/auth/confirm` call `verifyOtp()` on the server and set the authenticated session cookies before redirecting to the app.


## 3. Environment variables

Copy `.env.example` to `.env.local` and set:

```bash
NEXT_PUBLIC_SUPABASE_URL=https://YOUR_PROJECT.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=sb_publishable_YOUR_KEY
```

Do **not** put a Supabase secret/service-role key in a `NEXT_PUBLIC_` variable.

## 4. Run locally

```bash
npm install
npm run dev
```

Open `http://localhost:3000`.

## 5. Deploy to Vercel

Push the repository to GitHub and import it in Vercel.

Add the same two environment variables in Vercel Project Settings → Environment Variables, then deploy.

After Vercel gives you a production URL, add that URL and `/auth/callback` redirect to Supabase Auth URL configuration.

## App areas

- `/dashboard` — next action + progress snapshot
- `/today` — structured 60-minute learning workflow
- `/plan` — complete 4-week plan
- `/library` — studied input + comprehension history
- `/chunks` — reusable English chunks + Anki TSV export
- `/speaking` — speaking/retell history
- `/progress` — listening, speaking, checkpoints
- `/checkpoint` — weekly unseen-content test

## Completion rule

A day is complete when all six outcome gates are met:

1. Anki review done
2. First listen logged
3. English transcript pass done
4. Final no-sub listen reaches at least 70%
5. At least 5 chunks captured
6. Speaking outcome met (10 minutes total **or** at least 2 minutes retell)

Final-listen comprehension is also used as a completion gate so a session cannot be marked complete only by checking boxes.

## Suggested next milestone (M2 polish)

- YouTube metadata/transcript ingestion
- Rich quick-capture from highlighted transcript text
- Real session timer and sticky mini-player
- Chunk status editing + better Anki export templates
- Day/content editing from calendar
- Automatic `current_week` progression
- Optional voice recording/storage

## Suggested M3

- AI difficulty estimation
- AI chunk suggestions
- AI shadowing/retelling prompts
- Weekly recommendation engine
- Personalized plan adaptation from checkpoint data
