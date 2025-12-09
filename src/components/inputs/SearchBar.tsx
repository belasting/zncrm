"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { Search, User, Car, Calendar, Clock } from "lucide-react";
import Link from "next/link";

type Customer = {
  id: string;
  first_name: string;
  last_name: string | null;
  phone: string | null;
  email: string | null;
};

type CarType = {
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
  customer_name: string | null;
  customers: any;
};

export default function SearchBar() {
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(false);

  const [customers, setCustomers] = useState<Customer[]>([]);
  const [cars, setCars] = useState<CarType[]>([]);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [showResults, setShowResults] = useState(false);

  useEffect(() => {
    if (!query || query.length < 2) {
      setCustomers([]);
      setCars([]);
      setAppointments([]);
      setShowResults(false);
      return;
    }

    let active = true;
    setLoading(true);

    const runSearch = async () => {
      const q = query.trim();

      const [custRes, carRes, appRes] = await Promise.all([
        supabase
          .from("customers")
          .select("id, first_name, last_name, phone, email")
          .or(
            `first_name.ilike.%${q}%,last_name.ilike.%${q}%,phone.ilike.%${q}%,email.ilike.%${q}%`
          )
          .limit(10),

        supabase
          .from("cars")
          .select("id, license_plate, make, model, year")
          .or(
            `license_plate.ilike.%${q}%,make.ilike.%${q}%,model.ilike.%${q}%`
          )
          .limit(10),

        supabase
          .from("appointments")
          .select(
            "id, title, date, time, customer_name, customers(first_name, last_name)"
          )
          .or(`title.ilike.%${q}%`)
          .order("date", { ascending: true })
          .order("time", { ascending: true })
          .limit(10),
      ]);

      if (!active) return;

      setCustomers((custRes.data as Customer[]) || []);
      setCars((carRes.data as CarType[]) || []);
      setAppointments((appRes.data as Appointment[]) || []);
      setLoading(false);
      setShowResults(true);
    };

    const timeout = setTimeout(runSearch, 250);
    return () => {
      active = false;
      clearTimeout(timeout);
    };
  }, [query]);

  function closeResults() {
    setShowResults(false);
  }

  return (
    <div className="relative">
      {/* INPUT */}
      <div className="flex items-center gap-2 px-3 py-3 border rounded-xl shadow-sm bg-white">
        <Search size={18} className="text-gray-400" />
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Zoek klant, auto, afspraak..."
          className="w-full outline-none text-sm"
          onFocus={() => {
            if (
              (customers.length > 0 ||
                cars.length > 0 ||
                appointments.length > 0) &&
              query.length >= 2
            ) {
              setShowResults(true);
            }
          }}
        />
        {loading && (
          <span className="text-xs text-gray-400">Zoeken...</span>
        )}
      </div>

      {/* RESULTS */}
      {showResults &&
        (customers.length > 0 ||
          cars.length > 0 ||
          appointments.length > 0) && (
          <div className="absolute left-0 right-0 mt-2 bg-white border rounded-2xl shadow-lg max-h-96 overflow-y-auto z-20">
            {/* Customers */}
            {customers.length > 0 && (
              <div className="border-b">
                <div className="px-4 pt-3 pb-1 text-xs font-semibold text-gray-400 uppercase">
                  Klanten
                </div>
                {customers.map((c) => (
                  <Link
                    key={c.id}
                    href={`/customers/${c.id}`}
                    onClick={closeResults}
                  >
                    <div className="px-4 py-2 flex items-center gap-3 hover:bg-gray-50">
                      <User size={16} className="text-gray-500" />
                      <div>
                        <div className="text-sm font-medium">
                          {c.first_name} {c.last_name}
                        </div>
                        <div className="text-xs text-gray-500">
                          {c.phone && <span>{c.phone}</span>}
                          {c.phone && c.email && <span> · </span>}
                          {c.email && <span>{c.email}</span>}
                        </div>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            )}

            {/* Cars */}
            {cars.length > 0 && (
              <div className="border-b">
                <div className="px-4 pt-3 pb-1 text-xs font-semibold text-gray-400 uppercase">
                  Auto&apos;s
                </div>
                {cars.map((car) => (
                  <Link
                    key={car.id}
                    href={`/cars/${car.id}`}
                    onClick={closeResults}
                  >
                    <div className="px-4 py-2 flex items-center gap-3 hover:bg-gray-50">
                      <Car size={16} className="text-gray-500" />
                      <div>
                        <div className="text-sm font-medium">
                          {car.license_plate}
                        </div>
                        <div className="text-xs text-gray-500">
                          {car.make} {car.model}{" "}
                          {car.year && `(${car.year})`}
                        </div>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            )}

            {/* Appointments */}
            {appointments.length > 0 && (
              <div>
                <div className="px-4 pt-3 pb-1 text-xs font-semibold text-gray-400 uppercase">
                  Afspraken
                </div>
                {appointments.map((app) => (
                  <Link
                    key={app.id}
                    href={`/appointments/${app.id}`}
                    onClick={closeResults}
                  >
                    <div className="px-4 py-2 flex items-center gap-3 hover:bg-gray-50">
                      <Calendar size={16} className="text-gray-500" />
                      <div>
                        <div className="text-sm font-medium">
                          {app.title}
                        </div>
                        <div className="text-xs text-gray-500 flex items-center gap-2">
                          <span>{app.date}</span>
                          <span>·</span>
                          <span className="flex items-center gap-1">
                            <Clock size={11} />
                            <span>{app.time}</span>
                          </span>
                        </div>
                        {(app.customers || app.customer_name) && (
                          <div className="text-xs text-gray-400 flex items-center gap-1 mt-0.5">
                            <User size={11} />
                            <span>
                              {app.customers
                                ? `${app.customers.first_name} ${app.customers.last_name}`
                                : app.customer_name}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>
        )}

      {/* GEEN RESULTATEN */}
      {showResults &&
        customers.length === 0 &&
        cars.length === 0 &&
        appointments.length === 0 &&
        query.length >= 2 &&
        !loading && (
          <div className="absolute left-0 right-0 mt-2 bg-white border rounded-2xl shadow-lg z-20 p-4 text-sm text-gray-400">
            Niks gevonden voor &quot;{query}&quot;
          </div>
        )}
    </div>
  );
}