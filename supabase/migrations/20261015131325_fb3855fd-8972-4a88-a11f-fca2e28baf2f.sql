REVOKE EXECUTE ON FUNCTION public.get_formations_collaborateurs() FROM anon;
REVOKE EXECUTE ON FUNCTION public.get_formations_collaborateurs() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_formations_collaborateurs() TO authenticated;