ALTER TABLE public.media
  ADD COLUMN display_mode text NOT NULL DEFAULT 'auto'
  CONSTRAINT media_display_mode_check CHECK (display_mode IN ('auto', 'vertical', 'horizontal'));

ALTER TABLE public.posts
  ADD COLUMN display_mode text NOT NULL DEFAULT 'auto'
  CONSTRAINT posts_display_mode_check CHECK (display_mode IN ('auto', 'vertical', 'horizontal'));

ALTER TABLE public.players
  ADD COLUMN photo_display_mode text NOT NULL DEFAULT 'auto'
  CONSTRAINT players_photo_display_mode_check CHECK (photo_display_mode IN ('auto', 'vertical', 'horizontal'));

ALTER TABLE public.matches
  ADD COLUMN vikingada_display_mode text NOT NULL DEFAULT 'auto'
  CONSTRAINT matches_vikingada_display_mode_check CHECK (vikingada_display_mode IN ('auto', 'vertical', 'horizontal'));

CREATE TABLE public.post_media (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id uuid NOT NULL REFERENCES public.posts(id) ON DELETE CASCADE,
  url text NOT NULL,
  media_type text NOT NULL DEFAULT 'image' CHECK (media_type IN ('image', 'video')),
  display_mode text NOT NULL DEFAULT 'auto' CHECK (display_mode IN ('auto', 'vertical', 'horizontal')),
  sort_order integer NOT NULL DEFAULT 0 CHECK (sort_order >= 0),
  created_at timestamp with time zone NOT NULL DEFAULT now()
);
GRANT SELECT ON public.post_media TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.post_media TO authenticated;
GRANT ALL ON public.post_media TO service_role;
ALTER TABLE public.post_media ENABLE ROW LEVEL SECURITY;
CREATE INDEX post_media_post_order_idx ON public.post_media(post_id, sort_order);
CREATE POLICY "post media readable" ON public.post_media FOR SELECT USING (true);
CREATE POLICY "authors add post media" ON public.post_media FOR INSERT TO authenticated
  WITH CHECK (EXISTS (SELECT 1 FROM public.posts p WHERE p.id = post_id AND p.author_id = auth.uid()));
CREATE POLICY "authors update post media" ON public.post_media FOR UPDATE TO authenticated
  USING (EXISTS (SELECT 1 FROM public.posts p WHERE p.id = post_id AND (p.author_id = auth.uid() OR public.is_staff(auth.uid()))))
  WITH CHECK (EXISTS (SELECT 1 FROM public.posts p WHERE p.id = post_id AND (p.author_id = auth.uid() OR public.is_staff(auth.uid()))));
CREATE POLICY "authors delete post media" ON public.post_media FOR DELETE TO authenticated
  USING (EXISTS (SELECT 1 FROM public.posts p WHERE p.id = post_id AND (p.author_id = auth.uid() OR public.is_staff(auth.uid()))));