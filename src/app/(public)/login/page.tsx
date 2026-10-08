"use client";
import { signIn } from "next-auth/react";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { Input, Label, Btn } from "@/components/ui";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [err, setErr] = useState("");
  const router = useRouter();

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setErr("");
    const r = await signIn("credentials", { email, password, redirect: false });
    if (r?.ok) router.push("/cms");
    else setErr("Login gagal — cek email/password.");
  }

  return (
    <div className="mx-auto max-w-sm px-4 py-16 text-center">
      <div className="mx-auto mb-4 relative h-20 w-20 overflow-hidden rounded-full border-2 border-gold-400/60 bg-white shadow-lg">
        <Image src="/logo.png" alt="Edelweiss Logo" fill className="object-cover" priority />
      </div>
      <h1 className="font-serif-display text-3xl font-bold text-sage-900">Login CMS</h1>
      <p className="mt-1 text-sm text-stone-500">Edelweiss Salon Makeup Art — Owner / Admin / Kasir</p>
      <form onSubmit={submit} className="mt-6 space-y-4 rounded-2xl border bg-white p-6 text-left">
        <div><Label>Email</Label><Input type="email" placeholder="Masukkan email" value={email} onChange={(e) => setEmail(e.target.value)} required /></div>
        <div><Label>Password</Label><Input type="password" placeholder="Masukkan password" value={password} onChange={(e) => setPassword(e.target.value)} required /></div>
        <Btn className="w-full">Masuk</Btn>
        {err && <p className="text-sm text-red-600 font-semibold">{err}</p>}
      </form>
    </div>
  );
}
