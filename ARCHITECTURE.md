# Architecture

```text
Browser
  ↓
Next.js App Router on Vercel
  ├─ Server Components
  ├─ Server Actions
  ├─ Route Handlers (Anki export)
  └─ Supabase SSR session cookies
       ↓
Supabase
  ├─ Auth
  ├─ PostgreSQL
  └─ Row Level Security
```

## Ownership model

Every user-owned learning table has a `user_id`. RLS policies require:

```sql
user_id = auth.uid()
```

`profiles` uses `id = auth.uid()`.

## Core hierarchy

```text
learning_plans
  └─ learning_days
       ├─ content_items
       ├─ listening_attempts
       ├─ chunks
       ├─ speaking_sessions
       └─ daily_completion

weekly_checkpoints
anki_exports
```

## Learning loop

```text
Anki review
→ first listen (no subs)
→ transcript pass (English only)
→ final listen + mine 5–10 chunks
→ shadowing
→ retelling
→ transfer speaking
→ completion + analytics
```
