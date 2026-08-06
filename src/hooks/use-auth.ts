import { useAuthContext } from "@/context/AuthContext";

export type Profile = {
  id: string;
  full_name: string | null;
  avatar_url: string | null;
  city: string | null;
};

export function useAuth() {
  const { session, user, loading, isLoaded } = useAuthContext();
  return { session, user, loading: loading || !isLoaded };
}

export function useProfile(userId: string | undefined) {
  const { profile } = useAuthContext();
  if (!userId) return null;
  return profile;
}
