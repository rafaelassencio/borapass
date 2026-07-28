
-- is_staff helper
CREATE OR REPLACE FUNCTION public.is_staff(_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role IN ('admin'::app_role, 'support'::app_role)
  )
$$;
REVOKE EXECUTE ON FUNCTION public.is_staff(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.is_staff(uuid) TO authenticated;

-- cities
CREATE TABLE public.cities (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  state text,
  slug text NOT NULL UNIQUE,
  active boolean NOT NULL DEFAULT true,
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.cities TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON public.cities TO authenticated;
GRANT ALL ON public.cities TO service_role;
ALTER TABLE public.cities ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public views active cities" ON public.cities
  FOR SELECT TO anon, authenticated USING (active = true);
CREATE POLICY "Staff views all cities" ON public.cities
  FOR SELECT TO authenticated USING (public.is_staff(auth.uid()));
CREATE POLICY "Staff inserts cities" ON public.cities
  FOR INSERT TO authenticated WITH CHECK (public.is_staff(auth.uid()));
CREATE POLICY "Staff updates cities" ON public.cities
  FOR UPDATE TO authenticated USING (public.is_staff(auth.uid())) WITH CHECK (public.is_staff(auth.uid()));
CREATE POLICY "Admin deletes cities" ON public.cities
  FOR DELETE TO authenticated USING (public.has_role(auth.uid(), 'admin'::app_role));

CREATE TRIGGER update_cities_updated_at BEFORE UPDATE ON public.cities
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

INSERT INTO public.cities (name, state, slug, sort_order) VALUES
  ('São Paulo', 'SP', 'sao-paulo', 1),
  ('Rio de Janeiro', 'RJ', 'rio-de-janeiro', 2),
  ('Salvador', 'BA', 'salvador', 3),
  ('Florianópolis', 'SC', 'florianopolis', 4),
  ('Gramado', 'RS', 'gramado', 5),
  ('Fortaleza', 'CE', 'fortaleza', 6);

-- listings additions
ALTER TABLE public.listings
  ADD COLUMN IF NOT EXISTS status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','approved','rejected')),
  ADD COLUMN IF NOT EXISTS city_id uuid REFERENCES public.cities(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS reviewed_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS reviewed_at timestamptz;

UPDATE public.listings SET status = 'approved' WHERE status = 'pending';

DROP POLICY IF EXISTS "Public can view active listings" ON public.listings;
DROP POLICY IF EXISTS "Admins manage all listings" ON public.listings;

CREATE POLICY "Public views approved active listings" ON public.listings
  FOR SELECT TO anon, authenticated USING (active = true AND status = 'approved');
CREATE POLICY "Staff views all listings" ON public.listings
  FOR SELECT TO authenticated USING (public.is_staff(auth.uid()));
CREATE POLICY "Staff updates listings" ON public.listings
  FOR UPDATE TO authenticated USING (public.is_staff(auth.uid())) WITH CHECK (public.is_staff(auth.uid()));
CREATE POLICY "Staff deletes listings" ON public.listings
  FOR DELETE TO authenticated USING (public.is_staff(auth.uid()));

-- notifications
CREATE TABLE public.notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  type text NOT NULL,
  title text NOT NULL,
  body text,
  listing_id uuid REFERENCES public.listings(id) ON DELETE CASCADE,
  read_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX notifications_user_created_idx ON public.notifications (user_id, created_at DESC);
GRANT SELECT, UPDATE, DELETE ON public.notifications TO authenticated;
GRANT ALL ON public.notifications TO service_role;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users read own notifications" ON public.notifications
  FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users update own notifications" ON public.notifications
  FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users delete own notifications" ON public.notifications
  FOR DELETE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Staff inserts notifications" ON public.notifications
  FOR INSERT TO authenticated WITH CHECK (public.is_staff(auth.uid()));

CREATE OR REPLACE FUNCTION public.notify_listing_status_change()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.status IS DISTINCT FROM OLD.status AND NEW.status IN ('approved','rejected') THEN
    INSERT INTO public.notifications (user_id, type, title, body, listing_id)
    VALUES (
      NEW.owner_id,
      CASE WHEN NEW.status = 'approved' THEN 'listing_approved' ELSE 'listing_rejected' END,
      CASE WHEN NEW.status = 'approved' THEN 'Anúncio aprovado' ELSE 'Anúncio rejeitado' END,
      NEW.title,
      NEW.id
    );
  END IF;
  RETURN NEW;
END;
$$;
REVOKE EXECUTE ON FUNCTION public.notify_listing_status_change() FROM PUBLIC;

CREATE TRIGGER trg_notify_listing_status
AFTER UPDATE OF status ON public.listings
FOR EACH ROW EXECUTE FUNCTION public.notify_listing_status_change();
