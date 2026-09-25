CREATE TABLE public.match_attendance (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  match_id uuid NOT NULL REFERENCES public.matches(id) ON DELETE CASCADE,
  player_id uuid NOT NULL REFERENCES public.players(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (match_id, player_id)
);
GRANT SELECT, INSERT, DELETE ON public.match_attendance TO authenticated;
GRANT ALL ON public.match_attendance TO service_role;
ALTER TABLE public.match_attendance ENABLE ROW LEVEL SECURITY;

CREATE POLICY "own attendance read" ON public.match_attendance FOR SELECT TO authenticated
USING (EXISTS (SELECT 1 FROM public.players p WHERE p.id = player_id AND p.profile_id = auth.uid()) OR public.is_staff(auth.uid()));

CREATE POLICY "own attendance confirm" ON public.match_attendance FOR INSERT TO authenticated
WITH CHECK (
  EXISTS (SELECT 1 FROM public.players p WHERE p.id = player_id AND p.profile_id = auth.uid() AND p.active)
  AND EXISTS (SELECT 1 FROM public.matches m WHERE m.id = match_id AND m.published AND m.status = 'programado')
);

CREATE POLICY "own attendance withdraw" ON public.match_attendance FOR DELETE TO authenticated
USING (EXISTS (SELECT 1 FROM public.players p WHERE p.id = player_id AND p.profile_id = auth.uid()));

CREATE OR REPLACE FUNCTION public.match_attendance_stats(_match_id uuid)
RETURNS TABLE(confirmed integer, total integer)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT
    (SELECT count(*)::int FROM public.match_attendance a JOIN public.players p ON p.id = a.player_id WHERE a.match_id = _match_id AND p.active),
    (SELECT count(*)::int FROM public.players WHERE active);
$$;
GRANT EXECUTE ON FUNCTION public.match_attendance_stats(uuid) TO anon, authenticated;