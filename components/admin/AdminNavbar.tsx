"use client";

import Lambang from "@/components/Lambang";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  ClipboardList,
  Copy,
  DatabaseBackup,
  Globe,
  History,
  LayoutDashboard,
  LogOut,
  UserCircle,
  UserCog,
  type LucideIcon,
} from "lucide-react";
import { signOut } from "@/lib/actions/auth";

interface NavItem {
  href: string;
  label: string;
  icon: LucideIcon;
  superAdmin?: boolean;
}

const NAV_ITEMS: NavItem[] = [
  { href: "/admin", label: "Dashboard", icon: LayoutDashboard },
  { href: "/admin/irpom", label: "Data IRPOM", icon: ClipboardList },
  { href: "/admin/duplikasi", label: "Duplikasi", icon: Copy },
  { href: "/admin/pengguna", label: "Pengguna", icon: UserCog, superAdmin: true },
  { href: "/admin/audit", label: "Audit Log", icon: History, superAdmin: true },
  { href: "/admin/backup", label: "Cadangan", icon: DatabaseBackup },
  { href: "/admin/profil", label: "Profil", icon: UserCircle },
];

function isActive(pathname: string, href: string) {
  if (href === "/admin") return pathname === "/admin";
  return pathname === href || pathname.startsWith(`${href}/`);
}

const ROLE_LABEL = { super_admin: "Super Admin", admin: "Admin" } as const;

export default function AdminNavbar({
  userLabel,
  role,
  jumlahDuplikasi,
}: {
  userLabel: string;
  role: "super_admin" | "admin";
  jumlahDuplikasi: number;
}) {
  const pathname = usePathname();
  const items = NAV_ITEMS.filter((i) => !i.superAdmin || role === "super_admin");

  return (
    <header className="sticky top-0 z-[1100] border-b border-gray-200 bg-white/95 backdrop-blur">
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-3 px-4 py-2.5 sm:px-6">
        <Link href="/admin" className="flex min-w-0 items-center gap-2">
          <Lambang tinggi={34} />
          <span className="min-w-0 leading-tight">
            <span className="block truncate text-sm font-semibold text-gray-900">Monitoring IRPOM</span>
            <span className="block truncate text-[11px] text-gray-500">Panel Kelola Data</span>
          </span>
        </Link>

        <div className="flex shrink-0 items-center gap-1 sm:gap-2">
          <Link
            href="/"
            className="flex items-center gap-1.5 rounded-md px-2 py-1.5 text-xs font-medium text-gray-600 hover:bg-gray-100"
            title="Lihat halaman publik"
          >
            <Globe size={15} />
            <span className="hidden sm:inline">Halaman Publik</span>
          </Link>
          <div className="hidden text-right leading-tight md:block">
            <p className="max-w-[180px] truncate text-xs font-medium text-gray-800">{userLabel}</p>
            <p className="text-[11px] text-gray-500">{ROLE_LABEL[role]}</p>
          </div>
          <form action={signOut}>
            <button
              type="submit"
              className="flex items-center gap-1.5 rounded-md px-2 py-1.5 text-xs font-medium text-gray-600 hover:bg-red-50 hover:text-red-700"
            >
              <LogOut size={15} />
              <span className="hidden sm:inline">Keluar</span>
            </button>
          </form>
        </div>
      </div>

      <nav className="mx-auto flex max-w-7xl gap-1 overflow-x-auto px-3 pb-2 sm:px-5">
        {items.map((item) => {
          const Icon = item.icon;
          const active = isActive(pathname, item.href);
          const badge = item.href === "/admin/duplikasi" ? jumlahDuplikasi : 0;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex shrink-0 items-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
                active ? "bg-sky-50 text-sky-800" : "text-gray-600 hover:bg-gray-100 hover:text-gray-900"
              }`}
            >
              <Icon size={15} />
              {item.label}
              {badge > 0 && (
                <span className="flex min-w-5 items-center justify-center rounded-full bg-red-600 px-1.5 text-[11px] font-semibold text-white">
                  {badge}
                </span>
              )}
            </Link>
          );
        })}
      </nav>
    </header>
  );
}
