"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/hooks/useAuth";
import {
  Phone,
  Mail,
  CarFront,
  Calendar,
  StickyNote,
  FileText,
  Trash2,
} from "lucide-react";
import Link from "next/link";

type Customer = {
  id: string;
  first_name: string;
  last_name: string | null;
  phone: string | null;
  email: string | null;
};

type Car = {
  id: string;
  license_plate: string | null;
  make: string | null;
  model: string | null;
  year: string | null;
};

type Appointment = {
  id: string;
  title: string;
  date: string;
  time: string;
};

type Note = {
  id: string;
  content: string;
  created_at: string;
};

type Invoice = {
  id: string;
  amount: number;
  status: string;
  created_at: string;
};

export default function CustomerDetailPage() {
  const user = useAuth();
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const customerId = params?.id;

  const [customer, setCustomer] = useState<Customer | null>(null);
  const [cars, setCars] = useState<Car[]>([]);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [notes, setNotes] = useState<Note[]>([]);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);

  async function loadData() {
    if (!customerId) return;

    setLoading(true);

    const [{ data: cust }, { data: carData }, { data: appData }, { data: noteData }, { data: invData }] =
      await Promise.all([
        supabase
          .from("customers")
          .select("id, first_name, last_name, phone, email")
          .eq("id", customerId)
          .single(),
        supabase
          .from("cars")
          .select("id, license_plate, make, model, year")
          .eq("customer_id", customerId)
          .order("created_at", { ascending: false }),
        supabase
          .from("appointments")
          .select("id, title, date, time")
          .eq("customer_id", customerId)
          .order("date", { ascending: false })
          .order("time", { ascending: false }),
        supabase
          .from("notes")
          .select("id, content, created_at")
          .eq("customer_id", customerId)
          .order("created_at", { ascending: false }),
        supabase
          .from("invoices")
          .select("id, amount, status, created_at")
          .eq("customer_id", customerId)
          .order("created_at", { ascending: false }),
      ]);

    setCustomer((cust as Customer) || null);
    setCars((carData as Car[]) || []);
    setAppointments((appData as Appointment[]) || []);
    setNotes((noteData as Note[]) || []);
    setInvoices((invData as Invoice[]) || []);

    setLoading(false);
  }

  async function deleteCustomer() {
    if (!customerId) return;
    if (!confirm("Weet je zeker dat je deze klant wilt verwijderen?")) return;

    await supabase.from("customers").delete().eq("id", customerId);
    router.push("/customers");
  }

  useEffect(() => {
    if (!user) return;
    loadData();
  }, [user, customerId]);

  if (!user) return null;

  if (loading && !customer) {
    return (
      <div className="p-4 pb-24">
        <button
          className="text-sm text-blue-500 mb-3"
          onClick={() => router.back()}
        >
          ← Terug
        </button>
        <p>Klant laden...</p>
      </div>
    );
  }

  if (!customer) {
    return (
      <div className="p-4 pb-24">
        <button
          className="text-sm text-blue-500 mb-3"
          onClick={() => router.back()}
        >
          ← Terug
        </button>
        <p>Klant niet gevonden.</p>
      </div>
    );
  }

  return (
    <div className="p-4 pb-24 space-y-5">
      <div className="flex items-center justify-between">
        <button
          className="text-sm text-blue-500"
          onClick={() => router.back()}
        >
          ← Terug
        </button>
        <button
          type="button"
          onClick={deleteCustomer}
          className="p-1 rounded-full hover:bg-red-50 text-red-500"
        >
          <Trash2 size={16} />
        </button>
      </div>

      {/* Basis info */}
      <div className="bg-white border rounded-xl p-4">
        <p className="text-xs text-gray-400 uppercase mb-1">Klant</p>
        <h1 className="text-2xl font-bold">
          {customer.first_name} {customer.last_name}
        </h1>

        <div className="mt-2 text-sm text-gray-600 space-y-1">
          {customer.phone && (
            <div className="flex items-center gap-2">
              <Phone size={14} />
              <span>{customer.phone}</span>
            </div>
          )}
          {customer.email && (
            <div className="flex items-center gap-2">
              <Mail size={14} />
              <span>{customer.email}</span>
            </div>
          )}
        </div>
      </div>

      {/* Auto's */}
      <div className="bg-white border rounded-xl p-4">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <CarFront size={16} />
            <h2 className="text-sm font-semibold">Auto&apos;s</h2>
          </div>
          <Link
            href="/cars"
            className="text-xs text-blue-500"
          >
            Bekijk alle auto&apos;s →
          </Link>
        </div>

        {cars.length === 0 && (
          <p className="text-xs text-gray-400">
            Nog geen auto&apos;s gekoppeld aan deze klant.
          </p>
        )}

        <div className="space-y-2">
          {cars.map((car) => (
            <Link
              key={car.id}
              href={`/cars/${car.id}`}
              className="block border rounded-lg px-3 py-2 text-sm hover:bg-gray-50"
            >
              <p className="font-medium">
                {car.license_plate || "Onbekend kenteken"}
              </p>
              <p className="text-xs text-gray-500">
                {car.make} {car.model}{" "}
                {car.year && <span className="text-gray-400">({car.year})</span>}
              </p>
            </Link>
          ))}
        </div>
      </div>

      {/* Afspraken */}
      <div className="bg-white border rounded-xl p-4">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <Calendar size={16} />
            <h2 className="text-sm font-semibold">Afspraken</h2>
          </div>
          <Link href="/calendar" className="text-xs text-blue-500">
            Naar agenda →
          </Link>
        </div>

        {appointments.length === 0 && (
          <p className="text-xs text-gray-400">
            Nog geen afspraken voor deze klant.
          </p>
        )}

        <div className="space-y-2">
          {appointments.map((a) => (
            <Link
              key={a.id}
              href={`/appointments/${a.id}`}
              className="block border rounded-lg px-3 py-2 text-sm hover:bg-gray-50"
            >
              <p className="font-medium">{a.title}</p>
              <p className="text-xs text-gray-500">
                {a.date} · {a.time}
              </p>
            </Link>
          ))}
        </div>
      </div>

      {/* Notities */}
      <div className="bg-white border rounded-xl p-4">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <StickyNote size={16} />
            <h2 className="text-sm font-semibold">Notities</h2>
          </div>
          <Link href="/notes" className="text-xs text-blue-500">
            Alle notities →
          </Link>
        </div>

        {notes.length === 0 && (
          <p className="text-xs text-gray-400">
            Nog geen notities voor deze klant.
          </p>
        )}

        <div className="space-y-2">
          {notes.map((n) => (
            <div
              key={n.id}
              className="border rounded-lg px-3 py-2 text-xs bg-gray-50"
            >
              <p>{n.content}</p>
              <p className="text-[10px] text-gray-400 mt-1">
                {new Date(n.created_at).toLocaleString()}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* Facturen */}
      <div className="bg-white border rounded-xl p-4">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <FileText size={16} />
            <h2 className="text-sm font-semibold">Facturen</h2>
          </div>
          <Link href="/invoices" className="text-xs text-blue-500">
            Alle facturen →
          </Link>
        </div>

        {invoices.length === 0 && (
          <p className="text-xs text-gray-400">
            Nog geen facturen voor deze klant.
          </p>
        )}

        <div className="space-y-2">
          {invoices.map((inv) => (
            <div
              key={inv.id}
              className="border rounded-lg px-3 py-2 text-xs bg-gray-50 flex items-center justify-between"
            >
              <div>
                <p className="font-medium">
                  €{" "}
                  {inv.amount.toLocaleString("nl-NL", {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  })}
                </p>
                <p className="text-[10px] text-gray-400">
                  {new Date(inv.created_at).toLocaleDateString()}
                </p>
              </div>
              <span className="text-[10px] uppercase px-2 py-1 rounded-full bg-slate-100 text-slate-500">
                {inv.status}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}