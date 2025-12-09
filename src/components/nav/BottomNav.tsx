"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Home as HomeIcon,
  CalendarDays,
  Users,
  Car,
  FileText,
} from "lucide-react";

const navItems = [
  {
    href: "/",
    label: "Home",
    icon: HomeIcon,
  },
  {
    href: "/calendar",
    label: "Agenda",
    icon: CalendarDays,
  },
  {
    href: "/customers",
    label: "Klanten",
    icon: Users,
  },
  {
    href: "/cars",
    label: "Auto's",
    icon: Car,
  },
  {
    href: "/invoices",
    label: "Facturen",
    icon: FileText,
  },
];

export default function BottomNav() {
  const pathname = usePathname();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-20">
      <div className="max-w-md mx-auto px-4 pb-3">
        <div className="bg-white/90 backdrop-blur-md rounded-2xl border border-slate-100 shadow-sm px-2 py-1 flex items-center justify-between">
          {navItems.map((item) => {
            const Icon = item.icon;
            const active =
              pathname === item.href ||
              (item.href !== "/" && pathname.startsWith(item.href));

            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex flex-col items-center justify-center flex-1 py-1 text-[11px] ${
                  active ? "text-black" : "text-slate-400"
                }`}
              >
                <Icon size={18} className="mb-0.5" />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </div>
      </div>
    </nav>
  );
}