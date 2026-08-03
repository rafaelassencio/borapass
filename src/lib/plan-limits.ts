import { useState, useEffect, useMemo } from "react";
import { useAuth } from "@/hooks/use-auth";
import { useRoles } from "@/hooks/use-roles";

export type UserPlanType = "free" | "premium";

export interface PlanLimits {
  couponsPerDay: number;
  allowExclusiveCoupons: boolean;
  activeTrips: number;
  experiencesPerDay: number;
  maxFavorites: number;
  allowBoraPlanejaAI: boolean;
  allowPrioritySupport: boolean;
  allowExclusiveCampaigns: boolean;
  allowFullHistory: boolean;
}

export const PLAN_LIMITS: Record<UserPlanType, PlanLimits> = {
  free: {
    couponsPerDay: 1,
    allowExclusiveCoupons: false,
    activeTrips: 1,
    experiencesPerDay: 3,
    maxFavorites: 30,
    allowBoraPlanejaAI: false,
    allowPrioritySupport: false,
    allowExclusiveCampaigns: false,
    allowFullHistory: false,
  },
  premium: {
    couponsPerDay: Infinity,
    allowExclusiveCoupons: true,
    activeTrips: Infinity,
    experiencesPerDay: Infinity,
    maxFavorites: Infinity,
    allowBoraPlanejaAI: true,
    allowPrioritySupport: true,
    allowExclusiveCampaigns: true,
    allowFullHistory: true,
  },
};

export interface UsageStats {
  couponsTodayCount: number;
  couponsTodayLimit: number;
  activeTripsCount: number;
  activeTripsLimit: number;
  favoritesCount: number;
  favoritesLimit: number;
  isNearFavoritesLimit: boolean;
  isAtFavoritesLimit: boolean;
  isNearTripsLimit: boolean;
  isAtTripsLimit: boolean;
  isNearCouponsLimit: boolean;
  isAtCouponsLimit: boolean;
}

export function getTodayDateString(): string {
  return new Date().toISOString().split("T")[0];
}

// Get count of coupons redeemed today from localStorage
export function getCouponsRedeemedTodayCount(): number {
  if (typeof window === "undefined") return 0;
  try {
    const saved = localStorage.getItem("borapass:redeemed-coupons");
    if (!saved) return 0;
    const list = JSON.parse(saved);
    if (!Array.isArray(list)) return 0;

    const todayStr = getTodayDateString();
    const todayItems = list.filter((item: any) => {
      if (!item.redeemed_at) return false;
      return item.redeemed_at.startsWith(todayStr);
    });
    return todayItems.length;
  } catch {
    return 0;
  }
}

// Custom hook to check and observe user plan limits in real time
export function usePlanLimits() {
  const { user } = useAuth();
  const { isPremium } = useRoles(user?.id);
  const planType: UserPlanType = isPremium ? "premium" : "free";
  const limits = PLAN_LIMITS[planType];

  const [couponsTodayCount, setCouponsTodayCount] = useState<number>(() =>
    getCouponsRedeemedTodayCount(),
  );

  useEffect(() => {
    function handleStorage() {
      setCouponsTodayCount(getCouponsRedeemedTodayCount());
    }
    if (typeof window !== "undefined") {
      window.addEventListener("storage", handleStorage);
      window.addEventListener("borapass:coupons-changed", handleStorage);
    }
    return () => {
      if (typeof window !== "undefined") {
        window.removeEventListener("storage", handleStorage);
        window.removeEventListener("borapass:coupons-changed", handleStorage);
      }
    };
  }, []);

  const getUsage = (favoritesCount: number, activeTripsCount: number): UsageStats => {
    const couponsLimit = limits.couponsPerDay;
    const tripsLimit = limits.activeTrips;
    const favsLimit = limits.maxFavorites;

    return {
      couponsTodayCount,
      couponsTodayLimit: couponsLimit,
      activeTripsCount,
      activeTripsLimit: tripsLimit,
      favoritesCount,
      favoritesLimit: favsLimit,
      isNearFavoritesLimit: !isPremium && favoritesCount >= 25 && favoritesCount < 30,
      isAtFavoritesLimit: !isPremium && favoritesCount >= 30,
      isNearTripsLimit: !isPremium && activeTripsCount >= 1,
      isAtTripsLimit: !isPremium && activeTripsCount >= 1,
      isNearCouponsLimit: !isPremium && couponsTodayCount >= 1,
      isAtCouponsLimit: !isPremium && couponsTodayCount >= 1,
    };
  };

  return {
    isPremium,
    planType,
    limits,
    couponsTodayCount,
    getUsage,
  };
}
