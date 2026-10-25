import ScrollReveal from "@/components/landing/ScrollReveal";
import LandingPetaFilter from "@/components/landing/LandingPetaFilter";
import type { IrpomPublik } from "@/lib/irpom-publik-types";

export default function LandingSebaranSection({ units }: { units: IrpomPublik[] }) {
  return (
    <section id="sebaran" className="bg-white py-20 sm:py-24">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <ScrollReveal>
          <h2 className="text-center text-3xl font-bold tracking-tight text-sky-800 sm:text-4xl">Peta Sebaran</h2>
          <p className="mx-auto mt-3 max-w-2xl text-center text-gray-500">
            Lokasi titik pompa IRPOM se-Kabupaten Way Kanan. Warna titik menunjukkan status. Klik titik untuk detail dan lokasinya di Google Maps.
          </p>
        </ScrollReveal>

        <ScrollReveal delay={150}>
          <LandingPetaFilter units={units} />
        </ScrollReveal>
      </div>
    </section>
  );
}
