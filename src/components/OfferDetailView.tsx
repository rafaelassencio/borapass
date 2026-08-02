import { useState } from "react";
import { Link, useNavigate } from "@tanstack/react-router";
import { AppShell } from "@/components/AppShell";
import { fallbackImage, type Listing } from "@/lib/listings";
import {
  ArrowLeft,
  Heart,
  Share2,
  MapPin,
  Star,
  Clock,
  Users,
  TreePine,
  Smile,
  Camera,
  Dog,
  Accessibility,
  Car,
  Check,
  X as XIcon,
  Calendar,
  Phone,
  ExternalLink,
  Play,
  ChevronDown,
  Sparkles,
  Flame,
  AlertTriangle,
  Navigation,
  ShieldCheck,
  Ticket,
  ChevronRight,
  Info,
  BadgePercent,
  CheckCircle2,
  Zap,
  Compass,
} from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { useRoles } from "@/hooks/use-roles";
import { useFavorites } from "@/lib/favorites";
import { PaymentAndCouponModal } from "@/components/PaymentAndCouponModal";
import { toast } from "sonner";
import { tours as mockTours, hotels as mockHotels } from "@/lib/mock-data";

interface Props {
  listing: Listing;
  backRoute?: string;
}

export function OfferDetailView({ listing, backRoute = "/explorar" }: Props) {
  const { user } = useAuth();
  const { isFavorite, toggleFavorite } = useFavorites(user?.id);
  const navigate = useNavigate();

  const [modalMode, setModalMode] = useState<"pay" | "coupon" | "add_to_trip" | null>(null);
  const [activeFaq, setActiveFaq] = useState<number | null>(null);
  const [showVideoModal, setShowVideoModal] = useState(false);
  const [appliedCoupon, setAppliedCoupon] = useState(false);

  const isFav = listing?.id ? isFavorite(listing.id) : false;
  const { isPremium } = useRoles(user?.id);

  // Pricing calculations according to user role:
  const travelerPrice = listing?.traveler_price ?? listing?.price ?? 120;
  const premiumPrice = listing?.premium_price ?? Math.round(travelerPrice * 0.7);
  const originalPrice = listing?.store_price || Math.round(travelerPrice * 1.35);

  const currentPrice = isPremium ? premiumPrice : travelerPrice;
  const isFree =
    currentPrice === 0 || listing?.offer_type === "perk" || listing?.category === "cupom";
  const savedAmount = Math.max(originalPrice - currentPrice, 30);
  const premiumSavings = Math.max(travelerPrice - premiumPrice, 15);

  const ratingVal = 4.9;
  const reviewsCount = 1284;

  // Highlights list
  const highlights = [
    { icon: TreePine, label: "Natureza exuberante" },
    { icon: Smile, label: "Ideal para famílias" },
    { icon: Camera, label: "Excelente para fotos" },
    { icon: Dog, label: "Pet Friendly" },
    { icon: Accessibility, label: "Acessível PCD" },
    { icon: Car, label: "Estacionamento no local" },
    { icon: ShieldCheck, label: "Cancelamento gratuito" },
    { icon: Zap, label: "Reserva imediata" },
  ];

  // Included items
  const includes =
    listing?.includes && listing.includes.length > 0
      ? listing.includes
      : [
          "Ingresso oficial de acesso",
          "Guia profissional credenciado",
          "Seguro viagem contra acidentes",
        ];

  // Excluded items
  const excludes =
    listing?.excludes && listing.excludes.length > 0
      ? listing.excludes
      : ["Alimentação e refeições principais no local", "Gastos pessoais e lembranças de viagem"];

  // Important Info
  const importantInfo = [
    listing?.operating_days && { label: "Dias de funcionamento", val: listing.operating_days },
    listing?.checkin_time && { label: "Horário Check-in", val: listing.checkin_time },
    listing?.checkout_time && { label: "Horário Check-out", val: listing.checkout_time },
    listing?.duration_text && { label: "Duração estimada", val: listing.duration_text },
    listing?.age_group && { label: "Faixa etária", val: listing.age_group },
    listing?.cancellation_policy && {
      label: "Política de Cancelamento",
      val: listing.cancellation_policy,
    },
    listing?.meeting_point && { label: "Ponto de encontro", val: listing.meeting_point },
    (listing?.phone || listing?.whatsapp) && {
      label: "Contato / WhatsApp",
      val: listing.phone || listing.whatsapp || "",
    },
    listing?.accessibility !== undefined &&
      listing?.accessibility !== null && {
        label: "Acessibilidade PCD",
        val: listing.accessibility ? "♿ Sim, acessível para cadeirantes" : "Não adaptado",
      },
    listing?.libras_interpreter !== undefined &&
      listing?.libras_interpreter !== null && {
        label: "Intérprete de Libras",
        val: listing.libras_interpreter ? "🤟 Disponível" : "Não disponível",
      },
    listing?.languages &&
      listing.languages.length > 0 && {
        label: "Idiomas no Atendimento",
        val: `🌐 ${listing.languages.join(", ")}`,
      },
    listing?.important_info && { label: "Observações", val: listing.important_info },
  ].filter(Boolean) as Array<{ label: string; val: string }>;

  // Dynamic FAQ Accordion
  const faqs =
    listing?.faqs && listing.faqs.length > 0
      ? listing.faqs
      : [
          {
            q: "Posso cancelar minha reserva?",
            a: "Sim! O cancelamento é 100% gratuito se realizado até 24 horas antes do início da experiência diretamente pelo aplicativo.",
          },
          {
            q: "O local possui estacionamento?",
            a: "Sim, há estacionamento amplo, coberto e gratuito para clientes do Bora Pass no local da atração.",
          },
        ];

  // Reviews sample
  const reviewsList = [
    {
      name: "Juliana Costa",
      avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150",
      date: "Há 2 dias",
      rating: 5,
      comment:
        "Experiência simplesmente espetacular! O guia foi incrivelmente atencioso e a economia com o Bora Pass valeu super a pena.",
    },
    {
      name: "Carlos Eduardo Silva",
      avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150",
      date: "Há 1 semana",
      rating: 5,
      comment:
        "Reserva super rápida no app. Chegamos lá e o ingresso já estava liberado na hora no QR Code sem nenhuma fila!",
    },
    {
      name: "Fernanda Lima",
      avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150",
      date: "Há 2 semanas",
      rating: 5,
      comment:
        "Lugar lindo demais para tirar fotos com a família! Com certeza iremos recomendar para todos os amigos viajantes.",
    },
  ];

  // Related Listings
  const relatedItems = [...mockTours, ...mockHotels].slice(0, 4);

  function handleShare() {
    if (navigator.share) {
      navigator.share({ title: listing.title, url: window.location.href }).catch(() => {});
    } else {
      navigator.clipboard.writeText(window.location.href);
      toast.success("Link copiado para a área de transferência!");
    }
  }

  function handleOpenDirections() {
    const lat = (listing as any).lat || -22.9068;
    const lng = (listing as any).lng || -43.1729;
    window.open(`https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`, "_blank");
  }

  return (
    <AppShell>
      <div className="relative pb-32 bg-background text-foreground animate-fadeIn">
        {/* 1. CABEÇALHO HERO (IMAGEM GRANDE ~40% DA TELA) */}
        <div className="relative h-[42vh] min-h-[320px] w-full overflow-hidden bg-slate-950">
          <img
            src={listing.image_url || fallbackImage(listing.category as any)}
            alt={listing.title}
            className="h-full w-full object-cover opacity-90 transition-transform duration-700 hover:scale-105"
          />

          {/* Sombra de Gradiente Suave no Topo e na Base */}
          <div className="absolute inset-0 bg-gradient-to-t from-background via-black/30 to-black/60" />

          {/* Botões do Topo: Voltar, Compartilhar, Favoritar */}
          <div className="absolute inset-x-0 top-0 flex items-center justify-between p-4 z-20">
            <button
              onClick={() => {
                if (typeof window !== "undefined" && window.history.length > 1) {
                  window.history.back();
                } else {
                  navigate({ to: "/explorar" });
                }
              }}
              className="grid h-10 w-10 place-items-center rounded-full bg-black/50 text-white backdrop-blur-md transition hover:bg-black/75 active:scale-95 shadow-md border border-white/20"
              title="Voltar"
            >
              <ArrowLeft className="h-5 w-5" />
            </button>

            <div className="flex gap-2">
              <button
                onClick={handleShare}
                className="grid h-10 w-10 place-items-center rounded-full bg-black/50 text-white backdrop-blur-md transition hover:bg-black/75 active:scale-95 shadow-md border border-white/20"
                title="Compartilhar"
              >
                <Share2 className="h-5 w-5" />
              </button>

              <button
                onClick={() => toggleFavorite(listing.id, listing.title)}
                className="grid h-10 w-10 place-items-center rounded-full bg-black/50 text-white backdrop-blur-md transition hover:bg-black/75 active:scale-95 shadow-md border border-white/20"
                title={isFav ? "Remover dos favoritos" : "Salvar nos favoritos"}
              >
                <Heart
                  className={`h-5 w-5 ${isFav ? "fill-red-500 text-red-500" : "text-white"}`}
                />
              </button>
            </div>
          </div>

          {/* Badges Flutuantes sobre a Imagem Hero */}
          <div className="absolute bottom-4 left-4 right-4 flex flex-wrap items-center gap-2 z-20">
            <span className="flex items-center gap-1 rounded-full bg-black/70 px-3 py-1 text-xs font-black text-amber-400 backdrop-blur-md border border-amber-400/40 shadow-lg">
              <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
              {ratingVal}
            </span>

            <span className="flex items-center gap-1 rounded-full bg-gradient-ember px-3 py-1 text-xs font-black text-white shadow-ember">
              <Flame className="h-3.5 w-3.5" /> Mais vendido
            </span>

            <span className="flex items-center gap-1 rounded-full bg-purple-600 px-3 py-1 text-xs font-black text-white shadow-lg">
              🏆 Recomendado
            </span>

            <span className="flex items-center gap-1 rounded-full bg-gradient-brand px-3 py-1 text-xs font-black text-white shadow-brand">
              💙 Exclusivo Bora Pass
            </span>
          </div>
        </div>

        <div className="px-5 pt-5 space-y-6">
          {/* PROVA SOCIAL & ESCOSSEZ (CARDS DE ALERTA RÁPIDO) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            <div className="flex items-center gap-2.5 rounded-2xl bg-orange-500/10 border border-orange-500/30 p-3 text-xs font-bold text-orange-600 dark:text-orange-400">
              <Flame className="h-4 w-4 shrink-0 text-orange-500" />
              <span>🔥 153 pessoas reservaram esta experiência nesta semana!</span>
            </div>

            <div className="flex items-center gap-2.5 rounded-2xl bg-red-500/10 border border-red-500/30 p-3 text-xs font-bold text-red-600 dark:text-red-400">
              <AlertTriangle className="h-4 w-4 shrink-0 text-red-500" />
              <span>⚠️ Restam apenas 8 vagas para hoje!</span>
            </div>
          </div>

          {/* 2. INFORMAÇÕES PRINCIPAIS */}
          <div className="space-y-2">
            <h1 className="text-2xl sm:text-3xl font-black text-foreground tracking-tight leading-snug">
              {listing.title}
            </h1>

            <div className="flex flex-wrap items-center gap-y-2 gap-x-4 text-xs text-muted-foreground font-semibold">
              <span className="flex items-center gap-1 text-foreground font-bold">
                <MapPin className="h-4 w-4 text-primary shrink-0" />
                {listing.address || listing.city || "Localização Exclusiva"}
              </span>

              <span className="flex items-center gap-1 text-amber-500 font-extrabold">
                <Star className="h-4 w-4 fill-amber-400 text-amber-400 shrink-0" />
                {ratingVal}{" "}
                <span className="text-muted-foreground font-semibold">
                  ({reviewsCount} avaliações)
                </span>
              </span>

              <span className="flex items-center gap-1 capitalize rounded-md bg-secondary px-2 py-0.5 text-foreground font-bold">
                🌳 {listing.category}
              </span>

              {listing.accommodation_type && (
                <span className="flex items-center gap-1 rounded-md bg-sky-500/10 text-sky-600 dark:text-sky-400 border border-sky-500/20 px-2.5 py-0.5 font-black">
                  🏡 {listing.accommodation_type}
                </span>
              )}

              <span className="flex items-center gap-1 font-bold text-foreground">
                <Clock className="h-4 w-4 text-primary shrink-0" /> ⏱ 2h30min
              </span>

              <span className="flex items-center gap-1 font-bold text-foreground">
                <Users className="h-4 w-4 text-primary shrink-0" /> 👥 Até 20 pessoas
              </span>
            </div>

            {/* Informações de Deslocamento */}
            <div className="flex items-center gap-4 text-xs font-semibold text-sky-600 dark:text-sky-400 pt-1">
              <span className="flex items-center gap-1">
                <Navigation className="h-3.5 w-3.5" /> 🚗 15 minutos do centro
              </span>
              <span className="flex items-center gap-1">
                <Clock className="h-3.5 w-3.5" /> 🚶 25 minutos caminhando
              </span>
            </div>
          </div>

          {/* ✨ VALE A PENA PARA VOCÊ & CARD DE ECONOMIA */}
          <div className="rounded-3xl bg-gradient-hero p-5 text-white shadow-brand relative overflow-hidden space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-black uppercase tracking-wider text-amber-200 flex items-center gap-1.5">
                <Sparkles className="h-4 w-4" /> ✨ Vale a pena para você
              </span>
              <span className="rounded-full bg-white/20 px-2.5 py-0.5 text-[10px] font-black uppercase">
                Recomendado
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs font-bold">
              <div className="flex items-center gap-2 bg-white/10 rounded-xl p-2.5 backdrop-blur">
                <CheckCircle2 className="h-4 w-4 text-emerald-300 shrink-0" />
                <span>Ideal para famílias & grupos</span>
              </div>
              <div className="flex items-center gap-2 bg-white/10 rounded-xl p-2.5 backdrop-blur">
                <CheckCircle2 className="h-4 w-4 text-emerald-300 shrink-0" />
                <span>Excelente escolha para casais</span>
              </div>
              <div className="flex items-center gap-2 bg-white/10 rounded-xl p-2.5 backdrop-blur">
                <CheckCircle2 className="h-4 w-4 text-emerald-300 shrink-0" />
                <span>Apenas 10 minutos do centro</span>
              </div>
              <div className="flex items-center gap-2 bg-white/10 rounded-xl p-2.5 backdrop-blur">
                <CheckCircle2 className="h-4 w-4 text-emerald-300 shrink-0" />
                <span>Clima ideal no momento</span>
              </div>
            </div>

            {/* CARD DE ECONOMIA & PLANO PREMIUM */}
            {isPremium ? (
              <div className="rounded-2xl bg-amber-500/15 p-4 border border-amber-500/30 backdrop-blur flex items-center justify-between text-amber-300">
                <div className="flex items-center gap-3">
                  <span className="text-2xl">👑</span>
                  <div>
                    <p className="text-xs font-extrabold text-amber-300 uppercase tracking-wider">
                      Você é Viajante Premium VIP!
                    </p>
                    <p className="text-sm font-black text-white">
                      Preço exclusivo de R$ {premiumPrice.toFixed(2)} ativado com sucesso!
                    </p>
                  </div>
                </div>
              </div>
            ) : (
              <div className="rounded-2xl bg-gradient-to-r from-amber-500 via-amber-400 to-yellow-500 p-4 text-black shadow-lg flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                <div>
                  <span className="text-[10px] font-black uppercase tracking-wider bg-black/20 text-black px-2.5 py-0.5 rounded-full inline-block">
                    👑 Seja Viajante Premium
                  </span>
                  <h4 className="text-sm font-black mt-1">
                    Pague apenas R$ {premiumPrice.toFixed(2)} nesta experiência!
                  </h4>
                  <p className="text-xs font-bold opacity-90">
                    Economize mais R$ {premiumSavings.toFixed(2)} assinando agora o Bora Pass
                    Premium!
                  </p>
                </div>
                <button
                  onClick={() => navigate({ to: "/perfil" })}
                  className="rounded-xl bg-black text-amber-300 font-black px-4 py-2.5 text-xs shadow hover:bg-slate-900 transition shrink-0"
                >
                  Assinar Premium
                </button>
              </div>
            )}
          </div>

          {/* 3. DESTAQUES DA EXPERIÊNCIA */}
          <div className="space-y-3">
            <h2 className="text-base font-extrabold text-foreground tracking-tight">
              Destaques da Experiência
            </h2>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
              {highlights.map((h, idx) => {
                const IconComponent = h.icon;
                return (
                  <div
                    key={idx}
                    className="flex items-center gap-2.5 rounded-2xl border border-border bg-card p-3 shadow-soft text-xs font-bold text-foreground"
                  >
                    <div className="grid h-8 w-8 shrink-0 place-items-center rounded-xl bg-primary/10 text-primary">
                      <IconComponent className="h-4 w-4" />
                    </div>
                    <span className="line-clamp-2 leading-tight">{h.label}</span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* 4. SOBRE A EXPERIÊNCIA */}
          <div className="space-y-3 border-t border-border/60 pt-5">
            <h2 className="text-base font-extrabold text-foreground tracking-tight">
              Sobre a Experiência
            </h2>
            <div className="text-sm leading-relaxed text-muted-foreground space-y-3 font-medium">
              <p>
                {listing.description ||
                  "Prepare-se para viver momentos inesquecíveis em uma das atrações mais admiradas e desejadas pelos viajantes. Uma jornada cuidadosamente planejada para proporcionar contato com a natureza, cultura local e segurança completa."}
              </p>
              <p>
                Nossos guias credenciados acompanham todo o percurso garantindo fotos incríveis,
                curiosidades históricas e atendimento exclusivo para você aproveitar ao máximo sua
                viagem com conforto e tranquilidade.
              </p>
            </div>
          </div>

          {/* 5. O QUE ESTÁ INCLUSO */}
          <div className="space-y-3 border-t border-border/60 pt-5">
            <h2 className="text-base font-extrabold text-foreground tracking-tight flex items-center gap-2">
              <Check className="h-5 w-5 text-emerald-500" /> O que está incluso
            </h2>
            <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs font-bold text-foreground">
              {includes.map((inc, i) => (
                <li
                  key={i}
                  className="flex items-center gap-2 rounded-xl bg-emerald-500/10 border border-emerald-500/20 p-2.5 text-emerald-700 dark:text-emerald-300"
                >
                  <Check className="h-4 w-4 shrink-0 text-emerald-500" />
                  <span>{inc}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* O QUE LEVAR (RECOMENDAÇÕES PARA PASSEIOS) */}
          {listing.what_to_bring && listing.what_to_bring.length > 0 && (
            <div className="space-y-3 border-t border-border/60 pt-5">
              <h2 className="text-base font-extrabold text-foreground tracking-tight flex items-center gap-2">
                <Compass className="h-5 w-5 text-sky-500" /> Recomendações & O que levar
              </h2>
              <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs font-bold text-foreground">
                {listing.what_to_bring.map((item, i) => (
                  <li
                    key={i}
                    className="flex items-center gap-2 rounded-xl bg-sky-500/10 border border-sky-500/20 p-2.5 text-sky-700 dark:text-sky-300"
                  >
                    <CheckCircle2 className="h-4 w-4 shrink-0 text-sky-500" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* 6. O QUE NÃO ESTÁ INCLUSO */}
          <div className="space-y-3 border-t border-border/60 pt-5">
            <h2 className="text-base font-extrabold text-foreground tracking-tight flex items-center gap-2">
              <XIcon className="h-5 w-5 text-red-500" /> O que não está incluso
            </h2>
            <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs font-bold text-foreground">
              {excludes.map((exc, i) => (
                <li
                  key={i}
                  className="flex items-center gap-2 rounded-xl bg-red-500/10 border border-red-500/20 p-2.5 text-red-700 dark:text-red-300"
                >
                  <XIcon className="h-4 w-4 shrink-0 text-red-500" />
                  <span>{exc}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* 7. INFORMAÇÕES IMPORTANTES */}
          <div className="rounded-3xl border border-border bg-card p-5 shadow-soft space-y-3">
            <h2 className="text-base font-extrabold text-foreground tracking-tight flex items-center gap-2">
              <Info className="h-5 w-5 text-primary" /> Informações Importantes
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              {importantInfo.map((info, idx) => (
                <div key={idx} className="border-b border-border/50 pb-2">
                  <span className="text-muted-foreground font-semibold block">{info.label}</span>
                  <span className="font-extrabold text-foreground">{info.val}</span>
                </div>
              ))}
            </div>
          </div>

          {/* 8. LOCALIZAÇÃO E NAVEGAÇÃO */}
          <div className="space-y-3 border-t border-border/60 pt-5">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-extrabold text-foreground tracking-tight flex items-center gap-2">
                <MapPin className="h-5 w-5 text-primary" /> Localização
              </h2>
              <button
                onClick={handleOpenDirections}
                className="flex items-center gap-1.5 rounded-2xl bg-primary px-3.5 py-1.5 text-xs font-bold text-primary-foreground shadow-brand hover:opacity-95 transition"
              >
                📍 Como chegar
              </button>
            </div>
          </div>

          {/* 9. GALERIA & VÍDEO */}
          <div className="space-y-3 border-t border-border/60 pt-5">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-extrabold text-foreground tracking-tight">
                Galeria da Experiência
              </h2>
              <button
                onClick={() => setShowVideoModal(true)}
                className="flex items-center gap-1.5 rounded-full bg-gradient-ember px-3.5 py-1.5 text-xs font-bold text-white shadow-ember hover:opacity-95 transition"
              >
                <Play className="h-3.5 w-3.5 fill-white" /> Assistir Vídeo
              </button>
            </div>

            <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide">
              {[
                listing.image_url || fallbackImage(listing.category as any),
                "https://images.unsplash.com/photo-1506744038136-46273834b3fb?w=600",
                "https://images.unsplash.com/photo-1511884642898-4c92249e20b6?w=600",
                "https://images.unsplash.com/photo-1470071459604-3b5ec3a7fe05?w=600",
              ].map((imgUrl, i) => (
                <div
                  key={i}
                  className="relative h-32 w-44 shrink-0 overflow-hidden rounded-2xl border border-border shadow-soft"
                >
                  <img
                    src={imgUrl}
                    alt={`Foto ${i + 1}`}
                    className="h-full w-full object-cover hover:scale-105 transition duration-300"
                  />
                </div>
              ))}
            </div>
          </div>

          {/* 10. AVALIAÇÕES DOS USUÁRIOS */}
          <div className="space-y-4 border-t border-border/60 pt-5">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-base font-extrabold text-foreground tracking-tight">
                  Avaliações de Clientes
                </h2>
                <p className="text-xs text-muted-foreground">
                  O que os viajantes estão dizendo sobre esta experiência
                </p>
              </div>

              <div className="text-right">
                <span className="text-2xl font-black text-amber-500">⭐ {ratingVal}</span>
                <span className="block text-[10px] text-muted-foreground font-semibold">
                  {reviewsCount} avaliações
                </span>
              </div>
            </div>

            <div className="space-y-3">
              {reviewsList.map((rev, idx) => (
                <div
                  key={idx}
                  className="rounded-2xl border border-border bg-card p-4 shadow-soft space-y-2"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <img
                        src={rev.avatar}
                        alt={rev.name}
                        className="h-9 w-9 rounded-full object-cover border border-border"
                      />
                      <div>
                        <h4 className="text-xs font-extrabold text-foreground">{rev.name}</h4>
                        <span className="text-[10px] text-muted-foreground">{rev.date}</span>
                      </div>
                    </div>

                    <div className="flex items-center text-amber-400 text-xs">
                      {Array.from({ length: rev.rating }).map((_, i) => (
                        <Star key={i} className="h-3.5 w-3.5 fill-amber-400" />
                      ))}
                    </div>
                  </div>

                  <p className="text-xs leading-relaxed text-muted-foreground font-medium">
                    "{rev.comment}"
                  </p>
                </div>
              ))}
            </div>

            <button
              onClick={() => toast.info("Todas as 1.284 avaliações verificadas carregadas!")}
              className="w-full rounded-2xl border border-border bg-card py-2.5 text-xs font-bold text-foreground hover:bg-secondary transition"
            >
              ⭐ Ver todas as {reviewsCount} avaliações
            </button>
          </div>

          {/* 11. PERGUNTAS FREQUENTES (FAQ ACCORDION) */}
          <div className="space-y-3 border-t border-border/60 pt-5">
            <h2 className="text-base font-extrabold text-foreground tracking-tight">
              Perguntas Frequentes
            </h2>

            <div className="space-y-2">
              {faqs.map((faq, idx) => {
                const isOpen = activeFaq === idx;
                return (
                  <div
                    key={idx}
                    className="rounded-2xl border border-border bg-card overflow-hidden transition shadow-soft"
                  >
                    <button
                      onClick={() => setActiveFaq(isOpen ? null : idx)}
                      className="flex w-full items-center justify-between p-3.5 text-left text-xs font-extrabold text-foreground hover:bg-secondary/50 transition"
                    >
                      <span>{faq.q}</span>
                      <ChevronDown
                        className={`h-4 w-4 text-muted-foreground transition-transform ${isOpen ? "rotate-180 text-primary" : ""}`}
                      />
                    </button>
                    {isOpen && (
                      <div className="px-3.5 pb-3.5 text-xs text-muted-foreground leading-relaxed border-t border-border/50 pt-2 font-medium">
                        {faq.a}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* 12. EFETUAR RESERVA & ECONOMIA GARANTIDA BORA PASS */}
          <div className="rounded-3xl bg-gradient-to-br from-amber-500/15 via-orange-500/10 to-primary/10 border-2 border-dashed border-amber-500/40 p-5 shadow-soft space-y-4">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="flex items-center gap-3 text-center sm:text-left">
                <div className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-gradient-brand text-white shadow-brand text-2xl">
                  🎟️
                </div>
                <div>
                  <span className="text-[10px] font-black uppercase tracking-wider text-amber-600 dark:text-amber-400 flex items-center gap-1 justify-center sm:justify-start">
                    <Sparkles className="h-3 w-3" /> Desconto Exclusivo Bora Pass
                  </span>
                  <h3 className="text-sm font-black text-foreground">
                    Economize R$ {savedAmount.toFixed(2)} nesta compra (
                    {Math.round((savedAmount / originalPrice) * 100)}% OFF)
                  </h3>
                  <p className="text-xs text-muted-foreground">
                    Desconto aplicado instantaneamente ao resgatar seu passaporte.
                  </p>
                </div>
              </div>

              <button
                onClick={() => setModalMode("pay")}
                className="shrink-0 rounded-2xl bg-gradient-brand px-6 py-3 text-xs font-black text-white shadow-brand transition active:scale-95 flex items-center gap-2 hover:opacity-95"
              >
                <Zap className="h-4 w-4 fill-white" /> Efetuar Reserva
              </button>
            </div>

            {/* Informações detalhadas de preço */}
            <div className="grid grid-cols-3 gap-2 pt-3 border-t border-border/40 text-center text-xs">
              <div className="rounded-xl bg-card/70 p-2 border border-border/50">
                <span className="text-[10px] text-muted-foreground block font-bold">
                  Preço Total (Balcão)
                </span>
                <span className="font-extrabold text-foreground line-through">
                  R$ {originalPrice.toFixed(2)}
                </span>
              </div>
              <div className="rounded-xl bg-emerald-500/10 p-2 border border-emerald-500/30">
                <span className="text-[10px] text-emerald-600 dark:text-emerald-400 block font-black">
                  Preço com Desconto
                </span>
                <span className="font-black text-emerald-600 dark:text-emerald-400">
                  R$ {currentPrice.toFixed(2)}
                </span>
              </div>
              <div className="rounded-xl bg-amber-500/10 p-2 border border-amber-500/30">
                <span className="text-[10px] text-amber-600 dark:text-amber-400 block font-black">
                  Economia Garantida
                </span>
                <span className="font-black text-amber-600 dark:text-amber-400">
                  R$ {savedAmount.toFixed(2)} ({Math.round((savedAmount / originalPrice) * 100)}%)
                </span>
              </div>
            </div>
          </div>

          {/* 13. EXPERIÊNCIAS RELACIONADAS */}
          <div className="space-y-3 border-t border-border/60 pt-5">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-extrabold text-foreground tracking-tight">
                Experiências Relacionadas
              </h2>
              <span className="text-xs font-bold text-muted-foreground">
                Recomendações para você
              </span>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {relatedItems.map((rel) => {
                const relImage =
                  (rel as any).image_url ||
                  (rel as any).image ||
                  fallbackImage(((rel as any).category || "passeio") as any);
                const relTitle = (rel as any).title || (rel as any).name;
                const relPrice = (rel as any).traveler_price || (rel as any).price || 89;
                return (
                  <div
                    key={rel.id}
                    className="overflow-hidden rounded-2xl border border-border bg-card shadow-soft space-y-2 p-2.5 flex flex-col justify-between hover:border-primary/50 transition duration-200"
                  >
                    <div className="space-y-2">
                      <div className="h-28 w-full overflow-hidden rounded-xl bg-muted relative">
                        <img
                          src={relImage}
                          alt={relTitle}
                          className="h-full w-full object-cover hover:scale-105 transition duration-300"
                        />
                        <span className="absolute top-1.5 left-1.5 rounded-full bg-black/70 px-2 py-0.5 text-[9px] font-black text-amber-300 backdrop-blur border border-amber-400/30">
                          ⭐ 4.9
                        </span>
                      </div>
                      <h4 className="line-clamp-2 text-xs font-extrabold text-foreground leading-snug">
                        {relTitle}
                      </h4>
                    </div>

                    <div className="pt-2 border-t border-border/50 flex items-center justify-between">
                      <div>
                        <span className="text-[9px] text-muted-foreground font-bold block">
                          Por apenas
                        </span>
                        <span className="text-xs font-black text-emerald-600 dark:text-emerald-400">
                          R$ {relPrice}
                        </span>
                      </div>
                      <button
                        onClick={() => navigate({ to: "/explorar" })}
                        className="rounded-xl bg-primary px-3 py-1.5 text-[10px] font-black text-primary-foreground shadow-sm hover:opacity-90 transition"
                      >
                        Ver Detalhes
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* 14. RODAPÉ FIXO (STICKY CONVERSION FOOTER) */}
        <div className="fixed inset-x-0 bottom-0 z-40 border-t border-border bg-background/95 backdrop-blur-xl shadow-elevated">
          <div className="mx-auto flex max-w-2xl items-center justify-between gap-3 p-3.5">
            <div>
              <span className="text-[10px] font-extrabold uppercase text-amber-500 block">
                {isFree
                  ? "Valor da Cortesia"
                  : isPremium
                    ? "👑 Preço Exclusivo Viajante Premium"
                    : `👑 No Premium R$ ${premiumPrice.toFixed(2)} (-R$ ${premiumSavings.toFixed(2)})`}
              </span>
              <div className="flex items-center gap-2">
                <span className="text-xl font-black text-primary">
                  {isFree ? "Gratuito 🎁" : `R$ ${currentPrice.toFixed(2)}`}
                </span>
                {!isFree && originalPrice > currentPrice && (
                  <span className="text-xs font-semibold text-muted-foreground line-through">
                    R$ {originalPrice.toFixed(2)}
                  </span>
                )}
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => {
                  if (!user) {
                    toast.warning("🔒 Faça login para adicionar experiências à sua viagem!");
                    navigate({ to: "/login" });
                    return;
                  }
                  setModalMode("add_to_trip");
                }}
                className="flex items-center justify-center gap-1 rounded-2xl border border-border bg-card px-3.5 py-3 text-xs font-bold text-foreground hover:bg-secondary transition active:scale-95 shrink-0"
              >
                <Calendar className="h-4 w-4 text-primary" />
                <span className="hidden sm:inline">Adicionar à Viagem</span>
                <span className="sm:hidden">Viagem</span>
              </button>

              <button
                onClick={() => {
                  if (!user) {
                    toast.warning("🔒 Faça login ou cadastre-se para resgatar ou comprar!");
                    navigate({ to: "/login" });
                    return;
                  }
                  setModalMode("pay");
                }}
                className="flex items-center justify-center gap-1.5 rounded-2xl bg-gradient-brand px-6 py-3 text-xs font-black text-white shadow-brand transition active:scale-95 shrink-0 hover:opacity-95"
              >
                <Zap className="h-4 w-4 fill-white" /> Efetuar Reserva
              </button>
            </div>
          </div>
        </div>

        {/* MODAL DE VIDEO */}
        {showVideoModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-md p-4 animate-fadeIn">
            <div className="w-full max-w-lg rounded-3xl bg-card p-5 space-y-4 shadow-elevated border border-border">
              <div className="flex items-center justify-between border-b border-border/60 pb-3">
                <h3 className="text-sm font-extrabold text-foreground">Vídeo da Experiência</h3>
                <button
                  onClick={() => setShowVideoModal(false)}
                  className="rounded-full p-1 text-muted-foreground hover:bg-secondary"
                >
                  <XIcon className="h-5 w-5" />
                </button>
              </div>

              <div className="aspect-video w-full overflow-hidden rounded-2xl bg-black flex items-center justify-center relative">
                <iframe
                  className="w-full h-full"
                  src="https://www.youtube-nocookie.com/embed/dQw4w9WgXcQ?autoplay=1"
                  title="Vídeo demonstrativo"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                />
              </div>
            </div>
          </div>
        )}

        {/* MODAL DE PAGAMENTO / CUPOM / PLANEJADOR */}
        {modalMode && (
          <PaymentAndCouponModal
            listing={listing}
            mode={modalMode}
            onClose={() => setModalMode(null)}
          />
        )}
      </div>
    </AppShell>
  );
}
