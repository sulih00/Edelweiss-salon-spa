import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";

async function main() {
  const email = "admin@edelweiss.local";
  const existing = await prisma.user.findUnique({ where: { email } });
  if (!existing) {
    await prisma.user.create({
      data: {
        name: "Owner Edelweiss",
        email,
        passwordHash: await bcrypt.hash("admin123", 10),
        role: "OWNER",
      },
    });
    console.log("✓ admin created: admin@edelweiss.local / admin123");
  }

  const kasirEmail = "kasir@edelweiss.local";
  if (!(await prisma.user.findUnique({ where: { email: kasirEmail } }))) {
    await prisma.user.create({
      data: { name: "Kasir Edelweiss", email: kasirEmail, passwordHash: await bcrypt.hash("kasir123", 10), role: "KASIR" },
    });
    console.log("✓ kasir created: kasir@edelweiss.local / kasir123");
  }

  const categories = [
    "Haircut & Service",
    "Smoothing & Keratin",
    "Hair Colouring",
    "Eyelash & Brow Bomber",
    "Hairmask, Creambath & Spa",
    "Men Service",
    "Face Treatment",
    "Nail Art & Care",
    "Face Treatment Promo & Paket",
    "Sulam Alis, Bibir & Retouch",
  ];

  for (const nama of categories) {
    await prisma.kategoriProduk.upsert({
      where: { nama },
      update: {},
      create: { nama },
    });
  }

  const catMap = new Map<string, string>();
  const dbCats = await prisma.kategoriProduk.findMany();
  for (const c of dbCats) {
    catMap.set(c.nama, c.id);
  }

  const plItems = [
    // Haircut & Service
    { nama: "Basic Cut (by Assist)", cat: "Haircut & Service", harga: 25000, durasiMenit: 45, deskripsi: "Hanya haircut oleh asisten terapis." },
    { nama: "Platinum Cut (by Assist)", cat: "Haircut & Service", harga: 50000, durasiMenit: 60, deskripsi: "Haircut + hairwash / haircut + styling oleh asisten." },
    { nama: "Premium Cut (by Assist)", cat: "Haircut & Service", harga: 70000, durasiMenit: 75, deskripsi: "Haircut + hairwash & styling lengkap oleh asisten." },
    { nama: "Basic Cut (by Owner)", cat: "Haircut & Service", harga: 35000, durasiMenit: 45, deskripsi: "Hanya haircut oleh owner." },
    { nama: "Platinum Cut (by Owner)", cat: "Haircut & Service", harga: 60000, durasiMenit: 60, deskripsi: "Haircut + hairwash / haircut + styling oleh owner." },
    { nama: "Premium Cut (by Owner)", cat: "Haircut & Service", harga: 80000, durasiMenit: 75, deskripsi: "Haircut + hairwash & styling lengkap oleh owner." },
    { nama: "Hairwash", cat: "Haircut & Service", harga: 25000, durasiMenit: 30, deskripsi: "Cuci rambut + pijat ringan." },
    { nama: "Hairwash + Blow Dry", cat: "Haircut & Service", harga: 40000, durasiMenit: 45, deskripsi: "Cuci rambut + pengeringan blow dry." },
    { nama: "Hairwash + Styling (Catok)", cat: "Haircut & Service", harga: 50000, durasiMenit: 60, deskripsi: "Cuci rambut + styling catok lurus / wave." },
    { nama: "Catok Lurus", cat: "Haircut & Service", harga: 30000, durasiMenit: 30, deskripsi: "Styling catok lurus profesional." },
    { nama: "Catok Curly / Wave", cat: "Haircut & Service", harga: 40000, durasiMenit: 45, deskripsi: "Styling catok keriting / gelombang." },

    // Smoothing & Keratin
    { nama: "Smoothing Snow (Pendek)", cat: "Smoothing & Keratin", harga: 200000, durasiMenit: 120, deskripsi: "Smoothing snow untuk rambut pendek." },
    { nama: "Smoothing Snow (Medium)", cat: "Smoothing & Keratin", harga: 300000, durasiMenit: 150, deskripsi: "Smoothing snow untuk rambut sedang." },
    { nama: "Smoothing Snow (Panjang)", cat: "Smoothing & Keratin", harga: 400000, durasiMenit: 180, deskripsi: "Smoothing snow untuk rambut panjang." },
    { nama: "Smoothing Keratin Extra (Pendek)", cat: "Smoothing & Keratin", harga: 250000, durasiMenit: 120, deskripsi: "Smoothing keratin extra rambut pendek." },
    { nama: "Smoothing Keratin Extra (Medium)", cat: "Smoothing & Keratin", harga: 350000, durasiMenit: 150, deskripsi: "Smoothing keratin extra rambut sedang." },
    { nama: "Smoothing Keratin Extra (Panjang)", cat: "Smoothing & Keratin", harga: 450000, durasiMenit: 180, deskripsi: "Smoothing keratin extra rambut panjang." },
    { nama: "Smoothing Magic Blue (Pendek)", cat: "Smoothing & Keratin", harga: 250000, durasiMenit: 120, deskripsi: "Smoothing magic blue rambut pendek." },
    { nama: "Smoothing Magic Blue (Medium)", cat: "Smoothing & Keratin", harga: 350000, durasiMenit: 150, deskripsi: "Smoothing magic blue rambut sedang." },
    { nama: "Smoothing Magic Blue (Panjang)", cat: "Smoothing & Keratin", harga: 450000, durasiMenit: 180, deskripsi: "Smoothing magic blue rambut panjang." },
    { nama: "Premium Smoothing (Pendek)", cat: "Smoothing & Keratin", harga: 275000, durasiMenit: 120, deskripsi: "Premium smoothing rambut pendek." },
    { nama: "Premium Smoothing (Medium)", cat: "Smoothing & Keratin", harga: 350000, durasiMenit: 150, deskripsi: "Premium smoothing rambut sedang." },
    { nama: "Premium Smoothing (Panjang)", cat: "Smoothing & Keratin", harga: 450000, durasiMenit: 180, deskripsi: "Premium smoothing rambut panjang." },
    { nama: "Keratin Filler Therapy (Pendek)", cat: "Smoothing & Keratin", harga: 425000, durasiMenit: 150, deskripsi: "Keratin filler therapy rambut pendek." },
    { nama: "Keratin Filler Therapy (Medium)", cat: "Smoothing & Keratin", harga: 550000, durasiMenit: 180, deskripsi: "Keratin filler therapy rambut sedang." },
    { nama: "Keratin Filler Therapy (Panjang)", cat: "Smoothing & Keratin", harga: 750000, durasiMenit: 210, deskripsi: "Keratin filler therapy rambut panjang." },

    // Hair Colouring
    { nama: "Hitam / Black (Short/Pendek)", cat: "Hair Colouring", harga: 100000, durasiMenit: 60, deskripsi: "Pewarnaan hitam rambut pendek." },
    { nama: "Hitam / Black (Medium)", cat: "Hair Colouring", harga: 175000, durasiMenit: 90, deskripsi: "Pewarnaan hitam rambut sedang." },
    { nama: "Hitam / Black (Long/Panjang)", cat: "Hair Colouring", harga: 250000, durasiMenit: 120, deskripsi: "Pewarnaan hitam rambut panjang." },
    { nama: "Basic Colour (tanpa lightening) Short", cat: "Hair Colouring", harga: 175000, durasiMenit: 90, deskripsi: "Warna dasar tanpa bleaching rambut pendek." },
    { nama: "Basic Colour (tanpa lightening) Medium", cat: "Hair Colouring", harga: 250000, durasiMenit: 120, deskripsi: "Warna dasar tanpa bleaching rambut sedang." },
    { nama: "Basic Colour (tanpa lightening) Long", cat: "Hair Colouring", harga: 300000, durasiMenit: 150, deskripsi: "Warna dasar tanpa bleaching rambut panjang." },
    { nama: "Fashion Colour - Money Piece", cat: "Hair Colouring", harga: 150000, durasiMenit: 90, deskripsi: "Fashion colour gaya money piece." },
    { nama: "Fashion Colour - Ombre", cat: "Hair Colouring", harga: 200000, durasiMenit: 120, deskripsi: "Fashion colour gradasi ombre." },
    { nama: "Fashion Colour - Highlight", cat: "Hair Colouring", harga: 250000, durasiMenit: 150, deskripsi: "Fashion colour teknik highlight." },

    // Eyelash & Brow Bomber
    { nama: "Classic Lash (Natural)", cat: "Eyelash & Brow Bomber", harga: 65000, durasiMenit: 90, deskripsi: "Sambung bulu mata classic natural look." },
    { nama: "Classic Lash (Volume)", cat: "Eyelash & Brow Bomber", harga: 90000, durasiMenit: 90, deskripsi: "Sambung bulu mata classic volume look." },
    { nama: "Russian Lash (Natural)", cat: "Eyelash & Brow Bomber", harga: 75000, durasiMenit: 90, deskripsi: "Russian lash natural style." },
    { nama: "Korean 3D Lash (Natural)", cat: "Eyelash & Brow Bomber", harga: 85000, durasiMenit: 90, deskripsi: "Korean 3D lash natural." },
    { nama: "Lashlift Classic", cat: "Eyelash & Brow Bomber", harga: 65000, durasiMenit: 60, deskripsi: "Lashlift klasik pelentik bulu mata asli." },
    { nama: "Brow Bomber Classic", cat: "Eyelash & Brow Bomber", harga: 125000, durasiMenit: 60, deskripsi: "Brow bomber kerapihan alis." },

    // Hairmask, Creambath & Spa
    { nama: "Hairmask Buah", cat: "Hairmask, Creambath & Spa", harga: 60000, durasiMenit: 60, deskripsi: "Hairmask aroma buah *include catok lurus + free hair serum." },
    { nama: "Hairmask Keratin", cat: "Hairmask, Creambath & Spa", harga: 80000, durasiMenit: 60, deskripsi: "Hairmask formula keratin *include catok lurus + free hair serum." },
    { nama: "Hair Detox", cat: "Hairmask, Creambath & Spa", harga: 85000, durasiMenit: 60, deskripsi: "Hair detox pembersih folikel *include catok lurus + free hair serum." },
    { nama: "Creambath Buah", cat: "Hairmask, Creambath & Spa", harga: 65000, durasiMenit: 60, deskripsi: "Creambath aroma buah + pijat relaksasi *free hair serum." },
    { nama: "Hairspa Loreal", cat: "Hairmask, Creambath & Spa", harga: 90000, durasiMenit: 60, deskripsi: "Hairspa nutrisi Loreal *free hair serum." },

    // Men Service
    { nama: "Men Service - Hitam / Black", cat: "Men Service", harga: 50000, durasiMenit: 45, deskripsi: "Pewarnaan hitam khusus pria." },
    { nama: "Men Service - Haircut", cat: "Men Service", harga: 20000, durasiMenit: 30, deskripsi: "Potong rambut khusus pria." },

    // Face Treatment
    { nama: "Natural Facial", cat: "Face Treatment", harga: 60000, durasiMenit: 60, deskripsi: "Perawatan wajah alami pembersih komedo & penyegar." },
    { nama: "Acne Facial", cat: "Face Treatment", harga: 85000, durasiMenit: 60, deskripsi: "Facial khusus kulit berjerawat & peradangan." },
    { nama: "Anti Aging Facial", cat: "Face Treatment", harga: 85000, durasiMenit: 60, deskripsi: "Facial anti penuaan dini & pengencangan." },
    { nama: "Detox Facial", cat: "Face Treatment", harga: 85000, durasiMenit: 60, deskripsi: "Detoksifikasi racun & radikal bebas di wajah." },
    { nama: "Oxy Hydra Facial", cat: "Face Treatment", harga: 90000, durasiMenit: 60, deskripsi: "Hidrasi oksigen mendalam untuk kulit kering & kusam." },
    { nama: "Microdermabration Diamond", cat: "Face Treatment", harga: 145000, durasiMenit: 75, deskripsi: "Eksfoliasi sel kulit mati dengan intan microdermabration." },
    { nama: "Chemical Peeling", cat: "Face Treatment", harga: 145000, durasiMenit: 60, deskripsi: "Peeling bahan kimia aman peremajaan kulit." },
    { nama: "Korean BB Glow", cat: "Face Treatment", harga: 150000, durasiMenit: 75, deskripsi: "BB glow ala Korea wajah cerah mulus instan." },
    { nama: "Blackdoll Laser", cat: "Face Treatment", harga: 150000, durasiMenit: 75, deskripsi: "Laser karbon blackdoll pembersih pori & pencerah." },
    { nama: "Radio Frequency - Kantung Mata / Panda", cat: "Face Treatment", harga: 65000, durasiMenit: 45, deskripsi: "RF khusus mengencangkan area kantung mata." },
    { nama: "Radio Frequency - V Shaping", cat: "Face Treatment", harga: 125000, durasiMenit: 60, deskripsi: "RF pembentukan tirus wajah V-shape." },
    { nama: "Radio Frequency - Leher", cat: "Face Treatment", harga: 65000, durasiMenit: 45, deskripsi: "RF pengencangan garis kulit leher." },
    { nama: "Body Slimming - Lengan", cat: "Face Treatment", harga: 65000, durasiMenit: 45, deskripsi: "Perampingan & penghancur lemak lengan." },
    { nama: "Body Slimming - Perut", cat: "Face Treatment", harga: 85000, durasiMenit: 60, deskripsi: "Perampingan & penghancur lemak area perut." },

    // Nail Art & Care
    { nama: "Nail Gel Tangan", cat: "Nail Art & Care", harga: 50000, durasiMenit: 45, deskripsi: "Pewarnaan kutek gel kuku tangan tahan lama." },
    { nama: "Nail Gel Kaki", cat: "Nail Art & Care", harga: 60000, durasiMenit: 45, deskripsi: "Pewarnaan kutek gel kuku kaki tahan lama." },
    { nama: "Softgel Tips Extention", cat: "Nail Art & Care", harga: 4000, durasiMenit: 15, deskripsi: "Sambung kuku softgel tips per jari." },
    { nama: "Overlay Kuku", cat: "Nail Art & Care", harga: 1000, durasiMenit: 10, deskripsi: "Lapisan pelindung overlay kuku." },
    { nama: "French Nail Art", cat: "Nail Art & Care", harga: 3000, durasiMenit: 15, deskripsi: "Seni kuku gaya French nail klasik." },
    { nama: "Cat Eye Nail", cat: "Nail Art & Care", harga: 3000, durasiMenit: 15, deskripsi: "Efek mata kucing cat eye pada kuku." },
    { nama: "Glitter / Foil Nail", cat: "Nail Art & Care", harga: 2000, durasiMenit: 10, deskripsi: "Hiasan kilau glitter / foil kuku." },
    { nama: "Chrome / Aurora Nail", cat: "Nail Art & Care", harga: 4000, durasiMenit: 15, deskripsi: "Efek berkilau chrome / aurora." },
    { nama: "Ombre Nail Art", cat: "Nail Art & Care", harga: 4000, durasiMenit: 15, deskripsi: "Gradasi warna ombre cantik pada kuku." },
    { nama: "Marble Nail Art", cat: "Nail Art & Care", harga: 4000, durasiMenit: 15, deskripsi: "Motif marmer berkelas pada kuku." },
    { nama: "3D Nail Art", cat: "Nail Art & Care", harga: 5000, durasiMenit: 15, deskripsi: "Hiasan timbul 3D pada kuku." },
    { nama: "Aksesoris Nail", cat: "Nail Art & Care", harga: 5000, durasiMenit: 10, deskripsi: "Hiasan manik-manik & pernak-pernik kuku." },
    { nama: "Remove Nail Gel", cat: "Nail Art & Care", harga: 2000, durasiMenit: 15, deskripsi: "Pelepasan kutek gel kuku." },
    { nama: "Remove Extention Nail", cat: "Nail Art & Care", harga: 4000, durasiMenit: 20, deskripsi: "Pelepasan sambung kuku extention." },
    { nama: "Manicure 10 Jari", cat: "Nail Art & Care", harga: 25000, durasiMenit: 30, deskripsi: "Perawatan & pembersihan 10 kuku tangan." },
    { nama: "Pedicure 10 Jari", cat: "Nail Art & Care", harga: 30000, durasiMenit: 30, deskripsi: "Perawatan & pembersihan 10 kuku kaki." },

    // Face Treatment Promo & Paket
    { nama: "Chemical Peeling (Promo)", cat: "Face Treatment Promo & Paket", harga: 125000, durasiMenit: 60, deskripsi: "Diskon promo chemical peeling peremajaan." },
    { nama: "Korean BB Glow (Promo)", cat: "Face Treatment Promo & Paket", harga: 100000, durasiMenit: 75, deskripsi: "Diskon promo Korean BB Glow wajah." },
    { nama: "RF Treatment (Promo)", cat: "Face Treatment Promo & Paket", harga: 100000, durasiMenit: 60, deskripsi: "Diskon promo Radio Frequency v-shape." },
    { nama: "Blackdoll Laser (Promo)", cat: "Face Treatment Promo & Paket", harga: 150000, durasiMenit: 75, deskripsi: "Diskon promo laser karbon blackdoll." },
    { nama: "Keti Glow Laser (Promo)", cat: "Face Treatment Promo & Paket", harga: 75000, durasiMenit: 45, deskripsi: "Diskon promo laser pencerah ketiak." },
    { nama: "Lip Laser (Promo)", cat: "Face Treatment Promo & Paket", harga: 75000, durasiMenit: 45, deskripsi: "Diskon promo laser pencerah bibir." },
    { nama: "Microdermabration (Promo)", cat: "Face Treatment Promo & Paket", harga: 125000, durasiMenit: 60, deskripsi: "Diskon promo eksfoliasi microdermabration." },
    { nama: "Laser Sulam Gagal (Promo)", cat: "Face Treatment Promo & Paket", harga: 200000, durasiMenit: 60, deskripsi: "Diskon promo perbaikan laser sulam gagal." },
    { nama: "Laser Bekas Luka (Promo)", cat: "Face Treatment Promo & Paket", harga: 75000, durasiMenit: 45, deskripsi: "Diskon promo laser samarkan bekas luka per sisi." },
    { nama: "PAHEDELWEISS I", cat: "Face Treatment Promo & Paket", harga: 225000, durasiMenit: 90, deskripsi: "Paket hemat: basic facial + detox + laser blackdoll." },
    { nama: "PAHEDELWEISS II", cat: "Face Treatment Promo & Paket", harga: 250000, durasiMenit: 90, deskripsi: "Paket hemat: basic facial + chemical peeling + laser blackdoll." },
    { nama: "PAHEDELWEISS III", cat: "Face Treatment Promo & Paket", harga: 250000, durasiMenit: 90, deskripsi: "Paket hemat: detox + laser blackdoll + laser ketiglow + lip laser." },
    { nama: "PAHEDELWEISS IV", cat: "Face Treatment Promo & Paket", harga: 285000, durasiMenit: 105, deskripsi: "Paket hemat: basic facial + RF treatment + laser blackdoll + lip laser." },

    // Sulam Alis, Bibir & Retouch
    { nama: "Ombre Powder Sulam Alis", cat: "Sulam Alis, Bibir & Retouch", harga: 500000, durasiMenit: 120, deskripsi: "Sulam alis teknik ombre powder natural." },
    { nama: "Mixybrow Sulam Alis", cat: "Sulam Alis, Bibir & Retouch", harga: 600000, durasiMenit: 120, deskripsi: "Sulam alis kombinasi mixybrow." },
    { nama: "Hairstroke Sulam Alis", cat: "Sulam Alis, Bibir & Retouch", harga: 650000, durasiMenit: 120, deskripsi: "Sulam alis teknik serat rambut hairstroke halus." },
    { nama: "Permanent Liptint (wajib 2x tindakan)", cat: "Sulam Alis, Bibir & Retouch", harga: 350000, durasiMenit: 90, deskripsi: "Pewarnaan bibir permanent liptint alami (*wajib 2x tindakan)." },
    { nama: "Retouch Sulam (2-4 bulan)", cat: "Sulam Alis, Bibir & Retouch", harga: 275000, durasiMenit: 60, deskripsi: "Perapihan & penegasan ulang sulam setelah 2-4 bulan." },
    { nama: "Retouch Sulam (6 bulan)", cat: "Sulam Alis, Bibir & Retouch", harga: 350000, durasiMenit: 60, deskripsi: "Perapihan & penegasan ulang sulam setelah 6 bulan." },
    { nama: "Retouch Sulam (1 tahun)", cat: "Sulam Alis, Bibir & Retouch", harga: 450000, durasiMenit: 90, deskripsi: "Perapihan & penegasan ulang sulam setelah 1 tahun." },
  ];

  for (const item of plItems) {
    const kategoriId = catMap.get(item.cat);
    if (kategoriId) {
      const existingProd = await prisma.produk.findFirst({ where: { nama: item.nama } });
      if (!existingProd) {
        await prisma.produk.create({
          data: {
            nama: item.nama,
            kategoriId,
            harga: item.harga,
            durasiMenit: item.durasiMenit,
            deskripsi: item.deskripsi,
            isLayanan: true,
            aktif: true,
          },
        });
      }
    }
  }
  console.log("✓ full PL products seeded");

  const existingLokasi = await prisma.lokasi.findFirst();
  if (!existingLokasi) {
    await prisma.lokasi.create({
      data: {
        nama: "Edelweiss Salon & Spa",
        alamat: "Jl. Anggrek No. 123, Jakarta",
        lat: -6.2088,
        lon: 106.8456,
        zoom: 16,
        utama: true,
      },
    });
    console.log("✓ default location seeded");
  }
}

main().then(() => process.exit(0)).catch((e) => { console.error(e); process.exit(1); });

