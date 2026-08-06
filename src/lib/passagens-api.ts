import { supabase } from "@/integrations/supabase/client";

export type FlightTicket = {
  id: string;
  airline: string;
  airlineLogo: string;
  flightNumber: string;
  origin: string;
  destination: string;
  departureTime: string;
  arrivalTime: string;
  duration: string;
  stops: number;
  stopDetails?: string;
  baggage: string;
  cabinClass: string;
  price: number;
  taxes: number;
  availableSeats: number;
};

export type BusTicket = {
  id: string;
  companyName: string;
  companyLogo: string;
  category: "Convencional" | "Executivo" | "Semi-Leito" | "Leito" | "Cama";
  origin: string;
  destination: string;
  departureTime: string;
  arrivalTime: string;
  duration: string;
  availableSeats: number;
  price: number;
  taxes: number;
  amenities: string[];
};

export type SearchHistoryItem = {
  id: string;
  type: "aereo" | "rodoviario";
  origin: string;
  destination: string;
  date: string;
  returnDate?: string;
  passengersCount: number;
  cabinClass?: string;
  timestamp: string;
};

export type FavoriteRoute = {
  id: string;
  type: "aereo" | "rodoviario";
  origin: string;
  destination: string;
  created_at: string;
};

// CACHE EM MEMÓRIA (Evita requisições repetidas para os mesmos parâmetros)
const flightsCache = new Map<string, { data: FlightTicket[]; timestamp: number }>();
const busCache = new Map<string, { data: BusTicket[]; timestamp: number }>();
const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutos de cache em memória

/**
 * Invoca a Edge Function searchFlights (MaxMilhas)
 */
export async function searchFlights(params: {
  origin: string;
  destination: string;
  departureDate: string;
  returnDate?: string;
  adults?: number;
  children?: number;
  infants?: number;
  cabinClass?: string;
  signal?: AbortSignal;
}): Promise<FlightTicket[]> {
  const cacheKey = `${params.origin}-${params.destination}-${params.departureDate}-${params.returnDate || ""}-${params.cabinClass || "economy"}`;

  // Verificar cache em memória
  const cached = flightsCache.get(cacheKey);
  if (cached && Date.now() - cached.timestamp < CACHE_TTL_MS) {
    console.log(`[Passagens API] Retornando voos do cache em memória para "${cacheKey}"`);
    return cached.data;
  }

  // Registrar no histórico de pesquisas
  saveSearchHistory({
    id: `hist-${Date.now()}`,
    type: "aereo",
    origin: params.origin,
    destination: params.destination,
    date: params.departureDate,
    returnDate: params.returnDate,
    passengersCount: (params.adults || 1) + (params.children || 0) + (params.infants || 0),
    cabinClass: params.cabinClass,
    timestamp: new Date().toISOString(),
  });

  try {
    const { data, error } = await supabase.functions.invoke("searchFlights", {
      body: params,
    });

    if (error || !data || !data.results) {
      console.warn("[Passagens API] Edge Function searchFlights retornou fallback offline:", error);
      const fallback = getMockFlights(params);
      flightsCache.set(cacheKey, { data: fallback, timestamp: Date.now() });
      return fallback;
    }

    const results: FlightTicket[] = data.results;
    flightsCache.set(cacheKey, { data: results, timestamp: Date.now() });
    return results;
  } catch (err) {
    console.error("[Passagens API] Exceção na busca de voos, usando fallback:", err);
    const fallback = getMockFlights(params);
    flightsCache.set(cacheKey, { data: fallback, timestamp: Date.now() });
    return fallback;
  }
}

/**
 * Invoca a Edge Function searchBusTickets (ClickBus)
 */
