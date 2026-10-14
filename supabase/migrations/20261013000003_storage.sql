-- Buckets. Uploads happen server-side through the S3-compatible API (service credentials),
-- so no client-side storage write policies are created: anon/authenticated can only READ public objects.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values
  ('public-media', 'public-media', true, 5242880, array['image/jpeg','image/png','image/webp']),
  ('private-uploads', 'private-uploads', false, 20971520, array['image/jpeg','image/png','image/webp','application/pdf','application/zip','model/stl','model/3mf','application/octet-stream'])
on conflict (id) do update
  set public = excluded.public,
      file_size_limit = excluded.file_size_limit,
      allowed_mime_types = excluded.allowed_mime_types;
