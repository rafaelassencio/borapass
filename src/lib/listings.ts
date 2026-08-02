import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";
import {
  tours as mockTours,
  coupons as mockCoupons,
  hotels as mockHotels,
  restaurants as mockRestaurants,
  events as mockEvents,
} from "@/lib/mock-data";

export type ListingCategory =
  | "passeio"
  | "hospedagem"
  | "restaurante"
  | "evento"
  | "cupom"
  | "compras"
  | "transporte"
  | "roteiros";

export type Listing = Database["public"]["Tables"]["listings"]["Row"] & {
  offer_type?: "price" | "perk";
  store_price?: number | null;
  traveler_price?: number | null;
  premium_price?: number | null;
  traveler_perk?: string | null;
  premium_perk?: string | null;
  location_url?: string | null;
  expires_at?: string | null;
  reviewed_at?: string | null;
  reviewed_by?: string | null;
  // Informações Detalhadas solicitadas
  badge_seal?: string | null;
  reserved_this_week?: number | null;
  spots_left_today?: number | null;
  duration_text?: string | null;
  capacity_text?: string | null;
  car_distance_text?: string | null;
  walk_distance_text?: string | null;
  worth_reasons?: string[] | null;
  highlights?: string[] | null;
  includes?: string[] | null;
  excludes?: string[] | null;
  operating_days?: string | null;
  departure_times?: string | null;
  age_group?: string | null;
  rain_policy?: string | null;
  accessibility_info?: string | null;
  meeting_point?: string | null;
  contact_info?: string | null;
  video_url?: string | null;
  gallery_images?: string[] | null;
  faqs?: Array<{ q: string; a: string }> | null;
  // NOVOS CAMPOS ESPECÍFICOS POR CATEGORIA (CMS TURISMO PROFISSIONAL)
  phone?: string | null;
  whatsapp?: string | null;
  email?: string | null;
  website?: string | null;
  instagram?: string | null;
  facebook?: string | null;
  checkin_time?: string | null;
  checkout_time?: string | null;
  accommodation_type?: string | null;
  cancellation_policy?: string | null;
  languages?: string[] | null;
  pet_friendly?: boolean | null;
  accessibility?: boolean | null;
  libras_interpreter?: boolean | null;
  has_foreign_language?: boolean | null;
  parking?: boolean | null;
  wifi?: boolean | null;
  pool?: boolean | null;
  gym?: boolean | null;
  spa?: boolean | null;
  breakfast?: boolean | null;
  rooms_count?: number | null;
  beds_count?: number | null;
  max_capacity?: number | null;
  star_rating?: number | null;
  tags?: string[] | null;
  tour_360_url?: string | null;
  important_info?: string | null;
  seo_title?: string | null;
  seo_slug?: string | null;
  seo_description?: string | null;
  seo_keywords?: string | null;
  // Passeios
  difficulty_level?: string | null;
  min_age?: number | null;
  what_to_bring?: string[] | null;
  guide_included?: boolean | null;
  insurance_included?: boolean | null;
  equipment_included?: string | null;
  tour_type?: string | null;
  // Restaurantes
  cuisine_type?: string | null;
  price_range?: string | null;
  delivery_available?: boolean | null;
  reservations_accepted?: boolean | null;
  specialties?: string | null;
  menu_url?: string | null;
  kids_area?: boolean | null;
  chef_name?: string | null;
  wine_list?: boolean | null;
  live_music?: boolean | null;
  deck_area?: boolean | null;
  // Eventos
  event_start_date?: string | null;
  event_end_date?: string | null;
  event_start_time?: string | null;
  event_end_time?: string | null;
  ticket_batches?: Array<{ name: string; price: number; quantity: number }> | null;
  organizer_name?: string | null;
  rating_recommendation?: string | null;
  // Cupons
  coupon_code?: string | null;
  coupon_code_type?: "auto" | "manual" | null;
  coupon_discount_type?: "fixed" | "percent" | "free_shipping" | "cashback" | "gift" | null;
  coupon_discount_value?: number | null;
  coupon_min_purchase?: number | null;
  coupon_max_discount?: number | null;
  coupon_valid_days?: string[] | null;
  coupon_usage_limit_per_user?: number | null;
  coupon_total_limit?: number | null;
  coupon_used_count?: number | null;
  coupon_banner_url?: string | null;
  coupon_custom_color?: string | null;
  coupon_terms?: string | null;
};

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

