-- ROLES
CREATE TYPE public.app_role AS ENUM ('master', 'admin', 'vikingo');

CREATE TABLE public.profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  username text NOT NULL UNIQUE,
  display_name text NOT NULL,
  avatar_url text,
  active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.profiles TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.profiles TO authenticated;
GRANT ALL ON public.profiles TO service_role;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE TABLE public.user_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role public.app_role NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, role)
);
GRANT SELECT ON public.user_roles TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.user_roles TO authenticated;
GRANT ALL ON public.user_roles TO service_role;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role public.app_role)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role);
$$;

CREATE OR REPLACE FUNCTION public.is_master(_user_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = 'master');
$$;

CREATE OR REPLACE FUNCTION public.is_staff(_user_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role IN ('master','admin'));
$$;

CREATE OR REPLACE FUNCTION public.touch_updated_at()
RETURNS trigger LANGUAGE plpgsql SET search_path = public AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END; $$;

-- Guard: nobody but a master may create/alter/remove role rows, and the master
-- role itself can never be added, changed or removed through the Data API.
CREATE OR REPLACE FUNCTION public.guard_user_roles()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE actor uuid := auth.uid();
BEGIN
  IF actor IS NULL THEN RETURN COALESCE(NEW, OLD); END IF; -- service_role / SQL console
  IF NOT public.is_master(actor) THEN
    RAISE EXCEPTION 'Solo el MASTER puede administrar roles';
  END IF;
  IF TG_OP = 'INSERT' AND NEW.role = 'master' THEN
    RAISE EXCEPTION 'No se puede crear otro MASTER';
  END IF;
  IF TG_OP <> 'INSERT' AND OLD.role = 'master' THEN
    RAISE EXCEPTION 'El rol MASTER no puede modificarse';
  END IF;
  RETURN COALESCE(NEW, OLD);
END; $$;

CREATE TRIGGER guard_user_roles_trg
BEFORE INSERT OR UPDATE OR DELETE ON public.user_roles
FOR EACH ROW EXECUTE FUNCTION public.guard_user_roles();

CREATE POLICY "roles readable" ON public.user_roles FOR SELECT USING (true);
CREATE POLICY "master manages roles" ON public.user_roles FOR ALL TO authenticated
  USING (public.is_master(auth.uid())) WITH CHECK (public.is_master(auth.uid()));

-- Guard: an admin can never edit or deactivate the master profile
CREATE OR REPLACE FUNCTION public.guard_profiles()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE actor uuid := auth.uid();
BEGIN
  IF actor IS NULL THEN RETURN COALESCE(NEW, OLD); END IF;
  IF public.is_master(COALESCE(NEW.id, OLD.id)) AND NOT public.is_master(actor) THEN
    RAISE EXCEPTION 'La cuenta MASTER no puede modificarse';
  END IF;
  RETURN COALESCE(NEW, OLD);
END; $$;

CREATE TRIGGER guard_profiles_trg
BEFORE UPDATE OR DELETE ON public.profiles
FOR EACH ROW EXECUTE FUNCTION public.guard_profiles();

CREATE TRIGGER profiles_touch BEFORE UPDATE ON public.profiles
FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

CREATE POLICY "profiles readable" ON public.profiles FOR SELECT USING (true);
CREATE POLICY "own profile update" ON public.profiles FOR UPDATE TO authenticated
  USING (auth.uid() = id) WITH CHECK (auth.uid() = id);
CREATE POLICY "staff update profiles" ON public.profiles FOR UPDATE TO authenticated
  USING (public.is_staff(auth.uid())) WITH CHECK (public.is_staff(auth.uid()));
CREATE POLICY "master deletes profiles" ON public.profiles FOR DELETE TO authenticated
  USING (public.is_master(auth.uid()));

