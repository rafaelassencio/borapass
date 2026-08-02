import { useState, useEffect, useCallback } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

// Helper for dynamic table access without explicit any
const getFavTable = () => (supabase as unknown as { from: (t: string) => any }).from("favorites");

export function useFavorites(userId?: string | null) {
  const [favorites, setFavorites] = useState<string[]>(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("borapass:favorites");
      if (saved) {
        try {
          return JSON.parse(saved);
        } catch {
          /* fallback */
        }
      }
    }
    return ["1", "t-1", "h-1"];
  });

  // Sync initial database favorites if user logged in
  useEffect(() => {
    if (!userId) return;
    let cancelled = false;
    (async () => {
      try {
        const { data } = await getFavTable().select("listing_id").eq("user_id", userId);
        if (cancelled || !data) return;
        const dbFavs = (data as Array<{ listing_id: string }>).map((f) => f.listing_id);
        if (dbFavs.length > 0) {
          setFavorites((prev) => {
            const merged = Array.from(new Set([...prev, ...dbFavs]));
            if (typeof window !== "undefined") {
              localStorage.setItem("borapass:favorites", JSON.stringify(merged));
            }
            return merged;
          });
        }
      } catch {
        /* fallback */
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [userId]);

  const isFavorite = useCallback((id: string) => favorites.includes(id), [favorites]);

  const toggleFavorite = useCallback(
    async (id: string, title?: string) => {
      setFavorites((prev) => {
        const exists = prev.includes(id);
        const next = exists ? prev.filter((item) => item !== id) : [...prev, id];

        if (typeof window !== "undefined") {
          localStorage.setItem("borapass:favorites", JSON.stringify(next));
        }

        if (exists) {
          toast.info(title ? `"${title}" removido dos favoritos` : "Removido dos favoritos");
          if (userId) {
            getFavTable().delete().eq("user_id", userId).eq("listing_id", id);
          }
        } else {
          toast.success(
            title ? `❤️ "${title}" adicionado aos favoritos!` : "❤️ Adicionado aos favoritos!",
          );
          if (userId) {
            getFavTable().insert({ user_id: userId, listing_id: id });
          }
        }

        return next;
      });
    },
    [userId],
  );

  return { favorites, isFavorite, toggleFavorite };
}