export async function fetchWithTimeout<T>(promise: PromiseLike<T>, timeoutMs = 2500): Promise<T> {
  let timeoutId: ReturnType<typeof setTimeout>;
  const timeoutPromise = new Promise<never>((_, reject) => {
    timeoutId = setTimeout(() => reject(new Error("Timeout")), timeoutMs);
  });
  return Promise.race([promise, timeoutPromise]).finally(() => clearTimeout(timeoutId));
}

export function getTrashedListingIds(): Set<string> {
  const ids = new Set<string>();
  if (typeof window !== "undefined") {
    try {
      const saved = localStorage.getItem("borapass:trashed-listings");
      if (saved) {
        const parsed: Array<{ id: string }> = JSON.parse(saved);
        for (const item of parsed) {
          if (item.id) ids.add(item.id);
        }
      }
    } catch {
      /* fallback */
    }
  }
  return ids;
}

export function getInactiveListingIds(): Set<string> {
  const ids = new Set<string>();
  if (typeof window !== "undefined") {
    try {
      const saved = localStorage.getItem("borapass:active-listings-map");
      if (saved) {
        const parsed: Record<string, boolean> = JSON.parse(saved);
        for (const [id, active] of Object.entries(parsed)) {
          if (active === false) ids.add(id);
        }
      }
    } catch {
      /* fallback */
    }
  }
  return ids;
}

export function getStoredPartnerOffers(): Listing[] {
  if (typeof window === "undefined") return [];
  try {
    const savedOffers = localStorage.getItem("borapass:partner-offers");
    const customListings = localStorage.getItem("borapass:custom-listings");
    let items: any[] = [];
    if (savedOffers) {
      const parsed = JSON.parse(savedOffers);
      if (Array.isArray(parsed)) items = items.concat(parsed);
    }
    if (customListings) {
      const parsed = JSON.parse(customListings);
      if (Array.isArray(parsed)) items = items.concat(parsed);
    }

    const uniqueMap = new Map<string, any>();
    for (const item of items) {
      if (item && item.id) {
        uniqueMap.set(item.id, item);
      }
    }

    return Array.from(uniqueMap.values()).map((o) => {
      const rawCat = (o.category || "hospedagem").toLowerCase().trim();
      let normCat: ListingCategory = "hospedagem";
      if (rawCat.includes("hospedag") || rawCat.includes("hotel") || rawCat === "hoteis") {
        normCat = "hospedagem";
      } else if (
        rawCat.includes("restauran") ||
        rawCat.includes("gastro") ||
        rawCat === "restaurantes"
      ) {
        normCat = "restaurante";
      } else if (rawCat.includes("passeio") || rawCat.includes("trilha") || rawCat === "passeios") {
        normCat = "passeio";
      } else if (rawCat.includes("evento") || rawCat === "eventos") {
        normCat = "evento";
      } else if (rawCat.includes("cupom") || rawCat === "cupons") {
        normCat = "cupom";
      } else if (rawCat.includes("compra")) {
        normCat = "compras";
      } else if (rawCat.includes("transporte")) {
        normCat = "transporte";
      } else if (rawCat.includes("roteiro")) {
        normCat = "roteiros";
      }

      return {
        id: o.id,
        title: o.title || o.name || "Anúncio sem título",
        category: normCat,
        description: o.description || o.full_description || "",
        image_url: o.image_url || o.image || fallbackImage(normCat),
        price: o.price ?? o.traveler_price ?? o.store_price ?? 0,
        store_price: o.store_price || Math.round((o.traveler_price || 100) * 1.25),
        traveler_price: o.traveler_price || o.price || 0,
        premium_price: o.premium_price || Math.round((o.traveler_price || 100) * 0.75),
        address: o.address || o.city || "Gramado",
        city: o.city || "Gramado",
        lat: o.lat || -29.3746,
        lng: o.lng || -50.8764,
        active: o.active !== false,
        status: o.status || "approved",
        created_at: o.created_at || new Date().toISOString(),
        discount: o.discount_seal || o.discount || "🔥 OFERTA",
        ...o,
      } as unknown as Listing;
    });
  } catch {
    return [];
  }
}

