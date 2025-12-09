"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { useRouter, usePathname } from "next/navigation";

export function useAuth() {
  const [user, setUser] = useState<any | null>(null);
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    let cancelled = false;

    async function check() {
      const { data } = await supabase.auth.getUser();
      const u = data.user;

      if (!u) {
        if (pathname !== "/login") router.replace("/login");
        return;
      }

      if (!cancelled) {
        setUser(u);
        if (pathname === "/login") router.replace("/");
      }
    }

    check();

    const { data: subscription } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        if (!session?.user) {
          setUser(null);
          if (pathname !== "/login") router.replace("/login");
        } else {
          setUser(session.user);
          if (pathname === "/login") router.replace("/");
        }
      }
    );

    return () => {
      cancelled = true;
      subscription?.subscription?.unsubscribe();
    };
  }, [router, pathname]);

  return user;
}