-- SEASONS
CREATE TABLE public.seasons (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL UNIQUE,
  is_current boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.seasons TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.seasons TO authenticated;
GRANT ALL ON public.seasons TO service_role;
ALTER TABLE public.seasons ENABLE ROW LEVEL SECURITY;
CREATE POLICY "seasons readable" ON public.seasons FOR SELECT USING (true);
CREATE POLICY "staff manage seasons" ON public.seasons FOR ALL TO authenticated
  USING (public.is_staff(auth.uid())) WITH CHECK (public.is_staff(auth.uid()));

-- PLAYERS
CREATE TABLE public.players (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  full_name text NOT NULL,
  nickname text,
  jersey_number int,
  position text,
  photo_url text,
  active boolean NOT NULL DEFAULT true,
  joined_on date,
  bio text,
  profile_id uuid UNIQUE REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX players_active_idx ON public.players(active);
GRANT SELECT ON public.players TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.players TO authenticated;
GRANT ALL ON public.players TO service_role;
ALTER TABLE public.players ENABLE ROW LEVEL SECURITY;
CREATE TRIGGER players_touch BEFORE UPDATE ON public.players FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();
CREATE POLICY "players readable" ON public.players FOR SELECT USING (true);
CREATE POLICY "staff manage players" ON public.players FOR ALL TO authenticated
  USING (public.is_staff(auth.uid())) WITH CHECK (public.is_staff(auth.uid()));

-- MATCHES
CREATE TABLE public.matches (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  season_id uuid REFERENCES public.seasons(id) ON DELETE SET NULL,
  matchday text,
  opponent text NOT NULL,
  opponent_crest_url text,
  is_home boolean NOT NULL DEFAULT true,
  kickoff timestamptz,
  venue text,
  preview text,
  status text NOT NULL DEFAULT 'programado' CHECK (status IN ('programado','finalizado','aplazado','cancelado')),
  goals_for int,
  goals_against int,
  chronicle text,
  mvp_player_id uuid REFERENCES public.players(id) ON DELETE SET NULL,
  mvp_comment text,
  vikingada_player_id uuid REFERENCES public.players(id) ON DELETE SET NULL,
  vikingada_title text,
  vikingada_description text,
  vikingada_media_url text,
  published boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX matches_kickoff_idx ON public.matches(kickoff);
CREATE INDEX matches_status_idx ON public.matches(status);
GRANT SELECT ON public.matches TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.matches TO authenticated;
GRANT ALL ON public.matches TO service_role;
ALTER TABLE public.matches ENABLE ROW LEVEL SECURITY;
CREATE TRIGGER matches_touch BEFORE UPDATE ON public.matches FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();
CREATE POLICY "matches readable" ON public.matches FOR SELECT USING (published OR public.is_staff(auth.uid()));
CREATE POLICY "staff manage matches" ON public.matches FOR ALL TO authenticated
  USING (public.is_staff(auth.uid())) WITH CHECK (public.is_staff(auth.uid()));

-- MATCH EVENTS
CREATE TABLE public.match_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  match_id uuid NOT NULL REFERENCES public.matches(id) ON DELETE CASCADE,
  player_id uuid REFERENCES public.players(id) ON DELETE CASCADE,
  event_type text NOT NULL CHECK (event_type IN ('gol','asistencia','amarilla','roja')),
  minute int,
  note text,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX match_events_match_idx ON public.match_events(match_id);
CREATE INDEX match_events_player_idx ON public.match_events(player_id);
GRANT SELECT ON public.match_events TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.match_events TO authenticated;
GRANT ALL ON public.match_events TO service_role;
ALTER TABLE public.match_events ENABLE ROW LEVEL SECURITY;
CREATE POLICY "events readable" ON public.match_events FOR SELECT USING (true);
CREATE POLICY "staff manage events" ON public.match_events FOR ALL TO authenticated
  USING (public.is_staff(auth.uid())) WITH CHECK (public.is_staff(auth.uid()));

-- LINEUP (partidos jugados)
CREATE TABLE public.match_lineup (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  match_id uuid NOT NULL REFERENCES public.matches(id) ON DELETE CASCADE,
  player_id uuid NOT NULL REFERENCES public.players(id) ON DELETE CASCADE,
  UNIQUE (match_id, player_id)
);
GRANT SELECT ON public.match_lineup TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.match_lineup TO authenticated;
GRANT ALL ON public.match_lineup TO service_role;
ALTER TABLE public.match_lineup ENABLE ROW LEVEL SECURITY;
CREATE POLICY "lineup readable" ON public.match_lineup FOR SELECT USING (true);
CREATE POLICY "staff manage lineup" ON public.match_lineup FOR ALL TO authenticated
  USING (public.is_staff(auth.uid())) WITH CHECK (public.is_staff(auth.uid()));

-- TRIBUNA
CREATE TABLE public.posts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  author_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  content text NOT NULL,
  media_url text,
  media_type text CHECK (media_type IN ('image','video')),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX posts_created_idx ON public.posts(created_at DESC);
GRANT SELECT ON public.posts TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.posts TO authenticated;
GRANT ALL ON public.posts TO service_role;
ALTER TABLE public.posts ENABLE ROW LEVEL SECURITY;
CREATE TRIGGER posts_touch BEFORE UPDATE ON public.posts FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();
CREATE POLICY "posts readable" ON public.posts FOR SELECT USING (true);
CREATE POLICY "members create posts" ON public.posts FOR INSERT TO authenticated WITH CHECK (auth.uid() = author_id);
CREATE POLICY "own posts update" ON public.posts FOR UPDATE TO authenticated
  USING (auth.uid() = author_id) WITH CHECK (auth.uid() = author_id);
CREATE POLICY "own or staff delete posts" ON public.posts FOR DELETE TO authenticated
  USING (auth.uid() = author_id OR public.is_staff(auth.uid()));
CREATE POLICY "staff moderate posts" ON public.posts FOR UPDATE TO authenticated
  USING (public.is_staff(auth.uid())) WITH CHECK (public.is_staff(auth.uid()));

CREATE TABLE public.comments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id uuid NOT NULL REFERENCES public.posts(id) ON DELETE CASCADE,
  author_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  parent_id uuid REFERENCES public.comments(id) ON DELETE CASCADE,
  content text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX comments_post_idx ON public.comments(post_id);
GRANT SELECT ON public.comments TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.comments TO authenticated;
GRANT ALL ON public.comments TO service_role;
ALTER TABLE public.comments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "comments readable" ON public.comments FOR SELECT USING (true);
CREATE POLICY "members comment" ON public.comments FOR INSERT TO authenticated WITH CHECK (auth.uid() = author_id);
CREATE POLICY "own comment update" ON public.comments FOR UPDATE TO authenticated
  USING (auth.uid() = author_id) WITH CHECK (auth.uid() = author_id);
CREATE POLICY "own or staff delete comments" ON public.comments FOR DELETE TO authenticated
  USING (auth.uid() = author_id OR public.is_staff(auth.uid()));

CREATE TABLE public.reactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id uuid NOT NULL REFERENCES public.posts(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  emoji text NOT NULL CHECK (emoji IN ('❤️','😂','🔥','⚔️','👏')),
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (post_id, user_id, emoji)
);
CREATE INDEX reactions_post_idx ON public.reactions(post_id);
GRANT SELECT ON public.reactions TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.reactions TO authenticated;
GRANT ALL ON public.reactions TO service_role;
ALTER TABLE public.reactions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "reactions readable" ON public.reactions FOR SELECT USING (true);
CREATE POLICY "own reactions" ON public.reactions FOR ALL TO authenticated
  USING (auth.uid() = user_id OR public.is_staff(auth.uid())) WITH CHECK (auth.uid() = user_id);

-- VIKINGOTECA
CREATE TABLE public.media (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text,
  description text,
  url text NOT NULL,
  media_type text NOT NULL DEFAULT 'image' CHECK (media_type IN ('image','video')),
  category text,
  event_name text,
  season_id uuid REFERENCES public.seasons(id) ON DELETE SET NULL,
  match_id uuid REFERENCES public.matches(id) ON DELETE SET NULL,
  uploaded_by uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  featured boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX media_created_idx ON public.media(created_at DESC);
GRANT SELECT ON public.media TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.media TO authenticated;
GRANT ALL ON public.media TO service_role;
ALTER TABLE public.media ENABLE ROW LEVEL SECURITY;
CREATE POLICY "media readable" ON public.media FOR SELECT USING (true);
CREATE POLICY "members upload media" ON public.media FOR INSERT TO authenticated WITH CHECK (auth.uid() = uploaded_by);
CREATE POLICY "own media update" ON public.media FOR UPDATE TO authenticated
  USING (auth.uid() = uploaded_by) WITH CHECK (auth.uid() = uploaded_by);
CREATE POLICY "staff manage media" ON public.media FOR ALL TO authenticated
  USING (public.is_staff(auth.uid())) WITH CHECK (public.is_staff(auth.uid()));
CREATE POLICY "own media delete" ON public.media FOR DELETE TO authenticated
  USING (auth.uid() = uploaded_by);

-- CLUB
CREATE TABLE public.club_settings (
  id boolean PRIMARY KEY DEFAULT true CHECK (id),
  name text NOT NULL DEFAULT 'VIKINGOS FC',
  founded text NOT NULL DEFAULT '2017',
  league text NOT NULL DEFAULT 'Liga de Veteranos · Escuela Modelo',
  city text NOT NULL DEFAULT 'Mérida, Yucatán',
  history text,
  identity text,
  venue_info text,
  sponsors text,
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.club_settings TO anon;
GRANT SELECT, INSERT, UPDATE ON public.club_settings TO authenticated;
GRANT ALL ON public.club_settings TO service_role;
ALTER TABLE public.club_settings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "club readable" ON public.club_settings FOR SELECT USING (true);
CREATE POLICY "staff manage club" ON public.club_settings FOR ALL TO authenticated
  USING (public.is_staff(auth.uid())) WITH CHECK (public.is_staff(auth.uid()));
INSERT INTO public.club_settings (id) VALUES (true);

-- STATS VIEW
CREATE OR REPLACE VIEW public.player_stats
WITH (security_invoker = true) AS
SELECT
  p.id AS player_id,
  p.full_name,
  p.nickname,
  p.jersey_number,
  p.position,
  p.photo_url,
  p.active,
  m.season_id,
  COUNT(DISTINCT l.match_id) FILTER (WHERE l.match_id IS NOT NULL) AS pj,
  0 AS placeholder
FROM public.players p
LEFT JOIN public.match_lineup l ON l.player_id = p.id
LEFT JOIN public.matches m ON m.id = l.match_id
GROUP BY p.id, m.season_id;
GRANT SELECT ON public.player_stats TO anon, authenticated, service_role;