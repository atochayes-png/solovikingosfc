CREATE TABLE public.standings_teams (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  pj integer NOT NULL DEFAULT 0,
  g integer NOT NULL DEFAULT 0,
  e integer NOT NULL DEFAULT 0,
  p integer NOT NULL DEFAULT 0,
  gf integer NOT NULL DEFAULT 0,
  gc integer NOT NULL DEFAULT 0,
  pts integer NOT NULL DEFAULT 0,
  manual_order integer NOT NULL DEFAULT 0,
  is_vikingos boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.standings_teams TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.standings_teams TO authenticated;
GRANT ALL ON public.standings_teams TO service_role;
ALTER TABLE public.standings_teams ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Tabla visible" ON public.standings_teams FOR SELECT USING (true);
CREATE POLICY "Staff inserta" ON public.standings_teams FOR INSERT TO authenticated WITH CHECK (public.is_staff(auth.uid()));
CREATE POLICY "Staff edita" ON public.standings_teams FOR UPDATE TO authenticated USING (public.is_staff(auth.uid())) WITH CHECK (public.is_staff(auth.uid()));
CREATE POLICY "Staff borra" ON public.standings_teams FOR DELETE TO authenticated USING (public.is_staff(auth.uid()));
CREATE UNIQUE INDEX standings_one_vikingos ON public.standings_teams ((true)) WHERE is_vikingos;
CREATE TRIGGER standings_teams_touch BEFORE UPDATE ON public.standings_teams FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

CREATE TABLE public.standings_settings (
  id boolean PRIMARY KEY DEFAULT true CHECK (id),
  points_per_win integer NOT NULL DEFAULT 3,
  tiebreakers text[] NOT NULL DEFAULT '{}'::text[],
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.standings_settings TO anon;
GRANT SELECT, INSERT, UPDATE ON public.standings_settings TO authenticated;
GRANT ALL ON public.standings_settings TO service_role;
ALTER TABLE public.standings_settings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Config visible" ON public.standings_settings FOR SELECT USING (true);
CREATE POLICY "Staff crea config" ON public.standings_settings FOR INSERT TO authenticated WITH CHECK (public.is_staff(auth.uid()));
CREATE POLICY "Staff edita config" ON public.standings_settings FOR UPDATE TO authenticated USING (public.is_staff(auth.uid())) WITH CHECK (public.is_staff(auth.uid()));
CREATE TRIGGER standings_settings_touch BEFORE UPDATE ON public.standings_settings FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();