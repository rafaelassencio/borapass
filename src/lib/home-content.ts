import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";

export type HomeBanner = Database["public"]["Tables"]["home_banners"]["Row"];
export type HomeHighlight = Database["public"]["Tables"]["home_highlights"]["Row"];

export function useHomeBanners(includeInactive = false) {
  return useQuery({
    queryKey: ["home_banners", includeInactive],
    queryFn: async () => {
      let q = supabase.from("home_banners").select("*").order("sort_order").order("created_at");
      if (!includeInactive) q = q.eq("active", true);
      const { data, error } = await q;
      if (error) throw error;
      return data as HomeBanner[];
    },
  });
}

export function useHomeHighlights(cityId?: string | null, includeInactive = false) {
  return useQuery({
    queryKey: ["home_highlights", cityId ?? "all", includeInactive],
    queryFn: async () => {
      let q = supabase.from("home_highlights").select("*").order("sort_order").order("created_at");
      if (!includeInactive) q = q.eq("active", true);
      const { data, error } = await q;
      if (error) throw error;
      let rows = (data ?? []) as HomeHighlight[];
      if (cityId) rows = rows.filter((r) => !r.city_id || r.city_id === cityId);
      return rows;
    },
  });
}
