"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/hooks/useAuth";
import { Trash2 } from "lucide-react";
import Link from "next/link";

type NoteRow = {
  id: string;
  content: string;
  created_at: string;
  customers?: { id: string; first_name: string; last_name: string | null } | null;
};

type CustomerRow = {
  id: string;
  first_name: string;
  last_name: string | null;
};

export default function NotesPage() {
  const user = useAuth();
  const [notes, setNotes] = useState<NoteRow[]>([]);
  const [customers, setCustomers] = useState<CustomerRow[]>([]);
  const [content, setContent] = useState("");
  const [customerId, setCustomerId] = useState("");
  const [saving, setSaving] = useState(false);

  async function loadData() {
    const { data: noteData } = await supabase
      .from("notes")
      .select("id, content, created_at, customers(id, first_name, last_name)")
      .order("created_at", { ascending: false });

    const { data: custData } = await supabase
      .from("customers")
      .select("id, first_name, last_name")
      .order("first_name", { ascending: true });

    setNotes((noteData as any[]) || []);
    setCustomers((custData as CustomerRow[]) || []);
  }

  async function addNote() {
    if (!content.trim()) {
      return alert("Notitie mag niet leeg zijn");
    }

    setSaving(true);
    await supabase.from("notes").insert({
      content: content.trim(),
      customer_id: customerId || null,
    });
    setSaving(false);

    setContent("");
    setCustomerId("");
    loadData();
  }

  // ✅ snappy delete: eerst uit UI, dan Supabase
  async function deleteNote(id: string) {
    if (!confirm("Notitie verwijderen?")) return;

    // direct uit de lijst
    setNotes((prev) => prev.filter((n) => n.id !== id));

    const { error } = await supabase.from("notes").delete().eq("id", id);
    if (error) {
      console.error(error);
      alert("Verwijderen mislukt, probeer opnieuw");
      loadData(); // lijst herstellen
    }
  }

  useEffect(() => {
    if (!user) return;
    loadData();
  }, [user]);

  if (!user) return null;

  return (
    <div className="p-4 pb-24">
      <h1 className="text-xl font-bold mb-4">Notities</h1>

      {/* FORM */}
      <div className="bg-gray-100 p-4 rounded-xl space-y-2 mb-6">
        <textarea
          className="input min-h-[70px]"
          placeholder="Nieuwe notitie..."
          value={content}
          onChange={(e) => setContent(e.target.value)}
        />
        <select
          className="input"
          value={customerId}
          onChange={(e) => setCustomerId(e.target.value)}
        >
          <option value="">Algemene notitie (geen klant)</option>
          {customers.map((c) => (
            <option key={c.id} value={c.id}>
              {c.first_name} {c.last_name}
            </option>
          ))}
        </select>
        <button
          onClick={addNote}
          disabled={saving}
          className="w-full bg-black text-white p-3 rounded-lg disabled:opacity-60 text-sm"
        >
          {saving ? "Opslaan..." : "Notitie toevoegen"}
        </button>
      </div>

      {/* LIST */}
      <div className="space-y-2">
        {notes.length === 0 && (
          <p className="text-gray-400 text-sm">
            Nog geen notities aangemaakt.
          </p>
        )}

        {notes.map((note) => (
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

            <div className="flex items-center justify-between mt-2">
              <p className="text-[11px] text-gray-400">
                {new Date(note.created_at).toLocaleString()}
              </p>

              {note.customers && (
                <Link
                  href={`/customers/${note.customers.id}`}
                  className="text-[11px] text-blue-600 underline-offset-2 hover:underline"
                >
                  Klant: {note.customers.first_name}{" "}
                  {note.customers.last_name}
                </Link>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}