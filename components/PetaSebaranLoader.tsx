"use client";

import dynamic from "next/dynamic";
import type { IrpomPublik } from "@/lib/irpom-publik-types";

const PetaSebaran = dynamic(() => import("@/components/PetaSebaran"), {
  ssr: false,
  loading: () => (
    <div className="flex h-[70vh] items-center justify-center bg-gray-50 text-sm text-gray-400">Memuat peta...</div>
  ),
});

export default function PetaSebaranLoader({ units }: { units: IrpomPublik[] }) {
  return <PetaSebaran units={units} />;
}
