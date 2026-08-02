import { useEffect, useState } from "react";
import type { Session, User } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";

export type Profile = {
  id: string;
  full_name: string | null;
  avatar_url: string | null;
  city: string | null;
};

export function useAuth() {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;

    function checkLocalSession(): User | null {
      if (typeof window === "undefined") return null;
      try {
        const saved = localStorage.getItem("borapass:local-session");
        if (saved) return JSON.parse(saved);
      } catch {
        /* fallback */
      }
      return null;
    }

    const { data: sub } = supabase.auth.onAuthStateChange((_event, s) => {
      if (!isMounted) return;
      if (s) {
        setSession(s);
        setUser(s.user);
      } else {
        const local = checkLocalSession();
        if (local) {
          setUser(local);
          setSession({ user: local } as unknown as Session);
        } else {
          setSession(null);
          setUser(null);
        }
      }
    });

    const timeoutPromise = new Promise<{ data: { session: Session | null } }>((resolve) =>
      setTimeout(() => resolve({ data: { session: null } }), 2000),
    );

    Promise.race([supabase.auth.getSession(), timeoutPromise])
      .then(({ data }) => {
        if (!isMounted) return;
        if (data?.session) {
          setSession(data.session);
          setUser(data.session.user);
        } else {
          const local = checkLocalSession();
          if (local) {
            setUser(local);
            setSession({ user: local } as unknown as Session);
          }
        }
      })
      .catch(() => {
        if (!isMounted) return;
        const local = checkLocalSession();
        if (local) {
          setUser(local);
          setSession({ user: local } as unknown as Session);
        }
      })
      .finally(() => {
        if (isMounted) setLoading(false);
      });

    const handleLocalAuthChange = () => {
      const local = checkLocalSession();
      if (local) {
        setUser(local);
        setSession({ user: local } as unknown as Session);
      } else {
        setSession(null);
        setUser(null);
      }
    };

    if (typeof window !== "undefined") {
      window.addEventListener("borapass:auth-changed", handleLocalAuthChange);
    }

    return () => {
      isMounted = false;
      sub.subscription.unsubscribe();
      if (typeof window !== "undefined") {
        window.removeEventListener("borapass:auth-changed", handleLocalAuthChange);
      }
    };
  }, []);

  return { session, user, loading };
}

export function useProfile(userId: string | undefined) {
  const [profile, setProfile] = useState<Profile | null>(null);
  useEffect(() => {
    if (!userId) {
      setProfile(null);
      return;
    }
    supabase
      .from("profiles")
      .select("id, full_name, avatar_url, city")
      .eq("id", userId)
      .maybeSingle()
      .then(
        ({ data }) => setProfile(data as Profile | null),
        () => setProfile(null),
      );
  }, [userId]);
  return profile;
}
