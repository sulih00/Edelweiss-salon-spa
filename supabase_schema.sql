-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateEnum
CREATE TYPE "Role" AS ENUM ('OWNER', 'ADMIN', 'KASIR', 'USER');

-- CreateEnum
CREATE TYPE "BookingStatus" AS ENUM ('BARU', 'DIKONFIRMASI', 'SELESAI', 'BATAL');

-- CreateEnum
CREATE TYPE "TipeTransaksi" AS ENUM ('MASUK', 'KELUAR');

-- CreateEnum
CREATE TYPE "TipeDiskon" AS ENUM ('PERSEN', 'NOMINAL');

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "role" "Role" NOT NULL DEFAULT 'ADMIN',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Karyawan" (
    "id" TEXT NOT NULL,
    "nama" TEXT NOT NULL,
    "jabatan" TEXT NOT NULL DEFAULT 'Terapis',
    "telepon" TEXT,
    "komisiPersen" INTEGER NOT NULL DEFAULT 0,
    "aktif" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Karyawan_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "KategoriProduk" (
    "id" TEXT NOT NULL,
    "nama" TEXT NOT NULL,

    CONSTRAINT "KategoriProduk_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Produk" (
    "id" TEXT NOT NULL,
    "nama" TEXT NOT NULL,
    "kategoriId" TEXT NOT NULL,
    "harga" INTEGER NOT NULL DEFAULT 0,
    "durasiMenit" INTEGER NOT NULL DEFAULT 60,
    "stok" INTEGER NOT NULL DEFAULT 0,
    "foto" TEXT,
    "deskripsi" TEXT,
    "aktif" BOOLEAN NOT NULL DEFAULT true,
    "isLayanan" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Produk_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Pelanggan" (
    "id" TEXT NOT NULL,
    "nama" TEXT NOT NULL,
    "wa" TEXT NOT NULL,
    "alamat" TEXT,
    "poin" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Pelanggan_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Booking" (
    "id" TEXT NOT NULL,
    "pelangganId" TEXT NOT NULL,
    "produkId" TEXT NOT NULL,
    "karyawanId" TEXT,
    "jadwal" TIMESTAMP(3) NOT NULL,
    "status" "BookingStatus" NOT NULL DEFAULT 'BARU',
    "catatan" TEXT,
    "buktiTF" TEXT,
    "promoId" TEXT,
    "diskon" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Booking_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Promo" (
    "id" TEXT NOT NULL,
    "kode" TEXT NOT NULL,
    "nama" TEXT NOT NULL,
    "deskripsi" TEXT,
    "tipe" "TipeDiskon" NOT NULL DEFAULT 'PERSEN',
    "nilai" INTEGER NOT NULL DEFAULT 10,
    "minBelanja" INTEGER NOT NULL DEFAULT 0,
    "maxDiskon" INTEGER,
    "kuota" INTEGER,
    "terpakai" INTEGER NOT NULL DEFAULT 0,
    "mulai" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "berakhir" TIMESTAMP(3),
    "aktif" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Promo_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TransaksiKeuangan" (
    "id" TEXT NOT NULL,
    "tanggal" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "tipe" "TipeTransaksi" NOT NULL,
    "kategori" TEXT NOT NULL,
    "jumlah" INTEGER NOT NULL,
    "keterangan" TEXT,
    "bookingId" TEXT,
    "dibuatOlehId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TransaksiKeuangan_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Rekening" (
    "id" TEXT NOT NULL,
    "bank" TEXT NOT NULL,
    "nomor" TEXT NOT NULL,
    "atasNama" TEXT NOT NULL,
    "aktif" BOOLEAN NOT NULL DEFAULT true,
    "urutan" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Rekening_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Galeri" (
    "id" TEXT NOT NULL,
    "foto" TEXT NOT NULL,
    "judul" TEXT,
    "tampil" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "Galeri_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Testimoni" (
    "id" TEXT NOT NULL,
    "nama" TEXT NOT NULL,
    "isi" TEXT NOT NULL,
    "rating" INTEGER NOT NULL DEFAULT 5,
    "tampil" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "Testimoni_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Lokasi" (
    "id" TEXT NOT NULL,
    "nama" TEXT NOT NULL DEFAULT 'Edelweiss Salon & Spa',
    "alamat" TEXT,
    "lat" DOUBLE PRECISION NOT NULL,
    "lon" DOUBLE PRECISION NOT NULL,
    "zoom" INTEGER NOT NULL DEFAULT 15,
    "utama" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Lokasi_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE INDEX "User_role_idx" ON "User"("role");

-- CreateIndex
CREATE INDEX "Karyawan_aktif_idx" ON "Karyawan"("aktif");

-- CreateIndex
CREATE UNIQUE INDEX "KategoriProduk_nama_key" ON "KategoriProduk"("nama");

-- CreateIndex
CREATE INDEX "Produk_kategoriId_idx" ON "Produk"("kategoriId");

-- CreateIndex
CREATE INDEX "Produk_aktif_isLayanan_idx" ON "Produk"("aktif", "isLayanan");

-- CreateIndex
CREATE INDEX "Pelanggan_wa_idx" ON "Pelanggan"("wa");

-- CreateIndex
CREATE INDEX "Booking_status_jadwal_idx" ON "Booking"("status", "jadwal");

-- CreateIndex
CREATE INDEX "Booking_pelangganId_idx" ON "Booking"("pelangganId");

-- CreateIndex
CREATE INDEX "Booking_produkId_idx" ON "Booking"("produkId");

-- CreateIndex
CREATE UNIQUE INDEX "Promo_kode_key" ON "Promo"("kode");

-- CreateIndex
CREATE INDEX "Promo_aktif_mulai_berakhir_idx" ON "Promo"("aktif", "mulai", "berakhir");

-- CreateIndex
CREATE INDEX "TransaksiKeuangan_tanggal_idx" ON "TransaksiKeuangan"("tanggal");

-- CreateIndex
CREATE INDEX "TransaksiKeuangan_tipe_tanggal_idx" ON "TransaksiKeuangan"("tipe", "tanggal");

-- CreateIndex
CREATE INDEX "TransaksiKeuangan_bookingId_idx" ON "TransaksiKeuangan"("bookingId");

-- CreateIndex
CREATE INDEX "Rekening_aktif_idx" ON "Rekening"("aktif");

-- CreateIndex
CREATE INDEX "Galeri_tampil_idx" ON "Galeri"("tampil");

-- CreateIndex
CREATE INDEX "Testimoni_tampil_idx" ON "Testimoni"("tampil");

-- AddForeignKey
ALTER TABLE "Produk" ADD CONSTRAINT "Produk_kategoriId_fkey" FOREIGN KEY ("kategoriId") REFERENCES "KategoriProduk"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Booking" ADD CONSTRAINT "Booking_pelangganId_fkey" FOREIGN KEY ("pelangganId") REFERENCES "Pelanggan"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Booking" ADD CONSTRAINT "Booking_produkId_fkey" FOREIGN KEY ("produkId") REFERENCES "Produk"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Booking" ADD CONSTRAINT "Booking_karyawanId_fkey" FOREIGN KEY ("karyawanId") REFERENCES "Karyawan"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Booking" ADD CONSTRAINT "Booking_promoId_fkey" FOREIGN KEY ("promoId") REFERENCES "Promo"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TransaksiKeuangan" ADD CONSTRAINT "TransaksiKeuangan_bookingId_fkey" FOREIGN KEY ("bookingId") REFERENCES "Booking"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TransaksiKeuangan" ADD CONSTRAINT "TransaksiKeuangan_dibuatOlehId_fkey" FOREIGN KEY ("dibuatOlehId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