export function getMockListing(id: string): Listing | null {
  if (!id) return null;

  const cleanId = id.trim();
  const strippedId = cleanId.replace(/^(t-|h-|hotel-|c-|e-|r-|cst-|evt-|po-|custom-)/, "");

  const trashedIds = getTrashedListingIds();
  const inactiveIds = getInactiveListingIds();
  if (
    trashedIds.has(cleanId) ||
    trashedIds.has(strippedId) ||
    inactiveIds.has(cleanId) ||
    inactiveIds.has(strippedId)
  ) {
    return null;
  }

  // Check stored partner offers and custom listings first!
  const storedListings = getStoredPartnerOffers();
  const storedFound = storedListings.find(
    (l) => l.id === cleanId || l.id === strippedId || `po-${l.id}` === cleanId,
  );
  if (storedFound) return storedFound;

  // Check mockTours
  const tour = mockTours.find(
    (t) => t.id === cleanId || t.id === strippedId || `t-${t.id}` === cleanId,
  );
  if (tour) {
    return {
      id: tour.id,
      title: tour.name,
      category: "passeio",
      description: tour.description,
      image_url: tour.image,
      price: tour.price,
      store_price: Math.round(tour.price * 1.25),
      traveler_price: tour.price > 0 ? Math.round(tour.price * 0.85) : 0,
      premium_price: tour.price > 0 ? Math.round(tour.price * 0.7) : 0,
      address: tour.address,
      city: "Rio de Janeiro",
      lat: tour.lat,
      lng: tour.lng,
      active: true,
      status: "published",
      created_at: new Date().toISOString(),
      city_id: null,
      discount: tour.price === 0 ? "GRÁTIS" : "15% OFF",
      owner_id: null,
      partner_id: null,
      updated_at: new Date().toISOString(),
      reviewed_at: null,
      reviewed_by: null,
    } as unknown as Listing;
  }

  // Check mockHotels
  const hotel = mockHotels.find(
    (h) =>
      h.id === cleanId ||
      h.id === strippedId ||
      `h-${h.id}` === cleanId ||
      `hotel-${h.id}` === cleanId,
  );
  if (hotel) {
    return {
      id: hotel.id,
      title: hotel.name,
      category: "hospedagem",
      description: `Hospedagem excelente em ${hotel.name}. Comodidades: ${hotel.amenities.join(", ")}.`,
      image_url: hotel.image,
      price: hotel.price,
      store_price: Math.round(hotel.price * 1.25),
      traveler_price: Math.round(hotel.price * 0.85),
      premium_price: Math.round(hotel.price * 0.7),
      address: hotel.address,
      city: "Rio de Janeiro",
      lat: hotel.lat,
      lng: hotel.lng,
      active: true,
      status: "published",
      created_at: new Date().toISOString(),
      city_id: null,
      discount: "20% OFF",
      owner_id: null,
      partner_id: null,
      updated_at: new Date().toISOString(),
      reviewed_at: null,
      reviewed_by: null,
    } as unknown as Listing;
  }

  // Check mockCoupons
  const coupon = mockCoupons.find(
    (c) => c.id === cleanId || c.id === strippedId || `c-${c.id}` === cleanId,
  );
  if (coupon) {
    return {
      id: coupon.id,
      title: coupon.title,
      category: "cupom",
      description: `${coupon.description} (${coupon.rules})`,
      image_url: coupon.image,
      price: 0,
      traveler_price: 0,
      premium_price: 0,
      address: coupon.partner,
      city: "Rio de Janeiro",
      lat: -22.9068,
      lng: -43.1729,
      active: true,
      status: "published",
      created_at: new Date().toISOString(),
      city_id: null,
      discount: coupon.discount,
      expires_at: coupon.validUntil,
      owner_id: null,
      partner_id: null,
      updated_at: new Date().toISOString(),
      reviewed_at: null,
      reviewed_by: null,
    } as unknown as Listing;
  }

  // Check mockEvents
  const evt = mockEvents.find(
    (e) => e.id === cleanId || e.id === strippedId || `e-${e.id}` === cleanId,
  );
  if (evt) {
    return {
      id: evt.id,
      title: evt.name,
      category: "evento",
      description: `Evento ${evt.name} em ${evt.location}. Data: ${evt.date} às ${evt.time}.`,
      image_url: evt.image,
      price: evt.price,
      store_price: Math.round(evt.price * 1.25),
      traveler_price: evt.price > 0 ? Math.round(evt.price * 0.8) : 0,
      premium_price: evt.price > 0 ? Math.round(evt.price * 0.6) : 0,
      address: evt.location,
      city: "Rio de Janeiro",
      lat: evt.lat,
      lng: evt.lng,
      active: true,
      status: "published",
      created_at: new Date().toISOString(),
      city_id: null,
      discount: evt.price === 0 ? "ENTRADA LIVRE" : "OFICIAL",
      owner_id: null,
      partner_id: null,
      updated_at: new Date().toISOString(),
      reviewed_at: null,
      reviewed_by: null,
    } as unknown as Listing;
  }

  // Check mockRestaurants
  const rest = mockRestaurants.find(
    (r) => r.id === cleanId || r.id === strippedId || `r-${r.id}` === cleanId,
  );
  if (rest) {
    return {
      id: rest.id,
      title: rest.name,
      category: "restaurante",
      description: `Restaurante ${rest.name} de culinária ${rest.cuisine}.`,
      image_url: rest.image,
      price: 90,
      store_price: 110,
      traveler_price: 75,
      premium_price: 60,
      address: "Orla / Centro, Rio de Janeiro",
      city: "Rio de Janeiro",
      lat: rest.lat,
      lng: rest.lng,
      active: true,
      status: "published",
      created_at: new Date().toISOString(),
      city_id: null,
      discount: "10% OFF",
      owner_id: null,
      partner_id: null,
      updated_at: new Date().toISOString(),
      reviewed_at: null,
      reviewed_by: null,
    } as unknown as Listing;
  }

  return null;
}

