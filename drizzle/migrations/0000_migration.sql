
create type public.app_role as enum ('super_admin', 'organizer', 'user');
create type public.pageant_category as enum ('miss', 'mister');
create type public.application_status as enum ('pending', 'approved', 'rejected');

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text,
  email text,
  created_at timestamptz not null default now()
);
grant select, insert, update on public.profiles to authenticated;
grant all on public.profiles to service_role;
alter table public.profiles enable row level security;

create table public.user_roles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  role app_role not null,
  unique (user_id, role)
);
grant select on public.user_roles to authenticated;
grant all on public.user_roles to service_role;
alter table public.user_roles enable row level security;

create or replace function public.has_role(_user_id uuid, _role app_role)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.user_roles where user_id = _user_id and role = _role)
$$;

create policy "own roles or admin" on public.user_roles for select to authenticated
  using (user_id = auth.uid() or public.has_role(auth.uid(), 'super_admin'));
create policy "admin manage roles" on public.user_roles for all to authenticated
  using (public.has_role(auth.uid(), 'super_admin')) with check (public.has_role(auth.uid(), 'super_admin'));

create policy "own profile or admin read" on public.profiles for select to authenticated
  using (id = auth.uid() or public.has_role(auth.uid(), 'super_admin'));
create policy "own profile update" on public.profiles for update to authenticated using (id = auth.uid());

create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, display_name, email)
  values (new.id, coalesce(new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'name', split_part(new.email,'@',1)), new.email);
  insert into public.user_roles (user_id, role) values (new.id, 'user');
  if not exists (select 1 from public.user_roles where role = 'super_admin') then
    insert into public.user_roles (user_id, role) values (new.id, 'super_admin');
  end if;
  return new;
end; $$;
create trigger on_auth_user_created after insert on auth.users
  for each row execute function public.handle_new_user();

create table public.organizer_applications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null unique,
  organization_name text not null,
  country text,
  website text,
  message text,
  status application_status not null default 'pending',
  created_at timestamptz not null default now()
);
grant select, insert, update, delete on public.organizer_applications to authenticated;
grant all on public.organizer_applications to service_role;
alter table public.organizer_applications enable row level security;
create policy "apply self" on public.organizer_applications for insert to authenticated
  with check (user_id = auth.uid() and status = 'pending');
create policy "read own or admin" on public.organizer_applications for select to authenticated
  using (user_id = auth.uid() or public.has_role(auth.uid(), 'super_admin'));
create policy "admin update" on public.organizer_applications for update to authenticated
  using (public.has_role(auth.uid(), 'super_admin'));
create policy "admin delete" on public.organizer_applications for delete to authenticated
  using (public.has_role(auth.uid(), 'super_admin'));

create or replace function public.review_organizer(_application_id uuid, _approve boolean)
returns void language plpgsql security definer set search_path = public as $$
declare _uid uuid;
begin
  if not public.has_role(auth.uid(), 'super_admin') then raise exception 'Forbidden'; end if;
  update public.organizer_applications set status = case when _approve then 'approved'::application_status else 'rejected'::application_status end
    where id = _application_id returning user_id into _uid;
  if _approve then
    insert into public.user_roles (user_id, role) values (_uid, 'organizer') on conflict do nothing;
  else
    delete from public.user_roles where user_id = _uid and role = 'organizer';
  end if;
end; $$;

create table public.competitions (
  id uuid primary key default gen_random_uuid(),
  organizer_id uuid,
  title text not null,
  slug text not null unique,
  category pageant_category not null,
  edition text,
  description text,
  cover_url text,
  voting_open boolean not null default false,
  voting_starts_at timestamptz,
  voting_ends_at timestamptz,
  published boolean not null default true,
  created_at timestamptz not null default now()
);
grant select on public.competitions to anon;
grant select, insert, update, delete on public.competitions to authenticated;
grant all on public.competitions to service_role;
alter table public.competitions enable row level security;
create policy "public read published" on public.competitions for select to anon, authenticated
  using (published or organizer_id = auth.uid() or public.has_role(auth.uid(), 'super_admin'));
create policy "organizer create" on public.competitions for insert to authenticated
  with check ((public.has_role(auth.uid(), 'organizer') and organizer_id = auth.uid()) or public.has_role(auth.uid(), 'super_admin'));
create policy "owner update" on public.competitions for update to authenticated
  using (organizer_id = auth.uid() or public.has_role(auth.uid(), 'super_admin'));
create policy "owner delete" on public.competitions for delete to authenticated
  using (organizer_id = auth.uid() or public.has_role(auth.uid(), 'super_admin'));

create table public.contestants (
  id uuid primary key default gen_random_uuid(),
  competition_id uuid not null references public.competitions(id) on delete cascade,
  name text not null,
  country text not null,
  country_code text not null,
  age int,
  height text,
  bio text,
  photo_url text,
  created_at timestamptz not null default now()
);
grant select on public.contestants to anon;
grant select, insert, update, delete on public.contestants to authenticated;
grant all on public.contestants to service_role;
alter table public.contestants enable row level security;

