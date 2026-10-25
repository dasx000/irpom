"use client";

import { useEffect, useState } from "react";
import { Bar, BarChart, CartesianGrid, LabelList, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { Table2, BarChart3 } from "lucide-react";
import { formatAngka, formatHa } from "@/lib/format";
import type { IrpomStatistik } from "@/lib/irpom-publik-types";

type Datum = IrpomStatistik["per_kecamatan"][number];

const BAR_COLOR = "#0284c7"; // sky-600 -- satu seri, satu warna

// Tick sumbu dibulatkan ke 1/2/5 x 10^n (mis. 0, 100, 200, 300, 400).
function niceTicks(max: number, target = 4): number[] {
  if (max <= 0) return [0];
  const raw = max / target;
  const pow = 10 ** Math.floor(Math.log10(raw));
  const step = [1, 2, 5, 10].map((m) => m * pow).find((s) => s >= raw) ?? raw;
  const ticks: number[] = [];
  for (let v = 0; v < max + step; v += step) ticks.push(Math.round(v * 100) / 100);
  return ticks;
}

function ChartTooltip({ active, payload, total }: { active?: boolean; payload?: { payload: Datum }[]; total: number }) {
  const d = active ? payload?.[0]?.payload : undefined;
  if (!d) return null;
  const persen = total > 0 ? (d.luas_ha / total) * 100 : 0;
  return (
    <div className="rounded-lg border border-gray-200 bg-white px-3 py-2 text-xs shadow-md">
      <p className="font-semibold text-gray-900">{d.kecamatan}</p>
      <p className="mt-1 text-gray-600">
        Luas terairi <span className="font-semibold text-gray-900">{formatHa(d.luas_ha)} Ha</span>
      </p>
      <p className="text-gray-600">
        Jumlah unit <span className="font-semibold text-gray-900">{formatAngka(d.unit)}</span>
      </p>
      <p className="text-gray-400">{persen.toLocaleString("id-ID", { maximumFractionDigits: 1 })}% dari total luas</p>
    </div>
  );
}

// Peringkat luas lahan terairi per kecamatan (satu sumbu: Ha). Jumlah unit
// ditampilkan di label kategori & tooltip, bukan sebagai sumbu kedua.
export default function LuasKecamatanChart({ data }: { data: IrpomStatistik["per_kecamatan"] }) {
  const [view, setView] = useState<"grafik" | "tabel">("grafik");
  // Layar sempit: label cukup nama kecamatan supaya batang tidak terhimpit.
  const [sempit, setSempit] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia("(max-width: 640px)");
    const update = () => setSempit(mq.matches);
    update();
    mq.addEventListener("change", update);
    return () => mq.removeEventListener("change", update);
  }, []);

  const total = data.reduce((sum, d) => sum + d.luas_ha, 0);
  const rows = data.map((d) => ({
    ...d,
    label: sempit ? d.kecamatan : `${d.kecamatan} (${formatAngka(d.unit)} unit)`,
  }));
  const ticks = niceTicks(Math.max(0, ...data.map((d) => d.luas_ha)), sempit ? 2 : 4);

  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm sm:p-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="font-semibold text-gray-900">Luas Lahan Terairi per Kecamatan</p>
          <p className="text-sm text-gray-500">Diurutkan dari yang terluas, dalam hektar (Ha)</p>
        </div>
        <div className="flex rounded-lg border border-gray-200 p-0.5 text-xs">
          <button
            type="button"
            onClick={() => setView("grafik")}
            className={`flex items-center gap-1 rounded-md px-2.5 py-1 ${view === "grafik" ? "bg-sky-50 font-medium text-sky-800" : "text-gray-500"}`}
          >
            <BarChart3 size={13} /> Grafik
          </button>
          <button
            type="button"
            onClick={() => setView("tabel")}
            className={`flex items-center gap-1 rounded-md px-2.5 py-1 ${view === "tabel" ? "bg-sky-50 font-medium text-sky-800" : "text-gray-500"}`}
          >
            <Table2 size={13} /> Tabel
          </button>
        </div>
      </div>

      {data.length === 0 ? (
        <p className="py-12 text-center text-sm text-gray-400">Belum ada data.</p>
      ) : view === "grafik" ? (
        <div className="mt-5" style={{ height: rows.length * 36 + 30 }}>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={rows} layout="vertical" margin={{ top: 0, right: sempit ? 52 : 64, left: 0, bottom: 0 }}>
              <CartesianGrid stroke="#f1f5f9" horizontal={false} />
              <XAxis
                type="number"
                domain={[0, ticks[ticks.length - 1]]}
                ticks={ticks}
                tick={{ fontSize: 11, fill: "#9ca3af" }}
                axisLine={{ stroke: "#e5e7eb" }}
                tickLine={false}
                tickFormatter={(v: number) => formatAngka(v)}
              />
              <YAxis
                type="category"
                dataKey="label"
                width={sempit ? 108 : 190}
                tick={{ fontSize: sempit ? 11 : 12, fill: "#374151" }}
                axisLine={false}
                tickLine={false}
              />
              <Tooltip cursor={{ fill: "#f0f9ff" }} content={<ChartTooltip total={total} />} />
              <Bar dataKey="luas_ha" fill={BAR_COLOR} radius={[0, 4, 4, 0]} barSize={18}>
                <LabelList
                  dataKey="luas_ha"
                  position="right"
                  formatter={(v) => formatHa(Number(v))}
                  style={{ fontSize: 12, fontWeight: 600, fill: "#111827" }}
                />
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      ) : (
        <div className="mt-5 overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-200 text-left text-xs uppercase tracking-wide text-gray-500">
                <th className="py-2 pr-3 font-medium">Kecamatan</th>
                <th className="py-2 pr-3 text-right font-medium">Unit</th>
                <th className="py-2 pr-3 text-right font-medium">Luas Terairi (Ha)</th>
                <th className="py-2 text-right font-medium">Rata-rata/Unit</th>
              </tr>
            </thead>
            <tbody>
              {data.map((d) => (
                <tr key={d.id_kecamatan} className="border-b border-gray-100 last:border-0">
                  <td className="py-2 pr-3 text-gray-800">{d.kecamatan}</td>
                  <td className="py-2 pr-3 text-right tabular-nums text-gray-700">{formatAngka(d.unit)}</td>
                  <td className="py-2 pr-3 text-right tabular-nums font-medium text-gray-900">{formatHa(d.luas_ha)}</td>
                  <td className="py-2 text-right tabular-nums text-gray-700">{formatHa(d.unit > 0 ? d.luas_ha / d.unit : 0)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
