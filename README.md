# Langgor Store

Full-stack Cookie login store dengan Supabase sebagai satu-satunya source of truth untuk authentication, profil, produk, stok, order, notifikasi, role, dan audit log.

## Setup

```bash
npm install
cp .env.example .env
```

Isi konfigurasi dari **Supabase → Project Settings → API**:

```env
SUPABASE_URL=https://PROJECT_REF.supabase.co
SUPABASE_ANON_KEY=...
SUPABASE_SERVICE_ROLE_KEY=...
SUPABASE_STORAGE_BUCKET=langgor-media
```

Service-role key hanya boleh berada di server dan tidak boleh memakai prefix `VITE_`.

1. Buka Supabase SQL Editor.
2. Jalankan seluruh isi `server/schema.sql`.
3. Daftar melalui `/register`.
4. Jadikan akun pertama sebagai admin:

```sql
UPDATE public.users SET role = 'admin' WHERE email = 'alamat-admin@domain.com';
```

5. Jalankan aplikasi:

```bash
npm run dev
```

Build produksi:

```bash
npm run build
NODE_ENV=production npm run preview
```

## Data architecture

Tidak ada fallback produk, user, order, atau notifikasi hardcoded di application runtime. Jika Supabase belum dikonfigurasi, API mengembalikan status konfigurasi dan UI menampilkan loading/error/empty state.

- **Supabase Auth**: register, login, recovery, refresh token.
- **PostgreSQL**: users, profiles, products, orders, payments, inventory, deliveries, notifications, admin actions.
- **Supabase Storage**: avatar dan banner tervalidasi server.
- **Database function**: checkout mengunci product row, membaca harga server, memeriksa stok/saldo, dan membuat order secara atomik.
- **RLS**: ownership policy untuk profil, order, pembayaran, delivery, dan notifikasi.

## Route utama

- Publik: `/`, `/store/cookies`, `/product/:id`, `/u/:username`
- Auth: `/login`, `/register`, `/forgot-password`, `/reset-password`
- Dashboard: `/dashboard`, `/purchases`, `/profile`
- Admin: `/admin`

## Struktur

```text
api/[...path].ts   Vercel Express function
src/
  components/      shared UI and navigation
  context/         auth, products, toast
  lib/             API client
  pages/           public, auth, dashboard, admin
server/
  app.ts           API, Supabase Auth, RBAC, validation
  index.ts         local/standalone server entry
  supabase.ts      isolated admin/auth clients
  schema.sql       PostgreSQL, RLS, trigger, RPC, storage
```

## Admin panel

Route `/admin` dilindungi client guard dan backend RBAC. Semua operasi berikut menulis langsung ke Supabase:

- tambah, edit, dan hapus produk;
- harga, stok, status, spesifikasi, ikon, dan aksen;
- role `user`, `moderator`, `admin`;
- suspend/restore akun;
- transaksi dan audit action.

## Security

- Password dikelola Supabase Auth dan tidak disimpan di application database.
- Access/refresh token disimpan pada cookie `HttpOnly`, `Secure` pada production.
- Double-submit CSRF untuk seluruh mutation.
- Rate limiting authentication, API, dan upload; Redis didukung untuk multi-instance.
- Zod server-side validation.
- Backend RBAC dan proteksi admin agar tidak menurunkan/suspend dirinya sendiri.
- Harga dan stok checkout dibaca dalam transaksi database, bukan dari client.
- Upload memeriksa MIME, magic bytes, ukuran, dimensi, serta rasio banner sebelum masuk Supabase Storage.
- Admin action disimpan pada audit log dengan IP hash.
- Payload Cookie tidak pernah dikirim dari endpoint list, notifikasi, atau admin table.

Untuk rate limit production multi-instance:

```env
RATE_LIMIT_STORE=redis
REDIS_URL=rediss://default:password@host:6379
```

## Quality checks

```bash
npm run build
npm audit --omit=dev
```