create or replace function public.can_manage_competition(_competition_id uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select public.has_role(auth.uid(), 'super_admin') or exists (
    select 1 from public.competitions where id = _competition_id and organizer_id = auth.uid())
$$;

create policy "public read contestants" on public.contestants for select to anon, authenticated using (true);
create policy "manage contestants ins" on public.contestants for insert to authenticated with check (public.can_manage_competition(competition_id));
create policy "manage contestants upd" on public.contestants for update to authenticated using (public.can_manage_competition(competition_id));
create policy "manage contestants del" on public.contestants for delete to authenticated using (public.can_manage_competition(competition_id));

create table public.votes (
  id uuid primary key default gen_random_uuid(),
  competition_id uuid not null references public.competitions(id) on delete cascade,
  contestant_id uuid not null references public.contestants(id) on delete cascade,
  user_id uuid not null,
  vote_date date not null default (now() at time zone 'utc')::date,
  created_at timestamptz not null default now(),
  unique (competition_id, user_id, vote_date)
);
grant select on public.votes to authenticated;
grant all on public.votes to service_role;
alter table public.votes enable row level security;
create policy "read own votes" on public.votes for select to authenticated using (user_id = auth.uid());

create or replace function public.is_voting_live(_competition_id uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.competitions c where c.id = _competition_id and c.published and c.voting_open
    and (c.voting_starts_at is null or c.voting_starts_at <= now())
    and (c.voting_ends_at is null or c.voting_ends_at > now()))
$$;

create or replace function public.cast_vote(_contestant_id uuid)
returns void language plpgsql security definer set search_path = public as $$
declare _comp uuid;
begin
  if auth.uid() is null then raise exception 'Please sign in to vote'; end if;
  select competition_id into _comp from public.contestants where id = _contestant_id;
  if _comp is null then raise exception 'Contestant not found'; end if;
  if not public.is_voting_live(_comp) then raise exception 'Voting is closed for this competition'; end if;
  begin
    insert into public.votes (competition_id, contestant_id, user_id) values (_comp, _contestant_id, auth.uid());
  exception when unique_violation then
    raise exception 'You have already voted in this competition today. Come back tomorrow!';
  end;
end; $$;
revoke execute on function public.cast_vote(uuid) from anon, public;
grant execute on function public.cast_vote(uuid) to authenticated;

create or replace function public.competition_results(_competition_id uuid)
returns table (contestant_id uuid, votes bigint)
language sql stable security definer set search_path = public as $$
  select c.id, count(v.id) from public.contestants c
  left join public.votes v on v.contestant_id = c.id
  where c.competition_id = _competition_id
  group by c.id
$$;

create or replace function public.all_results()
returns table (contestant_id uuid, competition_id uuid, votes bigint)
language sql stable security definer set search_path = public as $$
  select c.id, c.competition_id, count(v.id) from public.contestants c
  left join public.votes v on v.contestant_id = c.id
  join public.competitions comp on comp.id = c.competition_id and comp.published
  group by c.id, c.competition_id
$$;
grant execute on function public.competition_results(uuid) to anon, authenticated;
grant execute on function public.all_results() to anon, authenticated;

insert into public.competitions (id, title, slug, category, edition, description, cover_url, voting_open, voting_ends_at) values
 ('11111111-1111-1111-1111-111111111111', 'Miss AI World', 'miss-ai-world-2026', 'miss', '2026', 'The crown jewel of AI pageantry — celebrating grace, intelligence and global elegance from every continent.', '/images/miss-1.jpg', true, now() + interval '30 days'),
 ('22222222-2222-2222-2222-222222222222', 'Mister AI World', 'mister-ai-world-2026', 'mister', '2026', 'Charisma, confidence and character — the world''s finest AI gentlemen compete for the global title.', '/images/mister-1.jpg', true, now() + interval '30 days'),
 ('33333333-3333-3333-3333-333333333333', 'Miss AI Universe', 'miss-ai-universe-2027', 'miss', '2027', 'A new era of beauty. Voting opens soon.', '/images/miss-3.jpg', false, null);

insert into public.contestants (competition_id, name, country, country_code, age, height, bio, photo_url) values
 ('11111111-1111-1111-1111-111111111111', 'Isabella Moreau', 'France', 'fr', 24, '178 cm', 'Parisian art historian and advocate for cultural heritage.', '/images/miss-1.jpg'),
 ('11111111-1111-1111-1111-111111111111', 'Amara Okafor', 'Nigeria', 'ng', 23, '180 cm', 'Software engineer championing girls in technology across Africa.', '/images/miss-2.jpg'),
 ('11111111-1111-1111-1111-111111111111', 'Sakura Tanaka', 'Japan', 'jp', 25, '172 cm', 'Classical pianist and ambassador for mental health awareness.', '/images/miss-3.jpg'),
 ('22222222-2222-2222-2222-222222222222', 'Lucas Silva', 'Brazil', 'br', 26, '188 cm', 'Marine biologist protecting the Atlantic coral reefs.', '/images/mister-1.jpg'),
 ('22222222-2222-2222-2222-222222222222', 'Arjun Mehta', 'India', 'in', 27, '185 cm', 'Entrepreneur building clean-water solutions for rural villages.', '/images/mister-2.jpg'),
 ('22222222-2222-2222-2222-222222222222', 'Erik Lindqvist', 'Sweden', 'se', 25, '191 cm', 'Olympic rower and sustainability campaigner.', '/images/mister-3.jpg');
