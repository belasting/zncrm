"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/hooks/useAuth";
import {
  CarFront,
  User,
  Calendar,
  ImagePlus,
  Trash2,
} from "lucide-react";
import Link from "next/link";

type CarDetail = {
  id: string;
  license_plate: string | null;
  make: string | null;
  model: string | null;
  year: string | null;
  customer_id?: string | null;
};

type Customer = {
  id: string;
  first_name: string;
  last_name: string | null;
  phone: string | null;
  email: string | null;
};

type Appointment = {
  id: string;
  title: string;
  date: string;
  time: string;
};

type CarPhoto = {
  id: string;
  section: string;
  image_url: string;
};

const SECTIONS = [
  { id: "front", label: "Voorkant" },
  { id: "left", label: "Linker zijkant" },
  { id: "right", label: "Rechter zijkant" },
  { id: "rear", label: "Achterkant" },
  { id: "detail", label: "Details / Schade" },
];

export default function CarDetailPage() {
  const user = useAuth();
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const carId = params?.id;

  const [car, setCar] = useState<CarDetail | null>(null);
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [photos, setPhotos] = useState<CarPhoto[]>([]);
  const [uploadingSection, setUploadingSection] = useState<string | null>(
    null
  );
  const [loading, setLoading] = useState(true);

  async function loadData() {
    if (!carId) return;

    setLoading(true);

    // 1) auto
    const { data: carData, error: carError } = await supabase
      .from("cars")
      .select("id, license_plate, make, model, year, customer_id")
      .eq("id", carId)
      .single();

    if (carError || !carData) {
      setCar(null);
      setCustomer(null);
      setAppointments([]);
      setPhotos([]);
      setLoading(false);
      return;
    }

    const carRow = carData as CarDetail;
    setCar(carRow);

    // 2) klant (als customer_id bestaat)
    if (carRow.customer_id) {
      const { data: cust } = await supabase
        .from("customers")
        .select("id, first_name, last_name, phone, email")
        .eq("id", carRow.customer_id)
        .single();

      setCustomer((cust as Customer) || null);
    } else {
      setCustomer(null);
    }

    // 3) afspraken
    const { data: appData } = await supabase
      .from("appointments")
      .select("id, title, date, time")
      .eq("car_id", carId)
      .order("date", { ascending: false })
      .order("time", { ascending: false });

    setAppointments((appData as Appointment[]) || []);

    // 4) foto’s
    const { data: photoData } = await supabase
      .from("car_photos")
      .select("id, section, image_url")
      .eq("car_id", carId)
      .order("created_at", { ascending: false });

    setPhotos((photoData as CarPhoto[]) || []);

    setLoading(false);
  }

  async function handleUpload(section: string, file: File) {
    if (!carId) return;

    setUploadingSection(section);

    try {
      const ext = file.name.split(".").pop();
      const path = `cars/${carId}/${section}-${Date.now()}.${ext}`;

      const { error: uploadError } = await supabase.storage
        .from("media")
        .upload(path, file, {
          cacheControl: "3600",
          upsert: false,
        });

      if (uploadError) throw uploadError;

      const {
        data: { publicUrl },
      } = supabase.storage.from("media").getPublicUrl(path);

      await supabase.from("car_photos").insert({
        car_id: carId,
        section,
        image_url: publicUrl,
      });

      loadData();
    } catch (e) {
      console.error(e);
      alert("Upload mislukt");
    } finally {
      setUploadingSection(null);
    }
  }

  async function deleteCar() {
    if (!carId) return;
    if (!confirm("Weet je zeker dat je deze auto wilt verwijderen?")) return;

    await supabase.from("cars").delete().eq("id", carId);
    router.push("/cars");
  }

  useEffect(() => {
    if (!user) return;
    loadData();
  }, [user, carId]);

  if (!user) return null;

  if (loading && !car) {
    return (
      <div className="p-4 pb-24">
        <button
          className="text-sm text-blue-500 mb-3"
          onClick={() => router.back()}
        >
          ← Terug
        </button>
        <p>Auto laden...</p>
      </div>
    );
  }

  if (!car) {
    return (
      <div className="p-4 pb-24">
        <button
          className="text-sm text-blue-500 mb-3"
          onClick={() => router.back()}
        >
          ← Terug
        </button>
        <p>Auto niet gevonden.</p>
      </div>
    );
  }

  const groupedPhotos: Record<string, CarPhoto[]> = {};
  for (const p of photos) {
    if (!groupedPhotos[p.section]) groupedPhotos[p.section] = [];
    groupedPhotos[p.section].push(p);
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
          onClick={deleteCar}
          className="p-1 rounded-full hover:bg-red-50 text-red-500"
        >
          <Trash2 size={16} />
        </button>
      </div>

      {/* Basis info */}
      <div className="bg-white border rounded-xl p-4">
        <p className="text-xs text-gray-400 uppercase mb-1">Auto</p>
        <h1 className="text-2xl font-bold">
          {car.license_plate || "Onbekend kenteken"}
        </h1>
        <p className="text-sm text-gray-600 mt-1">
          {car.make} {car.model}{" "}
          {car.year && <span className="text-gray-400">({car.year})</span>}
        </p>
      </div>

      {/* Klant */}
      <div className="bg-white border rounded-xl p-4 flex items-start gap-3">
        <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center">
          <User size={16} />
        </div>
        <div className="flex-1">
          <p className="text-xs text-gray-400 uppercase mb-1">Klant</p>
          {customer ? (
            <Link href={`/customers/${customer.id}`}>
              <p className="font-medium">
                {customer.first_name} {customer.last_name}
              </p>
              <p className="text-xs text-gray-500">
                {customer.phone && <span>{customer.phone}</span>}
                {customer.phone && customer.email && <span> · </span>}
                {customer.email && <span>{customer.email}</span>}
              </p>
            </Link>
          ) : (
            <p className="text-sm text-gray-500">
              Geen klant gekoppeld aan deze auto.
            </p>
          )}
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
            Nog geen afspraken gekoppeld aan deze auto.
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

      {/* RDW Foto's */}
      <div className="bg-white border rounded-xl p-4 space-y-4">
        <div className="flex items-center gap-2 mb-1">
          <CarFront size={16} />
          <h2 className="text-sm font-semibold">RDW Fotoregistratie</h2>
        </div>
        <p className="text-xs text-gray-500">
          Maak per paneel/hoek foto&apos;s. Upload per sectie zoveel
          foto&apos;s als nodig.
        </p>

        <div className="space-y-4">
          {SECTIONS.map((section) => (
            <div key={section.id} className="space-y-2">
              <div className="flex items-center justify-between">
                <p className="text-xs font-semibold uppercase text-gray-500">
                  {section.label}
                </p>
                <label className="flex items-center gap-1 text-xs text-blue-600 cursor-pointer">
                  <ImagePlus size={14} />
                  <span>
                    {uploadingSection === section.id
                      ? "Uploaden..."
                      : "Foto toevoegen"}
                  </span>
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    disabled={uploadingSection === section.id}
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (!file) return;
                      handleUpload(section.id, file);
                      e.target.value = "";
                    }}
                  />
                </label>
              </div>

              <div className="flex gap-2 overflow-x-auto">
                {(groupedPhotos[section.id] || []).map((photo) => (
                  <div
                    key={photo.id}
                    className="w-24 h-24 rounded-lg overflow-hidden border bg-gray-100 flex-shrink-0"
                  >
                    <img
                      src={photo.image_url}
                      alt={section.label}
                      className="w-full h-full object-cover"
                    />
                  </div>
                ))}

                {(!groupedPhotos[section.id] ||
                  groupedPhotos[section.id].length === 0) && (
                  <div className="text-[11px] text-gray-400 italic">
                    Nog geen foto&apos;s
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}