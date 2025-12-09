"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/hooks/useAuth";
import { Plus, Trash2, Phone, Mail } from "lucide-react";
import Link from "next/link";

type CustomerRow = {
  id: string;
  first_name: string;
  last_name: string | null;
  phone: string | null;
  email: string | null;
};

export default function CustomersPage() {
  const user = useAuth();
  const [customers, setCustomers] = useState<CustomerRow[]>([]);
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [saving, setSaving] = useState(false);

  async function loadCustomers() {
    const { data } = await supabase
      .from("customers")
      .select("id, first_name, last_name, phone, email")
      .order("first_name", { ascending: true });

    setCustomers((data as CustomerRow[]) || []);
  }

  async function addCustomer() {
    if (!firstName.trim()) {
      return alert("Voornaam is verplicht");
    }

    setSaving(true);
    await supabase.from("customers").insert({
      first_name: firstName.trim(),
      last_name: lastName.trim() || null,
      phone: phone.trim() || null,
      email: email.trim() || null,
    });
    setSaving(false);

    setFirstName("");
    setLastName("");
    setPhone("");
    setEmail("");

    loadCustomers();
  }

  async function deleteCustomer(id: string) {
    if (!confirm("Klant verwijderen?")) return;
    await supabase.from("customers").delete().eq("id", id);
    loadCustomers();
  }

  useEffect(() => {
    if (!user) return;
    loadCustomers();
  }, [user]);

  if (!user) return null;

  return (
    <div className="p-4 pb-24">
      <h1 className="text-xl font-bold mb-4">Klanten</h1>

      {/* FORM */}
      <div className="bg-gray-100 p-4 rounded-xl space-y-2 mb-6">
        <div className="flex gap-2">
          <input
            className="input"
            placeholder="Voornaam"
            value={firstName}
            onChange={(e) => setFirstName(e.target.value)}
          />
          <input
            className="input"
            placeholder="Achternaam"
            value={lastName}
            onChange={(e) => setLastName(e.target.value)}
          />
        </div>

        <input
          className="input"
          placeholder="Telefoon"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
        />

        <input
          className="input"
          placeholder="E-mail"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />

        <button
          onClick={addCustomer}
          disabled={saving}
          className="w-full bg-black text-white p-3 rounded-lg flex items-center justify-center gap-2 disabled:opacity-60"
        >
          <Plus size={16} />
          <span>{saving ? "Opslaan..." : "Klant toevoegen"}</span>
        </button>
      </div>

      {/* LIST */}
      <div className="space-y-3">
        {customers.length === 0 && (
          <p className="text-gray-400 text-sm">
            Nog geen klanten toegevoegd.
          </p>
        )}

        {customers.map((c) => (
          <div
            key={c.id}
            className="border rounded-xl p-4 bg-white flex items-start justify-between gap-3 relative"
          >
            <button
              type="button"
              onClick={() => deleteCustomer(c.id)}
              className="absolute top-2 right-2 p-1 rounded-full hover:bg-red-50 text-red-500"
            >
              <Trash2 size={14} />
            </button>

            <Link href={`/customers/${c.id}`} className="flex-1">
              <p className="font-semibold">
                {c.first_name} {c.last_name}
              </p>
              <div className="text-xs text-gray-500 mt-1 space-y-0.5">
                {c.phone && (
                  <div className="flex items-center gap-1">
                    <Phone size={12} />
                    <span>{c.phone}</span>
                  </div>
                )}
                {c.email && (
                  <div className="flex items-center gap-1">
                    <Mail size={12} />
                    <span>{c.email}</span>
                  </div>
                )}
              </div>
            </Link>
          </div>
        ))}
      </div>
    </div>
  );
}