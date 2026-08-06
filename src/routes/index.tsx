import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import {
  Search,
  SlidersHorizontal,
  Sparkles,
  Star,
  ArrowRight,
  MapPin,
  Sun,
  Store,
  Clock,
  Utensils,
  Compass,
  Heart,
  Flame,
  Ticket,
  TreePine,
  Hotel,
  Calendar,
  Award,
  Navigation,
  ChevronRight,
  ShieldCheck,
  Crown,
  ShoppingBag,
  Music,
  Smile,
  Mountain,
  GlassWater,
  PartyPopper,
  Wine,
  Gift,
  Zap,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useEffect, useState, useMemo } from "react";
import { AppShell } from "@/components/AppShell";
import {
  tours as mockTours,
  restaurants as mockRestaurants,
  coupons as mockCoupons,
  hotels as mockHotels,
  events as mockEvents,
} from "@/lib/mock-data";
import { CitySelectorButton } from "@/components/CitySelector";
import { NotificationsBell } from "@/components/NotificationsBell";
import { useSelectedCity } from "@/hooks/use-city";
import { getStoredCities, saveStoredCities, type CityItem } from "@/lib/cities";
import { getStoredCarouselBanners, type CarouselBanner } from "@/lib/banners";
import {
  useListings,
  fallbackImage,
  getTrashedListingIds,
  getInactiveListingIds,
  type Listing,
} from "@/lib/listings";
import { useHomeBanners } from "@/lib/home-content";
import { useAuth, useProfile } from "@/hooks/use-auth";
import { useRoles } from "@/hooks/use-roles";
import { useAutoGenerateAlerts, useTripAlertScheduler } from "@/lib/notifications";
import { useRealCityWeather } from "@/lib/weather";
import { getStoredPartners } from "@/lib/partners";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Bora Pass — Descubra o melhor de cada destino" },
      {
        name: "description",
        content: "Home do Bora Pass: passeios, cupons, hospedagens e eventos perto de você.",
      },
    ],
  }),
  component: Home,
});

// Structural Section Header
function SectionHeader({
  title,
  subtitle,
  to,
  linkText = "Ver todos",
}: {
  title: string;
  subtitle?: string;
  to?: string;
  linkText?: string;
}) {
  return (
    <div className="mb-3.5 flex items-end justify-between px-5">
      <div>
        <h2 className="text-base font-extrabold tracking-tight text-foreground">{title}</h2>
        {subtitle && <p className="text-xs text-muted-foreground mt-0.5">{subtitle}</p>}
      </div>
      {to && (
        <Link
          to={to}
          className="flex items-center gap-1 text-xs font-bold text-primary hover:underline transition"
        >
          {linkText} <ArrowRight className="h-3.5 w-3.5" />
        </Link>
      )}
    </div>
  );
}

// Helper function to resolve item detail route
export function getItemDetailRoute(id: string, category?: string) {
  const cat = (category || "").toLowerCase();
  if (cat.includes("cupom")) return `/cupons/${id}`;
  if (cat.includes("hospedag") || cat.includes("hotel")) return `/hospedagens/${id}`;
  if (cat.includes("event") || cat.includes("show")) return `/eventos/${id}`;
  return `/passeios/${id}`;
}

// Reusable Card for Experiences / Listings in Carousels
function ExperienceCard({
  id,
  image,
  category,
  title,
  city,
  rating = 4.9,
  price = 120,
  badgeText,
  to,
}: {
  id: string;
  image: string;
  category: string;
  title: string;
  city: string;
  rating?: number;
  price?: number;
  badgeText?: string;
  to?: string;
}) {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { isPremium } = useRoles(user?.id);
  const targetRoute = to || getItemDetailRoute(id, category);

  const travelerPrice = price || 120;
  const premiumPrice = Math.round(travelerPrice * 0.7);
  const discountAmount = Math.max(travelerPrice - premiumPrice, 15);

  return (
    <div
      onClick={() => navigate({ to: targetRoute })}
      className="w-56 shrink-0 cursor-pointer overflow-hidden rounded-2xl border border-border bg-card shadow-soft transition-all duration-300 hover:-translate-y-1 hover:border-primary/50 hover:shadow-elevated flex flex-col justify-between"
    >
      <div className="space-y-2.5">
        <div className="relative h-32 w-full overflow-hidden bg-muted">
          <img
            src={image}
            alt={title}
            className="h-full w-full object-cover transition duration-500 hover:scale-105"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />

          <div className="absolute top-2 left-2 flex flex-wrap gap-1">
            <span className="rounded-full bg-black/70 px-2 py-0.5 text-[9px] font-black text-amber-300 backdrop-blur border border-amber-400/30">
              ⭐ {rating}
            </span>
            {badgeText && (
              <span className="rounded-full bg-primary px-2 py-0.5 text-[9px] font-black text-white shadow-brand">
                {badgeText}
              </span>
            )}
          </div>

          <span className="absolute bottom-2 left-2 rounded-md bg-white/20 px-2 py-0.5 text-[9px] font-extrabold text-white backdrop-blur uppercase">
            {category}
          </span>
        </div>

        <div className="px-3 space-y-1">
          <h4 className="line-clamp-2 text-xs font-extrabold text-foreground leading-snug">
            {title}
          </h4>
          <p className="flex items-center gap-1 text-[11px] font-semibold text-muted-foreground">
            <MapPin className="h-3 w-3 text-primary shrink-0" />
            <span className="truncate">{city}</span>
          </p>
        </div>
      </div>

      <div className="p-3 pt-2 mt-2 border-t border-border/50 flex items-center justify-between gap-2">
        {isPremium ? (
          /* Se for Viajante Premium, mostre APENAS o preço do Viajante Premium */
          <div>
            <span className="text-[9px] font-extrabold text-amber-500 uppercase tracking-tight block">
              👑 VIP Premium
            </span>
            <span className="text-xs font-black text-amber-500 dark:text-amber-400">
              R$ {premiumPrice}
            </span>
          </div>
        ) : (
          /* Se for Viajante, mostre o preço do Viajante E a oferta do Viajante Premium */
          <div className="min-w-0">
            <div className="flex items-center gap-1">
              <span className="text-[9px] font-bold text-muted-foreground">Viajante:</span>
              <span className="text-xs font-black text-foreground">R$ {travelerPrice}</span>
            </div>
            <div className="text-[9.5px] font-black text-amber-600 dark:text-amber-400 truncate">
              👑 Premium R$ {premiumPrice}{" "}
              <span className="text-emerald-600 font-bold">(-R$ {discountAmount})</span>
            </div>
          </div>
        )}

        <button
          onClick={(e) => {
            e.stopPropagation();
            navigate({ to: targetRoute });
          }}
          className="rounded-xl bg-primary/10 text-primary px-3 py-1 text-[11px] font-extrabold hover:bg-primary hover:text-white transition shrink-0"
        >
          Ver
        </button>
      </div>
    </div>
  );
}

