import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";

export type Notification = Database["public"]["Tables"]["notifications"]["Row"];

export function useNotifications(userId: string | undefined, cityId?: string | null) {
  return useQuery({
    queryKey: ["notifications", userId, cityId ?? null],
    enabled: !!userId,
    queryFn: async () => {
      if (cityId) {
        const [linked, systemwide] = await Promise.all([
          supabase
            .from("notifications")
            .select("*, listings!inner(city_id)")
            .eq("listings.city_id", cityId)
            .order("created_at", { ascending: false })
            .limit(50),
          supabase
            .from("notifications")
            .select("*")
            .is("listing_id", null)
            .order("created_at", { ascending: false })
            .limit(50),
        ]);
        if (linked.error) throw linked.error;
        if (systemwide.error) throw systemwide.error;
        const merged = [...(linked.data ?? []), ...(systemwide.data ?? [])] as Notification[];
        merged.sort((a, b) => (a.created_at < b.created_at ? 1 : -1));
        return merged.slice(0, 50);
      }
      const { data, error } = await supabase
        .from("notifications")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(50);
      if (error) throw error;
      return data as Notification[];
    },
  });
}

export async function markNotificationRead(id: string) {
  await supabase.from("notifications").update({ read_at: new Date().toISOString() }).eq("id", id);
}

export async function markAllRead(userId: string) {
  await supabase
    .from("notifications")
    .update({ read_at: new Date().toISOString() })
    .eq("user_id", userId)
    .is("read_at", null);
}

/** Ask browser permission if not yet decided. */
export async function requestPushPermission(): Promise<NotificationPermission> {
  if (typeof window === "undefined" || !("Notification" in window)) return "denied";
  if (Notification.permission === "default") return Notification.requestPermission();
  return Notification.permission;
}

/** Fire native Notification for each unseen item and remember shown IDs locally. */
export function useLivePushNotifications(items: Notification[] | undefined) {
  const shownRef = useRef<Set<string>>(new Set());
  useEffect(() => {
    if (!items || typeof window === "undefined" || !("Notification" in window)) return;
    if (Notification.permission !== "granted") return;
    const seenRaw = window.localStorage.getItem("borapass:shown-notifs");
    const seen = new Set<string>(seenRaw ? JSON.parse(seenRaw) : []);
    for (const n of items) {
      if (seen.has(n.id) || shownRef.current.has(n.id)) continue;
      try {
        new Notification(n.title, { body: n.body ?? undefined, tag: n.id });
      } catch {
        /* ignore */
      }
      shownRef.current.add(n.id);
      seen.add(n.id);
    }
    window.localStorage.setItem("borapass:shown-notifs", JSON.stringify([...seen].slice(-200)));
  }, [items]);
}

/**
 * Best-effort client-side generator: creates local notifications for events
 * scheduled today and coupons from the past 24h in the user's selected city.
 */
