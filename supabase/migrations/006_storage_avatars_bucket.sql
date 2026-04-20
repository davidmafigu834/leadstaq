-- Optional: create public bucket for user avatars (Supabase Dashboard → Storage can also create this)
insert into storage.buckets (id, name, public)
values ('avatars', 'avatars', true)
on conflict (id) do nothing;
