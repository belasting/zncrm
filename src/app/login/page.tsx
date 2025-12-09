"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabase";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!email || !password) {
      alert("Email en wachtwoord zijn verplicht");
      return;
    }

    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    setLoading(false);

    if (error) {
      console.error(error);
      alert("Inloggen mislukt: " + error.message);
      return;
    }

    router.push("/");
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50">
      <div className="w-full max-w-sm bg-white rounded-2xl shadow-md p-6 border border-slate-100">
        <div className="flex items-center gap-2 mb-6">
          <div className="w-8 h-8 rounded-xl bg-black flex items-center justify-center text-[11px] font-semibold text-white">
            zn
          </div>
          <div className="flex flex-col leading-tight">
            <span className="text-base font-semibold tracking-tight">
              zncustom CRM
            </span>
            <span className="text-[11px] text-slate-400">
              Inloggen om te starten
            </span>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3">
          <input
            type="email"
            className="input"
            placeholder="Emailadres"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />

          <input
            type="password"
            className="input"
            placeholder="Wachtwoord"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-black text-white py-2.5 rounded-lg text-sm font-medium disabled:opacity-60"
          >
            {loading ? "Inloggen..." : "Inloggen"}
          </button>
        </form>

        <p className="text-[11px] text-slate-400 mt-4">
          Accounts worden beheerd via Supabase; registratie is uitgeschakeld in
          de app.
        </p>
      </div>
    </div>
  );
}