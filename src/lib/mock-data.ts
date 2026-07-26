import tour1 from "@/assets/tour-1.jpg";
import hotel1 from "@/assets/hotel-1.jpg";
import restaurant1 from "@/assets/restaurant-1.jpg";
import event1 from "@/assets/event-1.jpg";

export type Category = {
  id: string;
  label: string;
  icon: string;
  slug: string;
  gradient: string;
};

export const categories: Category[] = [
  { id: "hospedagens", label: "Hospedagens", icon: "🏨", slug: "hospedagens", gradient: "from-sky-400 to-blue-600" },
  { id: "cupons", label: "Cupons", icon: "🎟️", slug: "cupons", gradient: "from-orange-400 to-rose-500" },
  { id: "restaurantes", label: "Restaurantes", icon: "🍽️", slug: "restaurantes", gradient: "from-amber-400 to-orange-600" },
  { id: "passeios", label: "Passeios", icon: "🎢", slug: "passeios", gradient: "from-emerald-400 to-teal-600" },
  { id: "compras", label: "Compras", icon: "🛍️", slug: "compras", gradient: "from-pink-400 to-fuchsia-600" },
  { id: "eventos", label: "Eventos", icon: "📅", slug: "eventos", gradient: "from-violet-400 to-purple-600" },
  { id: "transporte", label: "Transporte", icon: "🚗", slug: "transporte", gradient: "from-slate-400 to-slate-700" },
  { id: "roteiros", label: "Roteiros", icon: "🗺️", slug: "roteiros", gradient: "from-cyan-400 to-blue-600" },
  { id: "favoritos", label: "Favoritos", icon: "⭐", slug: "favoritos", gradient: "from-yellow-400 to-orange-500" },
];

export type Tour = {
  id: string;
  name: string;
  description: string;
  image: string;
  rating: number;
  reviews: number;
  price: number;
  duration: string;
  address: string;
  lat: number;
  lng: number;
  gallery: string[];
  tags: string[];
};

export const tours: Tour[] = [
  {
    id: "parapente-pedra-bonita",
    name: "Voo de Parapente na Pedra Bonita",
    description:
      "Salte da Pedra Bonita com instrutores certificados e sobrevoe a costa mais famosa do Rio. Experiência guiada de aproximadamente 15 minutos de voo, com fotos e transporte incluso.",
    image: tour1,
    rating: 4.9,
    reviews: 1284,
    price: 450,
    duration: "3h no total • 15 min de voo",
    address: "Estrada das Canoas, São Conrado",
    lat: -22.9974,
    lng: -43.2593,
    gallery: [tour1, tour1, tour1, tour1],
    tags: ["Aventura", "Mais vendido"],
  },
  {
    id: "trilha-dois-irmaos",
    name: "Trilha Morro Dois Irmãos ao pôr do sol",
    description: "Caminhada guiada com vista panorâmica das praias do Leblon e Ipanema. Ideal para todos os níveis.",
    image: tour1,
    rating: 4.8,
    reviews: 842,
    price: 120,
    duration: "3h",
    address: "Vidigal, Rio de Janeiro",
    lat: -22.9932,
    lng: -43.2371,
    gallery: [tour1, tour1, tour1],
    tags: ["Natureza"],
  },
  {
    id: "passeio-escuna",
    name: "Passeio de escuna Angra dos Reis",
    description: "Dia inteiro navegando pelas ilhas paradisíacas de Angra com paradas para banho e almoço a bordo.",
    image: tour1,
    rating: 4.7,
    reviews: 512,
    price: 210,
    duration: "8h",
    address: "Cais de Angra dos Reis",
    lat: -23.0067,
    lng: -44.318,
    gallery: [tour1, tour1],
    tags: ["Família"],
  },
];

export type Coupon = {
  id: string;
  partner: string;
  title: string;
  description: string;
  discount: string;
  rules: string;
  validUntil: string;
  category: "Restaurantes" | "Hotéis" | "Parques" | "Lojas" | "Cafés";
  code: string;
  image: string;
};

export const coupons: Coupon[] = [
  {
    id: "c1",
    partner: "Sabor da Terra",
    title: "30% OFF em pratos executivos",
    description: "Válido de segunda a sexta no almoço. Não cumulativo com outras promoções.",
    discount: "30% OFF",
    rules: "Consumo mínimo de R$ 50 por pessoa.",
    validUntil: "31/12/2026",
    category: "Restaurantes",
    code: "BORASABOR30",
    image: restaurant1,
  },
  {
    id: "c2",
    partner: "Hotel Vista Mar",
    title: "2ª diária pela metade do preço",
    description: "Reserve 2 noites e ganhe 50% na segunda diária.",
    discount: "50% OFF",
    rules: "Sujeito à disponibilidade. Reservar direto pelo app.",
    validUntil: "30/06/2026",
    category: "Hotéis",
    code: "VISTAMAR50",
    image: hotel1,
  },
  {
    id: "c3",
    partner: "AquaPark Tropical",
    title: "1 ingresso pague, 2 leve",
    description: "Válido para entrada no parque durante a semana.",
    discount: "2 por 1",
    rules: "Válido apenas terça e quarta.",
    validUntil: "15/03/2026",
    category: "Parques",
    code: "AQUA2X1",
    image: tour1,
  },
  {
    id: "c4",
    partner: "Café do Porto",
    title: "Café espresso grátis na compra do combo",
    description: "Levou o combo croissant + suco, o espresso é por nossa conta.",
    discount: "Brinde",
    rules: "1 uso por cliente por dia.",
    validUntil: "01/09/2026",
    category: "Cafés",
    code: "PORTOFREE",
    image: restaurant1,
  },
];

