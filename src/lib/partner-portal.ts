import { getStoredPartners, type PartnerStore } from "@/lib/partners";

export type PartnerTypeCategory = "restaurante" | "cupons" | "hospedagem" | "passeios" | "eventos";

export type PartnerBooking = {
  id: string;
  partner_id: string;
  listing_title: string;
  client_name: string;
  client_photo: string;
  client_phone: string;
  client_email: string;
  date: string;
  time: string;
  guests_count: number;
  total_amount: number;
  status: "confirmada" | "pendente" | "concluida" | "cancelada";
  voucher_code: string;
  created_at: string;
  notes?: string;
};

export type ChatMessage = {
  id: string;
  booking_id: string;
  sender_type: "client" | "partner" | "support";
  sender_name: string;
  text: string;
  media_url?: string;
  timestamp: string;
  status: "sent" | "delivered" | "read";
};

export type PartnerNotification = {
  id: string;
  partner_id: string;
  title: string;
  message: string;
  type: "booking" | "coupon" | "message" | "approval" | "rejection" | "payment" | "system";
  read: boolean;
  timestamp: string;
};

export type PartnerListingDraft = {
  id: string;
  owner_id: string;
  title: string;
  category: "passeio" | "hospedagem" | "restaurante" | "evento" | "cupom";
  description: string;
  price: number;
  city: string;
  state: string;
  address: string;
  phone: string;
  whatsapp: string;
  instagram?: string;
  website?: string;
  image_url: string;
  gallery_urls?: string[];
  video_url?: string;
  validity_date?: string;
  discount_badge?: string;
  available_quantity?: number;
  status: "draft" | "pending" | "approved" | "rejected";
  created_at: string;
  adjustment_notes?: string;
};

// Initial Mock Bookings
export const INITIAL_BOOKINGS: PartnerBooking[] = [
  {
    id: "bk-101",
    partner_id: "p-1001",
    listing_title: "Jantar Especial com Vista para o Mar",
    client_name: "Mariana Souza",
    client_photo: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&q=80",
    client_phone: "(21) 98877-1122",
    client_email: "mariana.souza@gmail.com",
    date: "2026-08-07",
    time: "20:00",
    guests_count: 2,
    total_amount: 240.0,
    status: "confirmada",
    voucher_code: "BP-98214",
    created_at: "2026-08-06T10:30:00Z",
    notes: "Mesa próxima à janela, se possível.",
  },
  {
    id: "bk-102",
    partner_id: "p-1001",
    listing_title: "Almoço Executivo Gourmet",
    client_name: "Lucas Mendes",
    client_photo: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&q=80",
    client_phone: "(21) 97654-3210",
    client_email: "lucas.mendes@outlook.com",
    date: "2026-08-07",
    time: "12:30",
    guests_count: 4,
    total_amount: 380.0,
    status: "pendente",
    voucher_code: "BP-77412",
    created_at: "2026-08-06T14:15:00Z",
  },
  {
    id: "bk-103",
    partner_id: "p-1002",
    listing_title: "Suíte Luxo com Vista para a Orla",
    client_name: "Rodrigo Fonseca",
    client_photo: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&q=80",
    client_phone: "(22) 99811-2233",
    client_email: "rodrigo.fonseca@yahoo.com.br",
    date: "2026-08-10",
    time: "14:00",
    guests_count: 2,
    total_amount: 890.0,
    status: "confirmada",
    voucher_code: "BP-33981",
    created_at: "2026-08-05T18:20:00Z",
  },
  {
    id: "bk-104",
    partner_id: "p-1003",
    listing_title: "Passeio de Escuna pelas Ilhas Paradisíacas",
    client_name: "Camila Ribeiro",
    client_photo: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&q=80",
    client_phone: "(24) 99122-3344",
    client_email: "camila.ribeiro@gmail.com",
    date: "2026-08-08",
    time: "09:30",
    guests_count: 3,
    total_amount: 450.0,
    status: "confirmada",
    voucher_code: "BP-55120",
    created_at: "2026-08-06T09:00:00Z",
  },
];

// Initial Mock Messages
export const INITIAL_CHAT_MESSAGES: Record<string, ChatMessage[]> = {
  "bk-101": [
    {
      id: "msg-1",
      booking_id: "bk-101",
      sender_type: "client",
      sender_name: "Mariana Souza",
      text: "Olá! Gostaria de confirmar se conseguem reservar uma mesa na varanda para o jantar?",
      timestamp: "10:32",
      status: "read",
    },
    {
      id: "msg-2",
      booking_id: "bk-101",
      sender_type: "partner",
      sender_name: "Restaurante Sabor da Terra",
      text: "Com certeza, Mariana! Sua mesa na varanda com vista mar já está garantida. Aguardamos vocês às 20h!",
      timestamp: "10:35",
      status: "read",
    },
  ],
  "bk-102": [
    {
      id: "msg-3",
      booking_id: "bk-102",
      sender_type: "client",
      sender_name: "Lucas Mendes",
      text: "Boa tarde! Posso incluir mais uma pessoa na reserva do almoço?",
      timestamp: "14:18",
      status: "delivered",
    },
  ],
};