export function useListings(
  category: ListingCategory,
  cityId?: string | null,
  cityName?: string | null,
) {
  return useQuery({
    queryKey: ["listings", category, cityId ?? cityName ?? "all"],
    queryFn: async () => {
      let dbData: Listing[] = [];
      try {
        const { data } = await fetchWithTimeout(
          supabase.from("listings").select("*").order("created_at", { ascending: false }),
          2500,
        );

        if (data) dbData = data as Listing[];
      } catch {
        /* fallback em timeout/erro de rede */
      }

      // Filter DB items by category flexibly
      const normCat = category.toLowerCase().trim();
      const filteredDb = dbData.filter((item) => {
        const itemCat = (item.category || "").toLowerCase().trim();
        if (normCat === "hospedagem") {
          return (
            itemCat.includes("hospedag") || itemCat.includes("hotel") || itemCat === "hospedagens"
          );
        }
        if (normCat === "passeio") {
          return itemCat.includes("passeio") || itemCat.includes("trilha");
        }
        if (normCat === "evento") {
          return itemCat.includes("evento");
        }
        if (normCat === "cupom" || normCat === "restaurante") {
          return (
            itemCat.includes("cupom") ||
            itemCat.includes("restaurante") ||
            itemCat.includes("gastro")
          );
        }
        return itemCat === normCat;
      });

      // Prepare mock items if DB has no listings for this category
      let mockItems: Listing[] = [];
      if (normCat === "hospedagem") {
        mockItems = mockHotels.map(
          (h) =>
            ({
              id: h.id,
              title: h.name,
              category: "hospedagem",
              description: `Hospedagem excelente em ${h.name}. Comodidades: ${h.amenities.join(", ")}.`,
              image_url: h.image,
              price: h.price,
              store_price: Math.round(h.price * 1.25),
              traveler_price: Math.round(h.price * 0.85),
              premium_price: Math.round(h.price * 0.7),
              address: h.address,
              city: "Rio de Janeiro",
              lat: h.lat,
              lng: h.lng,
              active: true,
              status: "published",
              created_at: new Date().toISOString(),
              city_id: null,
              discount: "20% OFF",
              owner_id: null,
              partner_id: null,
              updated_at: new Date().toISOString(),
              reviewed_at: null,
              reviewed_by: null,
            }) as unknown as Listing,
        );
      }

      // Merge custom listings & partner offers from localStorage
      const storedOffers = getStoredPartnerOffers();

      const mergedMap = new Map<string, Listing>();

      // Add mock items first
      for (const item of mockItems) {
        mergedMap.set(item.id, item);
      }

      // Add db items
      for (const item of filteredDb) {
        mergedMap.set(item.id, item);
      }

      // Add stored partner & custom offers
      for (const item of storedOffers) {
        const itemCat = (item.category || "").toLowerCase().trim();
        const matchesCat =
          itemCat === normCat ||
          (normCat === "hospedagem" &&
            (itemCat.includes("hospedag") || itemCat.includes("hotel") || itemCat === "hoteis")) ||
          (normCat === "passeio" &&
            (itemCat.includes("passeio") ||
              itemCat.includes("trilha") ||
              itemCat === "passeios")) ||
          (normCat === "restaurante" &&
            (itemCat.includes("restauran") ||
              itemCat.includes("gastro") ||
              itemCat === "restaurantes")) ||
          (normCat === "evento" && (itemCat.includes("evento") || itemCat === "eventos")) ||
          (normCat === "cupom" && (itemCat.includes("cupom") || itemCat === "cupons")) ||
          (normCat === "compras" && itemCat.includes("compra")) ||
          (normCat === "transporte" && itemCat.includes("transporte")) ||
          (normCat === "roteiros" && itemCat.includes("roteiro"));

        if (matchesCat) {
          mergedMap.set(item.id, item);
        }
      }

      const result = Array.from(mergedMap.values());

      // Filter out items in the Recycle Bin (Lixeira) and items marked inactive
      const trashedIds = getTrashedListingIds();
      const inactiveIds = getInactiveListingIds();

      const activeResult = result.filter((item) => {
        if (trashedIds.has(item.id)) return false;
        if (inactiveIds.has(item.id)) return false;
        if (item.active === false) return false;
        return true;
      });

      // Filter by city if provided
      if (cityId || cityName) {
        const normCity = (cityName || "").toLowerCase().trim();
        return activeResult.filter((item) => {
          if (cityId && item.city_id === cityId) return true;
          if (normCity && item.city && item.city.toLowerCase().trim().includes(normCity))
            return true;
          if (normCity && item.address && item.address.toLowerCase().trim().includes(normCity))
            return true;
          return false;
        });
      }

      return activeResult;
    },
  });
}

