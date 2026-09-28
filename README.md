# POS Lagi

Panduan aktivasi penyimpanan Supabase dan impor data lokal lama tersedia di [supabase/README.md](supabase/README.md).

Menu **Pengaturan** di sidebar mengatur identitas toko pada nota, ukuran kertas 58/80 mm, pesan penutup, tampilan kasir dan catatan produk, foto menu, metode pembayaran awal, serta periode awal grafik. Preview nota membantu memeriksa tampilan sebelum menekan **Simpan pengaturan**.

Pengaturan tersimpan per akun dalam `user_profiles.data.settings` di Supabase, menggunakan tabel dan kebijakan akses yang sudah ada tanpa migrasi tambahan. Perangkat lain memuat perubahan setelah login atau muat ulang. Menyimpan profil tetap mempertahankan pengaturan, dan sebaliknya.

# React + TypeScript + Vite

This template provides a minimal setup to get React working in Vite with HMR and some Oxlint rules.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Oxc](https://oxc.rs)
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/)

## React Compiler

The React Compiler is not enabled on this template because of its impact on dev & build performances. To add it, see [this documentation](https://react.dev/learn/react-compiler/installation).

## Expanding the Oxlint configuration

If you are developing a production application, we recommend enabling type-aware lint rules by installing `oxlint-tsgolint` and editing `.oxlintrc.json`:

```json
{
  "$schema": "./node_modules/oxlint/configuration_schema.json",
  "plugins": ["react", "typescript", "oxc"],
  "options": {
    "typeAware": true
  },
  "rules": {
    "react/rules-of-hooks": "error",
    "react/only-export-components": ["warn", { "allowConstantExport": true }]
  }
}
```

See the [Oxlint rules documentation](https://oxc.rs/docs/guide/usage/linter/rules) for the full list of rules and categories.
