import ScrollReveal from "@/components/landing/ScrollReveal";
import LuasKecamatanChart from "@/components/landing/LuasKecamatanChart";
import StatusDistribusi from "@/components/landing/StatusDistribusi";
import TopPoktanTable from "@/components/landing/TopPoktanTable";
import type { IrpomStatistik } from "@/lib/irpom-publik-types";

export default function LandingDataSection({ statistik }: { statistik: IrpomStatistik }) {
  return (
    <section id="data-irpom" className="bg-gray-50 py-20 sm:py-24">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <ScrollReveal>
          <h2 className="text-center text-3xl font-bold tracking-tight text-sky-800 sm:text-4xl">Data IRPOM</h2>
          <p className="mx-auto mt-3 max-w-2xl text-center text-gray-500">
            Sebaran luas lahan terairi, status operasional pompa, dan kelompok tani pengelola hamparan terluas.
          </p>
        </ScrollReveal>

        <div className="mt-10 grid grid-cols-1 gap-6 lg:grid-cols-[1.6fr_1fr]">
          <ScrollReveal delay={100}>
            <LuasKecamatanChart data={statistik.per_kecamatan} />
          </ScrollReveal>
          <ScrollReveal delay={200}>
            <StatusDistribusi data={statistik.per_status} />
          </ScrollReveal>
        </div>

        <ScrollReveal delay={250} className="mt-6">
          <TopPoktanTable data={statistik.top_poktan} />
        </ScrollReveal>
      </div>
    </section>
  );
}
