import { toast } from "sonner";

export type TripPlanItem = {
  id: string;
  destinationCity: string;
  cityId?: string | null;
  startDate: string;
  daysCount: number;
  hotelName?: string;
  hotelAddress?: string;
  dailySchedule: Record<number, any[]>;
  created_at: string;
};

export function getSavedTrips(): TripPlanItem[] {
  if (typeof window === "undefined") return [];
  const raw = localStorage.getItem("borapass:trip-plans");
  if (!raw) return [];
  try {
    return JSON.parse(raw);
  } catch {
    return [];
  }
}

export function saveTrips(trips: TripPlanItem[]) {
  if (typeof window !== "undefined") {
    localStorage.setItem("borapass:trip-plans", JSON.stringify(trips));
  }
}

export function findTripForCity(
  cityName?: string | null,
  cityId?: string | null,
): TripPlanItem | null {
  const trips = getSavedTrips();
  if (!trips.length) return null;

  return (
    trips.find((t) => {
      if (cityId && t.cityId === cityId) return true;
      if (cityName && t.destinationCity.toLowerCase().trim() === cityName.toLowerCase().trim())
        return true;
      if (
        cityName &&
        (t.destinationCity.toLowerCase().includes(cityName.toLowerCase()) ||
          cityName.toLowerCase().includes(t.destinationCity.toLowerCase()))
      )
        return true;
      return false;
    }) || null
  );
}

export function addActivityToTrip(
  tripId: string,
  activity: {
    id: string;
    title: string;
    category: string;
    price?: number | null;
    image?: string | null;
    address?: string | null;
  },
  day = 1,
): boolean {
  const trips = getSavedTrips();
  const index = trips.findIndex((t) => t.id === tripId);
  if (index === -1) return false;

  const trip = trips[index];
  if (!trip.dailySchedule) trip.dailySchedule = {};
  if (!trip.dailySchedule[day]) trip.dailySchedule[day] = [];

  const exists = trip.dailySchedule[day].some(
    (a) => a.id === activity.id || a.title === activity.title,
  );
  if (!exists) {
    trip.dailySchedule[day].push({
      id: activity.id || `act-${Date.now()}`,
      title: activity.title,
      category: activity.category || "passeio",
      time: "10:00",
      price: activity.price ?? undefined,
      image: activity.image ?? undefined,
      address: activity.address ?? undefined,
    });
    trips[index] = trip;
    saveTrips(trips);
  }
  return true;
}

export function createQuickTripPlan(
  cityName: string,
  firstActivity?: {
    id: string;
    title: string;
    category: string;
    price?: number | null;
    image?: string | null;
  },
): TripPlanItem {
  const trips = getSavedTrips();
  const today = new Date().toISOString().split("T")[0];
  const newTrip: TripPlanItem = {
    id: `trip-${Date.now()}`,
    destinationCity: cityName,
    startDate: today,
    daysCount: 3,
    dailySchedule: {
      1: firstActivity
        ? [
            {
              id: firstActivity.id,
              title: firstActivity.title,
              category: firstActivity.category || "passeio",
              time: "10:00",
              price: firstActivity.price ?? undefined,
              image: firstActivity.image ?? undefined,
            },
          ]
        : [],
      2: [],
      3: [],
    },
    created_at: new Date().toISOString(),
  };

  saveTrips([newTrip, ...trips]);
  return newTrip;
}