export async function searchBusTickets(params: {
  origin: string;
  destination: string;
  date: string;
  passengers?: number;
  signal?: AbortSignal;
}): Promise<BusTicket[]> {
  const cacheKey = `${params.origin}-${params.destination}-${params.date}-${params.passengers || 1}`;

  // Verificar cache em memória
  const cached = busCache.get(cacheKey);
  if (cached && Date.now() - cached.timestamp < CACHE_TTL_MS) {
    console.log(`[Passagens API] Retornando ônibus do cache em memória para "${cacheKey}"`);
    return cached.data;
  }

  // Registrar no histórico de pesquisas
  saveSearchHistory({
    id: `hist-${Date.now()}`,
    type: "rodoviario",
    origin: params.origin,
    destination: params.destination,
    date: params.date,
    passengersCount: params.passengers || 1,
    timestamp: new Date().toISOString(),
  });

  try {
    const { data, error } = await supabase.functions.invoke("searchBusTickets", {
      body: params,
    });

    if (error || !data || !data.results) {
      console.warn("[Passagens API] Edge Function searchBusTickets retornou fallback offline:", error);
      const fallback = getMockBusTickets(params);
      busCache.set(cacheKey, { data: fallback, timestamp: Date.now() });
      return fallback;
    }

    const results: BusTicket[] = data.results;
    busCache.set(cacheKey, { data: results, timestamp: Date.now() });
    return results;
  } catch (err) {
    console.error("[Passagens API] Exceção na busca de ônibus, usando fallback:", err);
    const fallback = getMockBusTickets(params);
    busCache.set(cacheKey, { data: fallback, timestamp: Date.now() });
    return fallback;
  }
}

// =========================================================
// GESTÃO DE HISTÓRICO & FAVORITOS EM LOCALSTORAGE
// =========================================================

export function getStoredSearchHistory(): SearchHistoryItem[] {
  if (typeof window === "undefined") return [];
  try {
    const saved = localStorage.getItem("borapass:tickets-history");
    if (saved) return JSON.parse(saved);
  } catch { /* fallback */ }
  return [];
}

export function saveSearchHistory(item: SearchHistoryItem) {
  if (typeof window === "undefined") return;
  const current = getStoredSearchHistory();
  // Evitar duplicatas consecutivas idênticas
  const filtered = current.filter(
    (h) => !(h.type === item.type && h.origin === item.origin && h.destination === item.destination && h.date === item.date),
  );
  const updated = [item, ...filtered].slice(0, 20); // Manter últimas 20 pesquisas
  localStorage.setItem("borapass:tickets-history", JSON.stringify(updated));
}

export function clearSearchHistory() {
  if (typeof window === "undefined") return;
  localStorage.removeItem("borapass:tickets-history");
}

export function getStoredFavoriteRoutes(): FavoriteRoute[] {
  if (typeof window === "undefined") return [];
  try {
    const saved = localStorage.getItem("borapass:tickets-favorites");
    if (saved) return JSON.parse(saved);
  } catch { /* fallback */ }
  return [];
}

export function toggleFavoriteRoute(route: { type: "aereo" | "rodoviario"; origin: string; destination: string }) {
  if (typeof window === "undefined") return [];
  const current = getStoredFavoriteRoutes();
  const exists = current.find(
    (f) => f.type === route.type && f.origin.toLowerCase() === route.origin.toLowerCase() && f.destination.toLowerCase() === route.destination.toLowerCase(),
  );

  let updated: FavoriteRoute[];
  if (exists) {
    updated = current.filter((f) => f.id !== exists.id);
  } else {
    updated = [
      {
        id: `fav-${Date.now()}`,
        type: route.type,
        origin: route.origin,
        destination: route.destination,
        created_at: new Date().toISOString(),
      },
      ...current,
    ];
  }
  localStorage.setItem("borapass:tickets-favorites", JSON.stringify(updated));
  return updated;
}

