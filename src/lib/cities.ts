import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { fetchWithTimeout } from "@/lib/listings";

export type CityItem = {
  id: string;
  name: string;
  state: string;
  slug: string;
  active: boolean;
  banner_url?: string;
  banner_urls?: string[]; // Até 3 fotos de banner por Destino
  sort_order?: number;
  created_at?: string;
};

export const DEFAULT_CITIES: CityItem[] = [];

export function getStoredCities(onlyActive = false): CityItem[] {
  let list: CityItem[] = [];
  if (typeof window !== "undefined") {
    const saved = localStorage.getItem("borapass:custom-cities");
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) list = parsed;
      } catch {
        /* fallback */
      }
    }
  }
  return onlyActive ? list.filter((c) => c.active !== false) : list;
}

export function saveStoredCities(cities: CityItem[]) {
  if (typeof window !== "undefined") {
    localStorage.setItem("borapass:custom-cities", JSON.stringify(cities));
    window.dispatchEvent(new Event("borapass:cities-changed"));
  }
}

export function useCities(includeInactive = false) {
  return useQuery({
    queryKey: ["cities", includeInactive],
    queryFn: async () => {
      const stored = getStoredCities(!includeInactive);

      // Se houver destinos salvos em Gestao de Destinos, eles sao a fonte soberana!
      if (stored.length > 0) {
        return includeInactive ? stored : stored.filter((c) => c.active !== false);
      }

      try {
        let q = supabase.from("cities").select("*").order("sort_order").order("name");
        if (!includeInactive) q = q.eq("active", true);
        const { data, error } = await fetchWithTimeout(q, 2500);
        if (error || !data || data.length === 0) return [];

        const dbCities: CityItem[] = (data as any[]).map((dbItem) => ({
          id: dbItem.id,
          name: dbItem.name,
          state: dbItem.state,
          slug: dbItem.slug,
          active: dbItem.active !== false,
          banner_url: dbItem.banner_url,
          banner_urls: dbItem.banner_urls,
          sort_order: dbItem.sort_order,
        }));

        return includeInactive ? dbCities : dbCities.filter((c) => c.active !== false);
      } catch {
        return stored;
      }
    },
  });
}
