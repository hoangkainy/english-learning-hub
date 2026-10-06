# English Learning Hub

A private English learning workspace built with Next.js, Supabase and Vercel.

## Authentication

The production app uses a single-user username/password login.

The browser only sees a username and password. Server-side environment variables map the username to a private Supabase Auth email identity:

```bash
LOGIN_USERNAME=hoangkainy
LOGIN_EMAIL=hoangkainy@english-learning-hub.local
```

Create that user once in **Supabase Dashboard → Authentication → Users** and assign the password you want. The internal email does not need to receive mail, so SMTP is not required.

For a private single-user deployment, disable public user sign-ups after creating the account.

## Environment variables

```bash
NEXT_PUBLIC_SUPABASE_URL=https://YOUR_PROJECT.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=sb_publishable_YOUR_KEY
LOGIN_USERNAME=hoangkainy
LOGIN_EMAIL=hoangkainy@english-learning-hub.local
```

Never expose a Supabase secret/service-role key through a `NEXT_PUBLIC_` variable.

## Stack

- Next.js App Router + TypeScript
- Supabase Auth + PostgreSQL + RLS
- Vercel deployment
- Anki TSV export

## App areas

- `/dashboard`
- `/today`
- `/plan`
- `/library`
- `/chunks`
- `/speaking`
- `/progress`
- `/checkpoint`

## Completion rule

A day is complete when all six outcome gates are met:

1. Anki review done
2. First listen logged
3. English transcript pass done
4. Final no-sub listen reaches at least 70%
5. At least 5 chunks captured
6. Speaking outcome met: 10 minutes total or at least 2 minutes retell
