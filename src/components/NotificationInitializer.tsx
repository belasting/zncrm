"use client";

import { useEffect } from "react";
import { supabase } from "@/lib/supabase";

const STORAGE_KEY = "zncrm_notified_appointments";

export default function NotificationInitializer() {
  useEffect(() => {
    if (typeof window === "undefined") return;
    if (!("Notification" in window)) return;

    if (Notification.permission === "default") {
      Notification.requestPermission().catch(() => {});
    }

    let cancelled = false;

    const loadNotifiedSet = () => {
      try {
        const raw = localStorage.getItem(STORAGE_KEY);
        if (!raw) return new Set<string>();
        return new Set(JSON.parse(raw) as string[]);
      } catch {
        return new Set<string>();
      }
    };

    const saveNotifiedSet = (set: Set<string>) => {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify([...set]));
      } catch {
        // boeit niet als dit faalt
      }
    };

    const checkAppointments = async () => {
      if (cancelled) return;
      if (Notification.permission !== "granted") return;

      const today = new Date().toISOString().split("T")[0];

      const { data, error } = await supabase
        .from("appointments")
        .select("id, title, date, time, location")
        .eq("date", today);

      if (error || !data) return;

      const now = new Date();
      const notifiedSet = loadNotifiedSet();

      for (const app of data as any[]) {
        if (!app.time || !app.date) continue;

        const [yStr, moStr, dStr] = String(app.date).split("-");
        const [hStr, mStr] = String(app.time).split(":");

        const y = Number(yStr);
        const mo = Number(moStr);
        const d = Number(dStr);
        const h = Number(hStr);
        const m = Number(mStr);

        if ([y, mo, d, h, m].some((n) => Number.isNaN(n))) continue;

        const appointmentDate = new Date(y, mo - 1, d, h, m);
        const diffMinutes =
          (appointmentDate.getTime() - now.getTime()) / 60000;

        if (diffMinutes <= 15 && diffMinutes >= 0 && !notifiedSet.has(app.id)) {
          const title = app.title || "Afspraak";
          const parts = [app.time];
          if (app.location) parts.push(app.location);
          const body = parts.join(" · ");

          try {
            new Notification(title, { body });
          } catch {
            // ignore
          }

          notifiedSet.add(app.id);
        }
      }

      saveNotifiedSet(notifiedSet);
    };

    checkAppointments();
    const intervalId = setInterval(checkAppointments, 60_000);

    return () => {
      cancelled = true;
      clearInterval(intervalId);
    };
  }, []);

  return null;
}