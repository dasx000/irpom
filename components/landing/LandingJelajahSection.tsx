import ScrollReveal from "@/components/landing/ScrollReveal";
import JelajahWilayah from "@/components/landing/JelajahWilayah";
import type { IrpomPublik } from "@/lib/irpom-publik-types";

export default function LandingJelajahSection({ units }: { units: IrpomPublik[] }) {
  return (
    <section id="jelajah" className="bg-gray-50 py-20 sm:py-24">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <ScrollReveal>
          <h2 className="text-center text-3xl font-bold tracking-tight text-sky-800 sm:text-4xl">Jelajah Wilayah</h2>
          <p className="mx-auto mt-3 max-w-2xl text-center text-gray-500">
            Cari kelompok tani penerima IRPOM dan lihat rincian per kecamatan dan desa.
          </p>
        </ScrollReveal>

        <ScrollReveal delay={150}>
          <JelajahWilayah units={units} />
        </ScrollReveal>
      </div>
    </section>
  );
}