export function useAutoGenerateAlerts(
  userId: string | undefined,
  cityId: string | null | undefined,
) {
  const qc = useQueryClient();
  useEffect(() => {
    if (!userId || !cityId) return;
    let cancelled = false;
    (async () => {
      const dayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
      let evQ = supabase
        .from("listings")
        .select("id, title, city")
        .eq("category", "evento")
        .eq("status", "approved")
        .eq("active", true)
        .gte("updated_at", dayAgo);
      if (cityId) evQ = evQ.eq("city_id", cityId);

      let cpQ = supabase
        .from("listings")
        .select("id, title, city, discount")
        .eq("category", "cupom")
        .eq("status", "approved")
        .eq("active", true)
        .gte("created_at", dayAgo);
      if (cityId) cpQ = cpQ.eq("city_id", cityId);

      const [ev, cp, existing] = await Promise.all([
        evQ,
        cpQ,
        supabase.from("notifications").select("listing_id, type").eq("user_id", userId),
      ]);
      if (cancelled) return;
      const known = new Set((existing.data ?? []).map((n) => `${n.type}:${n.listing_id ?? ""}`));
      const rows: Array<{
        user_id: string;
        type: string;
        title: string;
        body: string | null;
        listing_id: string;
      }> = [];
      for (const e of ev.data ?? []) {
        const key = `event_today:${e.id}`;
        if (known.has(key)) continue;
        rows.push({
          user_id: userId,
          type: "event_today",
          title: "Evento hoje na sua cidade",
          body: e.title,
          listing_id: e.id,
        });
      }
      for (const c of cp.data ?? []) {
        const key = `coupon_available:${c.id}`;
        if (known.has(key)) continue;
        rows.push({
          user_id: userId,
          type: "coupon_available",
          title: c.discount ? `Novo cupom ${c.discount}` : "Novo cupom disponível",
          body: c.title,
          listing_id: c.id,
        });
      }
      if (rows.length) {
        const { error } = await supabase.from("notifications").insert(rows);
        if (!error) qc.invalidateQueries({ queryKey: ["notifications", userId] });
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [userId, cityId, qc]);
}

export type TripPlanItem = {
  id: string;
  destinationCity: string;
  daysCount: number;
  startDate: string; // YYYY-MM-DD
  initialDiffDaysAtCreation?: number; // Antecedência no momento do cadastro
  hotelName?: string;
  dailySchedule: Record<number, { id: string; title: string; time?: string; category: string }[]>;
};

/**
 * Agendador inteligente de alertas de viagem:
 * 1. NÃO dispara notificações no momento do cadastro da viagem.
 * 2. Se faltam >3 dias no cadastro (ex: 5 dias): avisa 3 dias antes e 1 dia antes da viagem.
 * 3. Se faltam <=3 dias no cadastro (ex: 2 dias): avisa SOMENTE 1 dia antes da viagem (ignora o aviso de 3 dias).
 * 4. Avisa EXATAMENTE 2 HORAS antes do horário marcado de cada passeio no dia do evento.
 */
export function useTripAlertScheduler(userId: string | undefined) {
  const qc = useQueryClient();

  useEffect(() => {
    if (!userId || typeof window === "undefined") return;

    let cancelled = false;

    async function checkTripAlerts() {
      if (!userId) return;
      const uid = userId;
      const savedRaw = localStorage.getItem("borapass:trip-plans");
      if (!savedRaw) return;

      let trips: TripPlanItem[] = [];
      try {
        trips = JSON.parse(savedRaw);
      } catch {
        return;
      }

      if (!trips.length) return;

      const now = new Date();
      const todayZero = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();

      const { data: existingNotifs } = await supabase
        .from("notifications")
        .select("type")
        .eq("user_id", uid);

      if (cancelled) return;

      const sentTypes = new Set((existingNotifs ?? []).map((n) => n.type));
      const alertsToInsert: Array<{ user_id: string; type: string; title: string; body: string }> =
        [];

      for (const trip of trips) {
        if (!trip.startDate) continue;

        const [year, month, day] = trip.startDate.split("-").map(Number);
        if (!year || !month || !day) continue;

        const startZero = new Date(year, month - 1, day).getTime();
        const diffDays = Math.round((startZero - todayZero) / (1000 * 60 * 60 * 24));
        const initialDiff = trip.initialDiffDaysAtCreation ?? diffDays;

        // 1. Alerta de 3 dias antes (apenas se no momento do cadastro faltavam mais de 3 dias)
        if (initialDiff > 3 && diffDays === 3) {
          const typeKey = `trip_3d_${trip.id}`;
          if (!sentTypes.has(typeKey)) {
            alertsToInsert.push({
              user_id: uid,
              type: typeKey,
              title: `✈️ Faltam 3 dias para sua viagem!`,
              body: `Contagem regressiva: faltam apenas 3 dias para sua viagem para ${trip.destinationCity}!`,
            });
          }
        }

        // 2. Alerta de 1 dia antes
        if (diffDays === 1) {
          const typeKey = `trip_1d_${trip.id}`;
          if (!sentTypes.has(typeKey)) {
            alertsToInsert.push({
              user_id: uid,
              type: typeKey,
              title: `✈️ É amanhã! Sua viagem para ${trip.destinationCity}`,
              body: `Sua viagem para ${trip.destinationCity} começa amanhã. Confira seu roteiro diário no app!`,
            });
          }
        }

        // 3. Alertas dos passeios: EXATAMENTE 2 HORAS ANTES do horário do passeio no dia marcado
        for (let d = 1; d <= trip.daysCount; d++) {
          const actDate = new Date(year, month - 1, day + (d - 1));
          const actDateZero = new Date(
            actDate.getFullYear(),
            actDate.getMonth(),
            actDate.getDate(),
          ).getTime();

          if (actDateZero === todayZero) {
            const activities = trip.dailySchedule[d] || [];
            for (const act of activities) {
              const timeStr = act.time || "10:00";
              const [h, m] = timeStr.split(":").map(Number);
              const actTimeMs = new Date(
                now.getFullYear(),
                now.getMonth(),
                now.getDate(),
                h || 10,
                m || 0,
              ).getTime();
              const twoHoursBeforeMs = actTimeMs - 2 * 60 * 60 * 1000;

              // Dispara se estamos no intervalo entre 2 horas antes e a hora do passeio
              if (
                now.getTime() >= twoHoursBeforeMs &&
                now.getTime() <= actTimeMs + 30 * 60 * 1000
              ) {
                const typeKey = `trip_act_2h_${trip.id}_d${d}_${act.id}`;
                if (!sentTypes.has(typeKey)) {
                  alertsToInsert.push({
                    user_id: uid,
                    type: typeKey,
                    title: `⏰ Passeio em 2 horas! (${timeStr})`,
                    body: `Seu passeio "${act.title}" em ${trip.destinationCity} está agendado para às ${timeStr}. Prepare-se!`,
                  });
                }
              }
            }
          }
        }
      }

      if (alertsToInsert.length > 0 && !cancelled) {
        const { error } = await supabase.from("notifications").insert(alertsToInsert);
        if (!error) {
          qc.invalidateQueries({ queryKey: ["notifications", userId] });
        }
      }
    }

    checkTripAlerts();
    const interval = setInterval(checkTripAlerts, 60000);

    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, [userId, qc]);
}

/** Dummy function for compatibility */
export async function scheduleTripAlerts(
  _userId: string | undefined,
  _tripPlan: Record<string, unknown>,
) {
  return Promise.resolve();
}
