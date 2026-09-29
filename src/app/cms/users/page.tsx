import UsersClient from "./UsersClient";
import { sessionRole } from "@/lib/roles";
import { redirect } from "next/navigation";

export default async function Page() {
  const s = await sessionRole();
  if (s?.role !== "OWNER") redirect("/cms");
  return <UsersClient />;
}
