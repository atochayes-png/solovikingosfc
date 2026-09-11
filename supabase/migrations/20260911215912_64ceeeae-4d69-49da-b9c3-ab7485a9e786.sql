REVOKE ALL ON FUNCTION public.touch_updated_at() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.guard_user_roles() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.guard_profiles() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.has_role(uuid, public.app_role) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.is_master(uuid) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.is_staff(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_master(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_staff(uuid) TO authenticated;

DROP POLICY "matches readable" ON public.matches;
CREATE POLICY "matches public readable" ON public.matches FOR SELECT TO anon USING (published);
CREATE POLICY "matches member readable" ON public.matches FOR SELECT TO authenticated
  USING (published OR public.is_staff(auth.uid()));