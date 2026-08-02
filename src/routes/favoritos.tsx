import { createFileRoute, Link } from "@tanstack/react-router";
import { AppShell, PageHeader } from "@/components/AppShell";
import { Heart, Trash2, MapPin, Sparkles } from "lucide-react";
import { useFavorites } from "@/lib/favorites";
import { useAuth } from "@/hooks/use-auth";
import { useMemo } from "react";
import {
  tours as mockTours,
  hotels as mockHotels,
  restaurants as mockRestaurants,
  events as mockEvents,
} from "@/lib/mock-data";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { fallbackImage } from "@/lib/listings";

export const Route = createFileRoute("/favoritos")({
  head: () => ({ meta: [{ title: "Favoritos — Bora Pass" }] }),
  component: FavoritosPage,
});

type ListingItem = {
  id: string;
  title: string;
  category: string;
  image: string;
  price?: number | null;
  address?: string | null;
  city?: string | null;
};

export function FavoritosPage() {
  const { user } = useAuth();
  const { favorites, toggleFavorite } = useFavorites(user?.id);

  // Fetch all Supabase DB listings
  const { data: dbListings } = useQuery({
    queryKey: ["listings", "all-favoritos"],
    queryFn: async () => {
      const { data } = await supabase.from("listings").select("*");
      return data ?? [];
    },
  });

  // Load custom listings from localStorage
  const customListings = useMemo(() => {
    if (typeof window === "undefined") return [];
    const savedRaw = localStorage.getItem("borapass:custom-listings");
    if (!savedRaw) return [];
    try {
      return JSON.parse(savedRaw);
    } catch {
      return [];
    }
  }, []);

  // Merge all available items (mocks + Supabase DB + custom localStorage)
  const allListings = useMemo(() => {
    const listMap = new Map<string, ListingItem>();

    mockTours.forEach((t) =>
      listMap.set(t.id, {
        id: t.id,
        title: t.name,
        category: "passeio",
        image: t.image,
        price: t.price,
        address: t.address,
      }),
    );
    mockHotels.forEach((h) =>
      listMap.set(h.id, {
        id: h.id,
        title: h.name,
        category: "hospedagem",
        image: h.image,
        price: h.price,
        address: h.address,
      }),
    );
    mockRestaurants.forEach((r) =>
      listMap.set(r.id, {
        id: r.id,
        title: r.name,
        category: "restaurante",
        image: r.image,
        price: 90,
        address: "Centro / Orla",
      }),
    );
    mockEvents.forEach((e) =>
      listMap.set(e.id, {
        id: e.id,
        title: e.name,
        category: "evento",
        image: e.image,
        price: e.price,
        address: e.location,
      }),
    );

    (dbListings ?? []).forEach((db: any) => {
      listMap.set(db.id, {
        id: db.id,
        title: db.title,
        category: db.category,
        image: db.image_url || fallbackImage(db.category as any),
        price: db.price,
        address: db.address || db.city,
        city: db.city,
      });
    });

    customListings.forEach((c: any) => {
      listMap.set(c.id, {
        id: c.id,
        title: c.title,
        category: c.category,
        image: c.image_url || c.image || fallbackImage(c.category as any),
        price: c.price,
        address: c.address,
        city: c.city,
      });
    });

    return Array.from(listMap.values());
  }, [dbListings, customListings]);

  const favoritedItems = useMemo(() => {
    return allListings.filter((item) => favorites.includes(item.id));
  }, [allListings, favorites]);

  const routeForCategory = (c: string, id: string) => {
    const norm = (c || "").toLowerCase().trim();
    if (
      norm.includes("hospedag") ||
      norm.includes("hotel") ||
      norm.includes("pousada") ||
      norm.includes("resort")
    ) {
      return { to: "/hospedagens/$id" as const, params: { id } };
    }
    if (norm.includes("passeio") || norm.includes("trilha") || norm.includes("tour")) {
      return { to: "/passeios/$id" as const, params: { id } };
    }
    if (norm.includes("evento") || norm.includes("fest")) {
      return { to: "/eventos/$id" as const, params: { id } };
    }
    if (norm.includes("cupom") || norm.includes("restaurante") || norm.includes("gastro")) {
      return { to: "/cupons/$id" as const, params: { id } };
    }
    return { to: "/passeios/$id" as const, params: { id } };
  };

  return (
    <AppShell>
      <PageHeader title="Favoritos" subtitle="Suas experiências e locais salvos" />
      <div className="p-5 space-y-6">
        {favoritedItems.length === 0 ? (
          <div className="rounded-3xl border border-dashed border-border bg-card p-8 text-center shadow-soft">
            <Heart className="mx-auto h-12 w-12 text-muted-foreground/50" />
            <h2 className="mt-3 text-base font-bold text-foreground">
              Nenhum favorito salvo ainda
            </h2>
            <p className="mt-1 text-xs text-muted-foreground">
              Navegue pelos anúncios, passeios e restaurantes e clique no coração ❤️ para salvar
              seus favoritos!
            </p>
            <Link
              to="/explorar"
              className="mt-4 inline-flex items-center gap-2 rounded-2xl bg-gradient-brand px-5 py-2.5 text-xs font-bold text-white shadow-brand"
            >
              <Sparkles className="h-4 w-4" /> Explorar Anúncios
            </Link>
          </div>
        ) : (
          <div className="space-y-3">
            <div className="flex items-center justify-between text-xs font-bold text-muted-foreground uppercase tracking-wider">
              <span>Seus Itens Salvos ({favoritedItems.length})</span>
            </div>
            {favoritedItems.map((item) => {
              const route = routeForCategory(item.category, item.id);
              return (
                <div
                  key={item.id}
                  className="flex items-center gap-3.5 rounded-2xl border border-border bg-card p-3 shadow-soft transition hover:shadow-elevated"
                >
                  <img
                    src={item.image}
                    alt={item.title}
                    className="h-20 w-24 rounded-xl object-cover"
                    loading="lazy"
                  />
                  <div className="flex-1 min-w-0 py-0.5">
                    <div className="flex items-center gap-1.5">
                      <span className="rounded-md bg-primary/10 px-2 py-0.5 text-[10px] font-extrabold text-primary capitalize">
                        {item.category}
                      </span>
                    </div>
                    <Link
                      to={route.to}
                      params={route.params}
                      className="mt-1 block truncate text-sm font-bold text-foreground hover:underline"
                    >
                      {item.title}
                    </Link>
                    {item.address && (
                      <p className="mt-0.5 truncate text-[11px] text-muted-foreground flex items-center gap-1">
                        <MapPin className="h-3 w-3 shrink-0" /> {item.address}
                      </p>
                    )}
                    {item.price !== undefined && item.price !== null && (
                      <p className="mt-1 text-xs font-black text-primary">
                        {item.price === 0 ? "GRÁTIS 🎁" : `R$ ${item.price}`}
                      </p>
                    )}
                  </div>
                  <button
                    onClick={() => toggleFavorite(item.id, item.title)}
                    className="rounded-full p-2.5 text-red-500 hover:bg-red-500/10 transition"
                    title="Remover dos favoritos"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </AppShell>
  );
}
