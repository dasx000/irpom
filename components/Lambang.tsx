import Image from "next/image";

// Lambang Kabupaten Way Kanan (public/images/lambang-way-kanan.png, 116x160,
// ~9 KB). `tinggi` = tinggi tampil dalam px; lebar mengikuti rasio asli.
export default function Lambang({ tinggi = 36, className = "" }: { tinggi?: number; className?: string }) {
  return (
    <Image
      src="/images/lambang-way-kanan.png"
      alt="Lambang Kabupaten Way Kanan"
      width={Math.round((tinggi * 116) / 160)}
      height={tinggi}
      unoptimized
      className={`shrink-0 ${className}`}
    />
  );
}