// Fallback Mock Data se a Edge Function estiver desconectada no ambiente local
function getMockFlights(params: any): FlightTicket[] {
  const orig = (params.origin || "RIO").toUpperCase();
  const dest = (params.destination || "SÃO").toUpperCase();
  const isBiz = params.cabinClass === "business";

  return [
    {
      id: "fl-latam-101",
      airline: "LATAM Airlines",
      airlineLogo: "https://images.unsplash.com/photo-1436491865332-7a61a109cc05?w=120&q=80",
      flightNumber: "LA-3240",
      origin: orig,
      destination: dest,
      departureTime: "06:30",
      arrivalTime: "07:45",
      duration: "1h 15m",
      stops: 0,
      baggage: "Mala de mão inclusa (10kg)",
      cabinClass: isBiz ? "Executiva" : "Econômica",
      price: isBiz ? 890 : 349.9,
      taxes: 38.5,
      availableSeats: 6,
    },
    {
      id: "fl-gol-202",
      airline: "GOL Linhas Aéreas",
      airlineLogo: "https://images.unsplash.com/photo-1540959733332-eab4deabeeaf?w=120&q=80",
      flightNumber: "G3-1452",
      origin: orig,
      destination: dest,
      departureTime: "10:15",
      arrivalTime: "11:35",
      duration: "1h 20m",
      stops: 0,
      baggage: "Mala de mão + bagagem despachada 23kg 🎒",
      cabinClass: isBiz ? "Executiva" : "Econômica",
      price: isBiz ? 950 : 419.0,
      taxes: 42.0,
      availableSeats: 4,
    },
    {
      id: "fl-azul-303",
      airline: "Azul Linhas Aéreas",
      airlineLogo: "https://images.unsplash.com/photo-1520437358207-323b43b5752b?w=120&q=80",
      flightNumber: "AD-4598",
      origin: orig,
      destination: dest,
      departureTime: "14:50",
      arrivalTime: "17:10",
      duration: "2h 20m",
      stops: 1,
      stopDetails: "Conexão em Viracopos (VCP) - 45min",
      baggage: "Mala de mão inclusa (10kg)",
      cabinClass: isBiz ? "Executiva" : "Econômica",
      price: isBiz ? 1120 : 489.5,
      taxes: 45.0,
      availableSeats: 9,
    },
    {
      id: "fl-latam-404",
      airline: "LATAM Airlines",
      airlineLogo: "https://images.unsplash.com/photo-1436491865332-7a61a109cc05?w=120&q=80",
      flightNumber: "LA-4920",
      origin: orig,
      destination: dest,
      departureTime: "19:40",
      arrivalTime: "20:55",
      duration: "1h 15m",
      stops: 0,
      baggage: "Mala de mão + despachada inclusas 🧳",
      cabinClass: isBiz ? "Executiva" : "Econômica Premium",
      price: isBiz ? 1290 : 540.0,
      taxes: 38.5,
      availableSeats: 2,
    },
  ];
}

function getMockBusTickets(params: any): BusTicket[] {
  const orig = params.origin || "Rio de Janeiro";
  const dest = params.destination || "Búzios";

  return [
    {
      id: "bus-1001-1",
      companyName: "Viação 1001",
      companyLogo: "https://images.unsplash.com/photo-1570125909232-eb263c188f7e?w=120&q=80",
      category: "Semi-Leito",
      origin: orig,
      destination: dest,
      departureTime: "07:00",
      arrivalTime: "10:15",
      duration: "3h 15m",
      availableSeats: 18,
      price: 89.9,
      taxes: 9.0,
      amenities: ["Wi-Fi 📶", "Ar Condicionado ❄️", "Entrada USB 🔌", "Água Mineral 🥤"],
    },
    {
      id: "bus-cometa-2",
      companyName: "Viação Cometa",
      companyLogo: "https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?w=120&q=80",
      category: "Leito",
      origin: orig,
      destination: dest,
      departureTime: "09:30",
      arrivalTime: "12:45",
      duration: "3h 15m",
      availableSeats: 12,
      price: 139.0,
      taxes: 11.5,
      amenities: ["Poltrona Reclinável 180° 🛋️", "Wi-Fi 📶", "Manta & Travesseiro 🛏️", "Ar Condicionado ❄️"],
    },
    {
      id: "bus-gontijo-3",
      companyName: "Viação Gontijo",
      companyLogo: "https://images.unsplash.com/photo-1570125909232-eb263c188f7e?w=120&q=80",
      category: "Executivo",
      origin: orig,
      destination: dest,
      departureTime: "13:15",
      arrivalTime: "16:45",
      duration: "3h 30m",
      availableSeats: 24,
      price: 78.5,
      taxes: 8.0,
      amenities: ["Ar Condicionado ❄️", "Sanitário 🚽", "Tomadas ⚡"],
    },
    {
      id: "bus-catarinense-4",
      companyName: "Viação Catarinense",
      companyLogo: "https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?w=120&q=80",
      category: "Cama",
      origin: orig,
      destination: dest,
      departureTime: "23:00",
      arrivalTime: "02:15",
      duration: "3h 15m",
      availableSeats: 6,
      price: 199.0,
      taxes: 15.0,
      amenities: ["Cama Individual 🛌", "Kit Lanche Gourmet 🥪", "Wi-Fi 5G 📶", "Entrada USB-C 🔌"],
    },
  ];
}
