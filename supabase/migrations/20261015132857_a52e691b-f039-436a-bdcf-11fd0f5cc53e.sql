GRANT EXECUTE ON FUNCTION public.get_formations_collaborateurs() TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_formations_collaborateurs() TO service_role;
REVOKE EXECUTE ON FUNCTION public.get_formations_collaborateurs() FROM anon;
REVOKE EXECUTE ON FUNCTION public.get_formations_collaborateurs() FROM PUBLIC;