ALTER TABLE public.votes DROP CONSTRAINT IF EXISTS votes_competition_id_user_id_vote_date_key;
CREATE INDEX IF NOT EXISTS votes_contestant_idx ON public.votes (contestant_id);
CREATE INDEX IF NOT EXISTS votes_competition_idx ON public.votes (competition_id);

CREATE OR REPLACE FUNCTION public.cast_vote(_contestant_id uuid)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE _comp uuid; _google boolean;
BEGIN
  IF auth.uid() IS NULL THEN RAISE EXCEPTION 'Please sign in with Google to vote'; END IF;
  SELECT coalesce(u.raw_app_meta_data->'providers' ? 'google', false)
      OR coalesce(u.raw_app_meta_data->>'provider' = 'google', false)
    INTO _google FROM auth.users u WHERE u.id = auth.uid();
  IF NOT coalesce(_google, false) THEN RAISE EXCEPTION 'Please sign in with your Google account to vote'; END IF;
  SELECT competition_id INTO _comp FROM public.contestants WHERE id = _contestant_id;
  IF _comp IS NULL THEN RAISE EXCEPTION 'Contestant not found'; END IF;
  IF NOT public.is_voting_live(_comp) THEN RAISE EXCEPTION 'Voting is closed for this competition'; END IF;
  INSERT INTO public.votes (competition_id, contestant_id, user_id) VALUES (_comp, _contestant_id, auth.uid());
END; $$;
REVOKE EXECUTE ON FUNCTION public.cast_vote(uuid) FROM anon, public;
GRANT EXECUTE ON FUNCTION public.cast_vote(uuid) TO authenticated;