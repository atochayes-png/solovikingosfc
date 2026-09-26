CREATE TABLE public.tournament_rounds (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tournament_id uuid NOT NULL REFERENCES public.tournaments(id) ON DELETE CASCADE,
  number integer NOT NULL CHECK (number > 0),
  name text,
  start_date date,
  end_date date,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (tournament_id, number)
);
CREATE TABLE public.tournament_matches (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tournament_id uuid NOT NULL REFERENCES public.tournaments(id) ON DELETE CASCADE,
  round_id uuid NOT NULL REFERENCES public.tournament_rounds(id) ON DELETE CASCADE,
  home_team_id uuid NOT NULL REFERENCES public.tournament_teams(id) ON DELETE RESTRICT,
  away_team_id uuid NOT NULL REFERENCES public.tournament_teams(id) ON DELETE RESTRICT,
  kickoff timestamptz NOT NULL,
  previous_kickoff timestamptz,
  status text NOT NULL DEFAULT 'programado' CHECK (status IN ('programado','reprogramado','cancelado','jugado')),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CHECK (home_team_id <> away_team_id)
);
CREATE INDEX ON public.tournament_matches (tournament_id, kickoff);
CREATE INDEX ON public.tournament_matches (round_id);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.tournament_rounds TO authenticated;
GRANT ALL ON public.tournament_rounds TO service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.tournament_matches TO authenticated;
GRANT ALL ON public.tournament_matches TO service_role;

ALTER TABLE public.tournament_rounds ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tournament_matches ENABLE ROW LEVEL SECURITY;

CREATE POLICY "rounds view" ON public.tournament_rounds FOR SELECT TO authenticated
  USING (public.can_view_tournament(auth.uid(), tournament_id));
CREATE POLICY "rounds insert" ON public.tournament_rounds FOR INSERT TO authenticated
  WITH CHECK (public.can_manage_tournament(auth.uid(), tournament_id));
CREATE POLICY "rounds update" ON public.tournament_rounds FOR UPDATE TO authenticated
  USING (public.can_manage_tournament(auth.uid(), tournament_id))
  WITH CHECK (public.can_manage_tournament(auth.uid(), tournament_id));
CREATE POLICY "rounds delete" ON public.tournament_rounds FOR DELETE TO authenticated
  USING (public.can_manage_tournament(auth.uid(), tournament_id));

CREATE POLICY "matches view" ON public.tournament_matches FOR SELECT TO authenticated
  USING (public.can_manage_tournament(auth.uid(), tournament_id)
    OR public.is_team_rep(auth.uid(), home_team_id)
    OR public.is_team_rep(auth.uid(), away_team_id));
CREATE POLICY "matches insert" ON public.tournament_matches FOR INSERT TO authenticated
  WITH CHECK (public.can_manage_tournament(auth.uid(), tournament_id));
CREATE POLICY "matches update" ON public.tournament_matches FOR UPDATE TO authenticated
  USING (public.can_manage_tournament(auth.uid(), tournament_id))
  WITH CHECK (public.can_manage_tournament(auth.uid(), tournament_id));
CREATE POLICY "matches delete" ON public.tournament_matches FOR DELETE TO authenticated
  USING (public.can_manage_tournament(auth.uid(), tournament_id));

-- Integridad: equipos y jornada deben pertenecer al mismo torneo
CREATE OR REPLACE FUNCTION public.guard_tournament_match()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM tournament_rounds WHERE id = NEW.round_id AND tournament_id = NEW.tournament_id) THEN
    RAISE EXCEPTION 'La jornada no pertenece al torneo';
  END IF;
  IF (SELECT count(*) FROM tournament_teams WHERE id IN (NEW.home_team_id, NEW.away_team_id) AND tournament_id = NEW.tournament_id) <> 2 THEN
    RAISE EXCEPTION 'Los equipos deben pertenecer al torneo';
  END IF;
  IF TG_OP = 'UPDATE' AND NEW.kickoff IS DISTINCT FROM OLD.kickoff THEN
    NEW.previous_kickoff := OLD.kickoff;
    IF NEW.status IN ('programado','reprogramado') THEN NEW.status := 'reprogramado'; END IF;
  END IF;
  NEW.updated_at := now();
  RETURN NEW;
END $$;
CREATE TRIGGER guard_tournament_match BEFORE INSERT OR UPDATE ON public.tournament_matches
  FOR EACH ROW EXECUTE FUNCTION public.guard_tournament_match();
CREATE TRIGGER touch_tournament_rounds BEFORE UPDATE ON public.tournament_rounds
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();