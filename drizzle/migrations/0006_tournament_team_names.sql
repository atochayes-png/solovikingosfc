CREATE OR REPLACE FUNCTION public.tournament_team_names(_tournament_id uuid)
RETURNS TABLE(id uuid, name text) LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT t.id, t.name FROM tournament_teams t
  WHERE t.tournament_id = _tournament_id AND public.can_view_tournament(auth.uid(), _tournament_id)
  ORDER BY t.name
$$;
REVOKE EXECUTE ON FUNCTION public.tournament_team_names(uuid) FROM anon, public;
GRANT EXECUTE ON FUNCTION public.tournament_team_names(uuid) TO authenticated;