# 🚀 BACA SEBELUM SETUP APLIKASI MyCorporate

<div align="center">
  <h3><strong>Enterprise ERP & HRM Platform</strong></h3>
  <p>Dibangun dengan Next.js App Router, Supabase, Tailwind CSS, dan Shadcn UI.</p>
  <hr />
</div>

Selamat! Anda baru saja mendapatkan *source code* premium untuk **MyCorporate**. Platform ini dirancang tidak hanya sekadar berjalan, namun juga **fleksibel, memiliki keamanan kelas berat (Enterprise-grade Security), dan siap dipasarkan ke berbagai perusahaan (Multi-Tenant SaaS).**

Panduan ini ditulis khusus agar Anda **bebas stres** saat melakukan setup. 
> ⚠️ **PERINGATAN KERAS:** Jangan langsung *run* atau *build* aplikasi tanpa membaca dan melakukan instruksi di bawah ini secara **berurutan**. Jika Anda mengikuti setiap langkah dengan benar, jaminan **0 Error** saat peluncuran! 🚀

---

## 🌟 FITUR UNGGULAN APLIKASI
Sebelum kita mulai *coding*, ini adalah *value* gila yang ada di dalam aplikasi Anda:
- **🏢 Sistem Multi-Tenant (B2B SaaS Ready):** 1 Database, ribuan perusahaan bisa daftar secara mandiri tanpa datanya bocor satu sama lain (Berkat sistem *Row Level Security* canggih dari Supabase).
- **🙋‍♂️ Employee & Admin Portal:** Karyawan memiliki area sendiri (Beranda, Absensi Cerdas dengan kalkulasi keterlambatan, Izin & Cuti). Admin memiliki Dashboard utuh (Data Karyawan, Inventory, CRM).
- **🔒 Onboarding Wizard & Tutorial Flow:** Pengalaman mendaftar yang mulus layaknya aplikasi berkelas Silicon Valley. Karyawan/Admin dipandu dengan tutorial pintar (Pop-up/Modal).
- **🛡️ Custom Organization Setup:** Perusahaan bisa mengatur *Slug URL*, Jam Kerja spesifik (untuk deteksi absen), Kontrol Akses Role (Owner, Admin, Staff, Employee), Keamanan, dan Tema UI mereka sendiri!

---

