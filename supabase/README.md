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


## Refund tunai produk yang sudah dibayar

Jalankan migrasi sesuai urutan: `202609250001_refunds.sql`, lalu `202609250002_cash_refunds.sql` melalui SQL Editor dan muat ulang aplikasi. Migrasi kedua memperbarui aturan refund baru menjadi Cash serta menyimpan pembayaran asal, kas sebelum, dan kas sesudah refund. Riwayat refund non-tunai yang sudah ada tidak diubah nominal atau metodenya.

Alur kasir:

1. Buka **Transaksi lunas → pilih nota → Refund produk**. Shift harus masih aktif.
2. Pilih jumlah produk yang dikembalikan dan isi alasan, serta catatan penerima bila diperlukan.
3. Pilih **Lanjut: periksa refund**. Periksa nota, barang, nominal, kas menurut sistem sebelum refund, dan kas seharusnya setelah refund.
4. Cocokkan uang fisik di laci, serahkan uang tunai kepada pelanggan, lalu centang konfirmasi penyerahan. Semua refund baru keluar sebagai Cash, termasuk untuk nota QRIS/Debit. Penerimaan pada metode pembayaran asli tidak dihapus.
5. Pilih **Simpan refund & kas keluar**. Bukti menyimpan nota asal, waktu, kasir, barang, alasan, metode asli, nominal, kas sebelum/sesudah, serta catatan penyerahan. Pengeluaran dihitung pada hari dan shift saat refund dilakukan.
6. Saat End Shift, lihat **Penjelasan refund pada shift ini**, hitung uang di laci, lalu isi **Kas fisik akhir hasil hitung**. Aplikasi menunjukkan selisih terhadap kas seharusnya. Penjelasan refund dan rumus kas ikut dicetak/disimpan PDF.

Rumus kas seharusnya: **kas awal + penjualan tunai − refund tunai**. Contoh: Rp 500.000 + Rp 300.000 − Rp 50.000 = Rp 750.000. Kas fisik tetap hasil hitung kasir, bukan nominal yang diisi otomatis oleh aplikasi. Jangan mengurangi refund lagi dari hasil hitung fisik.

Database menghitung nominal refund dari item nota beserta penyesuaian pajak/diskon. Jumlah produk, nominal yang diperiksa kasir, konfirmasi penyerahan, kepemilikan shift aktif, dan kecukupan saldo kas divalidasi kembali. Nota serta shift dikunci selama proses agar pengembalian bersamaan tidak melampaui sisa pembelian atau saldo kas. Pengulangan ID refund yang sama tidak membuat pengeluaran kedua.

Jika simpan gagal setelah uang diserahkan, jangan menyerahkan uang lagi; gunakan tombol coba simpan ulang atau muat ulang riwayat untuk mencocokkan hasilnya. Refund ini pencatatan manual, bukan transfer otomatis. Stok belum tersedia pada model produk aplikasi sehingga refund tidak mengubah persediaan.

Pengujian lokal memakai PostgreSQL melalui PGlite: `npm test`. Pengujian SQL ini tidak mengubah proyek Supabase Anda.
