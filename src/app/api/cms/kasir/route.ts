import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireRoles } from "@/lib/roles";

export async function GET() {
  const { error } = await requireRoles(["OWNER", "ADMIN", "KASIR"]);
  if (error) return error;

  try {
    const [produk, karyawan, promo, pelanggan] = await Promise.all([
      prisma.produk.findMany({
        where: { aktif: true },
        include: { kategori: true },
        orderBy: { nama: "asc" },
      }),
      prisma.karyawan.findMany({
        where: { aktif: true },
        orderBy: { nama: "asc" },
      }),
      prisma.promo.findMany({
        where: { aktif: true },
        orderBy: { kode: "asc" },
      }),
      prisma.pelanggan.findMany({
        select: { id: true, nama: true, wa: true, poin: true },
        orderBy: { nama: "asc" },
      }),
    ]);

    return NextResponse.json({ produk, karyawan, promo, pelanggan });
  } catch (err) {
    console.error("GET /api/cms/kasir Error:", err);
    return NextResponse.json({ error: "Gagal mengambil data kasir" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  const { error } = await requireRoles(["OWNER", "ADMIN", "KASIR"]);
  if (error) return error;

  try {
    const body = await req.json();
    const { nama, wa, items, produkId, karyawanId, promoKode, diskonManual, metodeBayar, splitDetails, isDp, dpAmount, pakaiPoin } = body;

    // Normalisasi format items (Mendukung Multi-Item Cart & Backward Compatibility)
    let cartItems: Array<{ produkId: string; karyawanId?: string; qty: number }> = [];
    if (Array.isArray(items) && items.length > 0) {
      cartItems = items.map((it: { produkId: string; karyawanId?: string; qty?: number }) => ({
        produkId: it.produkId,
        karyawanId: it.karyawanId || undefined,
        qty: Math.max(1, Number(it.qty ?? 1)),
      }));
    } else if (produkId) {
      cartItems = [{ produkId, karyawanId: karyawanId || undefined, qty: 1 }];
    }

    if (!nama || !wa || cartItems.length === 0) {
      return NextResponse.json({ error: "Nama, WA, dan minimal 1 Layanan/Produk wajib diisi" }, { status: 400 });
    }

    // Ambil detail seluruh produk
    const productIds = cartItems.map((c) => c.produkId);
    const dbProducts = await prisma.produk.findMany({
      where: { id: { in: productIds } },
    });

    const productMap = new Map(dbProducts.map((p) => [p.id, p]));

    // Validasi keberadaan & stok produk fisik
    let subtotalHarga = 0;
    const itemsWithDetail: Array<{
      produk: typeof dbProducts[0];
      karyawanId?: string;
      qty: number;
    }> = [];

    for (const item of cartItems) {
      const p = productMap.get(item.produkId);
      if (!p) {
        return NextResponse.json({ error: `Produk/Layanan ID "${item.produkId}" tidak ditemukan` }, { status: 404 });
      }

      // Cek stok jika produk fisik (bukan layanan)
      if (!p.isLayanan && p.stok < item.qty) {
        return NextResponse.json(
          { error: `Stok produk "${p.nama}" tidak mencukupi (Tersisa: ${p.stok}, Dibutuhkan: ${item.qty})` },
          { status: 400 }
        );
      }

      subtotalHarga += p.harga * item.qty;
      itemsWithDetail.push({ produk: p, karyawanId: item.karyawanId, qty: item.qty });
    }

    // Find or create Pelanggan
    const cleanWa = wa.replace(/[^0-9]/g, "");
    let pelanggan = await prisma.pelanggan.findFirst({ where: { wa: cleanWa } });
    if (!pelanggan) {
      pelanggan = await prisma.pelanggan.create({
        data: { nama: nama.trim(), wa: cleanWa },
      });
    }

    // Cegah duplikasi transaksi kasir (15 detik terakhir)
    const fifteenSecAgo = new Date(Date.now() - 15 * 1000);
    const duplikatKasir = await prisma.booking.findFirst({
      where: {
        pelangganId: pelanggan.id,
        createdAt: { gte: fifteenSecAgo },
      },
    });

    if (duplikatKasir) {
      return NextResponse.json(
        { error: "Transaksi serupa baru saja diproses. Mencegah duplikasi transaksi." },
        { status: 409 }
      );
    }

    // Hitung Promo & Diskon Manual
    let diskonPromoManual = Number(diskonManual ?? 0);
    let promoId: string | undefined = undefined;

    if (promoKode) {
      const p = await prisma.promo.findUnique({ where: { kode: promoKode.toUpperCase() } });
      if (p && p.aktif) {
        promoId = p.id;
        if (p.tipe === "PERSEN") {
          const hitung = Math.round((subtotalHarga * p.nilai) / 100);
          diskonPromoManual = p.maxDiskon ? Math.min(hitung, p.maxDiskon) : hitung;
        } else {
          diskonPromoManual = p.nilai;
        }
      }
    }

    // Perhitungan Poin Loyalitas (1 Poin = Rp 1.000 diskon, 1 Poin per Rp 10.000 spent)
    const numPakaiPoin = Math.min(pelanggan.poin, Math.max(0, Number(pakaiPoin ?? 0)));
    const diskonPoin = numPakaiPoin * 1000;
    const diskonTotalFinal = diskonPromoManual + diskonPoin;
    const grandTotal = Math.max(0, subtotalHarga - diskonTotalFinal);
    const poinDiperoleh = Math.floor(grandTotal / 10000);

    // Format Keterangan Pembayaran (Split / DP / Single)
    let paymentDesc = metodeBayar || "TUNAI";
    if (numPakaiPoin > 0) {
      paymentDesc += ` (Tukar ${numPakaiPoin} Poin: -Rp ${diskonPoin.toLocaleString("id-ID")})`;
    }

    const splits: Array<{ metode: string; jumlah: number }> = [];

    if (metodeBayar === "SPLIT" && Array.isArray(splitDetails) && splitDetails.length > 0) {
      splitDetails.forEach((sd: { metode: string; jumlah: number }) => {
        if (sd.jumlah > 0) {
          splits.push({ metode: sd.metode, jumlah: Number(sd.jumlah) });
        }
      });
      paymentDesc = `Split (${splits.map((s) => `${s.metode}: Rp ${s.jumlah.toLocaleString("id-ID")}`).join(" + ")})`;
    } else if (isDp && Number(dpAmount) > 0) {
      const dpVal = Math.min(grandTotal, Math.max(0, Number(dpAmount)));
      const sisaVal = Math.max(0, grandTotal - dpVal);
      paymentDesc = `DP (${metodeBayar || "TUNAI"}: Rp ${dpVal.toLocaleString("id-ID")}, Sisa: Rp ${sisaVal.toLocaleString("id-ID")})`;
    }

    // Atomic transaction for Multi-Item Checkout, Loyalty Points & Financial Ledger
    const result = await prisma.$transaction(async (tx) => {
      const createdBookings = [];
      const totalBookingCount = itemsWithDetail.reduce((acc, item) => acc + item.qty, 0);
      const perBookingDiskon = Math.round(diskonTotalFinal / Math.max(1, totalBookingCount));

      // Create Booking records for each item & decrement stock for physical products
      for (const item of itemsWithDetail) {
        for (let q = 0; q < item.qty; q++) {
          const booking = await tx.booking.create({
            data: {
              pelangganId: pelanggan.id,
              produkId: item.produk.id,
              karyawanId: item.karyawanId || null,
              promoId,
              jadwal: new Date(),
              status: "SELESAI",
              diskon: perBookingDiskon,
              catatan: `Kasir POS Walk-in (${paymentDesc})`,
            },
          });
          createdBookings.push(booking);
        }

        // Potong stok jika produk fisik
        if (!item.produk.isLayanan) {
          await tx.produk.update({
            where: { id: item.produk.id },
            data: { stok: { decrement: item.qty } },
          });
        }
      }

      // Sync Poin Loyalitas Pelanggan (Potong Poin Tukar + Tambah Poin Transaksi)
      const updatedPelanggan = await tx.pelanggan.update({
        where: { id: pelanggan.id },
        data: {
          poin: {
            increment: poinDiperoleh - numPakaiPoin,
          },
        },
      });

      const itemNames = itemsWithDetail.map((i) => `${i.produk.nama}${i.qty > 1 ? ` x${i.qty}` : ""}`).join(", ");
      const mainBookingId = createdBookings[0]?.id || null;

      // Pencatatan Kas Keuangan (Split vs Single vs DP)
      if (splits.length > 0) {
        for (const s of splits) {
          await tx.transaksiKeuangan.create({
            data: {
              tipe: "MASUK",
              kategori: "Jasa & Produk Salon",
              jumlah: s.jumlah,
              keterangan: `POS Split (${s.metode}): ${itemNames} - ${nama}`,
              bookingId: mainBookingId,
            },
          });
        }
      } else {
        const dpMasuk = isDp && Number(dpAmount) > 0 ? Math.min(grandTotal, Number(dpAmount)) : grandTotal;
        await tx.transaksiKeuangan.create({
          data: {
            tipe: "MASUK",
            kategori: "Jasa & Produk Salon",
            jumlah: dpMasuk,
            keterangan: `POS Kasir (${paymentDesc}): ${itemNames} - ${nama}`,
            bookingId: mainBookingId,
          },
        });
      }

      return { booking: createdBookings[0], pelanggan: updatedPelanggan };
    });

    return NextResponse.json({
      success: true,
      bookingId: result?.booking?.id ?? null,
      noNota: `EWS-${new Date().getFullYear()}-${(result?.booking?.id ?? "000000").slice(-6).toUpperCase()}`,
      poinPelanggan: result?.pelanggan?.poin ?? 0,
      poinDiperoleh,
      poinDigunakan: numPakaiPoin,
    });
  } catch (err) {
    console.error("Kasir POS Error:", err);
    return NextResponse.json({ error: "Terjadi kesalahan transaksi Kasir" }, { status: 500 });
  }
}