export type Hotel = {
  id: string;
  name: string;
  image: string;
  price: number;
  rating: number;
  reviews: number;
  distanceKm: number;
  amenities: string[];
  lat: number;
  lng: number;
  address: string;
};

export const hotels: Hotel[] = [
  {
    id: "h1",
    name: "Vista Mar Boutique Hotel",
    image: hotel1,
    price: 480,
    rating: 4.8,
    reviews: 621,
    distanceKm: 1.2,
    amenities: ["Wi-Fi", "Piscina", "Café da manhã", "Vista mar"],
    lat: -22.9711,
    lng: -43.1822,
    address: "Av. Atlântica, 1500 — Copacabana",
  },
  {
    id: "h2",
    name: "Pousada Recanto Verde",
    image: hotel1,
    price: 260,
    rating: 4.6,
    reviews: 314,
    distanceKm: 3.4,
    amenities: ["Wi-Fi", "Pet friendly", "Estacionamento"],
    lat: -22.9835,
    lng: -43.2096,
    address: "Rua das Palmeiras, 220 — Ipanema",
  },
  {
    id: "h3",
    name: "Grand Palm Resort",
    image: hotel1,
    price: 890,
    rating: 4.9,
    reviews: 987,
    distanceKm: 5.6,
    amenities: ["Spa", "3 piscinas", "Academia", "All inclusive"],
    lat: -23.0067,
    lng: -43.318,
    address: "Estrada do Sol, 4000 — Barra",
  },
];

export type Restaurant = {
  id: string;
  name: string;
  image: string;
  cuisine: string;
  price: string;
  rating: number;
  reviews: number;
  lat: number;
  lng: number;
};

export const restaurants: Restaurant[] = [
  { id: "r1", name: "Sabor da Terra", image: restaurant1, cuisine: "Brasileira contemporânea", price: "$$", rating: 4.7, reviews: 512, lat: -22.985, lng: -43.207 },
  { id: "r2", name: "Trattoria Mare", image: restaurant1, cuisine: "Italiana", price: "$$$", rating: 4.8, reviews: 341, lat: -22.972, lng: -43.183 },
  { id: "r3", name: "Sushi Nikkei", image: restaurant1, cuisine: "Japonesa", price: "$$$", rating: 4.9, reviews: 728, lat: -22.978, lng: -43.194 },
];

export type EventItem = {
  id: string;
  name: string;
  image: string;
  date: string; // ISO date
  time: string;
  location: string;
  price: number;
  category: string;
  lat: number;
  lng: number;
};

const today = new Date();
const iso = (offset: number) => {
  const d = new Date(today);
  d.setDate(d.getDate() + offset);
  return d.toISOString().slice(0, 10);
};

export const events: EventItem[] = [
  { id: "e1", name: "Festival de Verão Copacabana", image: event1, date: iso(0), time: "18:00", location: "Praia de Copacabana", price: 0, category: "Música", lat: -22.9711, lng: -43.1822 },
  { id: "e2", name: "Feira Gastronômica Ipanema", image: event1, date: iso(1), time: "12:00", location: "Praça General Osório", price: 20, category: "Gastronomia", lat: -22.984, lng: -43.198 },
  { id: "e3", name: "Show Nacional — Arena Rio", image: event1, date: iso(3), time: "21:00", location: "Arena Rio", price: 180, category: "Show", lat: -22.978, lng: -43.395 },
  { id: "e4", name: "Cinema ao ar livre", image: event1, date: iso(5), time: "19:30", location: "Parque Lage", price: 0, category: "Cultura", lat: -22.958, lng: -43.212 },
];

export type Roteiro = {
  id: string;
  title: string;
  duration: string;
  vibe: string;
  image: string;
  description: string;
};

export const roteiros: Roteiro[] = [
  { id: "1d", title: "Rio em 1 dia", duration: "1 dia", vibe: "Clássico", image: tour1, description: "Cristo Redentor, Pão de Açúcar e pôr do sol no Arpoador." },
  { id: "2d", title: "Fim de semana perfeito", duration: "2 dias", vibe: "Família", image: hotel1, description: "Praias, museus e um jantar especial no segundo dia." },
  { id: "3d", title: "3 dias de aventura", duration: "3 dias", vibe: "Aventura", image: tour1, description: "Trilhas, parapente e mergulho em Arraial do Cabo." },
  { id: "5d", title: "5 dias gastronômicos", duration: "5 dias", vibe: "Gastronomia", image: restaurant1, description: "Do boteco raiz aos estrelados: um tour de sabores." },
  { id: "rom", title: "Escape romântico", duration: "3 dias", vibe: "Romântico", image: hotel1, description: "Pousada charme, jantar à luz de velas e passeio de barco privativo." },
];

export const promoBanners = [
  { id: "b1", title: "Verão sem fim", subtitle: "Até 40% OFF em passeios selecionados", cta: "Ver ofertas", gradient: "bg-gradient-hero" },
  { id: "b2", title: "Sextou com desconto", subtitle: "Cupons novos toda sexta", cta: "Resgatar agora", gradient: "bg-gradient-ember" },
  { id: "b3", title: "Roteiros premium", subtitle: "Planejados pelos melhores guias locais", cta: "Explorar", gradient: "bg-gradient-sky" },
];
