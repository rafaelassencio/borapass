export type CarouselBanner = {
  id: string;
  cityName: string; // ex: "Valparaíso de Goiás" ou "Todas as Cidades"
  tag: string; // ex: "🔥 VALPARAÍSO DE GOIÁS IMPERDÍVEL"
  title: string; // ex: "Economize até 40% em Valparaíso de Goiás"
  subtitle: string; // ex: "Resgate ofertas e passeios com desconto exclusivo Bora Pass"
  image: string; // URL da foto de fundo
  gradient: string; // ex: "from-amber-600 via-orange-600 to-rose-700"
  linkUrl: string; // ex: "/explorar"
  active: boolean;
  created_at?: string;
};

export const GRADIENT_OPTIONS = [
  { label: "🔥 Laranja & Rosa (Quente)", value: "from-amber-600 via-orange-600 to-rose-700" },
  { label: "🏨 Azul VIP & Sky (Elegante)", value: "from-blue-600 via-indigo-600 to-sky-700" },
  {
    label: "🍷 Verde & Teal (Natureza & Gastronomia)",
    value: "from-emerald-600 via-teal-600 to-cyan-700",
  },
  {
    label: "💜 Roxo Imperial & Pink (Exclusivo)",
    value: "from-purple-600 via-pink-600 to-rose-700",
  },
  { label: "🌟 Âmbar Dourado & Sunset", value: "from-amber-500 via-yellow-600 to-orange-700" },
];

export function getStoredCarouselBanners(): CarouselBanner[] {
  if (typeof window !== "undefined") {
    const saved = localStorage.getItem("borapass:custom-carousel-banners");
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) return parsed;
      } catch {
        /* fallback */
      }
    }
  }
  return [];
}

export function saveStoredCarouselBanners(banners: CarouselBanner[]) {
  if (typeof window !== "undefined") {
    localStorage.setItem("borapass:custom-carousel-banners", JSON.stringify(banners));
    window.dispatchEvent(new Event("borapass:banners-changed"));
  }
}
