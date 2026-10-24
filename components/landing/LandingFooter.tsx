import Link from "next/link";
import { Code2, Droplets } from "lucide-react";

export default function LandingFooter() {
  return (
    <footer className="border-t border-gray-200 bg-white py-8">
      <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 px-4 text-sm text-gray-500 sm:flex-row sm:px-6">
        <div className="flex items-center gap-2">
          <Droplets size={16} className="text-sky-600" />
          <p>© {new Date().getFullYear()} Monitoring IRPOM — Pemerintah Kabupaten Way Kanan</p>
        </div>
        <nav className="flex flex-wrap items-center justify-center gap-x-4 gap-y-1">
          <a href="#data-irpom" className="hover:text-sky-700">
            Data IRPOM
          </a>
          <a href="#sebaran" className="hover:text-sky-700">
            Peta Sebaran
          </a>
          <a href="#jelajah" className="hover:text-sky-700">
            Jelajah Wilayah
          </a>
          <Link
            href="https://github.com/dasx000"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 hover:text-sky-700"
          >
            <Code2 size={15} />
            dasx000
          </Link>
        </nav>
      </div>
    </footer>
  );
}
