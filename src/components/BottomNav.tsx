import { Link, useRouterState } from "@tanstack/react-router";
import { Home, Compass, CalendarDays, Heart, User, Ticket } from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/hooks/use-auth";
import { useRoles } from "@/hooks/use-roles";

const travelerNavItems = [
  { to: "/", label: "Home", icon: Home },
  { to: "/explorar", label: "Explorar", icon: Compass },
  { to: "/planejar", label: "Planejar", icon: CalendarDays },
  { to: "/favoritos", label: "Favoritos", icon: Heart },
  { to: "/perfil", label: "Perfil", icon: User },
] as const;

const partnerNavItems = [
  { to: "/validar-cupom", label: "Ativar Cupom", icon: Ticket },
  { to: "/perfil", label: "Perfil", icon: User },
] as const;

export function BottomNav() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const { user } = useAuth();
  const { isPartner, isRealAdmin, simulatedRole } = useRoles(user?.id, user?.email);

  // É parceiro exclusivo se possui papel parceiro, não é admin real e não está simulando outro papel
  const isPurePartner = isPartner && !isRealAdmin && (!simulatedRole || simulatedRole === "partner");

  const currentNavItems = isPurePartner ? partnerNavItems : travelerNavItems;

  return (
    <nav className="fixed inset-x-0 bottom-0 z-40 border-t border-border bg-background/90 pb-[env(safe-area-inset-bottom)] backdrop-blur-xl">
      <ul className="mx-auto flex max-w-2xl items-stretch justify-center gap-4 px-1 py-1.5">
        {currentNavItems.map(({ to, label, icon: Icon }) => {
          const active = to === "/" ? pathname === "/" : pathname.startsWith(to);
          return (
            <li key={to} className="flex-1 max-w-[120px]">
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
