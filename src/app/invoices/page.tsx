"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/hooks/useAuth";
import { Trash2, Euro } from "lucide-react";

type InvoiceStatus = "draft" | "sent" | "paid" | "cancelled";

type InvoiceRow = {
  id: string;
  amount: number;
  status: InvoiceStatus;
  created_at: string;
  issued_at: string | null;
  due_date: string | null;
  customer_name: string | null;
  customers: {
    id: string;
    first_name: string;
    last_name: string | null;
  } | null;
  cars: {
    id: string;
    license_plate: string | null;
  } | null;
};

type CustomerOption = {
  id: string;
  first_name: string;
  last_name: string | null;
};

type CarOption = {
  id: string;
  license_plate: string | null;
};

const STATUS_OPTIONS: InvoiceStatus[] = [
  "draft",
  "sent",
  "paid",
  "cancelled",
];

function formatDate(dateStr: string | null) {
  if (!dateStr) return "-";
  try {
    return new Date(dateStr).toLocaleDateString("nl-NL");
  } catch {
    return dateStr;
  }
}

function formatAmount(value: number) {
  if (value == null) return "€ 0,00";
  return (
    "€ " +
    value.toLocaleString("nl-NL", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })
  );
}

export default function InvoicesPage() {
  const user = useAuth();
  const [invoices, setInvoices] = useState<InvoiceRow[]>([]);
  const [customers, setCustomers] = useState<CustomerOption[]>([]);
  const [cars, setCars] = useState<CarOption[]>([]);
  const [loading, setLoading] = useState(true);

  // form state
  const [customerId, setCustomerId] = useState("");
  const [carId, setCarId] = useState("");
  const [amount, setAmount] = useState("");
  const [status, setStatus] = useState<InvoiceStatus>("draft");
  const [issuedAt, setIssuedAt] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [saving, setSaving] = useState(false);

  async function loadInvoices() {
    const { data, error } = await supabase
      .from("invoices")
      .select(
        `
        id, amount, status, created_at, issued_at, due_date, customer_name,
        customers(id, first_name, last_name),
        cars(id, license_plate)
      `
      )
      .order("created_at", { ascending: false });

    if (error) {
      console.error(error);
      return;
    }

    const normalized: InvoiceRow[] = ((data as any[]) || []).map((row) => ({
      id: row.id,
      amount: row.amount,
      status: row.status as InvoiceStatus,
      created_at: row.created_at,
      issued_at: row.issued_at,
      due_date: row.due_date,
      customer_name: row.customer_name ?? null,
      customers: row.customers?.[0]
        ? {
            id: row.customers[0].id,
            first_name: row.customers[0].first_name,
            last_name: row.customers[0].last_name,
          }
        : null,
      cars: row.cars?.[0]
        ? {
            id: row.cars[0].id,
            license_plate: row.cars[0].license_plate,
          }
        : null,
    }));

    setInvoices(normalized);
    setLoading(false);
  }

  async function loadRelations() {
    const [{ data: cust }, { data: carData }] = await Promise.all([
      supabase
        .from("customers")
        .select("id, first_name, last_name")
        .order("first_name", { ascending: true }),
      supabase
        .from("cars")
        .select("id, license_plate")
        .order("created_at", { ascending: false }),
    ]);

    setCustomers((cust as CustomerOption[]) || []);
    setCars((carData as CarOption[]) || []);
  }

  async function addInvoice() {
    if (!customerId) {
      return alert("Klant is verplicht voor een factuur.");
    }
    if (!amount.trim()) {
      return alert("Bedrag is verplicht.");
    }

    const normalizedAmount = amount.replace(",", ".").trim();
    const parsed = Number(normalizedAmount);
    if (Number.isNaN(parsed) || parsed <= 0) {
      return alert("Voer een geldig bedrag in.");
    }

    // naam van de gekozen klant ook als plain tekst opslaan
    const selectedCustomer = customers.find((c) => c.id === customerId);
    const customerName = selectedCustomer
      ? `${selectedCustomer.first_name} ${selectedCustomer.last_name ?? ""}`.trim()
      : null;

    setSaving(true);

    const { error } = await supabase.from("invoices").insert({
      customer_id: customerId,
      customer_name: customerName,
      car_id: carId || null,
      amount: parsed,
      status,
      issued_at: issuedAt || null,
      due_date: dueDate || null,
    });

    setSaving(false);

    if (error) {
      console.error(error);
      alert("Factuur opslaan mislukt, probeer opnieuw.");
      return;
    }

    // form leegmaken
    setCustomerId("");
    setCarId("");
    setAmount("");
    setStatus("draft");
    setIssuedAt("");
    setDueDate("");

    loadInvoices();
  }

  async function deleteInvoice(id: string) {
    if (!confirm("Factuur verwijderen?")) return;

    setInvoices((prev) => prev.filter((i) => i.id !== id));

    const { error } = await supabase.from("invoices").delete().eq("id", id);
    if (error) {
      console.error(error);
      alert("Verwijderen mislukt, lijst wordt opnieuw geladen.");
      loadInvoices();
    }
  }

  async function updateStatus(id: string, newStatus: InvoiceStatus) {
    setInvoices((prev) =>
      prev.map((inv) =>
        inv.id === id ? { ...inv, status: newStatus } : inv
      )
    );

    const { error } = await supabase
      .from("invoices")
      .update({ status: newStatus })
      .eq("id", id);

    if (error) {
      console.error(error);
      alert("Status aanpassen mislukt, lijst wordt opnieuw geladen.");
      loadInvoices();
    }
  }

  useEffect(() => {
    if (!user) return;
    loadInvoices();
    loadRelations();
  }, [user]);

  if (!user) return null;

  return (
    <div className="p-4 pb-24">
      <h1 className="text-xl font-bold mb-4">Facturen</h1>

      {/* NIEUWE FACTUUR */}
      <div className="bg-gray-100 p-4 rounded-xl space-y-2 mb-6">
        <h2 className="text-sm font-semibold mb-1">Nieuwe factuur</h2>

        <select
          className="input"
          value={customerId}
          onChange={(e) => setCustomerId(e.target.value)}
        >
          <option value="">Kies een klant...</option>
          {customers.map((c) => (
            <option key={c.id} value={c.id}>
              {c.first_name} {c.last_name ?? ""}
            </option>
          ))}
        </select>

        <select
          className="input"
          value={carId}
          onChange={(e) => setCarId(e.target.value)}
        >
          <option value="">(Optioneel) koppel een auto...</option>
          {cars.map((c) => (
            <option key={c.id} value={c.id}>
              {c.license_plate ?? "Onbekend kenteken"}
            </option>
          ))}
        </select>

        <input
          className="input"
          placeholder="Bedrag (bijv. 199,95)"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
        />

        <div className="flex gap-2">
          <input
            type="date"
            className="input"
            value={issuedAt}
            onChange={(e) => setIssuedAt(e.target.value)}
          />
          <input
            type="date"
            className="input"
            value={dueDate}
            onChange={(e) => setDueDate(e.target.value)}
            placeholder="Vervaldatum"
          />
        </div>

        <div className="flex gap-2 flex-wrap">
          {STATUS_OPTIONS.map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => setStatus(s)}
              className={`px-2 py-1 rounded-full text-[11px] border ${
                status === s
                  ? "bg-black text-white border-black"
                  : "bg-white text-gray-600 border-gray-300"
              }`}
            >
              {s.toUpperCase()}
            </button>
          ))}
        </div>

        <button
          onClick={addInvoice}
          disabled={saving}
          className="w-full bg-black text-white p-3 rounded-lg text-sm disabled:opacity-60"
        >
          {saving ? "Factuur opslaan..." : "Factuur toevoegen"}
        </button>
      </div>

      {/* LIJST MET FACTUREN */}
      {loading ? (
        <p className="text-sm text-gray-500">Facturen laden...</p>
      ) : invoices.length === 0 ? (
        <p className="text-sm text-gray-500">
          Nog geen facturen aangemaakt.
        </p>
      ) : (
        <div className="space-y-3">
          {invoices.map((inv) => {
            const displayName = inv.customers
              ? `${inv.customers.first_name} ${
                  inv.customers.last_name ?? ""
                }`.trim()
              : inv.customer_name || "Onbekende klant";

            return (
              <div
                key={inv.id}
                className="border rounded-xl p-4 bg-white shadow-sm"
              >
                {/* HEADER */}
                <div className="flex items-start justify-between gap-4 mb-1">
                  <div>
                    <p className="font-semibold">{displayName}</p>
                    {inv.cars?.license_plate && (
                      <p className="text-xs text-gray-500">
                        Auto: {inv.cars.license_plate}
                      </p>
                    )}
                  </div>

                  <div className="flex items-center gap-3">
                    <p className="font-semibold whitespace-nowrap flex items-center gap-1">
                      <Euro size={14} />
                      {formatAmount(inv.amount).replace("€ ", "")}
                    </p>
                    <button
                      type="button"
                      onClick={() => deleteInvoice(inv.id)}
                      className="p-1 rounded-full hover:bg-red-50 text-red-500 flex-shrink-0"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>

                {/* DATUMS */}
                <p className="text-xs text-gray-400 mb-2">
                  Aangemaakt: {formatDate(inv.created_at)} · Uitgegeven:{" "}
                  {formatDate(inv.issued_at)} · Vervaldatum:{" "}
                  {formatDate(inv.due_date)}
                </p>

                {/* STATUS */}
                <div className="flex items-center justify-between gap-2 flex-wrap">
                  <div className="flex gap-2 flex-wrap">
                    {STATUS_OPTIONS.map((s) => (
                      <button
                        key={s}
                        onClick={() => updateStatus(inv.id, s)}
                        className={`px-2 py-1 rounded-full text-[11px] border ${
                          inv.status === s
                            ? "bg-black text-white border-black"
                            : "bg-white text-gray-600 border-gray-300"
                        }`}
                      >
                        {s.toUpperCase()}
                      </button>
                    ))}
                  </div>
                  <span className="text-[11px] text-gray-500">
                    Status: {inv.status.toUpperCase()}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}