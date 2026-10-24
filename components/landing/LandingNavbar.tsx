"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Droplets, LayoutDashboard, User } from "lucide-react";

const NAV_ITEMS = [
  { href: "#beranda", label: "Beranda" },
  { href: "#data-irpom", label: "Data IRPOM" },
  { href: "#sebaran", label: "Peta Sebaran" },
  { href: "#jelajah", label: "Jelajah Wilayah" },
];

// Transparan mengambang di atas hero gelap saat di paling atas, baru berubah
// jadi bar putih solid setelah discroll -- supaya tetap kebaca saat
// pengunjung sampai ke seksi terang di bawah hero.
export default function LandingNavbar({ loggedIn = false }: { loggedIn?: boolean }) {
  const [scrolled, setScrolled] = useState(false);
  const [activeHref, setActiveHref] = useState("#beranda");

  useEffect(() => {
    function handleScroll() {
      setScrolled(window.scrollY > 40);
    }
    handleScroll();
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    const sections = NAV_ITEMS.map((item) => document.querySelector(item.href)).filter((el): el is Element => el !== null);
    if (sections.length === 0) return;

    // Section dianggap "aktif" kalau melintasi pita tipis di tengah layar
    // (rootMargin -45% atas & bawah), bukan sekadar "sedikit terlihat" --
    // supaya nav yang nyala selalu yang paling relevan dengan posisi scroll.
    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((entry) => entry.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio);
        if (visible[0]) {
          setActiveHref(`#${visible[0].target.id}`);
        }
      },
      { rootMargin: "-45% 0px -45% 0px", threshold: 0 }
    );

    sections.forEach((section) => observer.observe(section));
    return () => observer.disconnect();
  }, []);

  return (
    <header
      className={`fixed inset-x-0 top-0 z-[1100] w-full border-b transition-colors duration-300 ${
        scrolled ? "border-gray-200/80 bg-white/85 backdrop-blur-md" : "border-transparent bg-transparent"
      }`}
    >
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-3 sm:px-6 sm:py-4">
        <a href="#beranda" className="flex min-w-0 items-center gap-2.5">
          <span
            className={`flex size-9 shrink-0 items-center justify-center rounded-xl bg-sky-600 text-white shadow-sm shadow-sky-600/30 transition-all duration-300 ${
              scrolled ? "" : "ring-1 ring-white/25"
            }`}
          >
            <Droplets size={19} />
          </span>
          <div className="min-w-0 leading-tight">
            <p className={`truncate font-semibold tracking-tight transition-colors duration-300 ${scrolled ? "text-gray-900" : "text-white"}`}>
              Monitoring IRPOM
            </p>
            <p className={`truncate text-xs transition-colors duration-300 ${scrolled ? "text-gray-500" : "text-white/70"}`}>
              Kabupaten Way Kanan
            </p>
          </div>
        </a>

        <nav
          className={`hidden items-center gap-7 text-sm font-medium transition-colors duration-300 lg:flex ${
            scrolled ? "text-gray-600" : "text-white/85"
          }`}
        >
          {NAV_ITEMS.map((item) => {
            const isActive = activeHref === item.href;
            return (
              <a
                key={item.href}
                href={item.href}
                className={`group relative py-1 transition-colors hover:text-sky-500 ${
                  isActive ? (scrolled ? "font-semibold text-sky-700" : "font-semibold text-white") : ""
                }`}
              >
                {item.label}
                <span
                  className={`absolute inset-x-0 -bottom-0.5 h-px bg-sky-500 transition-transform duration-300 ${
                    isActive ? "scale-x-100" : "scale-x-0 group-hover:scale-x-100"
                  }`}
                />
              </a>
            );
          })}
        </nav>

        <Link
          href={loggedIn ? "/admin" : "/login"}
          className={`inline-flex shrink-0 items-center gap-1.5 rounded-full border px-4 py-2 text-sm font-medium transition-all duration-300 sm:px-5 ${
            scrolled
              ? "border-sky-600 text-sky-700 hover:bg-sky-600 hover:text-white hover:shadow-md hover:shadow-sky-600/25"
              : "border-white/50 text-white hover:bg-white/10"
          }`}
        >
          {loggedIn ? <LayoutDashboard size={15} /> : <User size={15} />}
          {loggedIn ? "Panel Admin" : "Masuk"}
        </Link>
      </div>
    </header>
  );
}
