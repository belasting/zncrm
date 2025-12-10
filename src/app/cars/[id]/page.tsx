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
  X,
  Download,
} from "lucide-react";
import Link from "next/link";

type CarDetail = {
  id: string;
  license_plate: string | null;
  make: string | null;
  model: string | null;
  year: string | null;
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
  const [uploadingSection, setUploadingSection] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  // fullscreen preview state
  const [previewPhoto, setPreviewPhoto] = useState<CarPhoto | null>(null);

  async function loadData() {
    if (!carId) return;

    setLoading(true);

    const [
      { data: carData },
      { data: appData },
      { data: photoData },
    ] = await Promise.all([
      supabase
        .from("cars")
        .select("id, license_plate, make, model, year, customer_id")
        .eq("id", carId)
        .single(),
      supabase
        .from("appointments")
        .select("id, title, date, time")
        .eq("car_id", carId)
        .order("date", { ascending: false })
        .order("time", { ascending: false }),
      supabase
        .from("car_photos")
        .select("id, section, image_url")
        .eq("car_id", carId)
        .order("created_at", { ascending: false }),
    ]);

    const carRow = carData as any;
    if (!carRow) {
      setCar(null);
      setCustomer(null);
      setAppointments([]);
      setPhotos([]);
      setLoading(false);
      return;
    }

    setCar({
      id: carRow.id,
      license_plate: carRow.license_plate,
      make: carRow.make,
      model: carRow.model,
      year: carRow.year,
    });

    // Klant ophalen als er een customer_id is
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

    setAppointments((appData as Appointment[]) || []);
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

  // Foto volledig verwijderen: uit DB én uit storage
  async function deletePhoto(photo: CarPhoto) {
    if (!confirm("Deze foto verwijderen?")) return;

    // fullscreen overlay dicht als deze open stond
    setPreviewPhoto((prev) => (prev?.id === photo.id ? null : prev));

    // Optimistisch uit state halen
    setPhotos((prev) => prev.filter((p) => p.id !== photo.id));

    // 1) Proberen het bestand uit storage te verwijderen
    try {
      const url = new URL(photo.image_url);
      const prefix = "/storage/v1/object/public/media/";
      let path = url.pathname;

      const idx = path.indexOf(prefix);
      if (idx !== -1) {
        path = path.slice(idx + prefix.length); // bv. "cars/xxx/front-123.png"

        const { error: storageError } = await supabase
          .storage
          .from("media")
          .remove([path]);

        if (storageError) {
          console.error("Storage delete error:", storageError);
        }
      }
    } catch (e) {
      console.error("Kon storage path niet parsen:", e);
    }

    // 2) Row uit de database verwijderen
    const { error: dbError } = await supabase
      .from("car_photos")
      .delete()
      .eq("id", photo.id);

    if (dbError) {
      console.error("DB delete error:", dbError);
      alert("Verwijderen mislukt, ik laad de foto’s opnieuw.");
      loadData();
    }
  }

  // 👉 Foto downloaden met naam {kenteken}_{paneel}.ext
  async function downloadPhoto(photo: CarPhoto) {
    try {
      if (typeof window === "undefined") return;

      // kenteken opschonen
      const rawPlate = car?.license_plate || "onbekend";
      const plate = rawPlate.replace(/\s+/g, "").toUpperCase();

      // panel namen NL
      const sectionMap: Record<string, string> = {
        front: "voor",
        left: "links",
        right: "rechts",
        rear: "achter",
        detail: "detail",
      };
      const paneel = sectionMap[photo.section] || photo.section;

      // extensie uit URL halen
      let ext = "jpg";
      try {
        const url = new URL(photo.image_url);
        const match = url.pathname.match(/\.([a-zA-Z0-9]+)$/);
        if (match) {
          ext = match[1];
        }
      } catch {
        // boeit niet heel veel, default jpg
      }

      const filename = `${plate}_${paneel}.${ext}`;

      const res = await fetch(photo.image_url);
      const blob = await res.blob();
      const blobUrl = URL.createObjectURL(blob);

      const a = document.createElement("a");
      a.href = blobUrl;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(blobUrl);
    } catch (e) {
      console.error("Download error:", e);
      alert("Download mislukt");
    }
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
    <>
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

        {/* Auto info */}
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
            Maak per paneel/hoek foto&apos;s. Upload per sectie zoveel foto&apos;s
            als nodig.
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
                      onClick={() => setPreviewPhoto(photo)}
                      className="relative w-24 h-24 rounded-lg overflow-hidden border bg-gray-100 flex-shrink-0 cursor-pointer"
                    >
                      <img
                        src={photo.image_url}
                        alt={section.label}
                        className="w-full h-full object-cover"
                      />

                      {/* prullenbak rechtsboven */}
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          deletePhoto(photo);
                        }}
                        className="absolute top-1 right-1 p-1 rounded-full bg-black/55 text-white hover:bg-red-500 transition"
                      >
                        <Trash2 size={12} />
                      </button>

                      {/* download knop rechtsonder */}
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          downloadPhoto(photo);
                        }}
                        className="absolute bottom-1 right-1 p-1 rounded-full bg-black/45 text-white hover:bg-black transition"
                      >
                        <Download size={12} />
                      </button>
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

      {/* FULLSCREEN PREVIEW OVERLAY */}
      {previewPhoto && (
        <div
          className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center"
          onClick={() => setPreviewPhoto(null)}
        >
          <div
            className="relative max-w-full max-h-[90vh] px-4"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              onClick={() => setPreviewPhoto(null)}
              className="absolute -top-8 right-0 p-1 rounded-full bg-black/60 text-white"
            >
              <X size={18} />
            </button>

            <img
              src={previewPhoto.image_url}
              alt={previewPhoto.section}
              className="max-h-[80vh] max-w-full w-auto rounded-xl shadow-xl"
            />
          </div>
        </div>
      )}
    </>
  );
}