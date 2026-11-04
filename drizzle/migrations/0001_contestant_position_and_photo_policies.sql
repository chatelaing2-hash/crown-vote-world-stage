alter table public.contestants add column if not exists position int;
create policy "public read contestant photos" on storage.objects for select using (bucket_id = 'contestant-photos');
create policy "managers upload contestant photos" on storage.objects for insert to authenticated
  with check (bucket_id = 'contestant-photos' and (public.has_role(auth.uid(), 'super_admin') or public.has_role(auth.uid(), 'organizer')));
create policy "managers update contestant photos" on storage.objects for update to authenticated
  using (bucket_id = 'contestant-photos' and (public.has_role(auth.uid(), 'super_admin') or public.has_role(auth.uid(), 'organizer')));
create policy "managers delete contestant photos" on storage.objects for delete to authenticated
  using (bucket_id = 'contestant-photos' and (public.has_role(auth.uid(), 'super_admin') or public.has_role(auth.uid(), 'organizer')));