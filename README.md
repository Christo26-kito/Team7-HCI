# Project-HCI

Bangun sebuah website e-commerce sepatu (frontend only, tanpa backend/database,
data boleh dummy/hardcoded) dengan spesifikasi berikut.

## Brand & Design Language
- Toko online sepatu, menjual sepatu dari brand-brand besar (styling premium,
  sneaker culture), gunakan gambar produk yang menarik secara visual
  (kalau generate gambar, buat gaya studio product shot, background bersih,
  variasi sudut).
- Palet warna netral-earthy sebagai dasar: background terang lembut (~#ECEEEF),
  teks gelap (~#12151A), teks sekunder abu (~#5A626E), aksen abu-biru (~#5F6B7C).
  Sediakan juga versi dark mode (background gelap ~#0A0D14, teks terang ~#E9ECF2).
- Tipografi: sans-serif modern dan tegas untuk UI (contoh gaya: Bricolage
  Grotesque / Archivo), dipadukan font serif ekspresif untuk headline besar
  (contoh gaya: Fraunces / Playfair Display) agar terasa premium, bukan generik.
- Layout: grid modular, whitespace lega, border tipis (hairline), radius kecil
  di kartu (~6px), nomor section besar sebagai elemen dekoratif (misal "01").
- Motion sebagai bahasa desain utama: transisi halus dengan easing
  cubic-bezier custom (bukan default linear/ease), hover state yang hidup
  (image sedikit zoom + shadow naik), animasi spring untuk elemen yang
  "muncul" (checkmark, badge cart bertambah).
- Sound design ringan sebagai sentuhan opsional: bunyi klik singkat & lembut
  saat add-to-cart, nada naik singkat saat pembayaran sukses, ketukan pelan
  saat notifikasi — jangan pakai bunyi kasar/mengganggu (hindari sawtooth/
  square wave polos, pakai sine/triangle dengan low-pass filter biar terdengar
  "mahal" bukan "murahan").

## Halaman yang dibutuhkan (route terpisah)

### 1. Homepage
- Navbar: logo, search bar, toggle bahasa, toggle Pria/Wanita, ikon
  follow us (Instagram/TikTok/dll).
- Hero section: gambar sepatu besar dan menarik, ada motion masuk
  (fade+slide atau parallax ringan saat scroll).
- Filter: brand, ukuran, warna, rentang harga, kategori Pria/Wanita.
- Search bar berfungsi (boleh dummy filter di data lokal).
- Grid produk utama.
- Section "Favorit Pengguna" / "Paling Laris": tabel atau grid sepatu
  populer, tampilkan rating/jumlah suka.
- Interaksi utama: saat kartu sepatu di-klik, munculkan animasi motion
  yang jelas (pilih salah satu): quick-view modal muncul dengan scale+fade
  dari posisi kartu, atau transisi shared-element ke halaman detail
  (gambar sepatu "terbang" membesar ke tampilan detail).
- Micro-interaction: hover kartu = gambar zoom halus + shadow terangkat;
  klik tombol add-to-cart = ikon keranjang di navbar bergetar/bounce
  sebentar dan angka bertambah dengan animasi.

### 2. Keranjang (Cart) — halaman terpisah
- List item: gambar, nama, ukuran, qty stepper, harga, subtotal.
- Hapus item dengan animasi slide-out/fade-out, bukan hilang instan.
- Ringkasan total, kolom kode promo (dummy).
- Tombol lanjut ke checkout.

### 3. Checkout — halaman terpisah
- Form alamat pengiriman & metode pembayaran (dummy, tidak perlu
  integrasi payment gateway asli).
- Kalau multi-step, tampilkan step indicator dengan progress animasi.
- Validasi form dengan micro-interaction (shake halus untuk error,
  checkmark hijau untuk field valid).

### 4. Payment Berhasil — halaman terpisah
- Animasi konfirmasi jelas: checkmark yang "digambar" (stroke animation),
  disertai efek halus (partikel kecil / ring pulse), bukan sekadar teks
  statis "Berhasil".
- Ringkasan pesanan singkat.
- CTA kembali ke beranda / lihat status pesanan.

## Teknis
- Frontend only, boleh pakai data dummy/hardcoded array untuk produk.
- Stack: React + Tailwind CSS (React Router untuk pindah halaman antar
  Home/Cart/Checkout/Payment Success).
- Harus responsif (mobile & desktop).
- Prioritaskan kehalusan animasi dan konsistensi visual dibanding
  jumlah fitur — ini dinilai dari visual appeal, UX, dan hierarchy/nesting,
  bukan kelengkapan backend.
