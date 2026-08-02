import { useState, useEffect } from "react";
import {
  X,
  Check,
  ArrowRight,
  ArrowLeft,
  Sparkles,
  Image as ImageIcon,
  MapPin,
  DollarSign,
  Users,
  Clock,
  Hotel,
  UtensilsCrossed,
  Compass,
  Calendar,
  Ticket,
  ShoppingBag,
  Car,
  Map,
  Plus,
  Trash2,
  HelpCircle,
  Star,
  Globe,
  Share2,
  ShieldCheck,
  Award,
  Info,
  CheckSquare,
  Accessibility,
} from "lucide-react";
import { getStoredPartners } from "@/lib/partners";
import PartnerMapPicker from "./PartnerMapPicker";
import { toast } from "sonner";
import type { ListingCategory, Listing } from "@/lib/listings";

type Props = {
  isOpen: boolean;
  onClose: () => void;
  initialCategory?: ListingCategory;
  initialData?: any;
  onSave: (data: any) => void;
};

export function CategoryListingWizardModal({
  isOpen,
  onClose,
  initialCategory = "hospedagem",
  initialData,
  onSave,
}: Props) {
  const partners = getStoredPartners();
  const [category, setCategory] = useState<ListingCategory>(initialCategory);

  // Tab State for Category Wizards
  const [activeTab, setActiveTab] = useState<string>("basic");

  // Form State
  const [formData, setFormData] = useState<any>({
    title: "",
    description: "",
    full_description: "",
    city: "Gramado",
    state: "RS",
    address: "",
    zip_code: "",
    lat: -29.3746,
    lng: -50.8764,
    phone: "",
    whatsapp: "",
    email: "",
    website: "",
    instagram: "",
    facebook: "",
    checkin_time: "14:00",
    checkout_time: "12:00",
    cancellation_policy: "Cancelamento grátis até 7 dias antes do check-in.",
    languages: ["Português", "Inglês"],
    pet_friendly: true,
    accessibility: true,
    parking: true,
    wifi: true,
    pool: false,
    gym: false,
    spa: false,
    breakfast: true,
    rooms_count: 10,
    beds_count: 15,
    max_capacity: 4,
    star_rating: 5,
    tags: ["Luxo", "Família", "Romântico"],
    image_url:
      "https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=800&q=80",
    gallery_images: [
      "https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?auto=format&fit=crop&w=800&q=80",
      "https://images.unsplash.com/photo-1540555700478-4be289fbecef?auto=format&fit=crop&w=800&q=80",
    ],
    video_url: "",
    tour_360_url: "",
    includes: [
      "Café da Manhã Colonial completo",
      "Wi-Fi de Alta Velocidade",
      "Estacionamento Coberto",
    ],
    excludes: ["Bebidas alcoólicas do minibar", "Serviço de lavanderia"],
    important_info: "Apresentar documento com foto no check-in. Taxa de turismo inclusa.",
    faqs: [
      {
        q: "Possui recepção 24 horas?",
        a: "Sim, nossa equipe está pronta para atendê-lo 24 horas por dia.",
      },
      {
        q: "Aceita animais de estimação?",
        a: "Sim, aceitamos pets de pequeno porte mediante aviso prévio.",
      },
    ],
    seo_title: "",
    seo_slug: "",
    seo_description: "",
    seo_keywords: "",
    status: "approved",
    active: true,
    featured: true,
    display_order: 1,
    partner_id: partners[0]?.id || "",
    store_price: 350,
    traveler_price: 290,
    premium_price: 245,
    // Passeios
    duration_text: "4 horas",
    difficulty_level: "Fácil",
    min_age: 5,
    what_to_bring: ["Roupas confortáveis", "Protetor solar", "Câmera fotográfica"],
    meeting_point: "Recepção do hotel ou Ponto de Encontro Central",
    guide_included: true,
    insurance_included: true,
    equipment_included: "Capacete e equipamento de segurança homologado",
    tour_type: "Natureza & Aventura",
    // Restaurantes
    cuisine_type: "Cozinha Colonial Italiana",
    price_range: "$$$",
    delivery_available: true,
    reservations_accepted: true,
    specialties: "Galeto ao Primo Canto, Polenta Frita e Massas Artesanais",
    menu_url: "",
    kids_area: true,
    chef_name: "Chef Giovanni Rossi",
    // Eventos
    event_start_date: "2026-11-15",
    event_end_date: "2026-11-20",
    event_start_time: "19:30",
    event_end_time: "23:00",
    ticket_batches: [
      { name: "1º Lote Promocional", price: 120, quantity: 100 },
      { name: "2º Lote VIP", price: 200, quantity: 50 },
    ],
    organizer_name: "Produções Bora Pass Festivais",
    rating_recommendation: "Livre para todos os públicos",
    // Cupons Independentes
    coupon_code: "BORAPASS20",
    coupon_code_type: "manual",
    coupon_discount_type: "percent",
    coupon_discount_value: 20,
    coupon_min_purchase: 100,
    coupon_max_discount: 50,
    coupon_valid_days: ["Segunda", "Terça", "Quarta", "Quinta", "Sexta"],
    coupon_usage_limit_per_user: 1,
    coupon_total_limit: 500,
    coupon_used_count: 42,
    coupon_banner_url: "",
    coupon_custom_color: "#3b82f6",
    coupon_terms: "Válido apenas para compras efetuadas no aplicativo Bora Pass.",
    ...initialData,
  });

  useEffect(() => {
    if (initialData) {
      setFormData((prev: any) => ({ ...prev, ...initialData }));
    }
  }, [initialData]);

  if (!isOpen) return null;

  // New item generator for arrays
  const addArrayItem = (key: string, defaultVal: any) => {
    setFormData((prev: any) => ({
      ...prev,
      [key]: [...(prev[key] || []), defaultVal],
    }));
  };

  const removeArrayItem = (key: string, index: number) => {
    setFormData((prev: any) => ({
      ...prev,
      [key]: (prev[key] || []).filter((_: any, i: number) => i !== index),
    }));
  };

  const updateArrayItem = (key: string, index: number, val: any) => {
    setFormData((prev: any) => {
      const arr = [...(prev[key] || [])];
      arr[index] = val;
      return { ...prev, [key]: arr };
    });
  };

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!formData.title.trim()) {
      toast.error("O título do anúncio é obrigatório!");
      return;
    }

    const partner = partners.find((p) => p.id === formData.partner_id);

    const saved = {
      ...formData,
      category,
      partner_name: partner?.store_name || partner?.owner_name || "Parceiro Bora Pass",
      partner_phone: partner?.phone || formData.phone || "(54) 99999-8888",
    };

    onSave(saved);
    toast.success(`Anúncio de ${category.toUpperCase()} salvo com sucesso no CMS! 🌟`);
    onClose();
  }

  const isEditing = Boolean(initialData && (initialData.id || initialData.title));

  const ALL_CATEGORIES = [
    { id: "hospedagem", label: "🏨 Hospedagens" },
    { id: "passeio", label: "🧭 Passeios" },
    { id: "restaurante", label: "🍽️ Restaurantes" },
    { id: "evento", label: "🎉 Eventos" },
    { id: "cupom", label: "🎟️ Cupons Independentes" },
    { id: "compras", label: "🛍️ Compras & Empórios" },
    { id: "transporte", label: "🚗 Transporte & Traslados" },
    { id: "roteiros", label: "🗺️ Roteiros Guiados" },
  ] as const;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-md p-4 animate-fadeIn">
      <div className="w-full max-w-5xl max-h-[92vh] overflow-hidden rounded-3xl bg-slate-900 border border-slate-800 shadow-2xl flex flex-col">
        {/* TOP HEADER */}
        <div className="flex items-center justify-between border-b border-slate-800 bg-slate-950 p-5 shrink-0">
          <div className="flex items-center gap-3">
            <div className="grid h-11 w-11 place-items-center rounded-2xl bg-gradient-brand text-white shadow-brand font-bold text-xl">
              {category === "hospedagem" && <Hotel className="h-6 w-6" />}
              {category === "passeio" && <Compass className="h-6 w-6" />}
              {category === "restaurante" && <UtensilsCrossed className="h-6 w-6" />}
              {category === "evento" && <Calendar className="h-6 w-6" />}
              {category === "cupom" && <Ticket className="h-6 w-6" />}
              {category === "compras" && <ShoppingBag className="h-6 w-6" />}
              {category === "transporte" && <Car className="h-6 w-6" />}
              {category === "roteiros" && <Map className="h-6 w-6" />}
            </div>
            <div>
              <h2 className="text-base font-extrabold text-white flex items-center gap-2">
                CMS Profissional de Turismo —{" "}
                {isEditing
                  ? `Edição de ${category.toUpperCase()}`
                  : `Cadastro de ${category.toUpperCase()}`}
                <span className="text-[10px] bg-amber-500/20 text-amber-300 border border-amber-500/30 px-2 py-0.5 rounded-full font-mono uppercase">
                  {isEditing ? "✏️ Modo Edição" : "✨ Novo Anúncio"}
                </span>
              </h2>
              <p className="text-xs text-slate-400">
                {isEditing
                  ? `Editando anúncio cadastrado: "${formData.title || "Sem título"}"`
                  : "Formulário 100% nativo com abas e informações ricas para exibição ao usuário"}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="rounded-full p-2 text-slate-400 hover:bg-slate-800 hover:text-white"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* CATEGORY SELECTOR BAR */}
        <div className="border-b border-slate-800 bg-slate-950/60 p-3 shrink-0 flex flex-wrap gap-1.5 items-center overflow-x-auto scrollbar-hide">
          {isEditing ? (
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-slate-400">Categoria do Anúncio:</span>
              <span className="px-3.5 py-1.5 rounded-xl text-xs font-black bg-sky-600 text-white shadow-brand flex items-center gap-1.5">
                {ALL_CATEGORIES.find((c) => c.id === category)?.label || category}
                <span className="text-[10px] bg-sky-950/60 px-2 py-0.5 rounded-full border border-sky-400/30">
                  Somente Esta Categoria
                </span>
              </span>
            </div>
          ) : (
            ALL_CATEGORIES.map((cat) => (
              <button
                key={cat.id}
                type="button"
                onClick={() => {
                  setCategory(cat.id as any);
                  setActiveTab("basic");
                }}
                className={`px-3 py-1.5 rounded-xl text-xs font-extrabold transition flex items-center gap-1.5 ${
                  category === cat.id
                    ? "bg-sky-600 text-white shadow-brand"
                    : "bg-slate-900 text-slate-400 hover:text-slate-200 border border-slate-800"
                }`}
              >
                {cat.label}
              </button>
            ))
          )}
        </div>

        {/* TAB NAVIGATION FOR SELECTED CATEGORY */}
        <div className="border-b border-slate-800 bg-slate-900 px-4 py-2 shrink-0 flex gap-2 overflow-x-auto scrollbar-hide text-xs font-bold">
          {category === "hospedagem" && (
            <>
              <TabBtn id="basic" label="1. Básico" active={activeTab} onClick={setActiveTab} />
              <TabBtn
                id="media"
                label="2. Fotos & Vídeos"
                active={activeTab}
                onClick={setActiveTab}
              />
              <TabBtn id="perks" label="3. Benefícios" active={activeTab} onClick={setActiveTab} />
              <TabBtn
                id="includes"
                label="4. O que inclui"
                active={activeTab}
                onClick={setActiveTab}
              />
              <TabBtn
                id="excludes"
                label="5. O que NÃO inclui"
                active={activeTab}
                onClick={setActiveTab}
              />
              <TabBtn
                id="info"
                label="6. Informações Importantes"
                active={activeTab}
                onClick={setActiveTab}
              />
              <TabBtn id="faq" label="7. FAQ (Dúvidas)" active={activeTab} onClick={setActiveTab} />
              <TabBtn
                id="publish"
                label="8. Preço & Publicação"
                active={activeTab}
                onClick={setActiveTab}
              />
            </>
          )}

          {category === "passeio" && (
            <>
              <TabBtn
                id="basic"
                label="1. Dados do Passeio"
                active={activeTab}
                onClick={setActiveTab}
              />
              <TabBtn
                id="requirements"
                label="2. Requisitos & O que levar"
                active={activeTab}
                onClick={setActiveTab}
              />
              <TabBtn
                id="includes"
                label="3. Inclusões & Exclusões"
                active={activeTab}
                onClick={setActiveTab}
              />
              <TabBtn
                id="media"
                label="4. Fotos & Mídia"
                active={activeTab}
                onClick={setActiveTab}
              />
              <TabBtn id="faq" label="5. FAQ" active={activeTab} onClick={setActiveTab} />
              <TabBtn
                id="publish"
                label="6. Preços & Publicação"
                active={activeTab}
                onClick={setActiveTab}
              />
            </>
          )}

          {category === "restaurante" && (
            <>
              <TabBtn
                id="basic"
                label="1. Gastronomia & Cozinha"
                active={activeTab}
                onClick={setActiveTab}
              />
              <TabBtn
                id="amenities"
                label="2. Serviços & Estrutura"
                active={activeTab}
                onClick={setActiveTab}
              />
              <TabBtn
                id="media"
                label="3. Fotos & Cardápio"
                active={activeTab}
                onClick={setActiveTab}
              />
              <TabBtn
                id="publish"
                label="4. Preços & Publicação"
                active={activeTab}
                onClick={setActiveTab}
              />
            </>
          )}

          {category === "evento" && (
            <>
              <TabBtn
                id="basic"
                label="1. Dados do Evento"
                active={activeTab}
                onClick={setActiveTab}
              />
              <TabBtn
                id="tickets"
                label="2. Ingressos & Lotes"
                active={activeTab}
                onClick={setActiveTab}
              />
              <TabBtn
                id="media"
                label="3. Fotos & Mapa"
                active={activeTab}
                onClick={setActiveTab}
              />
              <TabBtn
                id="publish"
                label="4. Publicação"
                active={activeTab}
                onClick={setActiveTab}
              />
            </>
          )}

          {category === "cupom" && (
            <>
              <TabBtn
                id="basic"
                label="1. Dados do Cupom"
                active={activeTab}
                onClick={setActiveTab}
              />
              <TabBtn
                id="rules"
                label="2. Regras & Validade"
                active={activeTab}
                onClick={setActiveTab}
              />
              <TabBtn
                id="design"
                label="3. Personalização Visual"
                active={activeTab}
                onClick={setActiveTab}
              />
              <TabBtn
                id="publish"
                label="4. Publicação"
                active={activeTab}
                onClick={setActiveTab}
              />
            </>
          )}

          {["compras", "transporte", "roteiros"].includes(category) && (
            <>
              <TabBtn
                id="basic"
                label="1. Informações Básicas"
                active={activeTab}
                onClick={setActiveTab}
              />
              <TabBtn
                id="includes"
                label="2. Detalhes & Inclusões"
                active={activeTab}
                onClick={setActiveTab}
              />
              <TabBtn id="media" label="3. Mídia" active={activeTab} onClick={setActiveTab} />
              <TabBtn
                id="publish"
                label="4. Preço & Publicação"
                active={activeTab}
                onClick={setActiveTab}
              />
            </>
          )}
        </div>

        {/* FORM BODY */}
        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto flex-1 space-y-6 text-xs">
          {/* ABA: BÁSICO */}
          {activeTab === "basic" && (
            <div className="space-y-4 animate-fadeIn">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="sm:col-span-2">
                  <label className="font-bold text-slate-200 block mb-1">Título do Anúncio *</label>
                  <input
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    placeholder="Ex: Suíte Presidencial com Hidro Vista para a Serra"
                    className="w-full rounded-xl bg-slate-950 border border-slate-800 px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-sky-500 font-bold"
                  />
                </div>

                <div>
                  <label className="font-bold text-slate-200 block mb-1">Cidade</label>
                  <input
                    value={formData.city}
                    onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                    className="w-full rounded-xl bg-slate-950 border border-slate-800 px-3.5 py-2 text-xs text-white"
                  />
                </div>

                <div>
                  <label className="font-bold text-slate-200 block mb-1">Estado</label>
                  <input
                    value={formData.state}
                    onChange={(e) => setFormData({ ...formData, state: e.target.value })}
                    className="w-full rounded-xl bg-slate-950 border border-slate-800 px-3.5 py-2 text-xs text-white"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="font-bold text-slate-200 block mb-1">
                    Endereço Completo & CEP
                  </label>
                  <input
                    value={formData.address}
                    onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                    placeholder="Av. Borges de Medeiros, 2100 - Centro"
                    className="w-full rounded-xl bg-slate-950 border border-slate-800 px-3.5 py-2 text-xs text-white"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="font-bold text-slate-200 block mb-1">
                    Descrição Curta (Resumo)
                  </label>
                  <input
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    placeholder="Uma frase marcante sobre o anúncio..."
                    className="w-full rounded-xl bg-slate-950 border border-slate-800 px-3.5 py-2 text-xs text-white"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="font-bold text-slate-200 block mb-1">Descrição Completa</label>
                  <textarea
                    rows={4}
                    value={formData.full_description}
                    onChange={(e) => setFormData({ ...formData, full_description: e.target.value })}
                    placeholder="Descreva detalhadamente a experiência, comodidades e destaques..."
                    className="w-full rounded-xl bg-slate-950 border border-slate-800 px-3.5 py-2 text-xs text-white font-mono"
                  />
                </div>

                {/* Campos Específicos por Categoria */}
                {category === "hospedagem" && (
                  <>
                    <div className="sm:col-span-2">
                      <label className="font-bold text-sky-400 block mb-1">
                        Qual o tipo de acomodação: *
                      </label>
                      <select
                        value={formData.accommodation_type || "Casa Inteira"}
                        onChange={(e) =>
                          setFormData({ ...formData, accommodation_type: e.target.value })
                        }
                        className="w-full rounded-xl bg-slate-950 border border-sky-500/40 px-3.5 py-2.5 text-xs text-white font-bold focus:outline-none focus:border-sky-500"
                      >
                        <option value="Casa Inteira">🏡 Casa Inteira</option>
                        <option value="Apartamento Inteiro">🏢 Apartamento Inteiro</option>
                        <option value="Flat">🛋️ Flat</option>
                        <option value="Loft">🏰 Loft</option>
                        <option value="Quarto Compartilhado">🛏️ Quarto Compartilhado</option>
                        <option value="Quarto com Ambientes Compartilhados">
                          🤝 Quarto com Ambientes Compartilhados
                        </option>
                      </select>
                    </div>

                    <div>
                      <label className="font-bold text-slate-200 block mb-1">
                        Horário Check-in
                      </label>
                      <input
                        value={formData.checkin_time}
                        onChange={(e) => setFormData({ ...formData, checkin_time: e.target.value })}
                        className="w-full rounded-xl bg-slate-950 border border-slate-800 px-3 py-2 text-white"
                      />
                    </div>
                    <div>
                      <label className="font-bold text-slate-200 block mb-1">
                        Horário Check-out
                      </label>
                      <input
                        value={formData.checkout_time}
                        onChange={(e) =>
                          setFormData({ ...formData, checkout_time: e.target.value })
                        }
                        className="w-full rounded-xl bg-slate-950 border border-slate-800 px-3 py-2 text-white"
                      />
                    </div>
                    <div>
                      <label className="font-bold text-slate-200 block mb-1">Qtd. Quartos</label>
                      <input
                        type="number"
                        value={formData.rooms_count}
                        onChange={(e) =>
                          setFormData({ ...formData, rooms_count: Number(e.target.value) })
                        }
                        className="w-full rounded-xl bg-slate-950 border border-slate-800 px-3 py-2 text-white"
                      />
                    </div>
                    <div>
                      <label className="font-bold text-slate-200 block mb-1">
                        Capacidade Máxima de Hóspedes
                      </label>
                      <input
                        type="number"
                        value={formData.max_capacity}
                        onChange={(e) =>
                          setFormData({ ...formData, max_capacity: Number(e.target.value) })
                        }
                        className="w-full rounded-xl bg-slate-950 border border-slate-800 px-3 py-2 text-white"
                      />
                    </div>
                  </>
                )}

                {category === "passeio" && (
                  <>
                    <div>
                      <label className="font-bold text-slate-200 block mb-1">
                        Duração do Passeio
                      </label>
                      <input
                        value={formData.duration_text}
                        onChange={(e) =>
                          setFormData({ ...formData, duration_text: e.target.value })
                        }
                        placeholder="Ex: 4 horas"
                        className="w-full rounded-xl bg-slate-950 border border-slate-800 px-3 py-2 text-white"
                      />
                    </div>
                    <div>
                      <label className="font-bold text-slate-200 block mb-1">
                        Nível de Dificuldade
                      </label>
                      <select
                        value={formData.difficulty_level}
                        onChange={(e) =>
                          setFormData({ ...formData, difficulty_level: e.target.value })
                        }
                        className="w-full rounded-xl bg-slate-950 border border-slate-800 px-3 py-2 text-white"
                      >
                        <option value="Fácil">Fácil</option>
                        <option value="Médio">Médio</option>
                        <option value="Difícil">Difícil</option>
                        <option value="Extremo">Extremo</option>
                      </select>
                    </div>
                    <div>
                      <label className="font-bold text-slate-200 block mb-1">Idade Mínima</label>
                      <input
                        type="number"
                        value={formData.min_age}
                        onChange={(e) =>
                          setFormData({ ...formData, min_age: Number(e.target.value) })
                        }
                        className="w-full rounded-xl bg-slate-950 border border-slate-800 px-3 py-2 text-white"
                      />
                    </div>
                    <div>
                      <label className="font-bold text-slate-200 block mb-1">
                        Categoria de Passeio
                      </label>
                      <input
                        value={formData.tour_type}
                        onChange={(e) => setFormData({ ...formData, tour_type: e.target.value })}
                        placeholder="Natureza, Aventura, Família, Romântico"
                        className="w-full rounded-xl bg-slate-950 border border-slate-800 px-3 py-2 text-white"
                      />
                    </div>
                  </>
                )}

                {category === "restaurante" && (
                  <>
                    <div>
                      <label className="font-bold text-slate-200 block mb-1">Tipo de Cozinha</label>
                      <input
                        value={formData.cuisine_type}
                        onChange={(e) => setFormData({ ...formData, cuisine_type: e.target.value })}
                        placeholder="Italiana, Frutos do Mar, Colonial"
                        className="w-full rounded-xl bg-slate-950 border border-slate-800 px-3 py-2 text-white"
                      />
                    </div>
                    <div>
                      <label className="font-bold text-slate-200 block mb-1">Faixa de Preço</label>
                      <select
                        value={formData.price_range}
                        onChange={(e) => setFormData({ ...formData, price_range: e.target.value })}
                        className="w-full rounded-xl bg-slate-950 border border-slate-800 px-3 py-2 text-white"
                      >
                        <option value="$">$ (Econômico)</option>
                        <option value="$$">$$ (Moderado)</option>
                        <option value="$$$">$$$ (Sofisticado)</option>
                        <option value="$$$$">$$$$ (Gourmet / Luxo)</option>
                      </select>
                    </div>
                    <div>
                      <label className="font-bold text-slate-200 block mb-1">Nome do Chef</label>
                      <input
                        value={formData.chef_name}
                        onChange={(e) => setFormData({ ...formData, chef_name: e.target.value })}
                        placeholder="Chef Giovanni Rossi"
                        className="w-full rounded-xl bg-slate-950 border border-slate-800 px-3 py-2 text-white"
                      />
                    </div>
                    <div>
                      <label className="font-bold text-slate-200 block mb-1">
                        Especialidade da Casa
                      </label>
                      <input
                        value={formData.specialties}
                        onChange={(e) => setFormData({ ...formData, specialties: e.target.value })}
                        placeholder="Galeto ao Primo Canto"
                        className="w-full rounded-xl bg-slate-950 border border-slate-800 px-3 py-2 text-white"
                      />
                    </div>
                  </>
                )}

                {category === "evento" && (
                  <>
                    <div>
                      <label className="font-bold text-slate-200 block mb-1">Data Inicial</label>
                      <input
                        type="date"
                        value={formData.event_start_date}
                        onChange={(e) =>
                          setFormData({ ...formData, event_start_date: e.target.value })
                        }
                        className="w-full rounded-xl bg-slate-950 border border-slate-800 px-3 py-2 text-white"
                      />
                    </div>
                    <div>
                      <label className="font-bold text-slate-200 block mb-1">Data Final</label>
                      <input
                        type="date"
                        value={formData.event_end_date}
                        onChange={(e) =>
                          setFormData({ ...formData, event_end_date: e.target.value })
                        }
                        className="w-full rounded-xl bg-slate-950 border border-slate-800 px-3 py-2 text-white"
                      />
                    </div>
                    <div>
                      <label className="font-bold text-slate-200 block mb-1">
                        Horário de Início
                      </label>
                      <input
                        type="time"
                        value={formData.event_start_time}
                        onChange={(e) =>
                          setFormData({ ...formData, event_start_time: e.target.value })
                        }
                        className="w-full rounded-xl bg-slate-950 border border-slate-800 px-3 py-2 text-white"
                      />
                    </div>
                    <div>
                      <label className="font-bold text-slate-200 block mb-1">
                        Organizador do Evento
                      </label>
                      <input
                        value={formData.organizer_name}
                        onChange={(e) =>
                          setFormData({ ...formData, organizer_name: e.target.value })
                        }
                        className="w-full rounded-xl bg-slate-950 border border-slate-800 px-3 py-2 text-white"
                      />
                    </div>
                  </>
                )}

                {category === "cupom" && (
                  <>
                    <div>
                      <label className="font-bold text-slate-200 block mb-1">
                        Código do Cupom *
                      </label>
                      <input
                        value={formData.coupon_code}
                        onChange={(e) =>
                          setFormData({ ...formData, coupon_code: e.target.value.toUpperCase() })
                        }
                        placeholder="Ex: BORAPASS20"
                        className="w-full rounded-xl bg-slate-950 border border-slate-800 px-3 py-2 text-white font-mono font-bold"
                      />
                    </div>
                    <div>
                      <label className="font-bold text-slate-200 block mb-1">
                        Tipo de Desconto
                      </label>
                      <select
                        value={formData.coupon_discount_type}
                        onChange={(e) =>
                          setFormData({ ...formData, coupon_discount_type: e.target.value as any })
                        }
                        className="w-full rounded-xl bg-slate-950 border border-slate-800 px-3 py-2 text-white font-bold"
                      >
                        <option value="percent">Percentual (%)</option>
                        <option value="fixed">Valor Fixo (R$)</option>
                        <option value="free_shipping">Frete Grátis</option>
                        <option value="cashback">Cashback</option>
                        <option value="gift">Brinde Especial</option>
                      </select>
                    </div>
                    <div>
                      <label className="font-bold text-slate-200 block mb-1">
                        Valor do Desconto
                      </label>
                      <input
                        type="number"
                        value={formData.coupon_discount_value}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            coupon_discount_value: Number(e.target.value),
                          })
                        }
                        className="w-full rounded-xl bg-slate-950 border border-slate-800 px-3 py-2 text-white font-bold"
                      />
                    </div>
                    <div>
                      <label className="font-bold text-slate-200 block mb-1">
                        Compra Mínima (R$)
                      </label>
                      <input
                        type="number"
                        value={formData.coupon_min_purchase}
                        onChange={(e) =>
                          setFormData({ ...formData, coupon_min_purchase: Number(e.target.value) })
                        }
                        className="w-full rounded-xl bg-slate-950 border border-slate-800 px-3 py-2 text-white"
                      />
                    </div>
                  </>
                )}
                {/* ♿ ACESSIBILIDADE, INCLUSÃO & IDIOMAS DE ATENDIMENTO */}
                <div className="sm:col-span-2 pt-4 border-t border-slate-800 space-y-4">
                  <div className="flex items-center gap-2">
                    <Accessibility className="h-5 w-5 text-sky-400" />
                    <div>
                      <h4 className="font-extrabold text-white text-sm">
                        Acessibilidade, Inclusão & Idiomas de Atendimento
                      </h4>
                      <p className="text-xs text-slate-400">
                        Informe as condições de acessibilidade PCD, suporte em Libras e idiomas
                        falados no atendimento.
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 bg-slate-950 p-4 rounded-2xl border border-slate-800">
                    <label className="flex items-center gap-2.5 cursor-pointer font-bold text-slate-200 bg-slate-900/60 p-3 rounded-xl border border-slate-800/80 hover:border-sky-500/40 transition">
                      <input
                        type="checkbox"
                        checked={!!formData.accessibility}
                        onChange={(e) =>
                          setFormData({ ...formData, accessibility: e.target.checked })
                        }
                        className="rounded border-slate-700 bg-slate-900 text-sky-500 h-4 w-4 shrink-0"
                      />
                      <span>♿ Acessível para Cadeirantes / PCD</span>
                    </label>

                    <label className="flex items-center gap-2.5 cursor-pointer font-bold text-slate-200 bg-slate-900/60 p-3 rounded-xl border border-slate-800/80 hover:border-sky-500/40 transition">
                      <input
                        type="checkbox"
                        checked={!!formData.libras_interpreter}
                        onChange={(e) =>
                          setFormData({ ...formData, libras_interpreter: e.target.checked })
                        }
                        className="rounded border-slate-700 bg-slate-900 text-sky-500 h-4 w-4 shrink-0"
                      />
                      <span>🤟 Possui Intérprete de Libras</span>
                    </label>

                    <label className="flex items-center gap-2.5 cursor-pointer font-bold text-slate-200 bg-slate-900/60 p-3 rounded-xl border border-slate-800/80 hover:border-sky-500/40 transition">
                      <input
                        type="checkbox"
                        checked={!!formData.has_foreign_language}
                        onChange={(e) =>
                          setFormData({ ...formData, has_foreign_language: e.target.checked })
                        }
                        className="rounded border-slate-700 bg-slate-900 text-sky-500 h-4 w-4 shrink-0"
                      />
                      <span>🌐 Atendimento em outro idioma</span>
                    </label>
                  </div>

                  {/* SELEÇÃO DE IDIOMAS DE ATENDIMENTO */}
                  {formData.has_foreign_language && (
                    <div className="bg-sky-950/20 border border-sky-500/30 p-4 rounded-2xl space-y-3 animate-fadeIn">
                      <div className="flex items-center justify-between">
                        <label className="font-bold text-sky-300 flex items-center gap-1.5 text-xs">
                          <Globe className="h-4 w-4" /> Selecione os Idiomas Disponíveis no
                          Atendimento:
                        </label>
                        <span className="text-[10px] text-sky-400 font-mono font-bold">
                          {(formData.languages || []).length} idioma(s) selecionado(s)
                        </span>
                      </div>

                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                        {[
                          { id: "Português", flag: "🇧🇷", label: "Português" },
                          { id: "Inglês", flag: "🇺🇸", label: "Inglês (English)" },
                          { id: "Espanhol", flag: "🇪🇸", label: "Espanhol (Español)" },
                          { id: "Alemão", flag: "🇩🇪", label: "Alemão (Deutsch)" },
                          { id: "Italiano", flag: "🇮🇹", label: "Italiano" },
                          { id: "Francês", flag: "🇫🇷", label: "Francês (Français)" },
                          { id: "Mandarim", flag: "🇨🇳", label: "Mandarim (Chinese)" },
                          { id: "Japonês", flag: "🇯🇵", label: "Japonês (Japanese)" },
                        ].map((lang) => {
                          const selected = (formData.languages || []).includes(lang.id);
                          return (
                            <button
                              key={lang.id}
                              type="button"
                              onClick={() => {
                                const currentLangs: string[] = formData.languages || [];
                                const nextLangs = selected
                                  ? currentLangs.filter((l) => l !== lang.id)
                                  : [...currentLangs, lang.id];
                                setFormData({ ...formData, languages: nextLangs });
                              }}
                              className={`p-2.5 rounded-xl border text-xs font-bold transition flex items-center gap-2 ${
                                selected
                                  ? "bg-sky-600 text-white border-sky-400 shadow-brand"
                                  : "bg-slate-900 text-slate-400 border-slate-800 hover:text-white hover:border-slate-700"
                              }`}
                            >
                              <span className="text-base">{lang.flag}</span>
                              <span className="truncate">{lang.label}</span>
                              {selected && <Check className="h-3.5 w-3.5 ml-auto text-sky-200" />}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* ABA: FOTOS & MÍDIA */}
          {activeTab === "media" && (
            <div className="space-y-4 animate-fadeIn">
              <div>
                <label className="font-bold text-slate-200 block mb-1">
                  URL da Imagem Principal *
                </label>
                <input
                  value={formData.image_url}
                  onChange={(e) => setFormData({ ...formData, image_url: e.target.value })}
                  placeholder="https://images.unsplash.com/..."
                  className="w-full rounded-xl bg-slate-950 border border-slate-800 px-3.5 py-2.5 text-xs text-white font-mono"
                />
              </div>

              {formData.image_url && (
                <div className="h-44 w-full overflow-hidden rounded-2xl border border-slate-800 bg-slate-950">
                  <img
                    src={formData.image_url}
                    alt="Preview"
                    className="h-full w-full object-cover"
                  />
                </div>
              )}

              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="font-bold text-slate-200">Galeria de Fotos (URLs)</label>
                  <button
                    type="button"
                    onClick={() => addArrayItem("gallery_images", "")}
                    className="rounded-lg bg-sky-600/20 text-sky-300 border border-sky-500/30 px-2.5 py-1 text-[11px] font-bold"
                  >
                    + Adicionar Foto
                  </button>
                </div>
                <div className="space-y-2">
                  {(formData.gallery_images || []).map((img: string, idx: number) => (
                    <div key={idx} className="flex gap-2">
                      <input
                        value={img}
                        onChange={(e) => updateArrayItem("gallery_images", idx, e.target.value)}
                        placeholder="https://..."
                        className="flex-1 rounded-xl bg-slate-950 border border-slate-800 px-3 py-2 text-white font-mono"
                      />
                      <button
                        type="button"
                        onClick={() => removeArrayItem("gallery_images", idx)}
                        className="rounded-xl bg-rose-500/20 text-rose-300 p-2 border border-rose-500/30"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="font-bold text-slate-200 block mb-1">
                    Link do Vídeo (YouTube/Vimeo)
                  </label>
                  <input
                    value={formData.video_url}
                    onChange={(e) => setFormData({ ...formData, video_url: e.target.value })}
                    placeholder="https://youtube.com/watch?v=..."
                    className="w-full rounded-xl bg-slate-950 border border-slate-800 px-3 py-2 text-white font-mono"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-200 block mb-1">
                    Link do Tour 360° Interativo
                  </label>
                  <input
                    value={formData.tour_360_url}
                    onChange={(e) => setFormData({ ...formData, tour_360_url: e.target.value })}
                    placeholder="https://matterport.com/..."
                    className="w-full rounded-xl bg-slate-950 border border-slate-800 px-3 py-2 text-white font-mono"
                  />
                </div>
              </div>
            </div>
          )}

          {/* ABA: BENEFÍCIOS */}
          {activeTab === "perks" && (
            <div className="space-y-4 animate-fadeIn">
              <label className="font-bold text-slate-200 block">Comodidades e Estrutura</label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-slate-950 p-4 rounded-2xl border border-slate-800">
                {[
                  { key: "wifi", label: "📶 Wi-Fi Grátis" },
                  { key: "parking", label: "🚗 Estacionamento" },
                  { key: "pet_friendly", label: "🐾 Pet Friendly" },
                  { key: "accessibility", label: "♿ Acessibilidade" },
                  { key: "pool", label: "🏊 Piscina Climatizada" },
                  { key: "gym", label: "🏋️ Academia" },
                  { key: "spa", label: "🧘 Spa & Massagem" },
                  { key: "breakfast", label: "☕ Café da Manhã" },
                ].map((item) => (
                  <label
                    key={item.key}
                    className="flex items-center gap-2 cursor-pointer font-bold text-slate-300"
                  >
                    <input
                      type="checkbox"
                      checked={!!formData[item.key]}
                      onChange={(e) => setFormData({ ...formData, [item.key]: e.target.checked })}
                      className="rounded border-slate-700 bg-slate-900 text-sky-500 h-4 w-4"
                    />
                    <span>{item.label}</span>
                  </label>
                ))}
              </div>
            </div>
          )}

          {/* ABA: SERVIÇOS & ESTRUTURA (RESTAURANTES) */}
          {activeTab === "amenities" && (
            <div className="space-y-4 animate-fadeIn">
              <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 space-y-4">
                <div className="flex items-center gap-2 border-b border-slate-800 pb-2">
                  <UtensilsCrossed className="h-5 w-5 text-amber-400" />
                  <div>
                    <h3 className="text-sm font-extrabold text-white">
                      Serviços Gastronômicos, Cozinha & Estrutura do Estabelecimento
                    </h3>
                    <p className="text-xs text-slate-400">
                      Cadastre a especialidade culinária, chef de cozinha, faixa de preço e
                      facilidades oferecidas aos clientes.
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="font-bold text-slate-200 block mb-1">
                      Tipo de Cozinha / Especialidade *
                    </label>
                    <select
                      value={formData.cuisine_type || "Italiana & Massas"}
                      onChange={(e) => setFormData({ ...formData, cuisine_type: e.target.value })}
                      className="w-full rounded-xl bg-slate-900 border border-slate-800 px-3.5 py-2 text-xs text-white font-bold"
                    >
                      <option value="Italiana & Massas">🍝 Italiana & Massas Frescas</option>
                      <option value="Fondue & Culinária Colonial">
                        🫕 Fondue & Culinária Colonial
                      </option>
                      <option value="Carnes & Parrilla">🥩 Carnes Nobres & Parrilla</option>
                      <option value="Frutos do Mar & Peixes">🦐 Frutos do Mar & Peixes</option>
                      <option value="Hamburgueria & Pub">🍔 Hamburgueria & Pub Artesanal</option>
                      <option value="Pizzaria">🍕 Pizzaria Tradicional</option>
                      <option value="Japonesa & Sushi Bar">🍣 Japonesa & Sushi Bar</option>
                      <option value="Cafeteria & Confeitaria">☕ Cafeteria & Confeitaria</option>
                      <option value="Vegetariano & Vegano">🥗 Vegetariano & Vegano</option>
                    </select>
                  </div>

                  <div>
                    <label className="font-bold text-slate-200 block mb-1">
                      Faixa de Preço Média
                    </label>
                    <select
                      value={formData.price_range || "$$ Moderado"}
                      onChange={(e) => setFormData({ ...formData, price_range: e.target.value })}
                      className="w-full rounded-xl bg-slate-900 border border-slate-800 px-3.5 py-2 text-xs text-white font-bold"
                    >
                      <option value="$ Econômico">$ Econômico (Até R$ 50/pessoa)</option>
                      <option value="$$ Moderado">$$ Moderado (R$ 50 a R$ 120/pessoa)</option>
                      <option value="$$$ Sofisticado">
                        $$$ Sofisticado (R$ 120 a R$ 250/pessoa)
                      </option>
                      <option value="$$$$ Alta Gastronomia / VIP">
                        $$$$ Alta Gastronomia / VIP (Acima de R$ 250/pessoa)
                      </option>
                    </select>
                  </div>

                  <div>
                    <label className="font-bold text-slate-200 block mb-1">
                      Nome do Chef / Responsável da Cozinha
                    </label>
                    <input
                      value={formData.chef_name || ""}
                      onChange={(e) => setFormData({ ...formData, chef_name: e.target.value })}
                      placeholder="Ex: Chef Rodrigo Silva"
                      className="w-full rounded-xl bg-slate-900 border border-slate-800 px-3.5 py-2 text-xs text-white"
                    />
                  </div>

                  <div>
                    <label className="font-bold text-slate-200 block mb-1">
                      Especialidade Principal do Cardápio
                    </label>
                    <input
                      value={formData.specialties || ""}
                      onChange={(e) => setFormData({ ...formData, specialties: e.target.value })}
                      placeholder="Ex: Sequência de Fondue na Pedra e Massas Artesanais"
                      className="w-full rounded-xl bg-slate-900 border border-slate-800 px-3.5 py-2 text-xs text-white"
                    />
                  </div>

                  <div className="sm:col-span-2">
                    <label className="font-bold text-slate-200 block mb-1">
                      Horário de Funcionamento em Detalhes
                    </label>
                    <input
                      value={formData.operating_days || ""}
                      onChange={(e) => setFormData({ ...formData, operating_days: e.target.value })}
                      placeholder="Ex: Almoço: 11:30 às 15:00 | Jantar: 19:00 às 23:30 (Quarta a Domingo)"
                      className="w-full rounded-xl bg-slate-900 border border-slate-800 px-3.5 py-2 text-xs text-white"
                    />
                  </div>

                  <div className="sm:col-span-2">
                    <label className="font-bold text-slate-200 block mb-1">
                      Link do Cardápio Digital (URL ou PDF)
                    </label>
                    <input
                      value={formData.menu_url || ""}
                      onChange={(e) => setFormData({ ...formData, menu_url: e.target.value })}
                      placeholder="https://restaurante.com.br/cardapio.pdf"
                      className="w-full rounded-xl bg-slate-900 border border-slate-800 px-3.5 py-2 text-xs text-white font-mono"
                    />
                  </div>
                </div>

                <div className="pt-3 border-t border-slate-800 space-y-3">
                  <label className="font-bold text-amber-300 block">
                    Facilidades & Serviços Oferecidos aos Turistas
                  </label>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                    {[
                      { key: "reservations_accepted", label: "📅 Aceita Reservas" },
                      { key: "delivery_available", label: "🛵 Delivery / Takeaway" },
                      { key: "wine_list", label: "🍷 Carta de Vinhos & Sommelier" },
                      { key: "live_music", label: "🎸 Música ao Vivo / Couvert" },
                      { key: "kids_area", label: "🧸 Espaço Kids & Recreação" },
                      { key: "pet_friendly", label: "🐾 Pet Friendly" },
                      { key: "accessibility", label: "♿ Acessibilidade PCD" },
                      { key: "parking", label: "🚗 Estacionamento Próprio" },
                      { key: "wifi", label: "📶 Wi-Fi Cortesia" },
                      { key: "deck_area", label: "🌆 Área Externa / Deck Panorama" },
                    ].map((item) => (
                      <label
                        key={item.key}
                        className="flex items-center gap-2 cursor-pointer font-bold text-slate-300 bg-slate-900/60 p-2.5 rounded-xl border border-slate-800/80 hover:border-amber-500/40 transition"
                      >
                        <input
                          type="checkbox"
                          checked={!!formData[item.key]}
                          onChange={(e) =>
                            setFormData({ ...formData, [item.key]: e.target.checked })
                          }
                          className="rounded border-slate-700 bg-slate-900 text-amber-500 h-4 w-4"
                        />
                        <span className="text-xs">{item.label}</span>
                      </label>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ABA: REQUISITOS & O QUE LEVAR (PASSEIOS) */}
          {activeTab === "requirements" && (
            <div className="space-y-4 animate-fadeIn">
              <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 space-y-4">
                <div className="flex items-center gap-2 border-b border-slate-800 pb-2">
                  <Compass className="h-5 w-5 text-sky-400" />
                  <div>
                    <h3 className="text-sm font-extrabold text-white">
                      Requisitos da Atividade & Recomendações (O que levar)
                    </h3>
                    <p className="text-xs text-slate-400">
                      Defina a idade mínima, nível de exigência física, equipamentos e lista de
                      itens recomendados para o turista.
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="font-bold text-slate-200 block mb-1">
                      Idade Mínima Recomendada
                    </label>
                    <input
                      type="number"
                      value={formData.min_age || 0}
                      onChange={(e) =>
                        setFormData({ ...formData, min_age: Number(e.target.value) })
                      }
                      placeholder="Ex: 5 anos"
                      className="w-full rounded-xl bg-slate-900 border border-slate-800 px-3.5 py-2 text-xs text-white font-bold"
                    />
                  </div>

                  <div>
                    <label className="font-bold text-slate-200 block mb-1">
                      Nível de Dificuldade
                    </label>
                    <select
                      value={formData.difficulty_level || "Fácil"}
                      onChange={(e) =>
                        setFormData({ ...formData, difficulty_level: e.target.value })
                      }
                      className="w-full rounded-xl bg-slate-900 border border-slate-800 px-3.5 py-2 text-xs text-white font-bold"
                    >
                      <option value="Fácil">🟢 Fácil (Para todas as idades)</option>
                      <option value="Médio">🟡 Médio (Caminhada moderada)</option>
                      <option value="Difícil">🟠 Difícil (Exige bom preparo físico)</option>
                      <option value="Extremo">🔴 Extremo (Aventura intensa)</option>
                    </select>
                  </div>

                  <div className="sm:col-span-2">
                    <label className="font-bold text-slate-200 block mb-1">
                      Equipamentos Fornecidos pela Equipe
                    </label>
                    <input
                      value={formData.equipment_included || ""}
                      onChange={(e) =>
                        setFormData({ ...formData, equipment_included: e.target.value })
                      }
                      placeholder="Ex: Capacete, colete salva-vidas, mosquetão e lanterna"
                      className="w-full rounded-xl bg-slate-900 border border-slate-800 px-3.5 py-2 text-xs text-white"
                    />
                  </div>

                  <div className="sm:col-span-2 flex flex-wrap gap-4 pt-1">
                    <label className="flex items-center gap-2 cursor-pointer font-bold text-slate-200">
                      <input
                        type="checkbox"
                        checked={!!formData.guide_included}
                        onChange={(e) =>
                          setFormData({ ...formData, guide_included: e.target.checked })
                        }
                        className="rounded border-slate-700 bg-slate-900 text-sky-500 h-4 w-4"
                      />
                      <span>🧭 Guia profissional credenciado incluso</span>
                    </label>

                    <label className="flex items-center gap-2 cursor-pointer font-bold text-slate-200">
                      <input
                        type="checkbox"
                        checked={!!formData.insurance_included}
                        onChange={(e) =>
                          setFormData({ ...formData, insurance_included: e.target.checked })
                        }
                        className="rounded border-slate-700 bg-slate-900 text-sky-500 h-4 w-4"
                      />
                      <span>🛡️ Seguro viagem contra acidentes incluso</span>
                    </label>
                  </div>
                </div>

                <div className="pt-3 border-t border-slate-800 space-y-3">
                  <div className="flex items-center justify-between">
                    <label className="font-bold text-slate-200">
                      O que levar (Lista de Itens Recomendados ao Turista)
                    </label>
                    <button
                      type="button"
                      onClick={() => addArrayItem("what_to_bring", "")}
                      className="rounded-lg bg-sky-600/20 text-sky-300 border border-sky-500/30 px-3 py-1 font-bold"
                    >
                      + Adicionar Recomendação
                    </button>
                  </div>

                  <div className="space-y-2">
                    {(formData.what_to_bring || []).map((item: string, idx: number) => (
                      <div key={idx} className="flex gap-2">
                        <input
                          value={item}
                          onChange={(e) => updateArrayItem("what_to_bring", idx, e.target.value)}
                          placeholder="Ex: Protetor solar, Tênis confortável, Garrafa d'água"
                          className="flex-1 rounded-xl bg-slate-900 border border-slate-800 px-3 py-2 text-white"
                        />
                        <button
                          type="button"
                          onClick={() => removeArrayItem("what_to_bring", idx)}
                          className="rounded-xl bg-rose-500/20 text-rose-300 p-2 border border-rose-500/30"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 border-t border-slate-800">
                  <div className="sm:col-span-2">
                    <label className="font-bold text-slate-200 block mb-1">
                      Ponto de Encontro & Instruções de Chegada
                    </label>
                    <input
                      value={formData.meeting_point || ""}
                      onChange={(e) => setFormData({ ...formData, meeting_point: e.target.value })}
                      placeholder="Ex: Ponto de Apoio Central na Av. Principal nº 500"
                      className="w-full rounded-xl bg-slate-900 border border-slate-800 px-3.5 py-2 text-xs text-white"
                    />
                  </div>

                  <div className="sm:col-span-2">
                    <label className="font-bold text-slate-200 block mb-1">
                      Política para Dias de Chuva
                    </label>
                    <input
                      value={formData.rain_policy || ""}
                      onChange={(e) => setFormData({ ...formData, rain_policy: e.target.value })}
                      placeholder="Ex: Realizado normalmente com chuva leve. Capas fornecidas cortesia."
                      className="w-full rounded-xl bg-slate-900 border border-slate-800 px-3.5 py-2 text-xs text-white"
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ABA: O QUE INCLUI */}
          {activeTab === "includes" && (
            <div className="space-y-4 animate-fadeIn">
              <div className="flex items-center justify-between">
                <label className="font-bold text-slate-200">Itens Inclusos na Experiência</label>
                <button
                  type="button"
                  onClick={() => addArrayItem("includes", "")}
                  className="rounded-lg bg-emerald-600/20 text-emerald-300 border border-emerald-500/30 px-3 py-1 font-bold"
                >
                  + Adicionar Item Incluso
                </button>
              </div>

              <div className="space-y-2">
                {(formData.includes || []).map((inc: string, idx: number) => (
                  <div key={idx} className="flex gap-2">
                    <input
                      value={inc}
                      onChange={(e) => updateArrayItem("includes", idx, e.target.value)}
                      placeholder="Ex: Guia bilingue certificado"
                      className="flex-1 rounded-xl bg-slate-950 border border-slate-800 px-3 py-2 text-white"
                    />
                    <button
                      type="button"
                      onClick={() => removeArrayItem("includes", idx)}
                      className="rounded-xl bg-rose-500/20 text-rose-300 p-2 border border-rose-500/30"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ABA: O QUE NÃO INCLUI */}
          {activeTab === "excludes" && (
            <div className="space-y-4 animate-fadeIn">
              <div className="flex items-center justify-between">
                <label className="font-bold text-slate-200">Itens Não Inclusos (Exclusões)</label>
                <button
                  type="button"
                  onClick={() => addArrayItem("excludes", "")}
                  className="rounded-lg bg-amber-600/20 text-amber-300 border border-amber-500/30 px-3 py-1 font-bold"
                >
                  + Adicionar Item Não Incluso
                </button>
              </div>

              <div className="space-y-2">
                {(formData.excludes || []).map((exc: string, idx: number) => (
                  <div key={idx} className="flex gap-2">
                    <input
                      value={exc}
                      onChange={(e) => updateArrayItem("excludes", idx, e.target.value)}
                      placeholder="Ex: Transporte de ida e volta ao hotel"
                      className="flex-1 rounded-xl bg-slate-950 border border-slate-800 px-3 py-2 text-white"
                    />
                    <button
                      type="button"
                      onClick={() => removeArrayItem("excludes", idx)}
                      className="rounded-xl bg-rose-500/20 text-rose-300 p-2 border border-rose-500/30"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ABA: INFORMAÇÕES IMPORTANTES */}
          {activeTab === "info" && (
            <div className="space-y-4 animate-fadeIn">
              <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 space-y-4">
                <div className="flex items-center gap-2 border-b border-slate-800 pb-2">
                  <Info className="h-5 w-5 text-sky-400" />
                  <div>
                    <h3 className="text-sm font-extrabold text-white">
                      Informações Importantes, Regras & Políticas da Hospedagem
                    </h3>
                    <p className="text-xs text-slate-400">
                      Escreva em detalhes os requisitos de check-in, regras de convivência,
                      documentos necessários e políticas internas.
                    </p>
                  </div>
                </div>

                <div>
                  <label className="font-bold text-slate-200 block mb-1">
                    Caixa de Texto: Informações Importantes & Regras da Hospedagem
                  </label>
                  <textarea
                    rows={6}
                    value={formData.important_info || ""}
                    onChange={(e) => setFormData({ ...formData, important_info: e.target.value })}
                    placeholder="Ex: Apresentar documento de identidade original com foto de todos os hóspedes no check-in. Proibido festas ou som alto após às 22h. Não é permitido fumar nas dependências internas..."
                    className="w-full rounded-2xl bg-slate-900 border border-slate-800 p-4 text-xs text-white leading-relaxed font-mono focus:border-sky-500 outline-none"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                  <div>
                    <label className="font-bold text-slate-200 block mb-1">
                      Horário de Check-in (Entrada)
                    </label>
                    <input
                      value={formData.checkin_time || "14:00"}
                      onChange={(e) => setFormData({ ...formData, checkin_time: e.target.value })}
                      placeholder="Ex: A partir das 14:00"
                      className="w-full rounded-xl bg-slate-900 border border-slate-800 px-3.5 py-2 text-xs text-white"
                    />
                  </div>

                  <div>
                    <label className="font-bold text-slate-200 block mb-1">
                      Horário de Check-out (Saída)
                    </label>
                    <input
                      value={formData.checkout_time || "12:00"}
                      onChange={(e) => setFormData({ ...formData, checkout_time: e.target.value })}
                      placeholder="Ex: Até às 12:00"
                      className="w-full rounded-xl bg-slate-900 border border-slate-800 px-3.5 py-2 text-xs text-white"
                    />
                  </div>

                  <div className="sm:col-span-2">
                    <label className="font-bold text-slate-200 block mb-1">
                      Política de Cancelamento
                    </label>
                    <input
                      value={formData.cancellation_policy || ""}
                      onChange={(e) =>
                        setFormData({ ...formData, cancellation_policy: e.target.value })
                      }
                      placeholder="Ex: Cancelamento gratuito até 7 dias antes da data de entrada."
                      className="w-full rounded-xl bg-slate-900 border border-slate-800 px-3.5 py-2 text-xs text-white"
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ABA: FAQ */}
          {activeTab === "faq" && (
            <div className="space-y-4 animate-fadeIn">
              <div className="flex items-center justify-between">
                <label className="font-bold text-slate-200">
                  Perguntas e Respostas Frequentes (FAQ)
                </label>
                <button
                  type="button"
                  onClick={() => addArrayItem("faqs", { q: "", a: "" })}
                  className="rounded-lg bg-sky-600/20 text-sky-300 border border-sky-500/30 px-3 py-1 font-bold"
                >
                  + Nova Pergunta
                </button>
              </div>

              <div className="space-y-3">
                {(formData.faqs || []).map((faq: { q: string; a: string }, idx: number) => (
                  <div
                    key={idx}
                    className="bg-slate-950 p-3.5 rounded-2xl border border-slate-800 space-y-2"
                  >
                    <div className="flex justify-between items-center">
                      <span className="font-extrabold text-sky-400">Pergunta #{idx + 1}</span>
                      <button
                        type="button"
                        onClick={() => removeArrayItem("faqs", idx)}
                        className="text-rose-400 hover:text-rose-300 text-xs font-bold"
                      >
                        Excluir FAQ
                      </button>
                    </div>
                    <input
                      value={faq.q}
                      onChange={(e) => updateArrayItem("faqs", idx, { ...faq, q: e.target.value })}
                      placeholder="Pergunta (ex: Qual a idade mínima?)"
                      className="w-full rounded-xl bg-slate-900 border border-slate-800 px-3 py-1.5 text-white font-bold"
                    />
                    <textarea
                      rows={2}
                      value={faq.a}
                      onChange={(e) => updateArrayItem("faqs", idx, { ...faq, a: e.target.value })}
                      placeholder="Resposta clara para o turista..."
                      className="w-full rounded-xl bg-slate-900 border border-slate-800 px-3 py-1.5 text-white"
                    />
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ABA: PUBLICAÇÃO & PREÇOS */}
          {activeTab === "publish" && (
            <div className="space-y-4 animate-fadeIn">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 bg-slate-950 p-4 rounded-2xl border border-slate-800">
                <div>
                  <label className="font-bold text-slate-200 block mb-1">
                    Preço no Balcão (R$)
                  </label>
                  <input
                    type="number"
                    value={formData.store_price}
                    onChange={(e) =>
                      setFormData({ ...formData, store_price: Number(e.target.value) })
                    }
                    className="w-full rounded-xl bg-slate-900 border border-slate-800 px-3 py-2 text-white font-mono font-bold"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-200 block mb-1">Preço Viajante (R$)</label>
                  <input
                    type="number"
                    value={formData.traveler_price}
                    onChange={(e) =>
                      setFormData({ ...formData, traveler_price: Number(e.target.value) })
                    }
                    className="w-full rounded-xl bg-slate-900 border border-slate-800 px-3 py-2 text-sky-400 font-mono font-bold"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-200 block mb-1">
                    Preço Viajante Premium (R$)
                  </label>
                  <input
                    type="number"
                    value={formData.premium_price}
                    onChange={(e) =>
                      setFormData({ ...formData, premium_price: Number(e.target.value) })
                    }
                    className="w-full rounded-xl bg-slate-900 border border-slate-800 px-3 py-2 text-amber-400 font-mono font-bold"
                  />
                </div>

                <div className="sm:col-span-3 border-t border-slate-800 pt-3">
                  <label className="font-bold text-slate-200 block mb-1">
                    Parceiro Responsável
                  </label>
                  <select
                    value={formData.partner_id}
                    onChange={(e) => setFormData({ ...formData, partner_id: e.target.value })}
                    className="w-full rounded-xl bg-slate-900 border border-slate-800 px-3 py-2 text-white font-bold"
                  >
                    {partners.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.store_name || p.owner_name} ({p.city})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="font-bold text-slate-200 block mb-1">Status do Anúncio</label>
                  <select
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                    className="w-full rounded-xl bg-slate-900 border border-slate-800 px-3 py-2 text-white font-bold"
                  >
                    <option value="approved">🟢 Aprovado (Visível Publicamente)</option>
                    <option value="pending">🟡 Pendente de Aprovação</option>
                    <option value="rejected">🔴 Rejeitado</option>
                  </select>
                </div>

                <div className="flex items-center gap-2 pt-5">
                  <input
                    type="checkbox"
                    id="feat"
                    checked={!!formData.featured}
                    onChange={(e) => setFormData({ ...formData, featured: e.target.checked })}
                    className="h-4 w-4 rounded bg-slate-900 border-slate-700 text-sky-500"
                  />
                  <label htmlFor="feat" className="font-bold text-amber-300">
                    ⭐ Anúncio em Destaque no App
                  </label>
                </div>
              </div>
            </div>
          )}
        </form>

        {/* FOOTER ACTIONS */}
        <div className="border-t border-slate-800 bg-slate-950 p-4 shrink-0 flex items-center justify-between">
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl border border-slate-800 bg-slate-900 px-4 py-2 text-xs font-bold text-slate-300 hover:bg-slate-800"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            className="rounded-xl bg-gradient-brand px-6 py-2.5 text-xs font-black text-white shadow-brand hover:opacity-95 active:scale-95"
          >
            Salvar Anúncio no CMS 💾
          </button>
        </div>
      </div>
    </div>
  );
}

function TabBtn({
  id,
  label,
  active,
  onClick,
}: {
  id: string;
  label: string;
  active: string;
  onClick: (id: string) => void;
}) {
  const isSel = active === id;
  return (
    <button
      type="button"
      onClick={() => onClick(id)}
      className={`px-3 py-1.5 rounded-lg transition whitespace-nowrap ${
        isSel
          ? "bg-slate-800 text-sky-400 font-extrabold border border-slate-700"
          : "text-slate-400 hover:text-white"
      }`}
    >
      {label}
    </button>
  );
}
