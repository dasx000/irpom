"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Droplets } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import PasswordInput from "@/components/PasswordInput";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);

    const supabase = createClient();
    const { error } = await supabase.auth.signInWithPassword({ email: email.trim(), password });

    if (error) {
      // Akun yang dinonaktifkan Super Admin diblokir di Supabase Auth.
      setError(
        error.code === "user_banned"
          ? "Akun Anda dinonaktifkan. Hubungi Super Admin."
          : "Email atau kata sandi salah."
      );
      setIsSubmitting(false);
      return;
    }

    router.push("/admin");
    router.refresh();
  }

  return (
    <main className="flex min-h-screen">
      <div className="hidden flex-1 flex-col justify-between bg-sky-800 p-10 text-white lg:flex">
        <Link href="/" className="flex items-center gap-2">
          <Droplets size={22} />
          <span className="font-semibold">Monitoring IRPOM</span>
        </Link>
        <div>
          <h2 className="text-2xl font-semibold">Irigasi Perpompaan Kabupaten Way Kanan</h2>
          <p className="mt-2 max-w-md text-sky-100">
            Pengelolaan data unit pompa, luas lahan terairi, status, dan peta sebaran IRPOM se-Kabupaten Way Kanan.
          </p>
        </div>
        <p className="text-xs text-sky-200">Monitoring IRPOM</p>
      </div>

      <div className="flex flex-1 items-center justify-center bg-gray-50 p-6">
        <div className="w-full max-w-sm">
          <Link href="/" className="mb-6 flex items-center gap-2 lg:hidden">
            <Droplets size={20} className="text-sky-700" />
            <span className="font-semibold text-gray-900">Monitoring IRPOM</span>
          </Link>

          <div className="rounded-lg border border-gray-200 bg-white p-8 shadow-sm">
            <h1 className="mb-1 text-lg font-semibold text-gray-900">Masuk</h1>
            <p className="mb-6 text-sm text-gray-500">Khusus pengelola data IRPOM.</p>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label htmlFor="email" className="mb-1 block text-sm font-medium text-gray-700">
                  Email
                </label>
                <input
                  id="email"
                  type="email"
                  autoComplete="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-sky-500 focus:outline-none focus:ring-1 focus:ring-sky-500"
                />
              </div>

              <div>
                <label htmlFor="password" className="mb-1 block text-sm font-medium text-gray-700">
                  Kata Sandi
                </label>
                <PasswordInput
                  id="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-sky-500 focus:outline-none focus:ring-1 focus:ring-sky-500"
                />
              </div>

              {error && <p className="text-sm text-red-600">{error}</p>}

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full rounded-md bg-sky-700 px-4 py-2 text-sm font-medium text-white hover:bg-sky-800 disabled:opacity-50"
              >
                {isSubmitting ? "Memproses..." : "Masuk"}
              </button>
            </form>
          </div>
        </div>
      </div>
    </main>
  );
}
