CREATE POLICY "vikingos read" ON storage.objects FOR SELECT USING (bucket_id = 'vikingos');
CREATE POLICY "vikingos upload" ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id = 'vikingos');
CREATE POLICY "vikingos update own" ON storage.objects FOR UPDATE TO authenticated
  USING (bucket_id = 'vikingos' AND (owner = auth.uid() OR public.is_staff(auth.uid())));
CREATE POLICY "vikingos delete own" ON storage.objects FOR DELETE TO authenticated
  USING (bucket_id = 'vikingos' AND (owner = auth.uid() OR public.is_staff(auth.uid())));