import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";

export type ListingCategory = "passeio" | "hospedagem" | "restaurante" | "evento" | "cupom";
export type Listing = Database["public"]["Tables"]["listings"]["Row"];

import tourImg from "@/assets/tour-1.jpg";
import hotelImg from "@/assets/hotel-1.jpg";
import restaurantImg from "@/assets/restaurant-1.jpg";
import eventImg from "@/assets/event-1.jpg";

export function fallbackImage(cat: ListingCategory): string {
  switch (cat) {
    case "hospedagem":
      return hotelImg;
    case "restaurante":
      return restaurantImg;
    case "evento":
      return eventImg;
    case "cupom":
      return restaurantImg;
    case "passeio":
    default:
      return tourImg;
  }
}

export function useListings(category: ListingCategory, cityId?: string | null) {
  return useQuery({
    queryKey: ["listings", category, cityId ?? "all"],
    queryFn: async () => {
      let q = supabase
        .from("listings")
        .select("*")
        .eq("category", category)
        .eq("active", true)
        .eq("status", "approved")
        .order("created_at", { ascending: false });
      if (cityId) q = q.eq("city_id", cityId);
      const { data, error } = await q;
      if (error) throw error;
      return data as Listing[];
    },
  });
}

export function useListing(id: string) {
  return useQuery({
    queryKey: ["listing", id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("listings")
        .select("*")
        .eq("id", id)
        .eq("active", true)
        .eq("status", "approved")
        .maybeSingle();
      if (error) throw error;
      return data as Listing | null;
    },
  });
}
