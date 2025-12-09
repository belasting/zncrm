"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/hooks/useAuth";
import {
  Clock,
  MapPin,
  User,
  CarFront,
  CheckCircle2,
  Trash2,
} from "lucide-react";

type AppointmentDetail = {
  id: string;
  title: string;
  date: string;
  time: string;
  status: string;
  location: string | null;
  customer_name: string | null;
  car_label: string | null;
  customers?: any;
  cars?: any;
};

const STATUS_OPTIONS = ["planned", "in_progress", "completed", "cancelled"];

function formatTime(value: string | null | undefined) {
  if (!value) return "";
  const parts = String(value).split(":");
  if (parts.length >= 2) return `${parts[0]}:${parts[1]}`;
  return value;
}

export default function AppointmentDetailPage() {
  const user = useAuth();
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const appointmentId = params?.id;

  const [appointment, setAppointment] = useState<AppointmentDetail | null>(
    null
  );
  const [loading, setLoading] = useState(true);
  const [savingStatus, setSavingStatus] = useState(false);

  async function loadAppointment() {
    if (!appointmentId) {
      setLoading(false);
      setAppointment(null);
      return;
    }

    setLoading(true);
    const { data, error } = await supabase
      .from("appointments")
      .select(
        "id, title, date, time, status, location, customer_name, car_label, customers(first_name, last_name, phone, email), cars(license_plate, make, model, year)"
      )
      .eq("id", appointmentId)
      .single();

    if (error) {
      console.error(error);
      setAppointment(null);
      setLoading(false);
      return;
    }

    setAppointment((data as unknown as AppointmentDetail) || null);
    setLoading(false);
  }

  async function updateStatus(newStatus: string) {
    if (!appointmentId) return;
    setSavingStatus(true);
    await supabase
      .from("appointments")
      .update({ status: newStatus })
      .eq("id", appointmentId);
    await loadAppointment();
    setSavingStatus(false);
  }

  async function deleteAppointment() {
    if (!appointmentId) return;
    if (!confirm("Weet je zeker dat je deze afspraak wilt verwijderen?")) return;

    await supabase.from("appointments").delete().eq("id", appointmentId);
    router.push("/calendar");
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
    loadAppointment();
  }, [user, appointmentId]);

  if (!user) return null;

  // 🔹 Als er geen id is in de URL
  if (!appointmentId) {
    return (
      <div className="p-4 pb-24">
        <button
          className="text-sm text-blue-500 mb-3"
          onClick={() => router.push("/calendar")}
        >
          ← Terug naar agenda
        </button>
        <p>Afspraak niet gevonden.</p>
      </div>
    );
  }

  if (loading && !appointment) {
    return (
      <div className="p-4 pb-20">
        <button
          className="text-sm text-blue-500 mb-3"
          onClick={() => router.back()}
        >
          ← Terug
        </button>
        <p>Afspraak laden...</p>
      </div>
    );
  }

  if (!appointment) {
    return (
      <div className="p-4 pb-20">
        <button
          className="text-sm text-blue-500 mb-3"
          onClick={() => router.push("/calendar")}
        >
          ← Terug naar agenda
        </button>
        <p>Afspraak niet gevonden.</p>
      </div>
    );
  }

  const carDisplay =
    appointment.cars?.license_plate ?? appointment.car_label ?? null;

  return (
    <div className="p-4 pb-24 space-y-6">
      <div className="flex items-center justify-between">
        <button
          className="text-sm text-blue-500"
          onClick={() => router.back()}
        >
          ← Terug
        </button>
        <button
          type="button"
          onClick={deleteAppointment}
          className="p-1 rounded-full hover:bg-red-50 text-red-500"
        >
          <Trash2 size={16} />
        </button>
      </div>

      {/* Titel + tijd */}
      <div>
        <p className="text-xs text-gray-400 uppercase mb-1">Afspraak</p>
        <h1 className="text-2xl font-bold">{appointment.title}</h1>
        <p className="text-sm text-gray-500 flex items-center gap-2 mt-1">
          <span>{appointment.date}</span>
          <span>·</span>
          <span className="flex items-center gap-1 text-xs">
            <Clock size={12} />
            <span>{formatTime(appointment.time)}</span>
          </span>
        </p>
      </div>

      {/* Klant */}
      {(appointment.customers || appointment.customer_name) && (
        <div className="bg-gray-100 rounded-xl p-4 flex gap-3 items-start">
          <div className="w-8 h-8 rounded-full bg-white flex items-center justify-center border">
            <User size={16} />
          </div>
          <div>
            <p className="text-xs text-gray-400 uppercase mb-1">Klant</p>
            {appointment.customers ? (
              <>
                <p className="font-medium">
                  {appointment.customers.first_name}{" "}
                  {appointment.customers.last_name}
                </p>
                {appointment.customers.phone && (
                  <p className="text-sm text-gray-500">
                    Tel: {appointment.customers.phone}
                  </p>
                )}
                {appointment.customers.email && (
                  <p className="text-sm text-gray-500">
                    Email: {appointment.customers.email}
                  </p>
                )}
              </>
            ) : (
              <p className="font-medium">{appointment.customer_name}</p>
            )}
          </div>
        </div>
      )}

      {/* Auto */}
      {carDisplay && (
        <div className="bg-gray-100 rounded-xl p-4 flex gap-3 items-start">
          <div className="w-8 h-8 rounded-full bg-white flex items-center justify-center border">
            <CarFront size={16} />
          </div>
          <div>
            <p className="text-xs text-gray-400 uppercase mb-1">Auto</p>
            <p className="font-medium">{carDisplay}</p>
            {appointment.cars && (
              <p className="text-sm text-gray-500">
                {appointment.cars.make} {appointment.cars.model}{" "}
                {appointment.cars.year && (
                  <span className="text-gray-400">
                    ({appointment.cars.year})
                  </span>
                )}
              </p>
            )}
          </div>
        </div>
      )}

      {/* Locatie */}
      {appointment.location && (
        <div className="bg-gray-100 rounded-xl p-4 flex gap-3 items-start">
          <div className="w-8 h-8 rounded-full bg-white flex items-center justify-center border">
            <MapPin size={16} />
          </div>
          <div>
            <p className="text-xs text-gray-400 uppercase mb-1">Locatie</p>
            <button
              type="button"
              onClick={() => copyLocation(appointment.location!)}
              className="text-sm text-blue-600 underline-offset-2 hover:underline text-left"
            >
              {appointment.location}
            </button>
          </div>
        </div>
      )}

      {/* Status */}
      <div className="bg-gray-100 rounded-xl p-4">
        <p className="text-xs text-gray-400 uppercase mb-2">Status</p>
        <div className="flex items-center justify-between gap-2 flex-wrap">
          <div className="flex gap-2 flex-wrap">
            {STATUS_OPTIONS.map((s) => (
              <button
                key={s}
                onClick={() => updateStatus(s)}
                className={`px-2 py-1 rounded-full text-[11px] border flex items-center gap-1 ${
                  appointment.status === s
                    ? "bg-black text-white border-black"
                    : "bg-white text-gray-600 border-gray-300"
                }`}
              >
                {appointment.status === s && <CheckCircle2 size={12} />}
                <span>{s.toUpperCase()}</span>
              </button>
            ))}
          </div>
          <span className="text-[11px] text-gray-500">
            Huidig: {appointment.status.toUpperCase()}
          </span>
        </div>
        {savingStatus && (
          <p className="text-[11px] text-gray-400 mt-1">
            Status opslaan...
          </p>
        )}
      </div>
    </div>
  );
}