## 📋 PERSYARATAN SISTEM (Prerequisites)
Pastikan hal wajib ini sudah terinstal di PC/Mac Anda:
1. **[Node.js](https://nodejs.org/)** - Wajib versi 18 LTS atau yang terbaru.
2. **Git** - (Opsional, sangat disarankan untuk manajemen versi kode Anda).
3. **[Supabase](https://supabase.com/)** - Buat akun gratis (Hanya butuh email atau GitHub).

---

## 🛠️ LANGKAH 1: Set Up Backend (Sihir Database)
Aplikasi ini menggunakan **Supabase** (PostgreSQL) sebagai "Otak" dan "Jantung" datanya.
> **Kenapa Supabase?** Karena langsung mengurus Autentikasi (Login/Register) dan Database Relasional secara bersamaan dan Real-time!

1. Buka [Dashboard Supabase](https://app.supabase.com/) dan klik **New Project**.
2. Beri nama proyek cerdas (contoh: `MyCorporate-Prod`) dan buat **Password Database** yang sangat kuat (Simpan baik-baik!).
3. Tunggu ±2 menit hingga status proyek menjadi hijau (*Active*).

### ⚙️ INJEKSI STRUKTUR DATABASE (Super Penting!)
Sekarang, masukkan struktur tulang punggung aplikasi Anda (Tabel, Trigger, Function, Relasi) ke otak Supabase. **Kami sediakan 2 cara:**

🔥 **CARA A (PRO & CEPAT) via Supabase CLI** *[Rekomendasi]*
1. Buka Terminal (atau CMD/PowerShell), arahkan ke folder utama *source code* ini.
2. Login akun CLI: `npx supabase login` *(Paste Access Token dari Supabase Anda)*
3. Sambungkan ke proyek: `npx supabase link --project-ref KODE-PROYEK-ANDA` *(Kode huruf & angka acak di URL dashboard Supabase Anda)*
4. Suntikkan skema database: `npx supabase db push`
   *(Boom! Seluruh 20 file `migrations/` otomatis terinstal dengan rapi tanpa cacat!)*

🐢 **CARA B (MANUAL) via Copy-Paste SQL Editor** 
1. Di Dashboard Supabase, pergi ke tab **SQL Editor**.
2. Masuk ke folder *source code* di laptop Anda, cari folder: `supabase/migrations/`
3. Buka file dari urutan `001_initial_schema.sql` sampai dengan `020_settings_expansion.sql`.
4. **WAJIB:** *Copy-Paste* isinya satu per satu dan klik **Run** di SQL Editor. Ingat, harus secara **berurutan (001 -> 002 -> dst)** agar tidak terjadi error relasi antar tabel!

### 📧 MENGAKTIFKAN AUTENTIKASI:
1. Pergi ke menu **Authentication > Providers** pada Supabase.
2. Pastikan Provider **Email** sudah berstatus *Enabled* (Menyala).
3. *(Opsional untuk Testing)* Buka pengaturan Email, matikan opsi *Confirm Email* agar user baru bisa langsung masuk tanpa harus verifikasi inbox mereka (Khusus Development/Ujicoba).

---

## 🔑 LANGKAH 2: Konfigurasi Jembatan Penghubung (.env)
Aplikasi frontend (Next.js) harus tahu kemana ia harus mengirim dan mengambil data.

> 🚨 **PENTING: JANGAN DI-SKIP AGAR TIDAK STRES!** 🚨 
> Jika Anda melewatkan langkah ini, saat Anda menjalankan `npm run dev` atau `npm run build`, aplikasi akan langsung **CRASH / ERROR dengan pesan "Error: supabaseUrl is required"**. Ini adalah masalah nomor 1 yang sering membuat pemula panik. Pastikan Anda mengisi `.env.local` sebelum menjalankan aplikasinya!

1. Di dalam folder root/utama proyek (satu level dengan `package.json`), buat sebuah file baru bernama **`.env.local`**.
2. Masuk ke Dashboard Supabase > Menu **Project Settings** > tab **API**.
3. Salin URL dan Kunci (*Keys*) Anda ke dalam `.env.local` seperti format di bawah ini:

```env
# Hubungkan aplikasi Anda dengan Database Supabase
NEXT_PUBLIC_SUPABASE_URL="https://[KODE_PROJECT_ANDA].supabase.co"

# Anon Key (Aman terekspos ke Front-End)
NEXT_PUBLIC_SUPABASE_ANON_KEY="eyJhbGciOiJIUzI1NiIs..."

# Service Role Key (SANGAT RAHASIA! ☠️ JANGAN DIBAGIKAN KE FRONT-END!)
# Digunakan untuk aksi super admin, bypass RLS, bypass email verifikasi, hapus & ban akun.
SUPABASE_SERVICE_ROLE_KEY="eyJhbGciOiJIUzI1NiIs..."
```

---

## 🚀 LANGKAH 3: Instalasi & Menembak Server Lokal!
Saatnya mengkompilasi ratusan library cerdas yang membangun aplikasi ini.

1. Buka terminal Anda (pada *root folder* proyek), lalu ketikkan perintah ajaib ini:
   ```bash
   npm install
   ```
   *☕ Seduh kopi Anda. Proses ini mengunduh TailwindCSS, Shadcn UI, Supabase Client, React Query, dan core Next.js.*

2. Setelah sukses dan muncul tulisan *Packages Installed*, jalankan mesin:
   ```bash
   npm run dev
   ```

3. Voilà! 🎉 Buka *browser* kesayangan Anda dan meluncurlah ke: **`http://localhost:3000`**

---

## 🌐 LANGKAH 4: Tata Cara Penggunaan (The User Journey)
Aplikasi ini cerdas memisahkan jalur Pendaftar Perusahaan (Si Bos/Owner) dan Pendaftar Karyawan (Pegawai). Edukasi user perihal alur ini:

🏢 **Jalur Pendaftaran Perusahaan Baru:**
1. Di **Landing Page Utama** (`/`), tekan tombol **Mulai Gratis / Daftar Sebagai Perusahaan**.
2. Setelah sukses daftar, *Owner* akan dicegat oleh **Setup Onboarding Wizard**. Di sini wajib mengatur:
   - Nama Perusahaan.
   - **Kode Slug Perusahaan** *(Contoh: pt-makmur-jaya)*. Ini adalah identitas unik perusahaan!
   - Jam masuk & Jam pulang (Digunakan bot Absensi untuk mengecek siapa telat & pulang awal).
3. Setelah klik *Save*, Owner tiba di *Dashboard HR* dan bisa mulai menggunakan fitur.
4. **Tugas Owner:** Bagikan **Kode Slug** ke seluruh calon karyawannya.

👨‍💼 **Jalur Pendaftaran Karyawan Baru:**
1. Karyawan dilarang daftar dari /register. Arahkan mereka ke `/employee-register` (Tombol *Portal Karyawan* di *Landing Page*).
2. Karyawan WAJIB memasukkan **Kode Slug Perusahaan** tempat dia bernaung.
3. Begitu masuk ke Portal Karyawan (`/dashboard/employee-portal`), mereka akan disambut oleh UI interaktif yang mengenali perusahaan mereka, dan disapa oleh **Tutorial Penggunaan Aplikasi** interaktif!

*(Perusahaan A dan Perusahaan B sama-sama masuk ke App Anda, namun data Karyawan Perusahaan A dijamin 100% terkunci dan tidak akan tembus ke Perusahaan B berkat RLS Supabase!)*

---

## 🚑 RUANG GAWAT DARURAT (Troubleshooting Error)
Takut muncul masalah? Tenang, semuanya sudah kami mitigasi. Berikut contekan jika Anda/klien Anda menemui _error_:

**❌ Error: "Could not find the 'xyz' column in the schema cache"**
📝 **Penyebab & Solusi**: Karena Anda lupa menjalankan instruksi "SQL Migrations" terbaru, ATAU cache Supabase belum *refresh*. **Solusi:** Jalankan sisa file SQL yang belum di-run. Jika sudah, pergi ke `Supabase Dashboard -> Settings -> API -> Klik Clear Cache`. Selesai!

**❌ Error: "new row violates row-level security policy for table" (Gagal Save / Update Profil)**
📝 **Penyebab & Solusi**: Perlindungan privasi RLS Supabase bentrok. Ini terjadi bila `Service Role Key` di `.env` salah, atau cacat pada migrasi trigger. Pastikan file `004_fix_rls_recursion.sql` sudah berjalan.

**❌ Karyawan berhasil mendaftar tapi saat login ke Portal UI menjadi "Akun TIdak terhubung" (Tenant ID berstatus Null)**
📝 **Penyebab & Solusi**: Saat Insert karyawan, fungsi *Database Trigger Automatis* memutus sinkronisasi (Mungkin lambat).
Namun, tak usah khawatir! *Source Code* terbaru MyCorporate sudah mencangkok "Smart Bypass" via API `/api/auth/employee-register`. Fitur Frontend akan meng-_handle_ cacat Backend tanpa si karyawan menyadarinya. Aplikasi Anda kebal dari error murahan!

**❌ Saat Pindah Halaman/Menu, Layar Nge-blank sebentar**
📝 **Penyebab & Solusi**: Anda sedang berada dalam `Development Mode` (`npm run dev`), server memproses kode per klik/langsung (*Lazy Load*). Jika aplikasinya di-build dengan komando `npm run build && npm start` (Mode Produksi), sistem berpindah secara sekejap mata (Instant-Navigation)! Aplikasi ini juga sudah kami bekali *Loading Spinner* elegan layaknya Vercel ✨.

---

<div align="center">
  <br />
  <h3>🎉 <strong>SELAMAT MENJUAL DAN BERBISNIS!</strong> 🎉</h3>
  <p>Jangan ragu untuk meng-kustomisasi Logo, Nama Aplikasi, Tema Warna (Bisa Diubah via UI Settings loh!), atau Warna Dasar TailwindCSS Anda.</p>
</div>
