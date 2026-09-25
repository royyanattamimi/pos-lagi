# Penyimpanan database

Aplikasi memakai Supabase untuk produk, transaksi beserta item, shift/laporan akhir, dan profil.
Local storage hanya dibaca untuk impor data versi lama; SDK Supabase tetap mengelola sesi login.

## Aktivasi

1. Buka SQL Editor di project Supabase yang sesuai dengan `VITE_SUPABASE_URL`.
2. Jika tabel `products` belum ada, jalankan `products.sql` terlebih dahulu.
3. Jalankan `migrations/202609240001_database_storage.sql`. Skrip ini dijalankan dalam satu transaksi dan dapat diulang. Jika `shift_sessions` sudah dibuat manual tetapi masih kosong, skrip akan menambahkan kolom yang dibutuhkan dan menyesuaikan ID tanpa menghapus tabel. Jika struktur tabel berbeda dan sudah berisi data, skrip berhenti agar data lama dapat dipetakan terlebih dahulu.
4. Jalankan aplikasi, login, lalu gunakan **Impor data lokal lama** di halaman Start Shift pada browser yang menyimpan data lama. Impor ini memasukkan data yang belum tersedia; tidak menimpa data database dan tidak menghapus salinan lama. Jika impor gagal sebagian, ulangi dari browser yang sama.
5. Profil lama dengan ID akun yang sama diimpor saat profil pertama kali dimuat jika database belum memiliki profil akun tersebut.

Jangan memasukkan service-role key atau password database ke variabel `VITE_*`.
Migrasi memerlukan akses SQL Editor/administrator; anon/publishable key aplikasi tidak dapat membuat tabel.

## Perilaku

- Shift dan profil dibatasi ke pemilik akun melalui Row Level Security.
- Produk dan transaksi mempertahankan model POS bersama untuk pengguna yang login, seperti versi sebelumnya. Ini bukan skema multi-tenant per toko.
- Pembayaran disimpan melalui `save_pos_transaction`: header dan item tersimpan dalam satu transaksi database. Pengulangan ID nota yang sama tidak membuat pembayaran baru.
- Aplikasi menunggu database sebelum menampilkan nota, menutup shift, atau mengonfirmasi perubahan. Kegagalan ditampilkan dan dapat dicoba ulang; tidak ada fallback simpan ke local storage.
- Riwayat dimuat bertahap agar tidak terpotong pada batas respons API.
- Perubahan shift memakai perbandingan data sebelumnya agar hasil perangkat lain tidak ditimpa diam-diam. Jika terjadi konflik, muat ulang halaman.
- Data tersedia di perangkat lain setelah login/muat ulang; belum ada langganan pembaruan realtime antartab.

## Verifikasi setelah migrasi

Buat shift, transaksi Cash/QRIS/Debit, lalu tutup shift dengan catatan dan kas fisik.
Login melalui browser lain memakai akun yang sama dan periksa laporan, rincian item, catatan, dan profil.
Putuskan koneksi saat menyimpan untuk memastikan aplikasi tidak menampilkan keberhasilan palsu.

Pengujian lokal: `npm run build`, `npm run lint`, dan `node --test tests/*.test.mjs` (Node 22.18+).
Pengujian unit memakai adapter database tiruan; verifikasi SQL/RLS dan alur lintas browser perlu dijalankan pada Supabase setelah migrasi.
