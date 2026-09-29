import ProdukClient from "./ProdukClient";
import { sessionRole } from "@/lib/roles";

export default async function Page() {
  const s = await sessionRole();
  return <ProdukClient canDelete={s?.role !== "KASIR"} />;
}
