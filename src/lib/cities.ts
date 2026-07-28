import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";

export type City = Database["public"]["Tables"]["cities"]["Row"];

export function useCities(includeInactive = false) {
  return useQuery({
    queryKey: ["cities", includeInactive],
    queryFn: async () => {
      let q = supabase.from("cities").select("*").order("sort_order").order("name");
      if (!includeInactive) q = q.eq("active", true);
      const { data, error } = await q;
      if (error) throw error;
      return data as City[];
    },
  });
}
