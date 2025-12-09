"use client";

import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/lib/supabase";
import { useEffect, useState } from "react";
import SearchBar from "@/components/inputs/SearchBar";
import Link from "next/link";
import { Clock, MapPin, Trash2 } from "lucide-react";

function formatTime(value: string | null | undefined) {
  if (!value) return "";
  const parts = String(value).split(":");
  if (parts.length >= 2) return `${parts[0]}:${parts[1]}`;
  return value;
}

export default function Home() {
  const user = useAuth();
  const [todayAppointments, setTodayAppointments] = useState<any[]>([]);
  const [recentNotes, setRecentNotes] = useState<any[]>([]);
  const [quickNote, setQuickNote] = useState("");

  async function loadTodayAppointments() {
    const today = new Date().toISOString().split("T")[0];

    const { data } = await supabase
      .from("appointments")
      .select(
        "id, title, date, time, location, customer_name, customers(first_name, last_name)"
      )
      .eq("date", today)
      .order("time", { ascending: true });

    setTodayAppointments(data || []);
  }

  async function loadRecentNotes() {
    const { data } = await supabase
      .from("notes")
      .select("id, content, created_at, customer_id")
      .is("customer_id", null) // alleen algemene notities op home
      .order("created_at", { ascending: false })
      .limit(3);

    setRecentNotes(data || []);
  }

  async function saveQuickNote() {
    if (!quickNote.trim()) return;

    await supabase.from("notes").insert({
      content: quickNote.trim(),
      customer_id: null,
    });

    setQuickNote("");
    loadRecentNotes();
  }

  async function deleteAppointment(id: string) {
    if (!confirm("Afspraak verwijderen?")) return;

    setTodayAppointments((prev) => prev.filter((a) => a.id !== id));

    const { error } = await supabase.from("appointments").delete().eq("id", id);
    if (error) {
      console.error(error);
      alert("Verwijderen mislukt, probeer opnieuw");
      loadTodayAppointments();
    }
  }

  async function deleteNote(id: string) {
    if (!confirm("Notitie verwijderen?")) return;

    setRecentNotes((prev) => prev.filter((n) => n.id !== id));

    const { error } = await supabase.from("notes").delete().eq("id", id);
    if (error) {
      console.error(error);
      alert("Verwijderen mislukt, probeer opnieuw");
      loadRecentNotes();
    }
  }

  async function copyLocation(text: string) {
    try {
      await navigator.clipboard.writeText(text);
      alert("Adres gekopieerd naar klembord");
    } catch (e) {
      console.error(e);
      alert("Kopiëren mislukt");
    }
  }

  useEffect(() => {
    if (!user) return;
    loadTodayAppointments();
    loadRecentNotes();
  }, [user]);

  if (!user) return null;

  return (
    <div className="p-4 pb-24">
      <h1 className="text-xl font-bold mb-4">Vandaag</h1>

      {/* GLOBAL SEARCH */}
      <SearchBar />

      {/* TODAY APPOINTMENTS */}
      <div className="mt-6">
        <div className="flex items-center justify-between mb-2">
          <h2 className="text-lg font-semibold">Afspraken vandaag</h2>
          <Link href="/calendar" className="text-xs text-blue-500">
            Bekijk alle →
          </Link>
        </div>

        {todayAppointments.length === 0 && (
          <p className="text-gray-400 text-sm">
            Geen afspraken gepland voor vandaag.
          </p>
        )}

        <div className="space-y-3">
          {todayAppointments.map((app: any) => (
            <div
              key={app.id}
              className="border p-4 rounded-xl bg-white relative"
            >
              <button
                type="button"
                onClick={() => deleteAppointment(app.id)}
                className="absolute top-2 right-2 p-1 rounded-full hover:bg-red-50 text-red-500"
              >
                <Trash2 size={14} />
              </button>

              <p className="font-semibold">{app.title}</p>

              <p className="text-sm text-gray-500 flex items-center gap-1 mt-1">
                <Clock size={14} />
                <span>{formatTime(app.time)}</span>
              </p>

              {app.customers ? (
                <p className="text-xs text-gray-400 mt-1">
                  Klant: {app.customers.first_name} {app.customers.last_name}
                </p>
              ) : app.customer_name ? (
                <p className="text-xs text-gray-400 mt-1">
                  Klant: {app.customer_name}
                </p>
              ) : null}

              {app.location && (
                <button
                  type="button"
                  onClick={() => copyLocation(app.location)}
                  className="mt-1 flex items-center gap-1 text-xs text-blue-600 underline-offset-2 hover:underline"
                >
                  <MapPin size={12} />
                  <span>{app.location}</span>
                </button>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* QUICK NOTES */}
      <div className="mt-8">
        <div className="flex items-center justify-between mb-2">
          <h2 className="text-lg font-semibold">Snelle notities</h2>
          <Link href="/notes" className="text-xs text-blue-500">
            Alle notities →
          </Link>
        </div>

        <div className="bg-gray-100 p-4 rounded-xl space-y-2 mb-3">
          <textarea
            className="input min-h-[60px]"
            placeholder="Snel iets noteren..."
            value={quickNote}
            onChange={(e) => setQuickNote(e.target.value)}
          />
          <button
            onClick={saveQuickNote}
            className="w-full bg-black text-white p-2 rounded-lg text-sm"
          >
            Opslaan
          </button>
        </div>

        <div className="space-y-2">
          {recentNotes.length === 0 && (
            <p className="text-gray-400 text-sm">
              Nog geen notities. Tik hierboven om een notitie te maken.
            </p>
          )}

          {recentNotes.map((note) => (
            <div
              key={note.id}
              className="border rounded-xl p-3 text-sm bg-white relative"
            >
              <button
                type="button"
                onClick={() => deleteNote(note.id)}
                className="absolute top-2 right-2 p-1 rounded-full hover:bg-red-50 text-red-500"
              >
                <Trash2 size={14} />
              </button>

              <p>{note.content}</p>
              <p className="text-[11px] text-gray-400 mt-1">
                {new Date(note.created_at).toLocaleString()}
              </p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}