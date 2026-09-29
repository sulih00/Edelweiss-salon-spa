import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireRoles } from "@/lib/roles";

export async function POST(req: Request) {
  const { error } = await requireRoles(["OWNER", "ADMIN", "KASIR"]);
  if (error) return error;

  try {
    const { id, status } = await req.json();
    if (!id || !status) {
      return NextResponse.json({ error: "ID dan status wajib diisi" }, { status: 400 });
    }

    const updatedBooking = await prisma.$transaction(async (tx) => {
      const booking = await tx.booking.update({
        where: { id },
        data: { status },
        include: { produk: true, promo: true },
      });

      if (status === "SELESAI") {
        const bersih = Math.max(0, (booking.produk?.harga ?? 0) - (booking.diskon ?? 0));
        const exists = await tx.transaksiKeuangan.findFirst({ where: { bookingId: id } });
        if (!exists) {
          await tx.transaksiKeuangan.create({
            data: {
              tipe: "MASUK",
              kategori: "Jasa Salon",
              jumlah: bersih,
              keterangan: booking.promo
                ? `${booking.produk?.nama ?? "Layanan"} (promo ${booking.promo.kode})`
                : `${booking.produk?.nama ?? "Layanan"}`,
              bookingId: id,
            },
          });
        }

        const poinEarned = Math.floor(bersih / 10000);
        if (poinEarned > 0 && booking.pelangganId) {
          try {
            await tx.pelanggan.update({
              where: { id: booking.pelangganId },
              data: { poin: { increment: poinEarned } },
            });
          } catch (e) {
            console.warn("Gagal update poin booking:", e);
          }
        }
      } else {
        // Jika status bukan SELESAI (misal BATAL, BARU, DIKONFIRMASI), hapus transaksi kas masuk terkait
        await tx.transaksiKeuangan.deleteMany({ where: { bookingId: id } });
      }

      return booking;
    });

    return NextResponse.json(updatedBooking);
  } catch (err) {
    console.error("Gagal update status booking:", err);
    return NextResponse.json({ error: "Gagal memperbarui status booking" }, { status: 500 });
  }
}

