# Sistem Tiket Komplain Transfer

Sistem lengkap untuk mengelola komplain transfer dengan Firebase Authentication dan Storage.

## 📋 Daftar Isi

- [Fitur](#fitur)
- [Teknologi](#teknologi)
- [Struktur File](#struktur-file)
- [Instalasi](#instalasi)
- [Konfigurasi](#konfigurasi)
- [Cara Menggunakan](#cara-menggunakan)
- [Keamanan](#keamanan)
- [Troubleshooting](#troubleshooting)

## ✨ Fitur

### Halaman Komplain (User)
- Form komplain tanpa login (anonymous auth)
- Upload bukti transfer ke Firebase Storage
- Validasi input lengkap (frontend + backend)
- Rate limiting per IP untuk mencegah spam
- Nomor tiket unik yang dapat di-copy
- Mobile-first responsive design

### Dashboard Admin
- Login dengan Firebase Authentication (email/password)
- Lihat daftar semua tiket komplain
- Pagination untuk data banyak
- Preview gambar bukti transfer dalam modal
- Refresh data real-time
- Protected dengan Firebase ID Token

## 🔧 Teknologi

- **Frontend**: HTML5, CSS3, JavaScript (ES6 Modules)
- **Backend**: PHP 7.4+ (native, tanpa framework)
- **Database**: MySQL 5.7+
- **Cloud**: Firebase (Authentication & Storage)
- **Design**: Mobile-first, responsive

## 📁 Struktur File

```
form-komplainan/
├── public/
│   ├── komplain.html              # Halaman form komplain
│   ├── admin.html                 # Halaman dashboard admin
│   └── assets/
│       ├── style.css              # Styling aplikasi
│       ├── firebase-config.js     # Konfigurasi Firebase
│       ├── app-komplain.js        # JavaScript form komplain
│       └── app-admin.js           # JavaScript dashboard admin
├── api/
│   ├── config.php                 # Konfigurasi database & helpers
│   ├── create_ticket.php          # Endpoint buat tiket
│   └── list_tickets.php           # Endpoint list tiket (admin)
├── database.sql                   # Schema database
└── README.md                      # Dokumentasi
```

## 🚀 Instalasi

### 1. Persiapan Server

Pastikan server Anda memiliki:
- PHP 7.4 atau lebih tinggi
- MySQL 5.7 atau lebih tinggi
- Extension PHP: mysqli, json, curl
- Web server (Apache/Nginx)

### 2. Setup Database

```bash
# Login ke MySQL
mysql -u root -p

# Jalankan script database
mysql -u root -p < database.sql
```

Atau import manual melalui phpMyAdmin.

### 3. Setup Firebase

#### a. Buat Project Firebase
1. Buka [Firebase Console](https://console.firebase.google.com/)
2. Klik "Add project"
3. Ikuti wizard pembuatan project

#### b. Aktifkan Firebase Authentication
1. Di Firebase Console, buka **Authentication**
2. Klik tab **Sign-in method**
3. Aktifkan **Email/Password**
4. Aktifkan **Anonymous**

#### c. Buat Admin User
1. Di Authentication, klik tab **Users**
2. Klik **Add user**
3. Masukkan email dan password admin
4. Simpan

#### d. Setup Firebase Storage
1. Di Firebase Console, buka **Storage**
2. Klik **Get started**
3. Pilih region terdekat
4. Buka tab **Rules** dan ganti dengan:

```javascript
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    // Path untuk bukti transfer
    match /bukti-transfer/{fileName} {
      // Siapa saja bisa baca (untuk admin lihat bukti)
      allow read: if true;

      // Hanya user yang authenticated (termasuk anonymous) yang bisa upload
      // Maksimal ukuran file 5 MB
      allow write: if request.auth != null
                   && request.resource.size < 5 * 1024 * 1024
                   && request.resource.contentType.matches('image/.*');
    }
  }
}
```

#### e. Dapatkan Firebase Config
1. Di Firebase Console, klik ⚙️ (Settings) > **Project settings**
2. Scroll ke bawah ke bagian **Your apps**
3. Klik icon **Web** (</>) untuk add web app
4. Salin konfigurasi Firebase

### 4. Konfigurasi Aplikasi

#### a. Konfigurasi Firebase (Frontend)

Edit file `public/assets/firebase-config.js`:

```javascript
const firebaseConfig = {
  apiKey: "YOUR_API_KEY",
  authDomain: "your-project.firebaseapp.com",
  projectId: "your-project-id",
  storageBucket: "your-project.appspot.com",
  messagingSenderId: "1234567890",
  appId: "1:1234567890:web:abcdef1234567890"
};
```

#### b. Konfigurasi Database (Backend)

Edit file `api/config.php`:

```php
define('DB_HOST', 'localhost');
define('DB_USER', 'root');           // Ganti dengan user MySQL Anda
define('DB_PASS', 'your_password');  // Ganti dengan password MySQL
define('DB_NAME', 'komplain_db');
```

#### c. Konfigurasi Rate Limiting (Opsional)

Di `api/config.php`, sesuaikan waktu rate limit:

```php
// Waktu minimum (dalam menit) antara pengiriman tiket dari IP yang sama
define('RATE_LIMIT_MINUTES_PER_IP', 3); // Ubah sesuai kebutuhan
```

### 5. Upload ke Server

Upload semua file ke web server Anda:

```
your-domain.com/
├── komplain.html
├── admin.html
├── assets/
│   └── ...
└── api/
    └── ...
```

### 6. Setup URL API (Jika Berbeda Domain)

Jika API Anda berada di domain/subdomain berbeda, edit:

**File: `public/assets/app-komplain.js`**
```javascript
const API_BASE_URL = 'https://api.yourdomain.com/api'; // Ganti dengan URL API Anda
```

**File: `public/assets/app-admin.js`**
```javascript
const API_BASE_URL = 'https://api.yourdomain.com/api'; // Ganti dengan URL API Anda
```

## 🎯 Cara Menggunakan

### User - Kirim Komplain

1. Buka `komplain.html` di browser
2. Tunggu aplikasi terinisialisasi (anonymous auth otomatis)
3. Isi semua field yang wajib:
   - Kode User
   - Nama Toko
   - Tanggal Transfer
   - Nama Pengirim
   - Nominal
   - Bank (jika pilih QRIS, akan muncul field RRN)
   - Upload Bukti Transfer (max 5 MB, JPG/PNG)
4. Klik **Kirim Komplain**
5. Setelah sukses, nomor tiket akan muncul
6. Klik **Copy Nomor Tiket** untuk menyalin
7. Kirim nomor tiket ke CS via WhatsApp

### Admin - Kelola Tiket

1. Buka `admin.html` di browser
2. Login dengan email dan password admin (yang dibuat di Firebase Console)
3. Setelah login, Anda akan melihat dashboard dengan tabel tiket
4. Klik **Lihat Bukti** untuk preview gambar bukti transfer
5. Gunakan **Sebelumnya** / **Berikutnya** untuk navigasi halaman
6. Klik **Refresh Data** untuk memuat ulang data
7. Klik **Logout** untuk keluar

## 🔒 Keamanan

### Keamanan yang Sudah Diterapkan

1. **Firebase Anonymous Auth** - User harus authenticated sebelum bisa upload
2. **Firebase Storage Rules** - Validasi ukuran dan tipe file di cloud
3. **Rate Limiting** - Mencegah spam submit dari IP yang sama
4. **Input Validation** - Validasi di frontend dan backend
5. **SQL Injection Protection** - Menggunakan prepared statements
6. **XSS Protection** - HTML escaping di admin dashboard
7. **Firebase ID Token Verification** - Admin endpoint dilindungi token

### Rekomendasi Tambahan untuk Production

1. **Install Firebase Admin SDK untuk PHP**
   ```bash
   composer require kreait/firebase-php
   ```

   Lalu uncomment bagian verifikasi token di `api/config.php` fungsi `verifyFirebaseIdToken()`

2. **Gunakan HTTPS**
   - Wajib untuk production
   - Firebase membutuhkan HTTPS untuk beberapa fitur

3. **Setup CORS dengan Benar**
   - Ganti `Access-Control-Allow-Origin: *` di `api/config.php`
   - Gunakan domain spesifik untuk production

4. **Environment Variables**
   - Jangan commit file config dengan credentials asli
   - Gunakan environment variables untuk sensitive data

5. **Database Security**
   - Gunakan user database dengan privilege terbatas
   - Jangan gunakan root user

6. **File Upload Security**
   - Sudah divalidasi di Firebase Storage Rules
   - Tambahan: scan file dengan antivirus jika diperlukan

## 🔧 Kustomisasi

### Ubah Format Nomor Tiket

Edit di `api/config.php`:

```php
// Format: YYYYMMDDHHMMSS + 4 digit random
define('TICKET_NUMBER_FORMAT', 'YmdHis');
```

Atau ubah fungsi `generateTicketNumber()` sesuai kebutuhan.

### Ubah Waktu Rate Limit

Edit di `api/config.php`:

```php
define('RATE_LIMIT_MINUTES_PER_IP', 5); // Ubah jadi 5 menit
```

### Tambah Field Baru

1. Tambah kolom di database (file `database.sql`)
2. Tambah input di `komplain.html`
3. Tambah validasi di `app-komplain.js`
4. Tambah kolom di tabel admin (`admin.html`)
5. Update query di `create_ticket.php` dan `list_tickets.php`

### Ubah Jumlah Data Per Halaman

Edit di `public/assets/app-admin.js`:

```javascript
let perPage = 20; // Ubah dari 10 menjadi 20
```

## ❓ Troubleshooting

### Error: "Gagal menginisialisasi aplikasi"

**Solusi:**
- Cek apakah konfigurasi Firebase di `firebase-config.js` sudah benar
- Pastikan Firebase Authentication dan Storage sudah diaktifkan
- Cek console browser untuk error detail

### Error: "Koneksi database gagal"

**Solusi:**
- Cek konfigurasi database di `api/config.php`
- Pastikan MySQL service sedang running
- Cek username, password, dan nama database

### Error: "Token tidak valid" di Admin

**Solusi:**
- Login ulang ke dashboard admin
- Pastikan akun admin sudah dibuat di Firebase Console
- Cek apakah verifikasi token di `api/config.php` sudah benar
- Untuk production, install Firebase Admin SDK

### Upload Gambar Gagal

**Solusi:**
- Pastikan Firebase Storage sudah diaktifkan
- Cek Firebase Storage Rules sudah diupdate
- Pastikan ukuran file < 5 MB
- Format file harus JPG atau PNG

### Rate Limit Terlalu Ketat

**Solusi:**
- Ubah nilai `RATE_LIMIT_MINUTES_PER_IP` di `api/config.php`
- Atau hapus data di tabel `ip_rate_limit` untuk reset

### CORS Error

**Solusi:**
- Pastikan header CORS di `api/config.php` sudah benar
- Untuk production, ganti `*` dengan domain spesifik
- Pastikan web server mendukung CORS

## 📞 Support

Jika mengalami kendala:

1. Cek console browser (F12) untuk error JavaScript
2. Cek error log PHP di server
3. Cek Firebase Console untuk error Authentication/Storage
4. Pastikan semua konfigurasi sudah benar
