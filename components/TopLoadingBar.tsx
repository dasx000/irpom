"use client";

import { Suspense, useEffect, useRef } from "react";
import { usePathname, useSearchParams } from "next/navigation";

// Garis progres tipis di paling atas layar selama pindah halaman (gaya
// NProgress). Mulai saat link internal diklik atau form ber-atribut
// `data-loading-bar` dikirim (mis. Keluar); selesai saat URL berubah.
// Digerakkan langsung lewat DOM (bukan state) karena murni visual.
function createBar(el: HTMLDivElement) {
  let progress: number | null = null;
  let trickle: ReturnType<typeof setInterval> | null = null;
  let safety: ReturnType<typeof setTimeout> | null = null;
  let hide: ReturnType<typeof setTimeout> | null = null;

  const render = () => {
    el.style.width = `${progress ?? 0}%`;
    el.style.opacity = progress == null || progress >= 100 ? "0" : "1";
  };
  const clearTimers = () => {
    for (const t of [trickle, safety, hide]) if (t) clearTimeout(t as ReturnType<typeof setTimeout>);
    trickle = safety = hide = null;
  };

  return {
    start() {
      clearTimers();
      progress = 8;
      render();
      // Maju cepat lalu melambat, tidak pernah sampai 100% sebelum selesai.
      trickle = setInterval(() => {
        if (progress != null) progress += (90 - progress) * 0.1;
        render();
      }, 200);
      // Jaga-jaga bila navigasi batal / URL tidak berubah.
      safety = setTimeout(() => this.finish(), 15000);
    },
    finish() {
      if (progress == null) return;
      clearTimers();
      progress = 100;
      render();
      hide = setTimeout(() => {
        progress = null;
        el.style.transition = "none";
        render();
        void el.offsetWidth; // reset lebar ke 0 tanpa animasi mundur
        el.style.transition = "";
      }, 300);
    },
    destroy: clearTimers,
  };
}

function Bar() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const elRef = useRef<HTMLDivElement>(null);
  const barRef = useRef<ReturnType<typeof createBar> | null>(null);

  useEffect(() => {
    const bar = createBar(elRef.current!);
    barRef.current = bar;

    function onClick(e: MouseEvent) {
      if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
      const a = (e.target as Element | null)?.closest?.("a");
      if (!a || !a.href || a.target === "_blank" || a.hasAttribute("download")) return;
      const url = new URL(a.href, location.href);
      if (url.origin !== location.origin) return;
      // Link ke bagian di halaman yang sama (#data-irpom) atau URL yang sama: abaikan.
      if (url.pathname === location.pathname && url.search === location.search) return;
      if (url.pathname.startsWith("/api/")) return; // unduhan file
      bar.start();
    }
    function onSubmit(e: SubmitEvent) {
      if ((e.target as HTMLElement | null)?.hasAttribute?.("data-loading-bar")) bar.start();
    }
    document.addEventListener("click", onClick, true);
    document.addEventListener("submit", onSubmit, true);
    return () => {
      document.removeEventListener("click", onClick, true);
      document.removeEventListener("submit", onSubmit, true);
      bar.destroy();
    };
  }, []);

  // URL berubah = halaman baru sudah tampil.
  useEffect(() => {
    barRef.current?.finish();
  }, [pathname, searchParams]);

  return (
    <div aria-hidden className="pointer-events-none fixed inset-x-0 top-0 z-[2000] h-[3px]">
      <div
        ref={elRef}
        className="h-full w-0 bg-sky-500 opacity-0 shadow-[0_0_8px_rgba(14,165,233,0.7)] transition-[width,opacity] duration-200 ease-out"
      />
    </div>
  );
}

export default function TopLoadingBar() {
  return (
    <Suspense fallback={null}>
      <Bar />
    </Suspense>
  );
}
