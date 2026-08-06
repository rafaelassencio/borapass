import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { AppShell } from "@/components/AppShell";
import { useState, useEffect, useMemo, useCallback } from "react";
import { toast } from "sonner";
import {
  Hotel,
  Search,
  Calendar,
  Users,
  MapPin,
  Star,
  CheckCircle2,
  Coffee,
  ShieldCheck,
  Sparkles,
  Bed,
  X,
  ChevronRight,
  Info,
  Building,
  QrCode,
  ArrowRight,
  Filter,
} from "lucide-react";
import { HotelService, BookingService, type HotelItem, type HotelRoomOption } from "@/lib/gecko-services";

export const Route = createFileRoute("/hospedagens")({
  head: () => ({ meta: [{ title: "Hospedagens & Hotéis — Bora Pass" }] }),
  component: HospedagensPage,
});

export function HospedagensPage() {
  const navigate = useNavigate();

  // FORMULARIO DE PESQUISA DE HOSPEDAGEM
  const [destination, setDestination] = useState("Rio de Janeiro, RJ");
  const [checkIn, setCheckIn] = useState("2026-08-20");
  const [checkOut, setCheckOut] = useState("2026-08-22");
  const [adults, setAdults] = useState(2);
  const [children, setChildren] = useState(0);
  const [rooms, setRooms] = useState(1);

  // ESTADOS DE RESULTADO E MODAIS
  const [hotels, setHotels] = useState<HotelItem[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const [selectedHotel, setSelectedHotel] = useState<HotelItem | null>(null);
  const [selectedRoom, setSelectedRoom] = useState<HotelRoomOption | null>(null);
  const [showBookingModal, setShowBookingModal] = useState(false);

  // FORMULARIO DE RESERVA DO HÓSPEDE
  const [guestName, setGuestName] = useState("");
  const [guestEmail, setGuestEmail] = useState("");
  const [isSubmittingBooking, setIsSubmittingBooking] = useState(false);
  const [completedVoucher, setCompletedVoucher] = useState<any | null>(null);

  // FILTROS DE HOTÉIS
  const [maxPrice, setMaxPrice] = useState<number>(2000);
  const [onlyFreeCancellation, setOnlyFreeCancellation] = useState(false);
  const [onlyBreakfast, setOnlyBreakfast] = useState(false);

  // Executar pesquisa inicial na montagem
  const handleSearchHotels = useCallback(async () => {
    if (!destination || !checkIn || !checkOut) {
      return toast.error("Preencha o destino, data de check-in e check-out.");
    }

    setIsSearching(true);
    setHasSearched(true);

    try {
      const res = await HotelService.searchHotels({
        destination,
        checkIn,
        checkOut,
        adults,
        children,
        rooms,
      });

      setHotels(res);
      toast.success(`🏨 ${res.length} hospedagens encontradas via GeckoAPI!`);
    } catch (err) {
      toast.error("Falha ao consultar hospedagens.");
    } finally {
      setIsSearching(false);
    }
  }, [destination, checkIn, checkOut, adults, children, rooms]);

  useEffect(() => {
    handleSearchHotels();
  }, []);

  // Filtragem Dinâmica de Hotéis
  const filteredHotels = useMemo(() => {
    return hotels.filter((h) => {
      if (h.totalPrice > maxPrice) return false;
      if (onlyFreeCancellation && !h.freeCancellation) return false;
      if (onlyBreakfast && !h.breakfastIncluded) return false;
      return true;
    });
  }, [hotels, maxPrice, onlyFreeCancellation, onlyBreakfast]);

  // Concluir Reserva de Hotel
  const handleConfirmBooking = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedHotel || !selectedRoom) return;
    if (!guestName || !guestEmail) {
      return toast.error("Preencha o nome completo e e-mail do hóspede principal.");
    }

    setIsSubmittingBooking(true);
    try {
      const bookingRecord = await BookingService.createHotelBooking({
        hotel: selectedHotel,
        room: selectedRoom,
        guestName,
        guestEmail,
        checkIn,
        checkOut,
        guestsCount: adults + children,
      });

      setCompletedVoucher(bookingRecord);
      toast.success("🎉 Reserva de Hospedagem confirmada com sucesso!");
    } catch (err) {
      toast.error("Ocorreu um erro ao gerar a reserva.");
    } finally {
      setIsSubmittingBooking(false);
    }
  };

  return (
    <AppShell>
      {/* HEADER PRINCIPAL DE HOSPEDAGENS */}
      <div className="bg-gradient-to-r from-slate-950 via-slate-900 to-indigo-950 text-white px-5 pt-7 pb-6 shadow-elevated border-b border-white/10 relative overflow-hidden">
        <div className="absolute top-0 right-0 h-48 w-48 rounded-full bg-primary/20 blur-3xl pointer-events-none" />

        <div className="max-w-4xl mx-auto space-y-3 relative z-10">
          <div className="flex items-center justify-between">
            <span className="rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 px-3 py-1 text-[11px] font-black uppercase tracking-wider flex items-center gap-1.5 shadow-sm">
              <Sparkles className="h-3.5 w-3.5 text-amber-300" /> GeckoAPI Hotels Integrado
            </span>

            <button
              onClick={() => navigate({ to: "/minhas-viagens" })}
              className="rounded-full bg-white/10 hover:bg-white/20 text-white border border-white/20 px-3.5 py-1.5 text-xs font-bold transition flex items-center gap-1.5 shadow-sm"
            >
              <span>Minhas Viagens 🧳</span>
            </button>
          </div>

          <h1 className="text-2xl sm:text-3xl font-black text-white leading-tight drop-shadow-md">
            Reserve os Melhores <br />
            <span className="bg-gradient-to-r from-amber-300 via-amber-200 to-emerald-400 bg-clip-text text-transparent">
              Hotéis, Pousadas & Resorts
            </span>
          </h1>
          <p className="text-xs sm:text-sm text-slate-300 max-w-xl">
            Compare tarifas exclusivas, cancelamento grátis e suporte completo no Bora Pass.
          </p>
        </div>
      </div>

      <div className="px-5 pt-6 pb-28 max-w-4xl mx-auto space-y-6">
        {/* FORMULÁRIO DE PESQUISA DE HOTÉIS */}
        <div className="rounded-3xl border border-border bg-card p-6 shadow-elevated space-y-5 animate-fadeIn">
          <div className="flex items-center justify-between border-b border-border/60 pb-3">
            <div className="flex items-center gap-2">
              <Hotel className="h-5 w-5 text-primary" />
              <h2 className="text-sm font-black uppercase tracking-wider text-foreground">
                Pesquisar Hospedagens
              </h2>
            </div>
            <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-2.5 py-0.5 rounded-full">
              🔒 Reserva Segura via GeckoAPI
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 text-xs">
            {/* DESTINO */}
            <div className="space-y-1.5 sm:col-span-2 lg:col-span-1">
              <label className="font-extrabold text-foreground uppercase text-[10px] flex items-center gap-1">
                <MapPin className="h-3.5 w-3.5 text-primary" /> Cidade ou Destino
              </label>
              <input
                type="text"
                value={destination}
                onChange={(e) => setDestination(e.target.value)}
                placeholder="Ex: Rio de Janeiro, Búzios, Gramado..."
                className="w-full rounded-2xl border border-border bg-background px-3.5 py-3 text-xs font-bold text-foreground outline-none focus:ring-2 focus:ring-primary/40"
              />
            </div>

            {/* CHECK-IN */}
            <div className="space-y-1.5">
              <label className="font-extrabold text-foreground uppercase text-[10px] flex items-center gap-1">
                <Calendar className="h-3.5 w-3.5 text-primary" /> Data de Check-in
              </label>
              <input
                type="date"
                value={checkIn}
                onChange={(e) => setCheckIn(e.target.value)}
                className="w-full rounded-2xl border border-border bg-background px-3.5 py-2.5 text-xs font-bold text-foreground outline-none focus:ring-2 focus:ring-primary/40"
              />
            </div>

            {/* CHECK-OUT */}
            <div className="space-y-1.5">
              <label className="font-extrabold text-foreground uppercase text-[10px] flex items-center gap-1">
                <Calendar className="h-3.5 w-3.5 text-amber-500" /> Data de Check-out
              </label>
              <input
                type="date"
                value={checkOut}
                onChange={(e) => setCheckOut(e.target.value)}
                className="w-full rounded-2xl border border-border bg-background px-3.5 py-2.5 text-xs font-bold text-foreground outline-none focus:ring-2 focus:ring-primary/40"
              />
            </div>
          </div>

          {/* CONTADORES: ADULTOS, CRIANÇAS E QUARTOS */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs pt-2 border-t border-border/60">
            <div className="space-y-1.5">
              <label className="font-extrabold text-foreground uppercase text-[10px]">Adultos</label>
              <div className="flex items-center gap-3 bg-background border border-border rounded-2xl p-1.5 justify-between">
                <button
                  onClick={() => setAdults(Math.max(1, adults - 1))}
                  className="h-8 w-8 rounded-xl bg-secondary font-bold text-foreground"
                >
                  -
                </button>
                <span className="font-black text-sm">{adults}</span>
                <button
                  onClick={() => setAdults(adults + 1)}
                  className="h-8 w-8 rounded-xl bg-secondary font-bold text-foreground"
                >
                  +
                </button>
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="font-extrabold text-foreground uppercase text-[10px]">Crianças</label>
              <div className="flex items-center gap-3 bg-background border border-border rounded-2xl p-1.5 justify-between">
                <button
                  onClick={() => setChildren(Math.max(0, children - 1))}
                  className="h-8 w-8 rounded-xl bg-secondary font-bold text-foreground"
                >
                  -
                </button>
                <span className="font-black text-sm">{children}</span>
                <button
                  onClick={() => setChildren(children + 1)}
                  className="h-8 w-8 rounded-xl bg-secondary font-bold text-foreground"
                >
                  +
                </button>
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="font-extrabold text-foreground uppercase text-[10px]">Quartos</label>
              <div className="flex items-center gap-3 bg-background border border-border rounded-2xl p-1.5 justify-between">
                <button
                  onClick={() => setRooms(Math.max(1, rooms - 1))}
                  className="h-8 w-8 rounded-xl bg-secondary font-bold text-foreground"
                >
                  -
                </button>
                <span className="font-black text-sm">{rooms}</span>
                <button
                  onClick={() => setRooms(rooms + 1)}
                  className="h-8 w-8 rounded-xl bg-secondary font-bold text-foreground"
                >
                  +
                </button>
              </div>
            </div>
          </div>

          <button
            onClick={handleSearchHotels}
            disabled={isSearching}
            className="w-full rounded-2xl bg-gradient-brand py-3.5 text-sm font-black text-white shadow-brand hover:opacity-95 transition flex items-center justify-center gap-2 active:scale-95 disabled:opacity-50"
          >
            {isSearching ? (
              <>
                <div className="h-5 w-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                <span>Buscando hospedagens na GeckoAPI...</span>
              </>
            ) : (
              <>
                <Search className="h-4 w-4" /> Pesquisar Hospedagens
              </>
            )}
          </button>
        </div>

        {/* BARRA DE FILTROS DE HOTÉIS */}
        {hasSearched && hotels.length > 0 && (
          <div className="rounded-3xl border border-border bg-card p-4 shadow-soft space-y-3">
            <div className="flex items-center justify-between border-b border-border/60 pb-2">
              <h3 className="text-xs font-black uppercase text-foreground flex items-center gap-1.5">
                <Filter className="h-4 w-4 text-primary" /> Filtros de Hospedagem
              </h3>
              <span className="text-xs font-bold text-primary">{filteredHotels.length} hotéis encontrados</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
              <div>
                <label className="text-[10px] font-bold text-muted-foreground block mb-1">
                  Preço Total Máximo: R$ {maxPrice}
                </label>
                <input
                  type="range"
                  min="300"
                  max="3000"
                  step="100"
                  value={maxPrice}
                  onChange={(e) => setMaxPrice(Number(e.target.value))}
                  className="w-full accent-primary"
                />
              </div>

              <label className="flex items-center gap-2 font-bold text-foreground cursor-pointer">
                <input
                  type="checkbox"
                  checked={onlyFreeCancellation}
                  onChange={(e) => setOnlyFreeCancellation(e.target.checked)}
                  className="rounded text-primary accent-primary h-4 w-4"
                />
                Cancelamento Grátis
              </label>

              <label className="flex items-center gap-2 font-bold text-foreground cursor-pointer">
                <input
                  type="checkbox"
                  checked={onlyBreakfast}
                  onChange={(e) => setOnlyBreakfast(e.target.checked)}
                  className="rounded text-primary accent-primary h-4 w-4"
                />
                Café da Manhã Incluso
              </label>
            </div>
          </div>
        )}

        {/* MENSAGEM QUANDO NÃO EXISTEM RESULTADOS */}
        {hasSearched && filteredHotels.length === 0 && !isSearching && (
          <div className="rounded-3xl border border-dashed border-border bg-card p-10 text-center space-y-3 animate-fadeIn">
            <Hotel className="h-12 w-12 text-muted-foreground mx-auto opacity-50" />
            <h3 className="text-base font-extrabold text-foreground">
              Nenhuma hospedagem encontrada para os filtros selecionados.
            </h3>
            <p className="text-xs text-muted-foreground max-w-sm mx-auto">
              Tente alterar as datas de check-in/check-out ou aumentar a faixa de preço para ver opções disponíveis.
            </p>
            <button
              onClick={() => {
                setMaxPrice(3000);
                setOnlyFreeCancellation(false);
                setOnlyBreakfast(false);
              }}
              className="rounded-2xl bg-secondary hover:bg-border text-foreground font-bold px-4 py-2 text-xs transition inline-flex items-center gap-1.5"
            >
              Limpar Filtros
            </button>
          </div>
        )}

        {/* LISTA DE HOTÉIS (CARDS) */}
        {filteredHotels.length > 0 && (
          <div className="grid gap-4 animate-fadeIn">
            {filteredHotels.map((hotel) => (
              <div
                key={hotel.id}
                className="rounded-3xl border border-border bg-card shadow-soft hover:shadow-elevated transition overflow-hidden flex flex-col sm:flex-row group"
              >
                {/* FOTO PRINCIPAL */}
                <div className="sm:w-64 h-48 sm:h-auto relative overflow-hidden shrink-0">
                  <img
                    src={hotel.mainImage}
                    alt={hotel.name}
                    className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                  <div className="absolute top-3 left-3 bg-black/60 backdrop-blur-md px-2.5 py-1 rounded-full text-white text-[10px] font-bold flex items-center gap-1">
                    <Star className="h-3 w-3 fill-amber-400 text-amber-400" />
                    <span>{hotel.rating.toFixed(1)}</span>
                    <span className="opacity-75">({hotel.reviewsCount})</span>
                  </div>
                </div>

                {/* DETALHES DO CARD */}
                <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
                  <div className="space-y-1.5">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <h3 className="font-black text-base text-foreground leading-tight">{hotel.name}</h3>
                        <p className="text-xs text-muted-foreground font-medium flex items-center gap-1 mt-0.5">
                          <MapPin className="h-3.5 w-3.5 text-primary" /> {hotel.address}
                        </p>
                      </div>
                    </div>

                    <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed pt-1">
                      {hotel.description}
                    </p>

                    <div className="flex flex-wrap gap-1.5 pt-2">
                      {hotel.freeCancellation && (
                        <span className="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 px-2.5 py-0.5 rounded-full text-[10px] font-bold flex items-center gap-1">
                          <CheckCircle2 className="h-3 w-3" /> Cancelamento grátis
                        </span>
                      )}

                      {hotel.breakfastIncluded && (
                        <span className="bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20 px-2.5 py-0.5 rounded-full text-[10px] font-bold flex items-center gap-1">
                          <Coffee className="h-3 w-3" /> Café da manhã incluso
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-border/60">
                    <div>
                      <span className="text-[10px] text-muted-foreground font-bold block">Diária a partir de</span>
                      <div className="text-xl font-black text-emerald-600 dark:text-emerald-400">
                        R$ {hotel.pricePerNight.toFixed(2)}
                      </div>
                      <span className="text-[10px] text-slate-400">Total: R$ {hotel.totalPrice.toFixed(2)}</span>
                    </div>

                    <button
                      onClick={() => {
                        setSelectedHotel(hotel);
                        setSelectedRoom(hotel.rooms[0] || null);
                      }}
                      className="rounded-2xl bg-gradient-brand px-5 py-2.5 text-xs font-black text-white shadow-brand hover:opacity-95 transition flex items-center gap-1.5"
                    >
                      Ver Detalhes <ChevronRight className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* MODAL DE DETALHES DO HOTEL */}
      {selectedHotel && !showBookingModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm overflow-y-auto"
          onClick={() => setSelectedHotel(null)}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-2xl bg-card rounded-3xl p-6 shadow-elevated border border-border space-y-5 my-8"
          >
            <div className="flex items-center justify-between border-b border-border pb-3">
              <div>
                <h3 className="font-black text-lg text-foreground flex items-center gap-2">
                  <Building className="h-5 w-5 text-primary" /> {selectedHotel.name}
                </h3>
                <p className="text-xs text-muted-foreground flex items-center gap-1">
                  <MapPin className="h-3.5 w-3.5 text-primary" /> {selectedHotel.address}
                </p>
              </div>

              <button onClick={() => setSelectedHotel(null)} className="text-muted-foreground hover:text-foreground">
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* GALERIA DE FOTOS */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 rounded-2xl overflow-hidden h-52">
              <img src={selectedHotel.mainImage} className="h-full w-full object-cover sm:col-span-2" />
              {selectedHotel.images[1] && (
                <img src={selectedHotel.images[1]} className="h-full w-full object-cover hidden sm:block" />
              )}
            </div>

            {/* DESCRIÇÃO & SERVIÇOS */}
            <div className="space-y-2 text-xs">
              <h4 className="font-extrabold text-foreground uppercase text-[10px]">Sobre a Hospedagem</h4>
              <p className="text-muted-foreground leading-relaxed">{selectedHotel.description}</p>

              <div className="flex flex-wrap gap-1.5 pt-2">
                {selectedHotel.amenities.map((a, i) => (
                  <span key={i} className="bg-secondary px-3 py-1 rounded-xl text-xs font-bold text-foreground">
                    {a}
                  </span>
                ))}
              </div>
            </div>

            {/* QUARTOS DISPONÍVEIS */}
            <div className="space-y-3 pt-2 border-t border-border">
              <h4 className="font-extrabold text-foreground uppercase text-[10px] flex items-center gap-1.5">
                <Bed className="h-4 w-4 text-primary" /> Quartos Disponíveis
              </h4>

              <div className="space-y-2.5">
                {selectedHotel.rooms.map((room) => (
                  <div
                    key={room.id}
                    onClick={() => setSelectedRoom(room)}
                    className={`p-4 rounded-2xl border transition cursor-pointer flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 ${
                      selectedRoom?.id === room.id
                        ? "border-primary bg-primary/5 shadow-sm"
                        : "border-border bg-background hover:border-primary/40"
                    }`}
                  >
                    <div>
                      <h5 className="font-black text-sm text-foreground">{room.name}</h5>
                      <p className="text-xs text-muted-foreground">{room.bedType} · Ataxia para {room.maxOccupancy} hóspedes</p>
                    </div>

                    <div className="text-right w-full sm:w-auto">
                      <span className="text-base font-black text-emerald-600 dark:text-emerald-400 block">
                        R$ {room.totalPrice.toFixed(2)}
                      </span>
                      <span className="text-[10px] text-muted-foreground">Total da estadia</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* POLÍTICA DE CANCELAMENTO */}
            <div className="bg-secondary/60 p-3.5 rounded-2xl text-xs text-muted-foreground space-y-1">
              <strong className="text-foreground flex items-center gap-1">
                <ShieldCheck className="h-4 w-4 text-emerald-500" /> Política de Cancelamento
              </strong>
              <p>{selectedHotel.cancellationPolicy}</p>
            </div>

            <button
              onClick={() => setShowBookingModal(true)}
              className="w-full rounded-2xl bg-gradient-brand py-3.5 text-xs font-black text-white shadow-brand hover:opacity-95 transition flex items-center justify-center gap-2"
            >
              Reservar Agora por R$ {selectedRoom?.totalPrice.toFixed(2)} <ArrowRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}

      {/* MODAL DE FINALIZAÇÃO DE RESERVA */}
      {showBookingModal && selectedHotel && selectedRoom && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4 backdrop-blur-sm"
          onClick={() => setShowBookingModal(false)}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-md bg-card rounded-3xl p-6 shadow-elevated border border-border space-y-5"
          >
            <div className="flex items-center justify-between border-b border-border pb-3">
              <h3 className="font-black text-sm text-foreground flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-primary" /> Confirmar Reserva de Hotel
              </h3>
              <button onClick={() => setShowBookingModal(false)} className="text-muted-foreground hover:text-foreground">
                <X className="h-5 w-5" />
              </button>
            </div>

            {!completedVoucher ? (
              <form onSubmit={handleConfirmBooking} className="space-y-4 text-xs">
                <div className="bg-secondary/60 p-3.5 rounded-2xl space-y-1">
                  <h4 className="font-black text-foreground">{selectedHotel.name}</h4>
                  <p className="text-muted-foreground">{selectedRoom.name}</p>
                  <p className="text-muted-foreground">
                    📅 Check-in: {checkIn} ➔ Check-out: {checkOut}
                  </p>
                  <div className="text-right pt-1 font-black text-sm text-emerald-600 dark:text-emerald-400">
                    Total: R$ {selectedRoom.totalPrice.toFixed(2)}
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="font-extrabold text-foreground uppercase text-[10px]">
                    Nome Completo do Hóspede Principal
                  </label>
                  <input
                    type="text"
                    required
                    value={guestName}
                    onChange={(e) => setGuestName(e.target.value)}
                    placeholder="Nome completo conforme documento"
                    className="w-full rounded-2xl border border-border bg-background px-3.5 py-2.5 font-bold text-foreground outline-none"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="font-extrabold text-foreground uppercase text-[10px]">
                    E-mail para Envio do Voucher
                  </label>
                  <input
                    type="email"
                    required
                    value={guestEmail}
                    onChange={(e) => setGuestEmail(e.target.value)}
                    placeholder="seu.email@exemplo.com"
                    className="w-full rounded-2xl border border-border bg-background px-3.5 py-2.5 font-bold text-foreground outline-none"
                  />
                </div>

                <button
                  type="submit"
                  disabled={isSubmittingBooking}
                  className="w-full rounded-2xl bg-gradient-brand py-3.5 text-xs font-black text-white shadow-brand hover:opacity-95 transition flex items-center justify-center gap-2"
                >
                  {isSubmittingBooking ? (
                    <>
                      <div className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      <span>Processando reserva na GeckoAPI...</span>
                    </>
                  ) : (
                    <>Confirmar & Emitir Reserva</>
                  )}
                </button>
              </form>
            ) : (
              /* VOUCHER DE CONFIRMAÇÃO */
              <div className="space-y-4 text-center text-xs animate-fadeIn">
                <div className="grid h-14 w-14 place-items-center rounded-full bg-emerald-500/20 text-emerald-500 mx-auto border border-emerald-500/30">
                  <CheckCircle2 className="h-8 w-8" />
                </div>

                <div>
                  <h4 className="font-black text-base text-foreground">Reserva Confirmada!</h4>
                  <p className="text-muted-foreground text-xs">
                    Código Localizador: <strong className="text-primary font-mono">{completedVoucher.bookingCode}</strong>
                  </p>
                </div>

                <div className="bg-background p-4 rounded-2xl border border-border space-y-2">
                  <img src={completedVoucher.voucherQrCode} alt="QR Code Voucher" className="h-36 w-36 mx-auto rounded-xl border" />
                  <p className="text-[10px] text-muted-foreground">Apresente este QR Code na recepção do hotel</p>
                </div>

                <button
                  onClick={() => {
                    setShowBookingModal(false);
                    setSelectedHotel(null);
                    setCompletedVoucher(null);
                    navigate({ to: "/minhas-viagens" });
                  }}
                  className="w-full rounded-2xl bg-gradient-brand py-3 text-xs font-black text-white shadow-brand"
                >
                  Ver em Minhas Viagens 🧳
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </AppShell>
  );
}
