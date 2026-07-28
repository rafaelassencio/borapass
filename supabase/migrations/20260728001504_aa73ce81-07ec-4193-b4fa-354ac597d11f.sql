
-- home_banners
CREATE TABLE public.home_banners (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  media_url TEXT NOT NULL,
  media_type TEXT NOT NULL DEFAULT 'image' CHECK (media_type IN ('image','video')),
  title TEXT,
  sort_order INTEGER NOT NULL DEFAULT 0,
  active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT ON public.home_banners TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.home_banners TO authenticated;
GRANT ALL ON public.home_banners TO service_role;
ALTER TABLE public.home_banners ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public views active banners" ON public.home_banners FOR SELECT TO anon, authenticated USING (active = true);
CREATE POLICY "Staff views all banners" ON public.home_banners FOR SELECT TO authenticated USING (is_staff(auth.uid()));
CREATE POLICY "Staff inserts banners" ON public.home_banners FOR INSERT TO authenticated WITH CHECK (is_staff(auth.uid()));
CREATE POLICY "Staff updates banners" ON public.home_banners FOR UPDATE TO authenticated USING (is_staff(auth.uid())) WITH CHECK (is_staff(auth.uid()));
CREATE POLICY "Admin deletes banners" ON public.home_banners FOR DELETE TO authenticated USING (has_role(auth.uid(), 'admin'::app_role));
CREATE TRIGGER update_home_banners_updated_at BEFORE UPDATE ON public.home_banners FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- home_highlights
CREATE TABLE public.home_highlights (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  subtitle TEXT,
  image_url TEXT,
  link_url TEXT,
  city_id UUID REFERENCES public.cities(id) ON DELETE SET NULL,
  sort_order INTEGER NOT NULL DEFAULT 0,
  active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT ON public.home_highlights TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.home_highlights TO authenticated;
GRANT ALL ON public.home_highlights TO service_role;
ALTER TABLE public.home_highlights ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public views active highlights" ON public.home_highlights FOR SELECT TO anon, authenticated USING (active = true);
CREATE POLICY "Staff views all highlights" ON public.home_highlights FOR SELECT TO authenticated USING (is_staff(auth.uid()));
CREATE POLICY "Staff inserts highlights" ON public.home_highlights FOR INSERT TO authenticated WITH CHECK (is_staff(auth.uid()));
CREATE POLICY "Staff updates highlights" ON public.home_highlights FOR UPDATE TO authenticated USING (is_staff(auth.uid())) WITH CHECK (is_staff(auth.uid()));
CREATE POLICY "Admin deletes highlights" ON public.home_highlights FOR DELETE TO authenticated USING (has_role(auth.uid(), 'admin'::app_role));
CREATE TRIGGER update_home_highlights_updated_at BEFORE UPDATE ON public.home_highlights FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
