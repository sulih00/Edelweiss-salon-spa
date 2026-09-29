import GaleriClient from "./GaleriClient";
import { sessionRole } from "@/lib/roles";
import { redirect } from "next/navigation";

export default async function Page() {
  const s = await sessionRole();
  if (!s || !["OWNER", "ADMIN"].includes(s.role)) redirect("/cms");
  return <GaleriClient />;
}
