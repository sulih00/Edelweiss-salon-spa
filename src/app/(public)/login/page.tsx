"use client";
import { signIn } from "next-auth/react";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { Input, Label, Btn } from "@/components/ui";
import { Lock } from "lucide-react";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [err, setErr] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setErr("");
    setLoading(true);
    const r = await signIn("credentials", { email, password, redirect: false });
    setLoading(false);
    if (r?.ok) router.push("/cms");
    else setErr("Login gagal — cek email/password.");
  }

  return (
    <div className="relative flex min-h-[70vh] items-center justify-center overflow-hidden px-4 py-16">
      {/* Decorative blurs */}
      <div className="pointer-events-none absolute -left-24 top-10 h-64 w-64 rounded-full bg-sage-200/40 blur-3xl" />
      <div className="pointer-events-none absolute -right-20 bottom-10 h-56 w-56 rounded-full bg-gold-400/20 blur-3xl" />

      <div className="relative w-full max-w-sm text-center">
        <div className="mx-auto mb-5 relative h-20 w-20 overflow-hidden rounded-full border-2 border-gold-400/60 bg-white shadow-lg">
          <Image src="/logo.png" alt="Edelweiss Logo" fill className="object-cover" priority />
        </div>
        <h1 className="font-serif-display text-3xl font-bold text-sage-900">Login CMS</h1>
        <p className="mt-1.5 text-sm text-stone-500">Edelweiss Salon Makeup Art — Owner / Admin / Kasir</p>

        <form onSubmit={submit} className="mt-7 space-y-5 rounded-3xl border border-stone-200/80 bg-white p-7 text-left shadow-xl shadow-sage-900/8">
          <div>
            <Label>Email</Label>
            <Input type="email" placeholder="Masukkan email" value={email} onChange={(e) => setEmail(e.target.value)} required />
          </div>
          <div>
            <Label>Password</Label>
            <Input type="password" placeholder="Masukkan password" value={password} onChange={(e) => setPassword(e.target.value)} required />
          </div>
          <Btn className="w-full flex items-center justify-center gap-2" disabled={loading}>
            <Lock size={14} />
            {loading ? "Memproses..." : "Masuk"}
          </Btn>
          {err && (
            <div className="rounded-xl bg-red-50 px-4 py-2.5 text-center">
              <p className="text-sm font-semibold text-red-600">{err}</p>
            </div>
          )}
        </form>
      </div>
    </div>
  );
}
