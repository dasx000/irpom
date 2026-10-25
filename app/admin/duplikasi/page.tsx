import { redirect } from "next/navigation";

// Menu Duplikasi sudah digabung ke Monitoring Koordinat; alamat lama dialihkan.
export default function DuplikasiPage() {
  redirect("/admin/koordinat");
}
