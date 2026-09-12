CREATE TABLE public.sponsors (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  logo_url text NOT NULL,
  destination_url text NOT NULL,
  is_active boolean NOT NULL DEFAULT true,
  display_order integer NOT NULL DEFAULT 1,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT ON public.sponsors TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.sponsors TO authenticated;
GRANT ALL ON public.sponsors TO service_role;

ALTER TABLE public.sponsors ENABLE ROW LEVEL SECURITY;

CREATE POLICY "active sponsors public" ON public.sponsors FOR SELECT TO anon USING (is_active);
CREATE POLICY "sponsors readable members" ON public.sponsors FOR SELECT TO authenticated USING (is_active OR public.is_master(auth.uid()));
CREATE POLICY "master inserts sponsors" ON public.sponsors FOR INSERT TO authenticated WITH CHECK (public.is_master(auth.uid()));
CREATE POLICY "master updates sponsors" ON public.sponsors FOR UPDATE TO authenticated USING (public.is_master(auth.uid())) WITH CHECK (public.is_master(auth.uid()));
CREATE POLICY "master deletes sponsors" ON public.sponsors FOR DELETE TO authenticated USING (public.is_master(auth.uid()));

CREATE TRIGGER sponsors_touch BEFORE UPDATE ON public.sponsors FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

DROP POLICY IF EXISTS "vikingos upload" ON storage.objects;
DROP POLICY IF EXISTS "vikingos update own" ON storage.objects;
DROP POLICY IF EXISTS "vikingos delete own" ON storage.objects;

CREATE POLICY "vikingos upload" ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'vikingos' AND (name NOT LIKE 'patrocinadores/%' OR public.is_master(auth.uid())));
CREATE POLICY "vikingos update own" ON storage.objects FOR UPDATE TO authenticated
  USING (bucket_id = 'vikingos' AND (CASE WHEN name LIKE 'patrocinadores/%' THEN public.is_master(auth.uid()) ELSE (owner = auth.uid() OR public.is_staff(auth.uid())) END));
CREATE POLICY "vikingos delete own" ON storage.objects FOR DELETE TO authenticated
  USING (bucket_id = 'vikingos' AND (CASE WHEN name LIKE 'patrocinadores/%' THEN public.is_master(auth.uid()) ELSE (owner = auth.uid() OR public.is_staff(auth.uid())) END));