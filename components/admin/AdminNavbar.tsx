"use client";

import Lambang from "@/components/Lambang";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useFormStatus } from "react-dom";
import {
  ClipboardList,
  ClipboardX,
  Copy,
  DatabaseBackup,
  Globe,
  History,
  LayoutDashboard,
  Loader2,
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
  { href: "/admin/kelengkapan", label: "Belum Lengkap", icon: ClipboardX },
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

// Ikon berputar & tombol terkunci selama proses logout di server.
function TombolKeluar() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      title={pending ? "Sedang keluar..." : "Keluar"}
      aria-label="Keluar"
      className="flex size-8 items-center justify-center rounded-md text-gray-500 hover:bg-red-50 hover:text-red-600 disabled:cursor-wait disabled:bg-red-50 disabled:text-red-600"
    >
      {pending ? <Loader2 size={16} className="animate-spin" /> : <LogOut size={16} />}
    </button>
  );
}

// "Diky Saputra" -> "DS"; email -> huruf pertamanya.
function inisial(label: string) {
  const kata = label.split("@")[0].trim().split(/\s+/).filter(Boolean);
  return ((kata[0]?.[0] ?? "") + (kata.length > 1 ? kata[kata.length - 1][0] : "")).toUpperCase() || "?";
}

export default function AdminNavbar({
  userLabel,
  role,
  jumlahDuplikasi,
  jumlahBelumLengkap,
}: {
  userLabel: string;
  role: "super_admin" | "admin";
  jumlahDuplikasi: number;
  jumlahBelumLengkap: number;
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

        <div className="flex shrink-0 items-center gap-2 sm:gap-3">
          <Link
            href="/"
            className="flex items-center gap-1.5 rounded-md border border-gray-200 px-2.5 py-1.5 text-xs font-medium text-gray-700 hover:border-sky-300 hover:bg-sky-50 hover:text-sky-800"
            title="Lihat halaman publik"
          >
            <Globe size={15} />
            <span className="hidden sm:inline">Halaman Publik</span>
          </Link>

          <span className="hidden h-8 w-px bg-gray-200 sm:block" />

          <div className="flex items-center gap-2">
            <span
              className="flex size-8 shrink-0 items-center justify-center rounded-full bg-sky-100 text-xs font-semibold text-sky-800"
              title={userLabel}
            >
              {inisial(userLabel)}
            </span>
            <div className="hidden leading-tight md:block">
              <p className="max-w-[160px] truncate text-xs font-semibold text-gray-800">{userLabel}</p>
              <p className="text-[11px] text-gray-500">{ROLE_LABEL[role]}</p>
            </div>
            <form action={signOut} data-loading-bar>
              <TombolKeluar />
            </form>
          </div>
        </div>
      </div>

      {/* Garis pemisah selebar container konten, antara baris logo dan menu. */}
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        <div className="h-0.5 rounded-full bg-gray-200" />
      </div>

      <nav className="mx-auto flex max-w-7xl gap-1 overflow-x-auto px-3 py-2 sm:px-5">
        {items.map((item) => {
          const Icon = item.icon;
          const active = isActive(pathname, item.href);
          // Duplikasi = merah (pasti salah input); belum lengkap = kuning (perlu dilengkapi).
          const badge =
            item.href === "/admin/duplikasi"
              ? { n: jumlahDuplikasi, warna: "bg-red-600" }
              : item.href === "/admin/kelengkapan"
                ? { n: jumlahBelumLengkap, warna: "bg-amber-500" }
                : null;
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
              {badge && badge.n > 0 && (
                <span className={`flex min-w-5 items-center justify-center rounded-full px-1.5 text-[11px] font-semibold text-white ${badge.warna}`}>
                  {badge.n}
                </span>
              )}
            </Link>
          );
        })}
      </nav>
    </header>
  );
}
