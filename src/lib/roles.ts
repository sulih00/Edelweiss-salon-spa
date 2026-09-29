import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";
import { authOptions } from "./auth";

export type Role = "OWNER" | "ADMIN" | "KASIR" | "USER";

export async function sessionRole(): Promise<{ email: string; role: Role } | null> {
  const s = await getServerSession(authOptions);
  if (!s?.user) return null;
  const u = s.user as unknown as { email?: string; role?: Role };
  return { email: u.email ?? "", role: u.role ?? "ADMIN" };
}

/** Guard API: return NextResponse error jika tidak boleh, atau null jika lolos. */
export async function requireRoles(allowed: Role[]) {
  const s = await sessionRole();
  if (!s) return { error: NextResponse.json({ error: "Unauthorized" }, { status: 401 }) as NextResponse, session: null };
  if (!allowed.includes(s.role))
    return { error: NextResponse.json({ error: "Forbidden: butuh role " + allowed.join("/") }, { status: 403 }) as NextResponse, session: null };
  return { error: null, session: s };
}

export async function requireAuth() {
  const s = await getServerSession(authOptions);
  if (!s) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  return null;
}
