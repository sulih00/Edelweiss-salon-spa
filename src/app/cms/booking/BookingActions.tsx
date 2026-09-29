"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { RowBtn } from "@/components/admin";

export default function BookingActions({ id, status }: { id: string; status: string }) {
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  async function set(s: string) {
    setLoading(true);
    await fetch("/api/cms/booking", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id, status: s }) });
    setLoading(false);
    router.refresh();
  }
  if (status === "SELESAI" || status === "BATAL") return null;
  return (
    <>
      {status === "BARU" && <RowBtn tone="primary" onClick={() => !loading && set("DIKONFIRMASI")}>Konfirmasi</RowBtn>}
      {status !== "BARU" && <RowBtn tone="green" onClick={() => !loading && set("SELESAI")}>Selesai</RowBtn>}
      <RowBtn onClick={() => !loading && set("BATAL")}>Batal</RowBtn>
    </>
  );
}