export function useListing(id: string) {
  return useQuery({
    queryKey: ["listing", id],
    queryFn: async () => {
      if (!id) return getMockListing("1");

      const cleanId = id.trim();
      const strippedId = cleanId.replace(/^(t-|h-|hotel-|c-|e-|r-|cst-|evt-|custom-)/, "");

      const trashedIds = getTrashedListingIds();
      const inactiveIds = getInactiveListingIds();
      if (
        trashedIds.has(cleanId) ||
        trashedIds.has(strippedId) ||
        inactiveIds.has(cleanId) ||
        inactiveIds.has(strippedId)
      ) {
        return null;
      }

      // 1. Check local custom storage first
      if (typeof window !== "undefined") {
        const savedRaw = localStorage.getItem("borapass:custom-listings");
        if (savedRaw) {
          try {
            const localCustom: Listing[] = JSON.parse(savedRaw);
            const found = localCustom.find(
              (l) => l.id === cleanId || l.id === strippedId || `cst-${l.id}` === cleanId,
            );
            if (found) return found;
          } catch {
            /* fallback */
          }
        }
      }

      // 2. Check mock data items next
      const mockFound = getMockListing(cleanId);
      if (mockFound) return mockFound;

      // 3. Check if ID is a valid UUID before querying Supabase
      const isUUID =
        /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/.test(
          cleanId,
        );
      if (isUUID) {
        try {
          const { data, error } = await fetchWithTimeout(
            supabase.from("listings").select("*").eq("id", cleanId).maybeSingle(),
            2500,
          );

          if (!error && data) return data as Listing;
        } catch {
          /* fallback */
        }
      }

      return null;
    },
  });
}