export function Home() {
  const [city] = useSelectedCity();
  const cityId = city?.id ?? null;
  const { user } = useAuth();
  const { isPremium, isPartner, isRealAdmin, simulatedRole } = useRoles(user?.id, user?.email);
  const isPurePartner = isPartner && !isRealAdmin && (!simulatedRole || simulatedRole === "partner");
  const profile = useProfile(user?.id);
  const navigate = useNavigate();
  const [heroSearchQuery, setHeroSearchQuery] = useState("");

  const handleHeroSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const query = heroSearchQuery.trim();
    if (query) {
      navigate({ to: "/explorar", search: { q: query } });
    } else {
      navigate({ to: "/explorar" });
    }
  };

  useEffect(() => {
    if (isPurePartner) {
      navigate({ to: "/validar-cupom", replace: true });
    }
  }, [isPurePartner, navigate]);

  useAutoGenerateAlerts(user?.id, cityId);
  useTripAlertScheduler(user?.id);

  const { data: dbTours } = useListings("passeio", cityId, city?.name);
  const { data: dbCoupons } = useListings("cupom", cityId, city?.name);
  const { data: dbEvents } = useListings("evento", cityId, city?.name);
  const { data: dbRestaurants } = useListings("restaurante", cityId, city?.name);
  const { data: dbHotels } = useListings("hospedagem", cityId, city?.name);

  // Compute greeting name & time
  const hour = new Date().getHours();
  const greetingTime = hour < 12 ? "Bom dia" : hour < 18 ? "Boa tarde" : "Boa noite";
  const userName =
    profile?.full_name?.split(" ")[0] ||
    user?.user_metadata?.first_name ||
    user?.user_metadata?.full_name?.split(" ")[0] ||
    user?.email?.split("@")[0] ||
    "Viajante";

  // Real-time city weather from Open-Meteo & Climatempo integration
  const realWeather = useRealCityWeather(city?.slug, city?.name);

  // Filter out items in trash or set inactive
  const trashedIds = getTrashedListingIds();
  const inactiveIds = getInactiveListingIds();
  const isVisible = (id: string) => !trashedIds.has(id) && !inactiveIds.has(id);

  // Merge database items with rich fallback mock items
  const toursList = useMemo(() => {
    const raw =
      dbTours && dbTours.length > 0
        ? dbTours
        : mockTours.map((t) => ({
            id: t.id,
            title: t.name,
            description: t.description,
            image_url: t.image,
            price: t.price,
            address: t.address,
            city: city?.name ?? "Rio de Janeiro",
            category: "passeio",
          }));
    return raw.filter((item) => isVisible(item.id));
  }, [dbTours, city]);

  const couponsList = useMemo(() => {
    const raw =
      dbCoupons && dbCoupons.length > 0
        ? dbCoupons
        : mockCoupons.map((c) => ({
            id: c.id,
            title: c.title,
            description: c.description,
            image_url: c.image,
            discount: c.discount,
            city: city?.name ?? "Rio de Janeiro",
            category: "cupom",
          }));
    return raw.filter((item) => isVisible(item.id));
  }, [dbCoupons, city]);

  const restaurantsList = useMemo(() => {
    const raw =
      dbRestaurants && dbRestaurants.length > 0
        ? dbRestaurants
        : mockRestaurants.map((r) => ({
            id: r.id,
            title: r.name,
            description: r.cuisine,
            image_url: r.image,
            price: 85,
            address: "Centro / Orla",
            city: city?.name ?? "Rio de Janeiro",
            category: "restaurante",
          }));
    return raw.filter((item) => isVisible(item.id));
  }, [dbRestaurants, city]);

  const hotelsList = useMemo(() => {
    const raw =
      dbHotels && dbHotels.length > 0
        ? dbHotels
        : mockHotels.map((h) => ({
            id: h.id,
            title: h.name,
            description: h.address,
            image_url: h.image,
            price: h.price,
            address: h.address,
            city: city?.name ?? "Rio de Janeiro",
            category: "hospedagem",
          }));
    return raw.filter((item) => isVisible(item.id));
  }, [dbHotels, city]);

  const eventsList = useMemo(() => {
    const raw =
      dbEvents && dbEvents.length > 0
        ? dbEvents
        : mockEvents.map((e) => ({
            id: e.id,
            title: e.name,
            description: e.date,
            image_url: e.image,
            price: 50,
            address: (e as any).place || "Centro / Orla",
            city: city?.name ?? "Rio de Janeiro",
            category: "evento",
          }));
    return raw.filter((item) => isVisible(item.id));
  }, [dbEvents, city]);

  // Custom Cities & Banner Sync (Exibe apenas destinos ativos)
  const [storedCities, setStoredCities] = useState(() => getStoredCities(true));
  const [customBanners, setCustomBanners] = useState<CarouselBanner[]>(() =>
    getStoredCarouselBanners(),
  );

  useEffect(() => {
    const handleCitiesChanged = () => setStoredCities(getStoredCities(true));
    const handleBannersChanged = () => setCustomBanners(getStoredCarouselBanners());

    window.addEventListener("borapass:cities-changed", handleCitiesChanged);
    window.addEventListener("borapass:banners-changed", handleBannersChanged);

    return () => {
      window.removeEventListener("borapass:cities-changed", handleCitiesChanged);
      window.removeEventListener("borapass:banners-changed", handleBannersChanged);
    };
  }, []);

  const selectedCityObj = useMemo(() => {
    if (!city) return storedCities[0];
    return (
      storedCities.find(
        (c) => c.id === city.id || c.name.toLowerCase() === city.name.toLowerCase(),
      ) || storedCities[0]
    );
  }, [city, storedCities]);

  // BANNER PRINCIPAL (Rotativo exibindo Banners Personalizados + Banners do Destino)
  const heroBanners = useMemo(() => {
    const cityName = selectedCityObj?.name || "Experiências";
    const normCity = cityName.toLowerCase().trim();

    // 1. Filtra os banners personalizados criados em Configurações para a cidade selecionada
    const matchingCustom = customBanners.filter((b) => {
      if (!b.active) return false;
      if (!b.cityName || b.cityName === "Todas as Cidades") return true;
      return b.cityName.toLowerCase().trim() === normCity;
    });

    if (matchingCustom.length > 0) {
      return matchingCustom.map((b) => ({
        id: b.id,
        tag: b.tag,
        title: b.title,
        subtitle: b.subtitle,
        gradient: b.gradient || "from-amber-600 via-orange-600 to-rose-700",
        image: b.image,
        linkUrl: b.linkUrl || "/explorar",
      }));
    }

    // 2. Fallback padrão se ainda não foram criados banners personalizados
    const customPhotos =
      selectedCityObj?.banner_urls && selectedCityObj.banner_urls.length > 0
        ? selectedCityObj.banner_urls.filter((u) => u.trim() !== "")
        : [
            selectedCityObj?.banner_url ||
              "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=1200&q=80",
          ];

    const titles = [
      `Economize até 40% em ${cityName}`,
      `Hospedagens & Suítes VIP em ${cityName}`,
      `Experiências & Gastronomia em ${cityName}`,
    ];

    const subtitles = [
      `Resgate ofertas e passeios com desconto exclusivo Bora Pass em ${cityName}`,
      `Hotéis e pousadas selecionados com conforto garantido`,
      `Aproveite os melhores sabores e passeios imperdíveis`,
    ];

    const tags = [
      `🔥 ${cityName.toUpperCase()} IMPERDÍVEL`,
      `🏨 HOSPEDAGENS VIP · ${cityName.toUpperCase()}`,
      `🍷 EXPERIÊNCIAS · ${cityName.toUpperCase()}`,
    ];

    const gradients = [
      "from-amber-600 via-orange-600 to-rose-700",
      "from-blue-600 via-indigo-600 to-sky-700",
      "from-emerald-600 via-teal-600 to-cyan-700",
    ];

    return customPhotos.map((img, idx) => ({
      id: `b-${cityName}-${idx + 1}`,
      tag: tags[idx % tags.length],
      title: titles[idx % titles.length],
      subtitle: subtitles[idx % subtitles.length],
      gradient: gradients[idx % gradients.length],
      image: img,
      linkUrl: "/explorar",
    }));
  }, [selectedCityObj, customBanners]);

  // Fotos dos Banners da Home cadastradas em Gestao de Destinos
  const cityBannerPhotos = useMemo(() => {
    if (selectedCityObj?.banner_urls && selectedCityObj.banner_urls.length > 0) {
      const valid = selectedCityObj.banner_urls.filter((u) => u && u.trim() !== "");
      if (valid.length > 0) return valid;
    }
    if (selectedCityObj?.banner_url && selectedCityObj.banner_url.trim() !== "") {
      return [selectedCityObj.banner_url];
    }
    return ["https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=1400&q=80"];
  }, [selectedCityObj]);

  const [heroPhotoIdx, setHeroPhotoIdx] = useState(0);

  useEffect(() => {
    setHeroPhotoIdx(0);
  }, [selectedCityObj]);

  // Rotação automática das fotos de fundo cadastradas em Gestão de Destinos
  useEffect(() => {
    if (cityBannerPhotos.length <= 1) return;
    const interval = setInterval(() => {
      setHeroPhotoIdx((prev) => (prev + 1) % cityBannerPhotos.length);
    }, 6000);
    return () => clearInterval(interval);
  }, [cityBannerPhotos]);

  // Partners list for Section 11
  const partnersList = getStoredPartners();

  return (
    <AppShell>
      <div className="pb-28 bg-background text-foreground antialiased space-y-8 animate-fadeIn">
        {/* ========================================================= */}
        {/* HERO HEADER & BUSCA PRINCIPAL (Fundo Ampliado com Fotos)   */}
        {/* ========================================================= */}
        <section className="relative overflow-hidden rounded-b-[2.5rem] bg-slate-950 text-white shadow-elevated border-b border-border/40 min-h-[380px] sm:min-h-[420px] flex flex-col justify-between">
          {/* Fotos de Fundo da Cidade Cadastrada em Gestão de Destinos */}
          <div className="absolute inset-0 z-0 overflow-hidden">
            {cityBannerPhotos.map((photoUrl, idx) => (
              <img
                key={idx}
                src={photoUrl}
                alt={`${selectedCityObj?.name || "Destino"} - Foto ${idx + 1}`}
                className={cn(
                  "absolute inset-0 h-full w-full object-cover transition-opacity duration-1000 ease-in-out",
                  idx === heroPhotoIdx
                    ? "opacity-90 scale-100"
                    : "opacity-0 scale-105 pointer-events-none",
                )}
              />
            ))}
            {/* Gradientes leves focados no topo e base, deixando o centro totalmente visivel */}
            <div className="absolute inset-0 bg-gradient-to-t from-slate-950/90 via-slate-950/20 to-black/50" />
            <div className="absolute inset-0 bg-gradient-to-r from-slate-950/50 via-transparent to-black/30" />
          </div>

          <div className="relative z-10 px-5 pt-7 pb-6 flex flex-col justify-between flex-1 min-h-[380px] sm:min-h-[420px]">
            {/* Bloco Superior: Saudacao, Cidade, Clima e Titulo */}
            <div className="space-y-4">
              {/* Top Header Bar */}
              <div className="flex items-center justify-between">
                <div className="space-y-1.5">
                  <span className="text-[11px] font-black uppercase tracking-wider text-white/90 drop-shadow block">
                    OLÁ, {userName.toUpperCase()} 👋
                  </span>
                  <div className="flex items-center gap-2">
                    <CitySelectorButton className="bg-slate-900/60 text-white backdrop-blur-md border-white/30 hover:bg-slate-900/80 shadow-md" />
                    <a
                      href={realWeather.climatempoUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-1.5 rounded-full bg-black/35 px-3 py-1 text-xs font-bold text-amber-300 backdrop-blur border border-white/20 no-underline hover:bg-black/50 transition"
                    >
                      <Sun className="h-3.5 w-3.5 text-amber-400 animate-pulse" />
                      <span>
                        {realWeather.loading
                          ? "Clima..."
                          : `${realWeather.temp}°C · ${realWeather.condition}`}
                      </span>
                    </a>
                  </div>
                </div>
                <NotificationsBell />
              </div>

              {/* Hero Headline */}
              <div className="space-y-2 max-w-md pt-1">
                <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white leading-tight drop-shadow-lg">
                  Seu passe para viver <br />
                  <span className="bg-gradient-to-r from-amber-300 via-orange-300 to-amber-400 bg-clip-text text-transparent">
                    o melhor do destino.
                  </span>
                </h1>
              </div>
            </div>

            {/* Bloco Inferior: Barra de Busca reposicionada na parte inferior da foto */}
            <div className="relative pt-12 pb-1">
              <form
                onSubmit={handleHeroSearchSubmit}
                className="flex items-center justify-between rounded-full bg-white dark:bg-slate-900 p-1.5 pl-4 shadow-elevated border border-slate-200/80 dark:border-slate-800 hover:shadow-brand/20 transition group"
              >
                <div className="flex items-center gap-2.5 flex-1 min-w-0">
                  <Search className="h-5 w-5 text-muted-foreground shrink-0 group-hover:text-primary transition" />
                  <input
                    value={heroSearchQuery}
                    onChange={(e) => setHeroSearchQuery(e.target.value)}
                    placeholder="Buscar passeios, cupons, restaurantes..."
                    className="w-full bg-transparent text-xs sm:text-sm font-semibold text-foreground placeholder:text-muted-foreground outline-none"
                  />
                </div>
                <button
                  type="submit"
                  className="rounded-full bg-gradient-brand px-5 sm:px-6 py-2.5 text-xs font-black text-white shadow-brand hover:opacity-95 transition active:scale-95 shrink-0 flex items-center gap-1.5"
                >
                  <span>Buscar</span>
                  <ArrowRight className="h-3.5 w-3.5" />
                </button>
              </form>

              {/* Indicadores das fotos cadastradas no Destino */}
              {cityBannerPhotos.length > 1 && (
                <div className="mt-2.5 flex justify-center items-center gap-1.5">
                  {cityBannerPhotos.map((_, idx) => (
                    <button
                      key={idx}
                      onClick={() => setHeroPhotoIdx(idx)}
                      className={cn(
                        "h-1.5 rounded-full transition-all duration-300",
                        idx === heroPhotoIdx
                          ? "w-5 bg-amber-400"
                          : "w-1.5 bg-white/40 hover:bg-white/70",
                      )}
                      title={`Foto ${idx + 1}`}
                    />
                  ))}
                </div>
              )}
            </div>
          </div>
        </section>

        {/* ========================================================= */}
        {/* CARROSSEL DE BANNERS DA CIDADE SELECIONADA                */}
        {/* ========================================================= */}
        <section className="px-5 pt-2">
          <div className="flex snap-x snap-mandatory gap-3.5 overflow-x-auto pb-2 scrollbar-hide">
            {/* BANNER EXCLUSIVO MÓDULO PASSAGENS */}
            <div
              onClick={() => navigate({ to: "/passagens" })}
              className="w-[280px] sm:w-[340px] h-[150px] shrink-0 snap-start cursor-pointer rounded-3xl border border-sky-400/40 shadow-brand overflow-hidden relative group bg-slate-950"
            >
              <img
                src="https://images.unsplash.com/photo-1436491865332-7a61a109cc05?w=600&q=80"
                alt="Passagens Aéreas e Rodoviárias"
                className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-500 opacity-70"
              />
              <div className="absolute inset-0 bg-gradient-to-r from-sky-950/90 via-slate-950/70 to-amber-950/80" />
              <div className="absolute inset-0 p-4 flex flex-col justify-end text-white space-y-1">
                <span className="self-start rounded-full bg-gradient-brand px-2.5 py-0.5 text-[9px] font-black uppercase tracking-wider text-white shadow-brand">
                  ✈️ MaxMilhas & ClickBus
                </span>
                <h3 className="text-sm sm:text-base font-black leading-tight drop-shadow-md">
                  Passagens Aéreas & Rodoviárias 🚌
                </h3>
                <p className="text-[11px] text-amber-300 font-bold opacity-90">
                  Economize até 40% em voos e ônibus nacionais
                </p>
              </div>
            </div>

            {/* BANNER EXCLUSIVO MÓDULO HOSPEDAGENS */}
            <div
              onClick={() => navigate({ to: "/hospedagens" })}
              className="w-[280px] sm:w-[340px] h-[150px] shrink-0 snap-start cursor-pointer rounded-3xl border border-emerald-400/40 shadow-brand overflow-hidden relative group bg-slate-950"
            >
              <img
                src="https://images.unsplash.com/photo-1566073771259-6a8506099945?w=600&q=80"
                alt="Hotéis e Hospedagens"
                className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-500 opacity-70"
              />
              <div className="absolute inset-0 bg-gradient-to-r from-emerald-950/90 via-slate-950/70 to-amber-950/80" />
              <div className="absolute inset-0 p-4 flex flex-col justify-end text-white space-y-1">
                <span className="self-start rounded-full bg-emerald-500 px-2.5 py-0.5 text-[9px] font-black uppercase tracking-wider text-slate-950 shadow-brand">
                  🏨 GeckoAPI Hotels
                </span>
                <h3 className="text-sm sm:text-base font-black leading-tight drop-shadow-md">
                  Hotéis & Pousadas Exclusivos ✨
                </h3>
                <p className="text-[11px] text-emerald-300 font-bold opacity-90">
                  Compare diárias com cancelamento grátis
                </p>
              </div>
            </div>
            {heroBanners.map((b) => (
              <div
                key={b.id}
                onClick={() => navigate({ to: "/explorar" })}
                className="w-[280px] sm:w-[340px] h-[150px] shrink-0 snap-start cursor-pointer rounded-3xl border border-border/80 shadow-elevated overflow-hidden relative group"
              >
                <img
                  src={b.image}
                  alt={b.title}
                  className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-500"
                />
                <div
                  className={`absolute inset-0 bg-gradient-to-r ${b.gradient} opacity-80 mix-blend-multiply`}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/30 to-transparent p-4 flex flex-col justify-end text-white space-y-1">
                  <span className="inline-self-start rounded-full bg-white/20 px-2.5 py-0.5 text-[9px] font-black uppercase tracking-wider backdrop-blur border border-white/30">
                    {b.tag}
                  </span>
                  <h3 className="text-sm sm:text-base font-black leading-tight drop-shadow-md line-clamp-1">
                    {b.title}
                  </h3>
                  <p className="text-[11px] text-white/90 line-clamp-1 opacity-90">{b.subtitle}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* ========================================================= */}
        {/* SEÇÃO 1: 🔥 Em alta hoje                                   */}
        {/* ========================================================= */}
        <section>
          <SectionHeader
            title="🔥 Em alta hoje"
            subtitle="Experiências mais reservadas pelos viajantes nesta semana"
            to="/explorar"
          />

          <div className="flex gap-3 overflow-x-auto px-5 pb-2 scrollbar-hide">
            {toursList.slice(0, 5).map((item) => (
              <ExperienceCard
                key={item.id}
                id={item.id}
                image={item.image_url || fallbackImage(item.category as any)}
                category={item.category || "passeio"}
                title={item.title}
                city={item.city || "Rio de Janeiro"}
                rating={4.9}
                price={(item as any).price || 120}
                badgeText="🔥 EM ALTA"
              />
            ))}

            {/* 6º Card Especial: Ver Tudo */}
            <div
              onClick={() => navigate({ to: "/explorar" })}
              className="w-48 shrink-0 cursor-pointer rounded-2xl border-2 border-dashed border-primary/40 bg-primary/5 p-4 flex flex-col items-center justify-center text-center space-y-3 hover:bg-primary/10 transition"
            >
              <div className="grid h-12 w-12 place-items-center rounded-2xl bg-primary text-white shadow-brand text-xl">
                🚀
              </div>
              <div>
                <h4 className="text-xs font-black text-foreground">Ver Tudo</h4>
                <p className="text-[10px] text-muted-foreground">Explorar mais atrações</p>
              </div>
              <span className="rounded-xl bg-primary px-3 py-1 text-xs font-black text-primary-foreground shadow-sm">
                Explorar
              </span>
            </div>
          </div>
        </section>

        {/* ========================================================= */}
        {/* SEÇÃO 2: 🎟 Cupons exclusivos                               */}
        {/* ========================================================= */}
        <section>
          <SectionHeader
            title="🎟 Cupons exclusivos"
            subtitle="Descontos validados para economizar no passaporte"
            to="/cupons"
          />

          <div className="flex gap-3 overflow-x-auto px-5 pb-2 scrollbar-hide">
            {couponsList.slice(0, 5).map((cp) => (
              <div
                key={cp.id}
                onClick={() => navigate({ to: `/cupons/${cp.id}` })}
                className="w-56 shrink-0 cursor-pointer overflow-hidden rounded-2xl border border-amber-500/30 bg-gradient-to-br from-card via-card to-amber-500/5 p-3.5 shadow-soft hover:border-amber-500 transition space-y-2 flex flex-col justify-between"
              >
                <div className="flex items-center gap-2.5">
                  <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 font-black text-lg border border-amber-500/20">
                    🎟️
                  </div>
                  <div className="min-w-0">
                    <span className="text-[9px] font-black uppercase text-amber-600 dark:text-amber-400">
                      {(cp as any).discount || "20% OFF"}
                    </span>
                    <h4 className="truncate text-xs font-extrabold text-foreground">{cp.title}</h4>
                  </div>
                </div>
                <p className="text-[11px] text-muted-foreground line-clamp-2">{cp.description}</p>

                <div className="pt-2 border-t border-border/40 flex items-center justify-between">
                  <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400">
                    ✅ Resgate Imediato
                  </span>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      navigate({ to: `/cupons/${cp.id}` });
                    }}
                    className="rounded-lg bg-amber-500 px-3 py-1 text-[11px] font-black text-black hover:bg-amber-400 transition"
                  >
                    Resgatar
                  </button>
                </div>
              </div>
            ))}

            {/* Último Card: Ver Todos */}
            <div
              onClick={() => navigate({ to: "/cupons" })}
              className="w-48 shrink-0 cursor-pointer rounded-2xl border-2 border-dashed border-amber-500/40 bg-amber-500/5 p-4 flex flex-col items-center justify-center text-center space-y-2 hover:bg-amber-500/10 transition"
            >
              <Ticket className="h-8 w-8 text-amber-500" />
              <h4 className="text-xs font-black text-foreground">Ver todos os cupons</h4>
              <span className="text-[10px] font-bold text-amber-600">Acessar Cupons ↗</span>
            </div>
          </div>
        </section>

        {/* ========================================================= */}
        {/* SEÇÃO 3: 🌿 Passeios imperdíveis                            */}
        {/* ========================================================= */}
        <section>
          <SectionHeader
            title="🌿 Passeios imperdíveis"
            subtitle="Rotas de natureza, trilhas e pontos turísticos"
            to="/explorar"
          />

          <div className="flex gap-3 overflow-x-auto px-5 pb-2 scrollbar-hide">
            {toursList.map((t) => (
              <ExperienceCard
                key={t.id}
                id={t.id}
                image={t.image_url || fallbackImage("passeio")}
                category="Passeio"
                title={t.title}
                city={t.city || "Rio de Janeiro"}
                rating={4.9}
                price={(t as any).price || 110}
                badgeText="⭐ TOP GUIA"
              />
            ))}
          </div>
        </section>

        {/* ========================================================= */}
        {/* SEÇÃO 4: 🍽 Restaurantes recomendados                      */}
        {/* ========================================================= */}
        <section>
          <SectionHeader
            title="🍽 Restaurantes recomendados"
            subtitle="Sabores locais com pratos e atendimento VIP"
            to="/explorar"
          />

          <div className="flex gap-3 overflow-x-auto px-5 pb-2 scrollbar-hide">
            {restaurantsList.map((r) => (
              <ExperienceCard
                key={r.id}
                id={r.id}
                image={r.image_url || fallbackImage("restaurante")}
                category="Gastronomia"
                title={r.title}
                city={r.city || "Rio de Janeiro"}
                rating={4.8}
                price={85}
                badgeText="🍷 VIP"
              />
            ))}
          </div>
        </section>

        {/* ========================================================= */}
        {/* SEÇÃO 5: 🏨 Hospedagens em destaque                       */}
        {/* ========================================================= */}
        <section>
          <SectionHeader
            title="🏨 Hospedagens em destaque"
            subtitle="Hotéis e pousadas selecionados com conforto garantido"
            to="/explorar"
          />

          <div className="flex gap-3 overflow-x-auto px-5 pb-2 scrollbar-hide">
            {hotelsList.map((h) => (
              <ExperienceCard
                key={h.id}
                id={h.id}
                image={h.image_url || fallbackImage("hospedagem")}
                category="Hospedagem"
                title={h.title}
                city={h.city || "Rio de Janeiro"}
                rating={4.9}
                price={(h as any).price || 250}
                badgeText="👑 PREMIUM"
              />
            ))}
          </div>
        </section>

        {/* ========================================================= */}
        {/* SEÇÃO 6: 🎉 Eventos desta semana                            */}
        {/* ========================================================= */}
        <section>
          <SectionHeader
            title="🎉 Eventos desta semana"
            subtitle="Festivais, shows ao vivo e teatro"
            to="/explorar"
          />

          <div className="flex gap-3 overflow-x-auto px-5 pb-2 scrollbar-hide">
            {eventsList.map((ev) => (
              <ExperienceCard
                key={ev.id}
                id={ev.id}
                image={ev.image_url || fallbackImage("evento")}
                category="Evento"
                title={ev.title}
                city={ev.city || "Rio de Janeiro"}
                rating={5.0}
                price={(ev as any).price || 50}
                badgeText="🎉 SHOW"
              />
            ))}
          </div>
        </section>

        {/* ========================================================= */}
        {/* SEÇÃO 8: 📍 Próximo de você                                 */}
        {/* ========================================================= */}
        <section className="px-5">
          <SectionHeader
            title="📍 Próximo de você"
            subtitle="Estabelecimentos credenciados na sua localização"
          />

          <div className="space-y-2.5">
            {[
              {
                id: "p-101",
                category: "hospedagem",
                title: "Vista Mar Boutique Hotel & Restô",
                address: "Av. Atlântica, 1500 — Copacabana",
                dist: "1.2 km",
                time: "15 min de carro",
                img: "https://images.unsplash.com/photo-1566073771259-6a8506099945?w=500",
              },
              {
                id: "t-1",
                category: "passeio",
                title: "Trilha & Mirante da Pedra Bonita",
                address: "Estrada das Canoas — São Conrado",
                dist: "3.4 km",
                time: "25 min de carro",
                img: "https://images.unsplash.com/photo-1506744038136-46273834b3fb?w=500",
              },
              {
                id: "t-2",
                category: "passeio",
                title: "Restaurante Sabor da Terra VIP",
                address: "Rua Visconde de Pirajá — Ipanema",
                dist: "0.8 km",
                time: "8 min a pé 🚶",
                img: "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=500",
              },
            ].map((near, i) => (
              <div
                key={i}
                onClick={() => navigate({ to: getItemDetailRoute(near.id, near.category) })}
                className="flex items-center gap-3.5 rounded-2xl border border-border bg-card p-3 shadow-soft cursor-pointer hover:border-primary/50 transition"
              >
                <img
                  src={near.img}
                  alt={near.title}
                  className="h-16 w-20 shrink-0 rounded-xl object-cover"
                />
                <div className="min-w-0 flex-1 space-y-1">
                  <h4 className="truncate text-xs font-extrabold text-foreground leading-snug">
                    {near.title}
                  </h4>
                  <p className="truncate text-[11px] font-semibold text-muted-foreground">
                    📍 {near.address}
                  </p>
                  <div className="flex items-center gap-2 text-[10px] font-bold text-sky-600 dark:text-sky-400">
                    <span className="flex items-center gap-0.5">
                      <Navigation className="h-3 w-3" /> {near.dist}
                    </span>
                    <span>·</span>
                    <span className="flex items-center gap-0.5">
                      <Clock className="h-3 w-3" /> {near.time}
                    </span>
                  </div>
                </div>
                <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0" />
              </div>
            ))}
          </div>
        </section>

        {/* ========================================================= */}
        {/* SEÇÃO 9: 💰 Economize com o Bora Pass                       */}
        {/* ========================================================= */}
        <section className="px-5">
          <div className="rounded-3xl bg-gradient-to-br from-slate-950 via-slate-900 to-emerald-950 p-6 text-white shadow-elevated relative overflow-hidden space-y-4 border border-emerald-500/30 group">
            {/* Efeito Glow no Fundo */}
            <div className="absolute -right-10 -top-10 h-36 w-36 rounded-full bg-emerald-500/10 blur-3xl" />
            <div className="absolute -left-10 -bottom-10 h-36 w-36 rounded-full bg-amber-500/10 blur-3xl" />

            <div className="relative z-10 flex items-center justify-between border-b border-white/15 pb-4">
              <div className="flex items-center gap-3">
                <div className="grid h-12 w-12 place-items-center rounded-2xl bg-gradient-to-br from-amber-400 to-orange-500 text-black font-black text-2xl shadow-md">
                  💰
                </div>
                <div>
                  <span className="text-[10px] font-black uppercase text-amber-300 tracking-wider flex items-center gap-1">
                    <Sparkles className="h-3 w-3" /> Sua Economia com Bora Pass
                  </span>
                  <h3 className="text-xl font-black text-white mt-0.5">
                    Você já economizou{" "}
                    <span className="text-amber-400 font-extrabold underline decoration-amber-400/50">
                      R$ 340,00
                    </span>
                  </h3>
                </div>
              </div>
              <span className="rounded-full bg-emerald-400/20 text-emerald-300 border border-emerald-400/30 px-3 py-1 text-[10px] font-black uppercase tracking-wide backdrop-blur">
                Passaporte Ativo ✨
              </span>
            </div>

            <div className="relative z-10 grid grid-cols-2 gap-3 text-xs font-bold">
              <div className="rounded-2xl bg-white/10 p-3.5 backdrop-blur border border-white/15 hover:bg-white/15 transition">
                <span className="text-[10px] text-white/70 block uppercase tracking-wider">
                  Cupons Resgatados
                </span>
                <span className="text-base font-black text-amber-300 mt-1 block">
                  🎟️ 3 cupons ativos
                </span>
              </div>
              <div className="rounded-2xl bg-white/10 p-3.5 backdrop-blur border border-white/15 hover:bg-white/15 transition">
                <span className="text-[10px] text-white/70 block uppercase tracking-wider">
                  Viagens Realizadas
                </span>
                <span className="text-base font-black text-amber-300 mt-1 block">
                  🧭 5 viagens concluídas
                </span>
              </div>
            </div>
          </div>
        </section>

        {/* ========================================================= */}
        {/* SEÇÃO 10: ✨ Recomendado para você                         */}
        {/* ========================================================= */}
        <section>
          <SectionHeader
            title="✨ Recomendado para você"
            subtitle={
              city
                ? `Melhores passeios e ofertas em ${city.name}`
                : "Sugestões baseadas nas melhores atrações do momento"
            }
            to="/explorar"
          />

          <div className="flex gap-4 overflow-x-auto px-5 pb-3 scrollbar-hide">
            {toursList
              .concat(restaurantsList as any)
              .slice(0, 6)
              .map((item) => (
                <ExperienceCard
                  key={item.id}
                  id={item.id}
                  image={(item as any).image_url || fallbackImage((item as any).category as any)}
                  category={(item as any).category || "recomendado"}
                  title={(item as any).title}
                  city={(item as any).city || city?.name || "Rio de Janeiro"}
                  rating={4.9}
                  price={(item as any).price || 95}
                  badgeText="✨ RECOMENDADO"
                />
              ))}
          </div>
        </section>

        {/* ========================================================= */}
        {/* SEÇÃO 11: 🏆 Parceiros em destaque                          */}
        {/* ========================================================= */}
        <section>
          <SectionHeader
            title="🏆 Parceiros em destaque"
            subtitle="Marcas e estabelecimentos credenciados de alta qualidade"
          />

          <div className="flex gap-3.5 overflow-x-auto px-5 pb-3 scrollbar-hide">
            {partnersList.slice(0, 6).map((partner) => (
              <div
                key={partner.id}
                onClick={() => navigate({ to: "/explorar" })}
                className="w-52 shrink-0 cursor-pointer overflow-hidden rounded-3xl border border-border bg-card p-4 shadow-soft hover:border-primary/50 hover:shadow-elevated transition-all duration-300 flex flex-col items-center justify-between text-center group"
              >
                <div className="space-y-3 w-full">
                  <div className="h-16 w-16 overflow-hidden rounded-2xl border-2 border-primary/30 mx-auto shadow-md group-hover:scale-110 transition duration-300">
                    <img
                      src={partner.logo_url}
                      alt={partner.store_name}
                      className="h-full w-full object-cover"
                    />
                  </div>
                  <div>
                    <h4 className="line-clamp-1 text-xs font-black text-foreground group-hover:text-primary transition">
                      {partner.store_name}
                    </h4>
                    <p className="text-[10px] text-muted-foreground font-semibold mt-0.5">
                      {partner.category}
                    </p>
                  </div>
                </div>

                <div className="w-full pt-3 mt-3 border-t border-border/60 flex items-center justify-between text-xs">
                  <span className="text-amber-500 font-black flex items-center gap-1">⭐ 4.9</span>
                  <span className="rounded-full bg-primary/10 text-primary px-2.5 py-0.5 text-[10px] font-black">
                    Credenciado ✓
                  </span>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* ========================================================= */}
        {/* SEÇÃO 12: 📅 Próximos eventos                               */}
        {/* ========================================================= */}
        <section className="px-5">
          <SectionHeader
            title="📅 Próximos eventos"
            subtitle="Agenda de atrações imperdíveis nos próximos dias"
            to="/explorar"
          />

          <div className="space-y-2.5">
            {[
              {
                id: "e-1",
                date: "15 AGO",
                time: "19:00",
                title: "Festival Gastronômico & Vinhos ao Pôr do Sol",
                place: "Orla Búzios Lounge Club",
                price: "R$ 60",
              },
              {
                id: "e-2",
                date: "22 AGO",
                time: "21:30",
                title: "Show de MPB & Bossa Nova com Artistas Locais",
                place: "Teatro Municipal Mar",
                price: "R$ 45",
              },
              {
                id: "e-3",
                date: "05 SET",
                time: "10:00",
                title: "Feira de Gastronomia & Artesanato Regional",
                place: "Praça Principal",
                price: "Gratuito",
              },
            ].map((ev, idx) => (
              <div
                key={idx}
                onClick={() => navigate({ to: `/eventos/${ev.id}` })}
                className="flex items-center gap-3.5 rounded-2xl border border-border bg-card p-3 shadow-soft cursor-pointer hover:border-primary/40 transition"
              >
                <div className="grid h-12 w-12 shrink-0 place-items-center rounded-xl bg-gradient-brand text-white font-black text-center p-1 shadow-brand">
                  <div>
                    <span className="text-[9px] block leading-none opacity-90">
                      {ev.date.split(" ")[1]}
                    </span>
                    <span className="text-sm block leading-tight">{ev.date.split(" ")[0]}</span>
                  </div>
                </div>

                <div className="min-w-0 flex-1 space-y-0.5">
                  <h4 className="truncate text-xs font-black text-foreground">{ev.title}</h4>
                  <p className="truncate text-[11px] text-muted-foreground font-semibold">
                    📍 {ev.place} · {ev.time}
                  </p>
                </div>

                <span className="rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 px-2.5 py-1 text-xs font-black shrink-0">
                  {ev.price}
                </span>
              </div>
            ))}
          </div>
        </section>

        {/* ========================================================= */}
        {/* SEÇÃO 13: 💙 Bora Pass Premium (Visível apenas para Viajante) */}
        {/* ========================================================= */}
        {!isPremium && (
          <section className="px-5">
            <div className="rounded-3xl bg-gradient-to-br from-slate-950 via-slate-900 to-sky-950 border border-sky-500/40 p-6 text-white shadow-elevated space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="grid h-11 w-11 place-items-center rounded-2xl bg-amber-400 text-black font-black text-xl shadow-md">
                    👑
                  </div>
                  <div>
                    <span className="text-[10px] font-black uppercase text-amber-300 tracking-wider">
                      Plano Exclusivo
                    </span>
                    <h3 className="text-base font-black text-white">Bora Pass Premium</h3>
                  </div>
                </div>

                <span className="rounded-full bg-amber-400/20 text-amber-300 border border-amber-400/30 px-3 py-1 text-[10px] font-black uppercase">
                  VIP
                </span>
              </div>

              <p className="text-xs text-slate-300 leading-relaxed font-medium">
                Desbloqueie até 50% de desconto adicional, cupons ilimitados e suporte prioritário
                dedicado 24h para você e toda a sua família.
              </p>

              <div className="grid grid-cols-2 gap-2 text-xs font-bold text-slate-200">
                <div className="flex items-center gap-1.5">
                  <ShieldCheck className="h-4 w-4 text-emerald-400 shrink-0" />
                  <span>Descontos VIP Acumulativos</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <ShieldCheck className="h-4 w-4 text-emerald-400 shrink-0" />
                  <span>Cupons Exclusivos Ilimitados</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <ShieldCheck className="h-4 w-4 text-emerald-400 shrink-0" />
                  <span>Atendimento Gestor 24h</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <ShieldCheck className="h-4 w-4 text-emerald-400 shrink-0" />
                  <span>Sem taxa em Ingressos</span>
                </div>
              </div>

              <div className="pt-2 flex justify-end">
                <button
                  onClick={() => navigate({ to: "/perfil" })}
                  className="w-full sm:w-auto rounded-2xl bg-gradient-to-r from-amber-400 to-yellow-500 px-6 py-3 text-xs font-black text-black shadow-lg hover:opacity-95 transition active:scale-95 flex items-center justify-center gap-2"
                >
                  <Crown className="h-4 w-4" /> Conhecer o Bora Pass Premium
                </button>
              </div>
            </div>
          </section>
        )}
      </div>
    </AppShell>
  );
}
