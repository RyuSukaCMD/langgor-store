# Langgor Store

Full-stack Cookie login store dengan tiga produk: Cookie Basic, Cookie Premkum, dan Cookie Ultra. Stok diperiksa real-time sebelum delivery otomatis.

## Menjalankan

```bash
npm install
cp .env.example .env
npm run dev
```

`.env` lokal sudah di-ignore oleh Git. Isi `SUPABASE_URL`, `SUPABASE_ANON_KEY`, dan `SUPABASE_SERVICE_ROLE_KEY` dari **Supabase → Project Settings → API**. Service-role key hanya boleh digunakan server dan tidak boleh diberi prefix `VITE_`.

Untuk deployment multi-instance, gunakan rate limiter Redis:

```env
RATE_LIMIT_STORE=redis
REDIS_URL=rediss://default:password@host:6379
```

Konfigurasi environment divalidasi saat server mulai. Server akan berhenti dengan pesan yang jelas bila kombinasi variabel tidak aman atau tidak lengkap.

Aplikasi berjalan di `http://localhost:5173`. Build produksi:

```bash
npm run build
NODE_ENV=production npm run preview
```

## Akun demo

| Role | Login | Password |
|---|---|---|
| Member | `raka@langgor.store` | `Langgor123!` |
| Admin | `admin@langgor.store` | `Langgor123!` |

## Route utama

- Publik: `/`, `/store/cookies`, `/product/:id`, `/u/:username`
- Auth: `/login`, `/register`, `/forgot-password`, `/reset-password`
- Dashboard: `/dashboard`, `/purchases`, `/profile`
- Admin: `/admin`

## Struktur

```text
src/
  components/      shared UI, navigation, cards, guards
  context/         auth and toast state
  lib/             API client and helpers
  pages/           public, auth, dashboard, and admin pages
server/
  index.ts         Express API, auth, RBAC, CSRF, validation
  schema.sql       production PostgreSQL relational schema
```

## Security yang sudah diterapkan

- Password demo di-hash dengan bcrypt; password tidak pernah dikembalikan oleh API.
- Session ID acak 256-bit dalam cookie `HttpOnly`, `SameSite=Lax`, dan `Secure` pada production.
- Double-submit CSRF token untuk semua mutation.
- Rate limiting pada login/register/recovery.
- Zod validation di semua endpoint mutation.
- Backend RBAC untuk user dan admin.
- Hanya tiga package ID resmi yang dapat diproses oleh endpoint checkout.
- Harga checkout dihitung ulang di server; client tidak dapat menentukan nominal.
- Admin action memiliki audit record.
- Upload profil memeriksa size limit, magic bytes, format, dimensi, rasio banner, nama file acak, dan tidak menerima SVG.
- Helmet headers, body limits, output error yang tidak mengekspos stack trace.
- Tidak ada credential sensitif di payload listing publik.

## Catatan deployment

Runtime demo memakai repository data in-memory supaya project langsung dapat dicoba tanpa secret atau layanan eksternal. Sebelum menerima transaksi nyata:

1. Implementasikan repository PostgreSQL dari `server/schema.sql` dan migration tool.
2. Simpan session pada Redis/PostgreSQL dengan rotasi dan revocation.
3. Gunakan object storage private untuk upload/delivery serta antivirus scanning.
4. Envelope-encrypt payload delivery dengan KMS; jangan menyimpan password/token plaintext.
5. Hubungkan payment provider resmi. Verifikasi signature webhook dan gunakan idempotency key + row lock.
6. Tambahkan email provider, background queue, observability, backup, dan secret manager.
7. Set `NODE_ENV=production`, TLS, trusted proxy, CSP sesuai domain, dan origin allowlist.
8. Jalankan integration/E2E tests terhadap database dan payment sandbox sebelum go-live.

## Quality checks

```bash
npm run build
npm audit --omit=dev
```

UI menghormati `prefers-reduced-motion`, menggunakan semantic controls, visible focus, accessible modal/dropdown feedback, mobile filter drawer, skeleton, empty, loading, success, dan error states.
