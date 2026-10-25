import { requirePengelolaPage } from "@/lib/auth-guard";
import { getJumlahBelumLengkap, getMonitoringKoordinat } from "@/lib/admin-data";
import AdminNavbar from "@/components/admin/AdminNavbar";

export default async function AdminLayout({ children }: LayoutProps<"/admin">) {
  const profile = await requirePengelolaPage();
  const [koordinat, jumlahBelumLengkap] = await Promise.all([getMonitoringKoordinat(), getJumlahBelumLengkap()]);

  return (
    <div className="min-h-screen bg-gray-50">
      <AdminNavbar
        userLabel={profile.nama || profile.email} role={profile.role} jumlahMasalahKoordinat={koordinat.duplikasi.length + koordinat.diLuar.length}
        jumlahBelumLengkap={jumlahBelumLengkap}
      />
      <main className="mx-auto max-w-7xl px-4 py-6 sm:px-6">{children}</main>
    </div>
  );
}
