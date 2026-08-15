# Email OTP — otp@langgor.my.id

Aplikasi menggunakan OTP bawaan Supabase Auth. Supabase membuat, menyimpan hash, membatasi percobaan, mengirim, dan memverifikasi kode. Aplikasi tidak menyimpan OTP sendiri.

## 1. Buat akun Resend Free

1. Daftar di https://resend.com
2. Buka **Domains → Add Domain**.
3. Tambahkan `langgor.my.id`.
4. Tambahkan seluruh record DKIM/SPF yang diberikan Resend ke DNS provider domain.
5. Tunggu status domain menjadi **Verified**.
6. Buat API key dengan permission sending.

Alamat `otp@langgor.my.id` tidak harus dibuat sebagai mailbox. Setelah domain terverifikasi, alamat tersebut dapat digunakan sebagai sender transactional.

## 2. Hubungkan SMTP ke Supabase

Buka **Supabase → Authentication → Email / Notifications → SMTP Settings**.

Isi:

```text
Enable custom SMTP: ON
Sender email: otp@langgor.my.id
Sender name: Langgor Store
Host: smtp.resend.com
Port: 465
Username: resend
Password: RESEND_API_KEY
```

Gunakan port 465 dengan implicit TLS. API key Resend hanya disimpan pada Supabase SMTP Settings, tidak pada frontend atau repository.

## 3. Aktifkan konfirmasi email

Di **Authentication → Providers → Email**:

```text
Enable Email provider: ON
Confirm email: ON
```

Di **Authentication → Email Templates → Confirm signup**:

- Subject: `Kode verifikasi Langgor Store`
- Salin isi `supabase/templates/confirm-signup.html`.

Template wajib menggunakan `{{ .Token }}`. Jangan menggantinya dengan `{{ .ConfirmationURL }}`, karena aplikasi meminta kode OTP, bukan magic link.

## 4. Rate limit yang disarankan

Di **Authentication → Rate Limits**:

```text
Email sent: sesuaikan dengan batas provider
OTP: 30 per jam atau lebih rendah
Minimum resend interval: 60 detik
Verification attempts: gunakan default Supabase
```

Frontend sudah memiliki cooldown resend 60 detik. Backend juga menerapkan auth rate limiter.

## 5. Test

1. Buka `/register`.
2. Daftar menggunakan email yang dapat diakses.
3. Pastikan email berasal dari `Langgor Store <otp@langgor.my.id>`.
4. Masukkan kode enam digit di `/verify-email`.
5. Setelah berhasil, session HttpOnly dibuat dan user diarahkan ke dashboard.

Jika email tidak diterima, cek **Resend → Emails** dan **Supabase → Auth Logs**.
