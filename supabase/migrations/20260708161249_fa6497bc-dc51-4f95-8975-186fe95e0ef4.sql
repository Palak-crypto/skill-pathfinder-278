DROP POLICY IF EXISTS "Anyone reads share by token" ON public.shares;
REVOKE SELECT ON public.shares FROM anon;