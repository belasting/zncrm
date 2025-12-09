"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/hooks/useAuth";
import { Plus, Trash2 } from "lucide-react";
import Link from "next/link";

type CarRow = {
  id: string;
  license_plate: string | null;
  make: string | null;
  model: string | null;
  year: string | null;
  customers?: { first_name: string; last_name: string | null } | null;
};

type CustomerRow = {
  id: string;
  first_name: string;
  last_name: string | null;
};

export default function CarsPage() {
  const user = useAuth();
  const [cars, setCars] = useState<CarRow[]>([]);
  const [customers, setCustomers] = useState<CustomerRow[]>([]);

  const [licensePlate, setLicensePlate] = useState("");
  const [make, setMake] = useState("");
  const [model, setModel] = useState("");
  const [year, setYear] = useState("");
  const [customerId, setCustomerId] = useState("");

  const [saving, setSaving] = useState(false);

  async function loadData() {
    const { data: carData } = await supabase
      .from("cars")
      .select(
        "id, license_plate, make, model, year, customers(first_name, last_name)"
      )
      .order("created_at", { ascending: false });

    const { data: custData } = await supabase
      .from("customers")
      .select("id, first_name, last_name")
      .order("first_name", { ascending: true });

    setCars((carData as unknown as CarRow[]) || []);
    setCustomers((custData as CustomerRow[]) || []);
  }

  async function addCar() {
    if (!licensePlate.trim()) {
      return alert("Kenteken is verplicht");
    }

    setSaving(true);
    await supabase.from("cars").insert({
      license_plate: licensePlate.trim(),
      make: make.trim() || null,
      model: model.trim() || null,
      year: year.trim() || null,
      customer_id: customerId || null,
    });
    setSaving(false);

    setLicensePlate("");
    setMake("");
    setModel("");
    setYear("");
    setCustomerId("");

    loadData();
  }

  async function deleteCar(id: string) {
    if (!confirm("Auto verwijderen?")) return;
    await supabase.from("cars").delete().eq("id", id);
    loadData();
  }

  useEffect(() => {
    if (!user) return;
    loadData();
  }, [user]);

  if (!user) return null;

  return (
    <div className="p-4 pb-24">
      <h1 className="text-xl font-bold mb-4">Auto&apos;s</h1>

      {/* FORM */}
      <div className="bg-gray-100 p-4 rounded-xl space-y-2 mb-6">
        <input
          className="input"
          placeholder="Kenteken"
          value={licensePlate}
          onChange={(e) => setLicensePlate(e.target.value)}
        />
        <div className="flex gap-2">
          <input
            className="input"
            placeholder="Merk"
            value={make}
            onChange={(e) => setMake(e.target.value)}
          />
          <input
            className="input"
            placeholder="Model"
            value={model}
            onChange={(e) => setModel(e.target.value)}
          />
        </div>
        <input
          className="input"
          placeholder="Bouwjaar"
          value={year}
          onChange={(e) => setYear(e.target.value)}
        />

        <select
          className="input"
          value={customerId}
          onChange={(e) => setCustomerId(e.target.value)}
        >
          <option value="">Klant (optioneel)</option>
          {customers.map((c) => (
            <option key={c.id} value={c.id}>
              {c.first_name} {c.last_name}
            </option>
          ))}
        </select>

        <button
          onClick={addCar}
          disabled={saving}
          className="w-full bg-black text-white p-3 rounded-lg flex items-center justify-center gap-2 disabled:opacity-60"
        >
          <Plus size={16} />
          <span>{saving ? "Opslaan..." : "Auto toevoegen"}</span>
        </button>
      </div>

      {/* LIST */}
      <div className="space-y-3">
        {cars.length === 0 && (
          <p className="text-gray-400 text-sm">Nog geen auto&apos;s.</p>
        )}

        {cars.map((car) => (
          <div
            key={car.id}
            className="border rounded-xl p-4 bg-white relative"
          >
            <button
              type="button"
              onClick={() => deleteCar(car.id)}
              className="absolute top-2 right-2 p-1 rounded-full hover:bg-red-50 text-red-500"
            >
              <Trash2 size={14} />
            </button>

            <Link href={`/cars/${car.id}`}>
              <p className="font-semibold">
                {car.license_plate || "Onbekend kenteken"}
              </p>
              <p className="text-xs text-gray-500 mt-1">
                {car.make} {car.model}{" "}
                {car.year && <span className="text-gray-400">({car.year})</span>}
              </p>
              {car.customers && (
                <p className="text-xs text-gray-400 mt-1">
                  Klant: {car.customers.first_name}{" "}
                  {car.customers.last_name}
                </p>
              )}
            </Link>
          </div>
        ))}
      </div>
    </div>
  );
}