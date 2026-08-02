export type PartnerCategory =
  "Gastronomia" | "Hospedagem" | "Passeios & Lazer" | "Eventos" | "Comércio & Serviços";

export type PartnerStore = {
  id: string;
  user_id?: string;
  logo_url: string;
  store_name: string;
  cnpj: string;
  address: string;
  google_maps_url?: string;
  city: string;
  lat: number;
  lng: number;
  phone: string;
  email: string;
  owner_name: string;
  owner_phone: string;
  category: PartnerCategory;
  created_at: string;
};

export const DEFAULT_PARTNERS: PartnerStore[] = [
  {
    id: "p-1001",
    user_id: "u-demo-4",
    logo_url: "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=400&q=80",
    store_name: "Restaurante Sabor da Terra",
    cnpj: "12.345.678/0001-90",
    address: "Av. Atlântica, 1200, Copacabana",
    city: "Rio de Janeiro",
    lat: -22.9698,
    lng: -43.1802,
    phone: "(21) 98765-4321",
    email: "contato@sabordaterra.com.br",
    owner_name: "Fernanda Lima",
    owner_phone: "(21) 99887-6655",
    category: "Gastronomia",
    created_at: "2026-07-20T10:00:00Z",
  },
  {
    id: "p-1002",
    user_id: "u-demo-2",
    logo_url: "https://images.unsplash.com/photo-1566073771259-6a8506099945?w=400&q=80",
    store_name: "Pousada Vista Mar Búzios",
    cnpj: "98.765.432/0001-10",
    address: "Rua das Pedras, 450, Centro",
    city: "Búzios",
    lat: -22.7561,
    lng: -41.8887,
    phone: "(22) 99123-4567",
    email: "reserva@pousadavistamar.com",
    owner_name: "Carlos Eduardo Silva",
    owner_phone: "(22) 98112-3344",
    category: "Hospedagem",
    created_at: "2026-07-22T14:30:00Z",
  },
  {
    id: "p-1003",
    logo_url: "https://images.unsplash.com/photo-1544551763-46a013bb70d5?w=400&q=80",
    store_name: "Angra Náutica & Mergulho",
    cnpj: "45.890.123/0001-55",
    address: "Marina Verolme, Pier 3",
    city: "Angra dos Reis",
    lat: -23.0067,
    lng: -44.3181,
    phone: "(24) 99988-7766",
    email: "passeios@angranautica.com.br",
    owner_name: "Roberto Mendes",
    owner_phone: "(24) 99776-5544",
    category: "Passeios & Lazer",
    created_at: "2026-07-24T11:15:00Z",
  },
];

/**
 * Utility to get all stored partners (local storage + default demo)
 */
export function getStoredPartners(): PartnerStore[] {
  if (typeof window === "undefined") return DEFAULT_PARTNERS;
  const saved = localStorage.getItem("borapass:partner-stores");
  if (saved) {
    try {
      const parsed = JSON.parse(saved);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed;
      }
    } catch {
      /* fallback */
    }
  }
  return DEFAULT_PARTNERS;
}

/**
 * Utility to save a partner store (add or update)
 */
export function savePartnerStore(partner: PartnerStore): PartnerStore[] {
  const current = getStoredPartners();
  const index = current.findIndex((p) => p.id === partner.id);
  let updated: PartnerStore[];
  if (index >= 0) {
    updated = [...current];
    updated[index] = partner;
  } else {
    updated = [partner, ...current];
  }
  if (typeof window !== "undefined") {
    localStorage.setItem("borapass:partner-stores", JSON.stringify(updated));
  }
  return updated;
}

/**
 * Utility to delete a partner store by ID
 */
export function deletePartnerStore(partnerId: string): PartnerStore[] {
  const current = getStoredPartners();
  const updated = current.filter((p) => p.id !== partnerId);
  if (typeof window !== "undefined") {
    localStorage.setItem("borapass:partner-stores", JSON.stringify(updated));
  }
  return updated;
}
