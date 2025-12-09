"use client";

import { LogOut } from "lucide-react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

export default function TopLogo() {
  const router = useRouter();

  async function handleLogout() {
    try {
      await supabase.auth.signOut();
    } catch (e) {
      console.error(e);
    } finally {
      router.push("/login");
    }
  }

  return (
    <div className="fixed top-0 left-0 right-0 z-30">
      <div className="max-w-md mx-auto px-4 pt-3 pb-2">
        <div className="flex items-center justify-between bg-white/80 backdrop-blur-md rounded-2xl px-3 py-2 shadow-sm border border-slate-100">
          {/* Logo + titel */}
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-xl bg-black flex items-center justify-center text-[11px] font-semibold text-white">
              zn
            </div>
            <div className="flex flex-col leading-tight">
              <span className="text-sm font-semibold tracking-tight">
                zncustom
              </span>
              <span className="text-[11px] text-slate-400">
                Passie voor auto&apos;s
              </span>
            </div>
          </div>

          {/* Rechts: credit + logout */}
          <div className="flex items-center gap-2">
            <span className="text-[11px] px-2 py-1 rounded-full bg-slate-100 text-slate-500">
              Built by{" "}
              <a
                href="https://webadvisors.nl"
                target="_blank"
                rel="noopener noreferrer"
                className="underline font-semibold text-slate-600 hover:text-slate-700"
              >
                Web Advisors
              </a>
              .
            </span>

            <button
              type="button"
              onClick={handleLogout}
              className="flex items-center gap-1 px-2 py-1 rounded-full text-[11px] text-slate-500 hover:bg-slate-100 active:scale-95 transition"
            >
              <LogOut size={14} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}