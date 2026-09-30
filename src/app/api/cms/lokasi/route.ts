import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth, requireRoles } from "@/lib/roles";

export async function GET() {
  const authError = await requireAuth();
  if (authError) return authError;

  try {
    const data = await prisma.lokasi.findMany({
      orderBy: [{ utama: "desc" }, { createdAt: "asc" }],
    });

    return NextResponse.json(data);
  } catch (e) {
    console.error("[api/cms/lokasi] DB gagal:", (e as Error)?.message ?? e);
    return NextResponse.json([]);
  }
}

export async function POST(req: Request) {
  const { error } = await requireRoles(["OWNER", "ADMIN"]);
  if (error) return error;

  try {
    const body = await req.json();
    const { nama, alamat, lat, lon, zoom, utama } = body;

    const parsedLat = Number(lat);
    const parsedLon = Number(lon);

    if (isNaN(parsedLat) || isNaN(parsedLon)) {
      return NextResponse.json(
        { error: "Latitude (lat) dan Longitude (lon) harus berupa angka koordinat yang valid" },
        { status: 400 }
      );
    }

    if (parsedLat < -90 || parsedLat > 90) {
      return NextResponse.json(
        { error: "Latitude harus bernilai antara -90 dan 90" },
        { status: 400 }
      );
    }

    if (parsedLon < -180 || parsedLon > 180) {
      return NextResponse.json(
        { error: "Longitude harus bernilai antara -180 dan 180" },
        { status: 400 }
      );
    }

    const count = await prisma.lokasi.count();
    const isUtama = count === 0 ? true : !!utama;

    const newLokasi = await prisma.$transaction(async (tx) => {
      if (isUtama) {
        await tx.lokasi.updateMany({
          data: { utama: false },
        });
      }

      return tx.lokasi.create({
        data: {
          nama: nama?.trim() || "Edelweiss Salon & Spa",
          alamat: alamat?.trim() || null,
          lat: parsedLat,
          lon: parsedLon,
          zoom: zoom != null && !isNaN(Number(zoom)) ? Math.min(Math.max(Number(zoom), 1), 21) : 15,
          utama: isUtama,
        },
      });
    });

    return NextResponse.json(newLokasi);
  } catch (err: unknown) {
    const errorMessage = err instanceof Error ? err.message : "Gagal menambahkan lokasi";
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}

export async function PUT(req: Request) {
  const { error } = await requireRoles(["OWNER", "ADMIN"]);
  if (error) return error;

  try {
    const body = await req.json();
    const { id, nama, alamat, lat, lon, zoom, utama } = body;

    if (!id) {
      return NextResponse.json({ error: "ID lokasi tidak ditemukan" }, { status: 400 });
    }

    const existing = await prisma.lokasi.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ error: "Data lokasi tidak ditemukan" }, { status: 404 });
    }

    const updateData: Record<string, unknown> = {};

    if (lat !== undefined) {
      const parsedLat = Number(lat);
      if (isNaN(parsedLat) || parsedLat < -90 || parsedLat > 90) {
        return NextResponse.json({ error: "Latitude tidak valid" }, { status: 400 });
      }
      updateData.lat = parsedLat;
    }

    if (lon !== undefined) {
      const parsedLon = Number(lon);
      if (isNaN(parsedLon) || parsedLon < -180 || parsedLon > 180) {
        return NextResponse.json({ error: "Longitude tidak valid" }, { status: 400 });
      }
      updateData.lon = parsedLon;
    }

    if (nama !== undefined) updateData.nama = nama.trim() || "Edelweiss Salon & Spa";
    if (alamat !== undefined) updateData.alamat = alamat ? alamat.trim() : null;
    if (zoom !== undefined && !isNaN(Number(zoom))) {
      updateData.zoom = Math.min(Math.max(Number(zoom), 1), 21);
    }

    const updatedLokasi = await prisma.$transaction(async (tx) => {
      if (utama === true) {
        await tx.lokasi.updateMany({
          where: { id: { not: id } },
          data: { utama: false },
        });
        updateData.utama = true;
      } else if (utama === false && existing.utama) {
        // Find another location to make primary if possible
        const another = await tx.lokasi.findFirst({ where: { id: { not: id } } });
        if (another) {
          await tx.lokasi.update({
            where: { id: another.id },
            data: { utama: true },
          });
          updateData.utama = false;
        } else {
          // Keep as primary if only 1 exists
          updateData.utama = true;
        }
      }

      return tx.lokasi.update({
        where: { id },
        data: updateData,
      });
    });

    return NextResponse.json(updatedLokasi);
  } catch (err: unknown) {
    const errorMessage = err instanceof Error ? err.message : "Gagal memperbarui lokasi";
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  const { error } = await requireRoles(["OWNER", "ADMIN"]);
  if (error) return error;

  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ error: "ID lokasi tidak boleh kosong" }, { status: 400 });
    }

    const total = await prisma.lokasi.count();
    if (total <= 1) {
      return NextResponse.json(
        { error: "Tidak dapat menghapus lokasi terakhir. Minimal harus ada 1 lokasi tersimpan." },
        { status: 400 }
      );
    }

    const target = await prisma.lokasi.findUnique({ where: { id } });
    if (!target) {
      return NextResponse.json({ error: "Lokasi tidak ditemukan" }, { status: 404 });
    }

    await prisma.$transaction(async (tx) => {
      await tx.lokasi.delete({ where: { id } });

      if (target.utama) {
        const nextLokasi = await tx.lokasi.findFirst({ orderBy: { createdAt: "asc" } });
        if (nextLokasi) {
          await tx.lokasi.update({
            where: { id: nextLokasi.id },
            data: { utama: true },
          });
        }
      }
    });

    return NextResponse.json({ ok: true });
  } catch (err: unknown) {
    const errorMessage = err instanceof Error ? err.message : "Gagal menghapus lokasi";
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}
