import { useState } from "react";
import { X, Check, Store, MapPin, Phone, Mail, User, Shield, Building2 } from "lucide-react";
import { type PartnerStore, type PartnerCategory, savePartnerStore } from "@/lib/partners";
import PartnerMapPicker from "./PartnerMapPicker";
import { toast } from "sonner";

export default function PartnerFormModal({
  partner = null,
  onClose,
  onSave,
}: {
  partner?: PartnerStore | null;
  onClose: () => void;
  onSave: (partner: PartnerStore) => void;
}) {
  const [storeName, setStoreName] = useState(partner?.store_name || "");
  const [cnpj, setCnpj] = useState(partner?.cnpj || "");
  const [logoUrl, setLogoUrl] = useState(partner?.logo_url || "");
  const [googleMapsUrl, setGoogleMapsUrl] = useState(
    partner?.google_maps_url || partner?.address || "",
  );
  const [city, setCity] = useState(partner?.city || "Rio de Janeiro");
  const [phone, setPhone] = useState(partner?.phone || "");
  const [email, setEmail] = useState(partner?.email || "");
  const [ownerName, setOwnerName] = useState(partner?.owner_name || "");
  const [ownerPhone, setOwnerPhone] = useState(partner?.owner_phone || "");
  const [category, setCategory] = useState<PartnerCategory>(partner?.category || "Gastronomia");

  const [lat] = useState<number>(partner?.lat || -22.9068);
  const [lng] = useState<number>(partner?.lng || -43.1729);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!storeName.trim()) return toast.error("Preencha o Nome da Loja/Estabelecimento.");
    if (!cnpj.trim()) return toast.error("Preencha o CNPJ.");
    if (!googleMapsUrl.trim()) return toast.error("Insira o Link da Localização no Google Maps.");
    if (!phone.trim()) return toast.error("Preencha o Telefone da Loja.");
    if (!ownerName.trim()) return toast.error("Preencha o Nome do Responsável.");

    const p: PartnerStore = {
      id: partner?.id || `p-${Date.now()}`,
      user_id: partner?.user_id,
      logo_url:
        logoUrl.trim() || "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=400&q=80",
      store_name: storeName.trim(),
      cnpj: cnpj.trim(),
      address: googleMapsUrl.trim(),
      google_maps_url: googleMapsUrl.trim(),
      city: city.trim(),
      lat,
      lng,
      phone: phone.trim(),
      email: email.trim(),
      owner_name: ownerName.trim(),
      owner_phone: ownerPhone.trim(),
      category,
      created_at: partner?.created_at || new Date().toISOString(),
    };

    savePartnerStore(p);
    onSave(p);
    toast.success(`🎉 Cadastro do parceiro "${p.store_name}" salvo com sucesso!`);
    onClose();
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 backdrop-blur-sm p-4 sm:items-center"
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="max-h-[92vh] w-full max-w-lg overflow-y-auto rounded-3xl bg-background p-6 shadow-elevated border border-border space-y-4"
      >
        <div className="flex items-center justify-between border-b border-border/60 pb-3">
          <div className="flex items-center gap-2">
            <Store className="h-5 w-5 text-primary" />
            <h2 className="text-base font-extrabold text-foreground">
              {partner ? "Editar Cadastro do Parceiro" : "Novo Cadastro de Parceiro"}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="rounded-full p-1 text-muted-foreground hover:bg-secondary"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3.5">
          {/* Logo & Store Name */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="mb-1 block text-xs font-bold uppercase text-muted-foreground">
                Nome da Loja / Estabelecimento
              </label>
              <input
                type="text"
                required
                value={storeName}
                onChange={(e) => setStoreName(e.target.value)}
                placeholder="ex: Restaurante Sabor da Terra"
                className="w-full rounded-xl border border-border bg-card px-3 py-2 text-xs outline-none focus:ring-1 focus:ring-primary shadow-soft"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-bold uppercase text-muted-foreground">
                CNPJ
              </label>
              <input
                type="text"
                required
                value={cnpj}
                onChange={(e) => setCnpj(e.target.value)}
                placeholder="12.345.678/0001-90"
                className="w-full rounded-xl border border-border bg-card px-3 py-2 text-xs outline-none focus:ring-1 focus:ring-primary shadow-soft"
              />
            </div>
          </div>

          <div>
            <label className="mb-1 block text-xs font-bold uppercase text-muted-foreground flex items-center justify-between">
              <span>Logo / Foto da Loja</span>
              <span className="text-[10px] text-primary">Envie do Computador ou digite a URL</span>
            </label>
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={logoUrl}
                onChange={(e) => setLogoUrl(e.target.value)}
                placeholder="URL da imagem ou envie foto do computador"
                className="flex-1 rounded-xl border border-border bg-card px-3 py-2 text-xs outline-none focus:ring-1 focus:ring-primary shadow-soft"
              />
              <label className="cursor-pointer rounded-xl bg-primary px-3 py-2 text-xs font-bold text-white shadow-brand hover:brightness-110 shrink-0">
                📁 Enviar Foto
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) {
                      const reader = new FileReader();
                      reader.onload = (ev) => {
                        if (ev.target?.result) {
                          setLogoUrl(ev.target.result as string);
                          toast.success("Foto carregada com sucesso do computador!");
                        }
                      };
                      reader.readAsDataURL(file);
                    }
                  }}
                />
              </label>
            </div>
            {logoUrl && (
              <div className="mt-2 flex items-center gap-2">
                <img
                  src={logoUrl}
                  alt="Preview"
                  className="h-10 w-10 rounded-xl object-cover border border-border shadow-sm"
                />
                <span className="text-[10px] text-muted-foreground font-semibold">
                  Foto pronta para o cadastro
                </span>
              </div>
            )}
          </div>

          {/* Category & City */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="mb-1 block text-xs font-bold uppercase text-muted-foreground">
                Categoria da Loja
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value as any)}
                className="w-full rounded-xl border border-border bg-card px-3 py-2 text-xs font-semibold outline-none focus:ring-1 focus:ring-primary shadow-soft"
              >
                <option value="Gastronomia">Gastronomia 🍽️</option>
                <option value="Hospedagem">Hospedagem 🏨</option>
                <option value="Passeios & Lazer">Passeios & Lazer 🎢</option>
                <option value="Eventos">Eventos 📅</option>
                <option value="Comércio & Serviços">Comércio & Serviços 🛍️</option>
              </select>
            </div>
            <div>
              <label className="mb-1 block text-xs font-bold uppercase text-muted-foreground">
                Cidade Principal
              </label>
              <input
                type="text"
                required
                value={city}
                onChange={(e) => setCity(e.target.value)}
                placeholder="ex: Rio de Janeiro"
                className="w-full rounded-xl border border-border bg-card px-3 py-2 text-xs outline-none focus:ring-1 focus:ring-primary shadow-soft"
              />
            </div>
          </div>

          {/* Google Maps Location Link */}
          <div className="pt-1 border-t border-border/60">
            <label className="mb-1 block text-xs font-bold uppercase text-muted-foreground flex items-center gap-1">
              <MapPin className="h-3.5 w-3.5 text-primary" /> Link da Localização no Google Maps
            </label>
            <input
              type="url"
              required
              value={googleMapsUrl}
              onChange={(e) => setGoogleMapsUrl(e.target.value)}
              placeholder="https://maps.google.com/?q=..."
              className="w-full rounded-xl border border-border bg-card px-3 py-2.5 text-xs outline-none focus:ring-1 focus:ring-primary shadow-soft"
            />
            <p className="mt-1 text-[10px] text-muted-foreground">
              Cole aqui o link de localização gerado pelo Google Maps do seu estabelecimento.
            </p>
          </div>

          {/* Store Contacts */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1 border-t border-border/60">
            <div>
              <label className="mb-1 block text-xs font-bold uppercase text-muted-foreground">
                Telefone da Loja / WhatsApp
              </label>
              <input
                type="text"
                required
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="(21) 98765-4321"
                className="w-full rounded-xl border border-border bg-card px-3 py-2 text-xs outline-none focus:ring-1 focus:ring-primary shadow-soft"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-bold uppercase text-muted-foreground">
                E-mail Corporativo
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="contato@loja.com.br"
                className="w-full rounded-xl border border-border bg-card px-3 py-2 text-xs outline-none focus:ring-1 focus:ring-primary shadow-soft"
              />
            </div>
          </div>

          {/* Owner Contacts */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1 border-t border-border/60">
            <div>
              <label className="mb-1 block text-xs font-bold uppercase text-muted-foreground">
                Nome do Responsável
              </label>
              <input
                type="text"
                required
                value={ownerName}
                onChange={(e) => setOwnerName(e.target.value)}
                placeholder="ex: Fernanda Lima"
                className="w-full rounded-xl border border-border bg-card px-3 py-2 text-xs outline-none focus:ring-1 focus:ring-primary shadow-soft"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-bold uppercase text-muted-foreground">
                Telefone do Responsável
              </label>
              <input
                type="text"
                required
                value={ownerPhone}
                onChange={(e) => setOwnerPhone(e.target.value)}
                placeholder="(21) 99887-6655"
                className="w-full rounded-xl border border-border bg-card px-3 py-2 text-xs outline-none focus:ring-1 focus:ring-primary shadow-soft"
              />
            </div>
          </div>

          <div className="pt-3">
            <button
              type="submit"
              className="w-full rounded-2xl bg-gradient-brand py-3 text-xs font-extrabold text-white shadow-brand transition active:scale-95 flex items-center justify-center gap-1.5"
            >
              <Check className="h-4 w-4" /> Salvar Cadastro do Parceiro
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
