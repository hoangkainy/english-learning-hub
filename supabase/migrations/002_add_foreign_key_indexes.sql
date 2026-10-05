create index if not exists anki_exports_user_idx on public.anki_exports(user_id);
create index if not exists chunks_learning_day_idx on public.chunks(learning_day_id);
create index if not exists content_items_user_idx on public.content_items(user_id);
create index if not exists daily_completion_user_idx on public.daily_completion(user_id);
create index if not exists learning_days_user_idx on public.learning_days(user_id);
create index if not exists listening_attempts_user_idx on public.listening_attempts(user_id);
create index if not exists speaking_sessions_user_idx on public.speaking_sessions(user_id);
create index if not exists weekly_checkpoints_user_idx on public.weekly_checkpoints(user_id);
