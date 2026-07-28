import { Bell, Check, X } from "lucide-react";
import { useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { useNotifications, markAllRead, requestPushPermission, useLivePushNotifications, useAutoGenerateAlerts } from "@/lib/notifications";
import { useSelectedCity } from "@/hooks/use-city";
import { useQueryClient } from "@tanstack/react-query";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";

export function NotificationsBell() {
  const { user } = useAuth();
  const [city] = useSelectedCity();
  const [open, setOpen] = useState(false);
  const qc = useQueryClient();
  useAutoGenerateAlerts(user?.id, city?.id ?? null);
  const { data } = useNotifications(user?.id, city?.id ?? null);
  useLivePushNotifications(data);
  const unread = (data ?? []).filter((n) => !n.read_at).length;

  async function handleOpen() {
    setOpen(true);
    await requestPushPermission();
    if (user && unread > 0) {
      await markAllRead(user.id);
      qc.invalidateQueries({ queryKey: ["notifications", user.id] });
    }
  }

  return (
    <>
      <button
        aria-label="Notificações"
        onClick={handleOpen}
        className="relative rounded-full bg-white/15 p-2.5 backdrop-blur transition hover:bg-white/25"
      >
        <Bell className="h-5 w-5" />
        {unread > 0 && (
          <span className="absolute -right-0.5 -top-0.5 grid h-4 min-w-[16px] place-items-center rounded-full bg-accent px-1 text-[10px] font-bold text-white">
            {unread > 9 ? "9+" : unread}
          </span>
        )}
      </button>
      {open && (
        <div className="fixed inset-0 z-50 flex items-start justify-center bg-black/50 pt-16" onClick={() => setOpen(false)}>
          <div onClick={(e) => e.stopPropagation()} className="max-h-[70vh] w-[92%] max-w-md overflow-y-auto rounded-3xl bg-background p-5 shadow-elevated">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-bold text-foreground">Notificações</h2>
              <button onClick={() => setOpen(false)} className="rounded-full p-1 text-muted-foreground hover:bg-secondary">
                <X className="h-5 w-5" />
              </button>
            </div>
            {!user ? (
              <p className="mt-4 text-sm text-muted-foreground">Entre para receber alertas de cupons e eventos.</p>
            ) : (data ?? []).length === 0 ? (
              <p className="mt-4 text-sm text-muted-foreground">Nada por aqui ainda. Assim que houver eventos hoje ou cupons novos você recebe aqui.</p>
            ) : (
              <ul className="mt-3 space-y-2">
                {(data ?? []).map((n) => (
                  <li key={n.id} className="rounded-2xl border border-border p-3">
                    <div className="flex items-start gap-2">
                      <div className="mt-0.5 grid h-8 w-8 place-items-center rounded-full bg-primary/10 text-primary">
                        {n.type.startsWith("listing_") ? <Check className="h-4 w-4" /> : <Bell className="h-4 w-4" />}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-bold text-foreground">{n.title}</p>
                        {n.body && <p className="text-xs text-muted-foreground">{n.body}</p>}
                        <p className="mt-1 text-[10px] text-muted-foreground">
                          {formatDistanceToNow(new Date(n.created_at), { addSuffix: true, locale: ptBR })}
                        </p>
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      )}
    </>
  );
}
