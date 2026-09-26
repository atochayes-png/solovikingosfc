CREATE TABLE public.tournaments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  sport text NOT NULL DEFAULT 'futbol' CHECK (sport = 'futbol'),
  season text,
  category text,
  venue text,
  start_date date,
  status text NOT NULL DEFAULT 'preparacion' CHECK (status IN ('preparacion','activo','finalizado')),
  registration_fee numeric(10,2),
  referee_fee numeric(10,2),
  created_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.tournament_admins (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tournament_id uuid NOT NULL REFERENCES public.tournaments(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (tournament_id, user_id)
);

CREATE TABLE public.tournament_teams (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tournament_id uuid NOT NULL REFERENCES public.tournaments(id) ON DELETE CASCADE,
  name text NOT NULL,
  logo_url text,
  rep_name text,
  rep_phone text,
  rep_email text,
  rep_user_id uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  status text NOT NULL DEFAULT 'pendiente' CHECK (status IN ('pendiente','activo','inactivo')),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX ON public.tournament_teams (tournament_id);
CREATE INDEX ON public.tournament_teams (rep_user_id);

CREATE TABLE public.sport_people (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  full_name text NOT NULL,
  document_number text,
  profile_id uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.team_registrations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  team_id uuid NOT NULL REFERENCES public.tournament_teams(id) ON DELETE CASCADE,
  person_id uuid NOT NULL REFERENCES public.sport_people(id) ON DELETE CASCADE,
  jersey_number integer CHECK (jersey_number IS NULL OR jersey_number BETWEEN 0 AND 999),
  photo_url text,
  document_url text,
  status text NOT NULL DEFAULT 'pendiente' CHECK (status IN ('pendiente','aprobado','rechazado','inactivo')),
  created_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (team_id, person_id)
);
CREATE INDEX ON public.team_registrations (team_id);

CREATE OR REPLACE FUNCTION public.can_manage_tournament(_user_id uuid, _tournament_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT public.is_master(_user_id) OR EXISTS (
    SELECT 1 FROM public.tournament_admins WHERE tournament_id = _tournament_id AND user_id = _user_id);
$$;

CREATE OR REPLACE FUNCTION public.is_team_rep(_user_id uuid, _team_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.tournament_teams WHERE id = _team_id AND rep_user_id = _user_id);
$$;

CREATE OR REPLACE FUNCTION public.can_manage_team(_user_id uuid, _team_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.tournament_teams t WHERE t.id = _team_id
    AND public.can_manage_tournament(_user_id, t.tournament_id));
$$;

CREATE OR REPLACE FUNCTION public.can_view_tournament(_user_id uuid, _tournament_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT public.can_manage_tournament(_user_id, _tournament_id) OR EXISTS (
    SELECT 1 FROM public.tournament_teams WHERE tournament_id = _tournament_id AND rep_user_id = _user_id);
$$;

CREATE OR REPLACE FUNCTION public.can_view_person(_user_id uuid, _person_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT public.is_master(_user_id)
    OR EXISTS (SELECT 1 FROM public.sport_people WHERE id = _person_id AND created_by = _user_id)
    OR EXISTS (SELECT 1 FROM public.team_registrations r WHERE r.person_id = _person_id
      AND (public.can_manage_team(_user_id, r.team_id) OR public.is_team_rep(_user_id, r.team_id)));
$$;

CREATE OR REPLACE FUNCTION public.can_access_team_path(_user_id uuid, _path text)
RETURNS boolean LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public AS $$
DECLARE tid uuid;
BEGIN
  BEGIN tid := split_part(_path, '/', 1)::uuid; EXCEPTION WHEN others THEN RETURN false; END;
  RETURN public.can_manage_team(_user_id, tid) OR public.is_team_rep(_user_id, tid);
END; $$;

CREATE OR REPLACE FUNCTION public.guard_team_registration()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE actor uuid := auth.uid();
BEGIN
  IF actor IS NULL OR public.can_manage_team(actor, NEW.team_id) THEN RETURN NEW; END IF;
  IF TG_OP = 'INSERT' THEN
    NEW.status := 'pendiente';
    NEW.created_by := actor;
  ELSE
    IF NEW.team_id <> OLD.team_id THEN RAISE EXCEPTION 'No puedes mover la inscripción'; END IF;
    IF NEW.status <> OLD.status THEN RAISE EXCEPTION 'Solo el administrador de liga cambia el estado'; END IF;
    IF OLD.status = 'aprobado' THEN RAISE EXCEPTION 'La inscripción ya fue aprobada'; END IF;
  END IF;
  RETURN NEW;
END; $$;

CREATE TRIGGER team_registrations_guard BEFORE INSERT OR UPDATE ON public.team_registrations
  FOR EACH ROW EXECUTE FUNCTION public.guard_team_registration();
CREATE TRIGGER tournaments_touch BEFORE UPDATE ON public.tournaments FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();
CREATE TRIGGER tournament_teams_touch BEFORE UPDATE ON public.tournament_teams FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();
CREATE TRIGGER sport_people_touch BEFORE UPDATE ON public.sport_people FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();
CREATE TRIGGER team_registrations_touch BEFORE UPDATE ON public.team_registrations FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

GRANT SELECT, INSERT, UPDATE, DELETE ON public.tournaments, public.tournament_admins, public.tournament_teams, public.sport_people, public.team_registrations TO authenticated;
GRANT ALL ON public.tournaments, public.tournament_admins, public.tournament_teams, public.sport_people, public.team_registrations TO service_role;

ALTER TABLE public.tournaments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tournament_admins ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tournament_teams ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sport_people ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.team_registrations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "t select" ON public.tournaments FOR SELECT TO authenticated USING (public.can_view_tournament(auth.uid(), id));
CREATE POLICY "t insert" ON public.tournaments FOR INSERT TO authenticated WITH CHECK (public.is_master(auth.uid()));
CREATE POLICY "t update" ON public.tournaments FOR UPDATE TO authenticated USING (public.can_manage_tournament(auth.uid(), id)) WITH CHECK (public.can_manage_tournament(auth.uid(), id));
CREATE POLICY "t delete" ON public.tournaments FOR DELETE TO authenticated USING (public.is_master(auth.uid()));

CREATE POLICY "ta select" ON public.tournament_admins FOR SELECT TO authenticated USING (public.can_manage_tournament(auth.uid(), tournament_id));
CREATE POLICY "ta insert" ON public.tournament_admins FOR INSERT TO authenticated WITH CHECK (public.is_master(auth.uid()));
CREATE POLICY "ta delete" ON public.tournament_admins FOR DELETE TO authenticated USING (public.is_master(auth.uid()));

CREATE POLICY "tt select" ON public.tournament_teams FOR SELECT TO authenticated USING (public.can_manage_tournament(auth.uid(), tournament_id) OR rep_user_id = auth.uid());
CREATE POLICY "tt insert" ON public.tournament_teams FOR INSERT TO authenticated WITH CHECK (public.can_manage_tournament(auth.uid(), tournament_id));
CREATE POLICY "tt update" ON public.tournament_teams FOR UPDATE TO authenticated USING (public.can_manage_tournament(auth.uid(), tournament_id)) WITH CHECK (public.can_manage_tournament(auth.uid(), tournament_id));
CREATE POLICY "tt delete" ON public.tournament_teams FOR DELETE TO authenticated USING (public.can_manage_tournament(auth.uid(), tournament_id));

CREATE POLICY "sp select" ON public.sport_people FOR SELECT TO authenticated USING (public.can_view_person(auth.uid(), id));
CREATE POLICY "sp insert" ON public.sport_people FOR INSERT TO authenticated WITH CHECK (created_by = auth.uid());
CREATE POLICY "sp update" ON public.sport_people FOR UPDATE TO authenticated USING (public.can_view_person(auth.uid(), id)) WITH CHECK (public.can_view_person(auth.uid(), id));

CREATE POLICY "tr select" ON public.team_registrations FOR SELECT TO authenticated USING (public.can_manage_team(auth.uid(), team_id) OR public.is_team_rep(auth.uid(), team_id));
CREATE POLICY "tr insert" ON public.team_registrations FOR INSERT TO authenticated WITH CHECK (public.can_manage_team(auth.uid(), team_id) OR public.is_team_rep(auth.uid(), team_id));
CREATE POLICY "tr update" ON public.team_registrations FOR UPDATE TO authenticated USING (public.can_manage_team(auth.uid(), team_id) OR public.is_team_rep(auth.uid(), team_id)) WITH CHECK (public.can_manage_team(auth.uid(), team_id) OR public.is_team_rep(auth.uid(), team_id));
CREATE POLICY "tr delete" ON public.team_registrations FOR DELETE TO authenticated USING (public.can_manage_team(auth.uid(), team_id) OR (public.is_team_rep(auth.uid(), team_id) AND status = 'pendiente'));

CREATE POLICY "torneos read" ON storage.objects FOR SELECT TO authenticated USING (bucket_id = 'torneos' AND public.can_access_team_path(auth.uid(), name));
CREATE POLICY "torneos upload" ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id = 'torneos' AND public.can_access_team_path(auth.uid(), name));
CREATE POLICY "torneos delete" ON storage.objects FOR DELETE TO authenticated USING (bucket_id = 'torneos' AND public.can_access_team_path(auth.uid(), name));