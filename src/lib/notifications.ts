import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";

export type Notification = Database["public"]["Tables"]["notifications"]["Row"];

export function useNotifications(userId: string | undefined) {
  return useQuery({
    queryKey: ["notifications", userId],
    enabled: !!userId,
    queryFn: async () => {
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
 * Runs whenever the home page mounts.
 */
export function useAutoGenerateAlerts(userId: string | undefined, cityId: string | null | undefined) {
  const qc = useQueryClient();
  useEffect(() => {
    if (!userId) return;
    let cancelled = false;
    (async () => {
      const dayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
      // Events approved for today (city matches if set)
      let evQ = supabase
        .from("listings")
        .select("id, title, city")
        .eq("category", "evento")
        .eq("status", "approved")
        .eq("active", true)
        .gte("updated_at", dayAgo);
      if (cityId) evQ = evQ.eq("city_id", cityId);
      // Coupons created recently
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
      const known = new Set(
        (existing.data ?? []).map((n) => `${n.type}:${n.listing_id ?? ""}`),
      );
      const rows: Array<{ user_id: string; type: string; title: string; body: string | null; listing_id: string }> = [];
      for (const e of ev.data ?? []) {
        const key = `event_today:${e.id}`;
        if (known.has(key)) continue;
        rows.push({ user_id: userId, type: "event_today", title: "Evento hoje na sua cidade", body: e.title, listing_id: e.id });
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
        // insert requires staff via RLS; fallback: skip silently if not allowed
        const { error } = await supabase.from("notifications").insert(rows);
        if (!error) qc.invalidateQueries({ queryKey: ["notifications", userId] });
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [userId, cityId, qc]);
}
