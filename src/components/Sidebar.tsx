
"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Activity,
  Fish,
  Utensils,
  SlidersHorizontal,
  TriangleAlert,
  History,
  Settings,
  Waves,
} from "lucide-react";

const navigationItems = [
  {
    label: "Dashboard",
    href: "/",
    icon: LayoutDashboard,
  },
  {
    label: "Live Monitoring",
    href: "/live-monitoring",
    icon: Activity,
  },
  {
    label: "Fish Monitoring",
    href: "/fish-monitoring",
    icon: Fish,
  },
  {
    label: "Feeding",
    href: "/feeding",
    icon: Utensils,
  },
  {
    label: "Equipment Control",
    href: "/equipment-control",
    icon: SlidersHorizontal,
  },
  {
    label: "Alerts",
    href: "/alerts",
    icon: TriangleAlert,
  },
  {
    label: "History",
    href: "/history",
    icon: History,
  },
  {
    label: "Settings",
    href: "/settings",
    icon: Settings,
  },
];

export default function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="sticky top-0 flex h-screen w-64 shrink-0 flex-col bg-slate-900 p-6 text-white">
      {/* Logo / System Name */}
      <Link href="/" className="flex items-center gap-3">
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-cyan-600">
          <Waves size={24} />
        </div>

        <div>
          <h1 className="text-lg font-bold">
            SMART Aqua Pond
          </h1>

          <p className="text-xs text-slate-400">
            Monitoring System
          </p>
        </div>
      </Link>

      {/* Navigation */}
      <nav
        aria-label="Main navigation"
        className="mt-8 flex-1 space-y-2 overflow-y-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      >
        {navigationItems.map((item) => {
          const Icon = item.icon;

          const isActive =
            item.href === "/"
              ? pathname === "/"
              : pathname === item.href ||
                pathname.startsWith(`${item.href}/`);

          return (
            <Link
              key={item.href}
              href={item.href}
              aria-current={isActive ? "page" : undefined}
              className={`flex items-center gap-3 rounded-lg px-4 py-3 text-sm font-medium transition-colors ${
                isActive
                  ? "bg-cyan-600 text-white"
                  : "text-slate-300 hover:bg-slate-800 hover:text-white"
              }`}
            >
              <Icon size={19} />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>

      {/* System Status */}
      <div className="mt-4 shrink-0 rounded-xl bg-slate-800 p-4">
        <div className="flex items-center gap-2">
          <span className="h-2.5 w-2.5 rounded-full bg-emerald-500" />

          <span className="text-sm font-semibold text-slate-200">
            System Online
          </span>
        </div>

        <p className="mt-1 pl-4 text-xs text-slate-400">
          Prototype Mode
        </p>
      </div>
    </aside>
  );
}
