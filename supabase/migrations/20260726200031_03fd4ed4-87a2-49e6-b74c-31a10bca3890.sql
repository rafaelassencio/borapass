
-- Listings owned by partners
CREATE TABLE public.listings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  category TEXT NOT NULL CHECK (category IN ('passeio','hospedagem','restaurante','evento','cupom')),
  title TEXT NOT NULL,
  description TEXT,
  image_url TEXT,
  price NUMERIC(10,2),
  city TEXT,
  address TEXT,
  discount TEXT,
  active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT ON public.listings TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.listings TO authenticated;
GRANT ALL ON public.listings TO service_role;
ALTER TABLE public.listings ENABLE ROW LEVEL SECURITY;

-- Anyone can browse active listings
CREATE POLICY "Public can view active listings" ON public.listings
  FOR SELECT TO anon, authenticated USING (active = true);

-- Partners manage only their own
CREATE POLICY "Partners view own listings" ON public.listings
  FOR SELECT TO authenticated USING (auth.uid() = owner_id);
CREATE POLICY "Partners create own listings" ON public.listings
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = owner_id AND (public.has_role(auth.uid(),'partner') OR public.has_role(auth.uid(),'admin')));
CREATE POLICY "Partners update own listings" ON public.listings
  FOR UPDATE TO authenticated USING (auth.uid() = owner_id) WITH CHECK (auth.uid() = owner_id);
CREATE POLICY "Partners delete own listings" ON public.listings
  FOR DELETE TO authenticated USING (auth.uid() = owner_id);

-- Admins manage everything
CREATE POLICY "Admins manage all listings" ON public.listings
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(),'admin'))
  WITH CHECK (public.has_role(auth.uid(),'admin'));

CREATE TRIGGER listings_updated_at BEFORE UPDATE ON public.listings
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Admin visibility on profiles and user_roles
CREATE POLICY "Admins view all profiles" ON public.profiles
  FOR SELECT TO authenticated USING (public.has_role(auth.uid(),'admin'));

CREATE POLICY "Admins view all roles" ON public.user_roles
  FOR SELECT TO authenticated USING (public.has_role(auth.uid(),'admin'));
CREATE POLICY "Admins grant roles" ON public.user_roles
  FOR INSERT TO authenticated WITH CHECK (public.has_role(auth.uid(),'admin'));
CREATE POLICY "Admins revoke roles" ON public.user_roles
  FOR DELETE TO authenticated USING (public.has_role(auth.uid(),'admin'));

-- Bootstrap: first caller becomes admin (safe only while zero admins exist)
CREATE OR REPLACE FUNCTION public.claim_first_admin()
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  uid UUID := auth.uid();
BEGIN
  IF uid IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;
  IF EXISTS (SELECT 1 FROM public.user_roles WHERE role = 'admin') THEN
    RETURN false;
  END IF;
  INSERT INTO public.user_roles (user_id, role) VALUES (uid, 'admin')
  ON CONFLICT (user_id, role) DO NOTHING;
  RETURN true;
END;
$$;
REVOKE EXECUTE ON FUNCTION public.claim_first_admin() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.claim_first_admin() TO authenticated;

-- Convenience: list all users with their profile for admin panel
CREATE OR REPLACE FUNCTION public.admin_list_users()
RETURNS TABLE (id UUID, email TEXT, full_name TEXT, avatar_url TEXT, city TEXT, created_at TIMESTAMPTZ)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'Forbidden';
  END IF;
  RETURN QUERY
    SELECT u.id, u.email::TEXT, p.full_name, p.avatar_url, p.city, u.created_at
    FROM auth.users u
    LEFT JOIN public.profiles p ON p.id = u.id
    ORDER BY u.created_at DESC;
END;
$$;
REVOKE EXECUTE ON FUNCTION public.admin_list_users() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.admin_list_users() TO authenticated;
