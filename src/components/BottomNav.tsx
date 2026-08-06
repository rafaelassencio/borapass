import { Link, useRouterState } from "@tanstack/react-router";
import { Home, Compass, CalendarDays, Heart, User, Ticket, ShieldAlert, Calendar, LayoutGrid, DollarSign, Plane, Hotel, Luggage } from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuthContext } from "@/context/AuthContext";

type NavItem = {
  to: string;
  label: string;
  icon: React.ComponentType<any>;
};

const travelerNavItems: NavItem[] = [
  { to: "/", label: "Home", icon: Home },
  { to: "/hospedagens", label: "Hotéis", icon: Hotel },
  { to: "/passagens", label: "Passagens", icon: Plane },
  { to: "/minhas-viagens", label: "Viagens", icon: Luggage },
  { to: "/perfil", label: "Perfil", icon: User },
];

const adminNavItems: NavItem[] = [
  { to: "/", label: "Home", icon: Home },
  { to: "/hospedagens", label: "Hotéis", icon: Hotel },
  { to: "/passagens", label: "Passagens", icon: Plane },
  { to: "/admin", label: "Admin Console", icon: ShieldAlert },
  { to: "/perfil", label: "Perfil", icon: User },
];

const supportNavItems: NavItem[] = [
  { to: "/admin", label: "Central Suporte", icon: ShieldAlert },
  { to: "/perfil", label: "Perfil", icon: User },
];

export function BottomNav() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const { isPurePartner, primaryRole, isAdmin, isSupport, partnerStore } = useAuthContext();

  const partnerCategory = (partnerStore?.category || "Gastronomia").toLowerCase();
  const isBookingBased =
    partnerCategory.includes("hospedag") ||
    partnerCategory.includes("passeio") ||
    partnerCategory.includes("evento");

  const partnerNavItems: NavItem[] = isBookingBased
    ? [
        { to: "/parceiro", label: "Reservas", icon: Calendar },
        { to: "/parceiro", label: "Anúncios", icon: LayoutGrid },
        { to: "/parceiro", label: "Financeiro", icon: DollarSign },
        { to: "/perfil", label: "Perfil", icon: User },
      ]
    : [
        { to: "/validar-cupom", label: "Ativar Cupom", icon: Ticket },
        { to: "/parceiro", label: "Anúncios", icon: LayoutGrid },
        { to: "/parceiro", label: "Financeiro", icon: DollarSign },
        { to: "/perfil", label: "Perfil", icon: User },
      ];

  let currentNavItems = travelerNavItems;
  if (isPurePartner || primaryRole === "Parceiro") {
    currentNavItems = partnerNavItems;
  } else if (isSupport || primaryRole === "Suporte") {
    currentNavItems = supportNavItems;
  } else if (isAdmin || primaryRole === "Administrador") {
    currentNavItems = adminNavItems;
  }

  return (
    <nav className="fixed inset-x-0 bottom-0 z-40 border-t border-border bg-background/90 pb-[env(safe-area-inset-bottom)] backdrop-blur-xl transition-all">
      <ul className="mx-auto flex max-w-2xl items-stretch justify-center gap-2 px-1 py-1.5">
        {currentNavItems.map(({ to, label, icon: Icon }) => {
          const active = to === "/" ? pathname === "/" : pathname.startsWith(to);
          return (
            <li key={`${to}-${label}`} className="flex-1 max-w-[120px]">
              <Link
                to={to}
                className={cn(
                  "flex flex-col items-center gap-0.5 rounded-xl px-1 py-1.5 transition-colors",
                  active ? "text-primary font-bold" : "text-muted-foreground hover:text-foreground",
                )}
              >
                <div
                  className={cn(
                    "flex h-8 w-8 items-center justify-center rounded-full transition-all",
                    active && "bg-primary/10 text-primary scale-110",
                  )}
                >
                  <Icon className="h-4.5 w-4.5" strokeWidth={active ? 2.4 : 2} />
                </div>
                <span
                  className={cn(
                    "text-[10px] font-medium leading-none text-center truncate w-full mt-0.5",
                    active && "font-extrabold text-primary",
                  )}
                >
                  {label}
                </span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
