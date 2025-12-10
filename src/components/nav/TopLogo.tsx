"use client";

import Image from "next/image";
import Link from "next/link";

export default function TopLogo() {
  return (
    <div className="fixed top-0 left-0 right-0 z-30">
      <div className="max-w-md mx-auto px-4 pt-3 pb-2">
        <div className="flex items-center justify-between bg-white/80 backdrop-blur-md rounded-2xl px-3 py-2 shadow-sm border border-slate-100">
          {/* LOGO LINKS */}
          <Link href="/" className="flex items-center gap-2">
            <Image
              src="/logo-zncustom.png" // komt uit /public
              alt="znzwart.png"
              width={120}
              height={32}
              className="h-8 w-auto"
              priority
            />
          </Link>

          {/* Badge rechts mag blijven */}
          <span className="text-[11px] px-2 py-1 rounded-full bg-slate-100 text-slate-500 whitespace-nowrap">
            Built by{" "}
            <a
              href="https://webadvisors.nl"
              target="_blank"
              rel="noopener noreferrer"
              className="underline font-semibold text-slate-600 hover:text-slate-700"
            >
              Web Advisors
            </a>
          </span>
        </div>
      </div>
    </div>
  );
}