// Initial Mock Notifications
export const INITIAL_NOTIFICATIONS: PartnerNotification[] = [
  {
    id: "notif-1",
    partner_id: "p-1001",
    title: "Nova Reserva Confirmada 🎉",
    message: "Mariana Souza reservou 'Jantar Especial com Vista para o Mar' para 07/08 às 20:00.",
    type: "booking",
    read: false,
    timestamp: "Há 10 minutos",
  },
  {
    id: "notif-2",
    partner_id: "p-1001",
    title: "Anúncio Aprovado ✨",
    message: "Seu anúncio 'Almoço Executivo Gourmet' foi aprovado pela equipe de moderação.",
    type: "approval",
    read: true,
    timestamp: "Há 2 horas",
  },
  {
    id: "notif-3",
    partner_id: "p-1001",
    title: "Pagamento Processado 💵",
    message: "Transferência semanal no valor de R$ 1.620,00 enviada para sua conta cadastrada.",
    type: "payment",
    read: true,
    timestamp: "Ontem às 18:00",
  },
];

// Helper Functions for Bookings
export function getStoredBookings(): PartnerBooking[] {
  if (typeof window === "undefined") return INITIAL_BOOKINGS;
  try {
    const saved = localStorage.getItem("borapass:partner-bookings");
    if (saved) return JSON.parse(saved);
  } catch { /* fallback */ }
  return INITIAL_BOOKINGS;
}

export function saveBooking(booking: PartnerBooking): PartnerBooking[] {
  const current = getStoredBookings();
  const idx = current.findIndex((b) => b.id === booking.id);
  let updated: PartnerBooking[];
  if (idx >= 0) {
    updated = [...current];
    updated[idx] = booking;
  } else {
    updated = [booking, ...current];
  }
  if (typeof window !== "undefined") {
    localStorage.setItem("borapass:partner-bookings", JSON.stringify(updated));
  }
  return updated;
}

// Helper Functions for Chat Messages
export function getStoredChatMessages(bookingId: string): ChatMessage[] {
  if (typeof window === "undefined") return INITIAL_CHAT_MESSAGES[bookingId] || [];
  try {
    const saved = localStorage.getItem(`borapass:chat-messages:${bookingId}`);
    if (saved) return JSON.parse(saved);
  } catch { /* fallback */ }
  return INITIAL_CHAT_MESSAGES[bookingId] || [];
}

export function sendChatMessage(bookingId: string, message: ChatMessage): ChatMessage[] {
  const current = getStoredChatMessages(bookingId);
  const updated = [...current, message];
  if (typeof window !== "undefined") {
    localStorage.setItem(`borapass:chat-messages:${bookingId}`, JSON.stringify(updated));
    window.dispatchEvent(new CustomEvent("borapass:chat-updated", { detail: { bookingId } }));
  }
  return updated;
}

// Helper Functions for Notifications
export function getStoredNotifications(): PartnerNotification[] {
  if (typeof window === "undefined") return INITIAL_NOTIFICATIONS;
  try {
    const saved = localStorage.getItem("borapass:partner-notifications");
    if (saved) return JSON.parse(saved);
  } catch { /* fallback */ }
  return INITIAL_NOTIFICATIONS;
}

export function markNotificationAsRead(id: string): PartnerNotification[] {
  const current = getStoredNotifications();
  const updated = current.map((n) => (n.id === id ? { ...n, read: true } : n));
  if (typeof window !== "undefined") {
    localStorage.setItem("borapass:partner-notifications", JSON.stringify(updated));
  }
  return updated;
}

// Helper Functions for Listing Drafts / Admin Approval
export function getStoredPartnerDrafts(): PartnerListingDraft[] {
  if (typeof window === "undefined") return [];
  try {
    const saved = localStorage.getItem("borapass:partner-drafts");
    if (saved) return JSON.parse(saved);
  } catch { /* fallback */ }
  return [];
}

export function savePartnerDraft(draft: PartnerListingDraft): PartnerListingDraft[] {
  const current = getStoredPartnerDrafts();
  const idx = current.findIndex((d) => d.id === draft.id);
  let updated: PartnerListingDraft[];
  if (idx >= 0) {
    updated = [...current];
    updated[idx] = draft;
  } else {
    updated = [draft, ...current];
  }
  if (typeof window !== "undefined") {
    localStorage.setItem("borapass:partner-drafts", JSON.stringify(updated));
  }
  return updated;
}
