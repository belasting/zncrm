"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { MapPin, Clock, Trash2 } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";

type CalendarCustomer = {
  id: string;
  first_name: string;
  last_name: string | null;
};

type CalendarCar = {
  id: string;
  license_plate: string | null;
};

type CalendarAppointment = {
  id: string;
  title: string;
  date: string;
  time: string;
  location: string | null;
  customer_name: string | null;
  car_label: string | null;
  customers: { first_name: string; last_name: string | null } | null;
  cars: { license_plate: string | null } | null;
};

function formatTime(value: string | null | undefined) {
  if (!value) return "";
  const parts = String(value).split(":");
  if (parts.length >= 2) return `${parts[0]}:${parts[1]}`;
  return value;
}

export default function CalendarPage() {
  const user = useAuth();
  const [appointments, setAppointments] = useState<CalendarAppointment[]>([]);
  const [customers, setCustomers] = useState<CalendarCustomer[]>([]);
  const [cars, setCars] = useState<CalendarCar[]>([]);
  const [loading, setLoading] = useState(true);

  const [customerText, setCustomerText] = useState("");
  const [carText, setCarText] = useState("");
  const [title, setTitle] = useState("");
  const [date, setDate] = useState("");
  const [time, setTime] = useState("");
  const [location, setLocation] = useState("");

  async function loadData() {
    setLoading(true);

    const [{ data: a }, { data: cust }, { data: carData }] = await Promise.all(
      [
        supabase
          .from("appointments")
          .select(
            "id, title, date, time, location, customer_name, car_label, customers(first_name, last_name), cars(license_plate)"
          )
          .order("date", { ascending: true })
          .order("time", { ascending: true }),
        supabase
          .from("customers")
          .select("id, first_name, last_name")
          .order("first_name", { ascending: true }),
        supabase
          .from("cars")
          .select("id, license_plate")
          .order("created_at", { ascending: false }),
      ]
    );

    // 🔧 normalize supabase result -> ons eigen type
    const normalized: CalendarAppointment[] = ((a as any[]) || []).map(
      (row) => ({
        id: row.id,
        title: row.title,
        date: row.date,
        time: row.time,
        location: row.location,
        customer_name: row.customer_name,
        car_label: row.car_label,
        customers: row.customers?.[0]
          ? {
              first_name: row.customers[0].first_name,
              last_name: row.customers[0].last_name,
            }
          : null,
        cars: row.cars?.[0]
          ? {
              license_plate: row.cars[0].license_plate,
            }
          : null,
      })
    );

    setAppointments(normalized);
    setCustomers((cust as CalendarCustomer[]) || []);
    setCars((carData as CalendarCar[]) || []);
    setLoading(false);
  }

  async function addAppointment() {
    if (!customerText.trim() || !title.trim() || !date || !time) {
      return alert("Klant, titel, datum en tijd zijn verplicht");
    }

    const customerInput = customerText.trim();
    const carInput = carText.trim();

    let customer_id: string | null = null;
    let customer_name: string | null = null;

    const customerMatch = customers.find(
      (c) =>
        `${c.first_name} ${c.last_name ?? ""}`
          .trim()
          .toLowerCase() === customerInput.toLowerCase()
    );

    if (customerMatch) {
      customer_id = customerMatch.id;
    } else {
      customer_name = customerInput;
    }

    let car_id: string | null = null;
    let car_label: string | null = null;

    if (carInput) {
      const carMatch = cars.find(
        (c) =>
          (c.license_plate ?? "").trim().toLowerCase() ===
          carInput.toLowerCase()
      );

      if (carMatch) {
        car_id = carMatch.id;
      } else {
        car_label = carInput;
      }
    }

    await supabase.from("appointments").insert({
      customer_id,
      customer_name,
      car_id,
      car_label,
      title: title.trim(),
      date,
      time,
      location: location.trim() || null,
    });

    setCustomerText("");
    setCarText("");
    setTitle("");
    setDate("");
    setTime("");
    setLocation("");

    loadData();
  }

  async function deleteAppointment(id: string) {
    if (!confirm("Afspraak verwijderen?")) return;
    await supabase.from("appointments").delete().eq("id", id);
    loadData();
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
    loadData();
  }, [user]);

  if (!user) return null;

  return (
    <div className="p-4 pb-20">
      <h1 className="text-xl font-bold mb-4">Agenda</h1>

      {/* FORM */}
      <div className="bg-gray-100 p-4 rounded-xl space-y-2 mb-6">
        <input
          className="input"
          list="customers-list"
          placeholder="Klant (naam typen of kiezen)..."
          value={customerText}
          onChange={(e) => setCustomerText(e.target.value)}
        />
        <datalist id="customers-list">
          {customers.map((c) => (
            <option
              key={c.id}
              value={`${c.first_name} ${c.last_name ?? ""}`.trim()}
            />
          ))}
        </datalist>

        <input
          className="input"
          list="cars-list"
          placeholder="Auto (kenteken of omschrijving)..."
          value={carText}
          onChange={(e) => setCarText(e.target.value)}
        />
        <datalist id="cars-list">
          {cars.map((c) => (
            <option key={c.id} value={c.license_plate ?? ""} />
          ))}
        </datalist>

        <input
          className="input"
          placeholder="Titel"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
        />
        <input
          type="date"
          className="input"
          value={date}
          onChange={(e) => setDate(e.target.value)}
        />
        <input
          type="time"
          className="input"
          value={time}
          onChange={(e) => setTime(e.target.value)}
        />
        <input
          className="input"
          placeholder="Locatie / adres"
          value={location}
          onChange={(e) => setLocation(e.target.value)}
        />

        <button
          className="w-full bg-black text-white p-3 rounded-lg text-sm"
          onClick={addAppointment}
        >
          Afspraak opslaan
        </button>
      </div>

      {/* LIST */}
      {loading ? (
        <p className="text-sm text-gray-500">Afspraken laden...</p>
      ) : appointments.length === 0 ? (
        <p className="text-sm text-gray-400">
          Nog geen afspraken ingepland.
        </p>
      ) : (
        <div className="space-y-3">
          {appointments.map((app) => {
            const carDisplay =
              app.cars?.license_plate ?? app.car_label ?? null;

            return (
              <div
                key={app.id}
                className="border rounded-xl p-4 bg-white relative"
              >
                <button
                  type="button"
                  onClick={() => deleteAppointment(app.id)}
                  className="absolute top-2 right-2 p-1 rounded-full hover:bg-red-50 text-red-500"
                >
                  <Trash2 size={14} />
                </button>

                <p className="font-semibold">{app.title}</p>

                <p className="text-sm text-gray-500 flex items-center gap-2 mt-1">
                  <span>{app.date}</span>
                  <span>·</span>
                  <span className="flex items-center gap-1 text-xs">
                    <Clock size={12} />
                    <span>{formatTime(app.time)}</span>
                  </span>
                </p>

                {app.customers ? (
                  <p className="text-xs text-gray-400 mt-1">
                    Klant: {app.customers.first_name}{" "}
                    {app.customers.last_name}
                  </p>
                ) : app.customer_name ? (
                  <p className="text-xs text-gray-400 mt-1">
                    Klant: {app.customer_name}
                  </p>
                ) : null}

                {carDisplay && (
                  <p className="text-xs text-gray-400 mt-1">
                    Auto: {carDisplay}
                  </p>
                )}

                {app.location && (
                  <button
                    type="button"
                    onClick={() => copyLocation(app.location!)}
                    className="mt-2 flex items-center gap-1 text-xs text-blue-600 underline-offset-2 hover:underline"
                  >
                    <MapPin size={12} />
                    <span>{app.location}</span>
                  </button>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}