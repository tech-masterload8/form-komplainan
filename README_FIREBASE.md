# Sistem Tiket Komplain Transfer - Firebase Edition 🚀

Sistem tiket komplain **100% serverless** menggunakan Firebase (Cloud Firestore, Cloud Functions, Authentication, Storage, dan Hosting).

**TIDAK PERLU:** PHP, MySQL, atau Web Server! ✅

## ✨ Fitur

### User - Form Komplain
- ✅ Submit komplain tanpa login (anonymous auth)
- ✅ Upload bukti transfer ke Firebase Storage (max 5MB)
- ✅ Auto-generate nomor tiket unik
- ✅ Rate limiting anti-spam (3 menit per IP)
- ✅ Validasi lengkap frontend & backend
- ✅ Copy nomor tiket ke clipboard
- ✅ Mobile-first responsive design

### Admin - Dashboard
- ✅ Login dengan Firebase Auth (email/password)
- ✅ Lihat daftar tiket dengan pagination
- ✅ Preview gambar bukti transfer
- ✅ Protected dengan ID token verification
- ✅ Real-time refresh data
- ✅ Responsive table

## 🔧 Teknologi

- **Frontend:** HTML5 + CSS3 + JavaScript (ES6 Modules)
- **Backend:** Firebase Cloud Functions (Node.js 18)
- **Database:** Cloud Firestore (NoSQL)
- **Authentication:** Firebase Authentication
- **Storage:** Firebase Storage
- **Hosting:** Firebase Hosting
- **Deployment:** 1 command deploy!

## 📁 Struktur File

```
form-komplainan/
├── public/                      # Frontend (akan di-host di Firebase Hosting)
│   ├── komplain.html
│   ├── admin.html
│   └── assets/
│       ├── style.css
│       ├── firebase-config.js   # Config Firebase (edit ini!)
│       ├── app-komplain.js
│       └── app-admin.js
├── functions/                   # Backend (Firebase Cloud Functions)
│   ├── index.js                 # Main functions file
│   ├── package.json
│   └── .eslintrc.js
├── firebase.json                # Firebase project config
├── .firebaserc                  # Firebase project ID (edit ini!)
├── firestore.rules              # Firestore Security Rules
├── firestore.indexes.json       # Firestore indexes
├── storage.rules                # Storage Security Rules
└── README_FIREBASE.md           # Dokumentasi ini
```

## 🚀 Quick Start (5 Menit!)

### Prasyarat

```bash
# Install Node.js (versi 18 atau lebih tinggi)
# Download dari: https://nodejs.org

# Install Firebase CLI
npm install -g firebase-tools

# Verify installation
firebase --version
```

### Langkah 1: Setup Firebase Project

```bash
# Login ke Firebase
firebase login

# Inisialisasi project (pilih opsi: Hosting, Functions, Firestore, Storage)
firebase init

# ATAU manual: Edit .firebaserc dan ganti 'your-project-id' dengan project ID Anda
```

### Langkah 2: Konfigurasi Firebase

#### a. Buat Firebase Project

1. Buka [Firebase Console](https://console.firebase.google.com/)
2. Klik **Add project**
3. Masukkan nama project → **Create project**

#### b. Aktifkan Layanan Firebase

**Authentication:**
1. Buka **Authentication** → **Get started**
2. Tab **Sign-in method** → Aktifkan **Email/Password** ✅
3. Aktifkan **Anonymous** ✅

**Firestore Database:**
1. Buka **Firestore Database** → **Create database**
2. Pilih **Start in production mode**
3. Pilih lokasi terdekat (e.g., `asia-southeast1`)

**Storage:**
1. Buka **Storage** → **Get started**
2. Pilih **Start in production mode**
3. Pilih lokasi yang sama dengan Firestore

**Buat Admin User:**
1. Buka **Authentication** → tab **Users**
2. Klik **Add user**
3. Masukkan email dan password admin
4. Simpan

#### c. Dapatkan Firebase Config

1. Buka **Project Settings** (⚙️ icon)
2. Scroll ke **Your apps**
3. Klik icon **Web** (</>)
4. Register app dengan nama (e.g., "Komplain App")
5. **Copy** konfigurasi Firebase

#### d. Edit `public/assets/firebase-config.js`

```javascript
const firebaseConfig = {
  apiKey: "AIzaSy...",                    // Paste dari Firebase Console
  authDomain: "your-project.firebaseapp.com",
  projectId: "your-project-id",
  storageBucket: "your-project.appspot.com",
  messagingSenderId: "123456789",
  appId: "1:123456789:web:abcdef"
};

window.firebaseConfig = firebaseConfig;
```

#### e. Edit `.firebaserc`

```json
{
  "projects": {
    "default": "your-project-id"    // Ganti dengan project ID Anda
  }
}
```

### Langkah 3: Install Dependencies

```bash
# Install dependencies untuk Cloud Functions
cd functions
npm install
cd ..
```

### Langkah 4: Deploy ke Firebase! 🚀

```bash
# Deploy SEMUA (Hosting, Functions, Firestore Rules, Storage Rules)
firebase deploy

# Atau deploy satu per satu:
firebase deploy --only hosting
firebase deploy --only functions
firebase deploy --only firestore
firebase deploy --only storage
```

**Selesai!** 🎉

Aplikasi Anda sudah live di: `https://your-project-id.web.app`

## 🧪 Testing Lokal (Opsional)

Sebelum deploy, Anda bisa test dengan Firebase Emulator:

```bash
# Install dependencies dulu (jika belum)
cd functions && npm install && cd ..

# Jalankan emulator
firebase emulators:start

# Buka di browser:
# - Hosting: http://localhost:5000
# - Emulator UI: http://localhost:4000
```

**Note:** Ketika testing dengan emulator:
- Data tidak tersimpan ke Firestore production
- File tidak terupload ke Storage production
- Semua isolated di local machine

## 📝 Cara Menggunakan

### User - Kirim Komplain

1. Buka `https://your-project-id.web.app/komplain.html`
2. Isi form:
   - Kode User
   - Nama Toko
   - Tanggal Transfer
   - Nama Pengirim
   - Nominal
   - Bank (jika pilih QRIS, field RRN akan muncul)
   - Upload Bukti Transfer (JPG/PNG, max 5MB)
3. Klik **Kirim Komplain**
4. Nomor tiket akan muncul
5. Klik **Copy Nomor Tiket**
6. Kirim nomor tiket ke CS via WhatsApp

### Admin - Dashboard

1. Buka `https://your-project-id.web.app/admin.html`
2. Login dengan email & password admin (yang dibuat di Firebase Console)
3. Lihat daftar tiket
4. Klik **Lihat Bukti** untuk preview gambar
5. Navigasi dengan pagination
6. Klik **Refresh Data** untuk reload
7. Klik **Logout** untuk keluar

## 🔒 Keamanan

### Apa yang Sudah Diterapkan?

1. **Firestore Security Rules**
   - User biasa TIDAK bisa write langsung ke database
   - Semua write melalui Cloud Functions
   - Admin bisa read dengan autentikasi

2. **Storage Security Rules**
   - Hanya authenticated user (termasuk anonymous) yang bisa upload
   - Max file size 5MB
   - Hanya image (JPEG, PNG) yang diizinkan

3. **Cloud Functions**
   - Validasi input lengkap
   - Rate limiting per IP (3 menit)
   - Firebase Admin SDK untuk verifikasi token
   - Generate nomor tiket unik

4. **Frontend**
   - Anonymous auth untuk upload
   - Admin auth dengan email/password
   - Input validation
   - XSS protection (HTML escaping)

## 💰 Biaya

Firebase **GRATIS** untuk:
- ✅ Up to 50,000 reads/day (Firestore)
- ✅ Up to 20,000 writes/day (Firestore)
- ✅ 10 GB storage (Firebase Storage)
- ✅ 1 GB upload/day (Storage)
- ✅ 125,000 function invocations/month
- ✅ 10 GB Hosting transfer/month

**Untuk traffic kecil-menengah, semuanya GRATIS!** 🎉

Lihat pricing: https://firebase.google.com/pricing

## 🎨 Kustomisasi

### Ubah Waktu Rate Limit

Edit `functions/index.js`:

```javascript
const RATE_LIMIT_MINUTES = 5; // Ubah dari 3 menjadi 5 menit
```

Lalu deploy ulang:
```bash
firebase deploy --only functions
```

### Ubah Jumlah Data Per Halaman

Edit `public/assets/app-admin.js`:

```javascript
let perPage = 20; // Ubah dari 10 menjadi 20
```

### Tambah Field Baru

1. **Frontend:** Tambah input di `komplain.html` dan validasi di `app-komplain.js`
2. **Backend:** Update validasi di `functions/index.js` (fungsi `validateTicketInput`)
3. **Admin:** Tambah kolom di tabel `admin.html` dan render di `app-admin.js`

### Ubah Tema Warna

Edit `public/assets/style.css`:

```css
:root {
    --primary-color: #2563eb; /* Ubah warna utama */
    --primary-hover: #1d4ed8;
}
```

## 🛠 Troubleshooting

### Error: "Firebase config not found"

**Solusi:**
- Pastikan `firebase-config.js` sudah diedit dengan config yang benar
- Pastikan file dimuat sebelum `app-komplain.js` atau `app-admin.js`

### Error: "Permission denied" saat upload

**Solusi:**
- Pastikan Storage Rules sudah di-deploy: `firebase deploy --only storage`
- Cek di Firebase Console → Storage → Rules

### Error: "Token verification failed"

**Solusi:**
- Logout dan login ulang di admin dashboard
- Pastikan Functions sudah di-deploy: `firebase deploy --only functions`

### Functions tidak jalan

**Solusi:**
```bash
# Cek logs
firebase functions:log

# Pastikan dependencies ter-install
cd functions
npm install
cd ..

# Deploy ulang
firebase deploy --only functions
```

### CORS Error

**Solusi:**
- Jika deploy di Firebase Hosting, tidak akan ada CORS error (karena same origin)
- Jika pakai custom domain, pastikan sudah setup di Firebase Hosting settings

## 📊 Monitoring

### Lihat Logs

```bash
# Logs Functions
firebase functions:log

# Logs specific function
firebase functions:log --only createTicket
```

### Firebase Console

Buka Firebase Console untuk monitoring:
- **Functions:** Lihat usage, errors, dan execution time
- **Firestore:** Lihat data real-time
- **Authentication:** Lihat users
- **Storage:** Lihat files yang diupload

## 🔄 Update Aplikasi

Jika Anda mengubah kode:

```bash
# Jika ubah frontend saja
firebase deploy --only hosting

# Jika ubah Cloud Functions
firebase deploy --only functions

# Jika ubah Firestore/Storage Rules
firebase deploy --only firestore,storage

# Deploy semuanya
firebase deploy
```

## 🌐 Custom Domain (Opsional)

Ingin pakai domain sendiri (e.g., `komplain.yourdomain.com`)?

1. Buka Firebase Console → **Hosting**
2. Klik **Add custom domain**
3. Masukkan domain Anda
4. Ikuti instruksi untuk setup DNS records
5. Firebase akan otomatis setup SSL certificate (GRATIS!)

## 📱 Progressive Web App (PWA) - Opsional

Ingin aplikasi bisa di-install di HP?

Tambahkan file `public/manifest.json` dan `service-worker.js`.

Tutorial: https://firebase.google.com/docs/hosting/pwa

## 🎓 Resources

- [Firebase Documentation](https://firebase.google.com/docs)
- [Cloud Functions Guide](https://firebase.google.com/docs/functions)
- [Firestore Guide](https://firebase.google.com/docs/firestore)
- [Firebase Hosting](https://firebase.google.com/docs/hosting)

## 💡 Tips

1. **Gunakan Emulator** saat development untuk testing tanpa biaya
2. **Enable Billing Alerts** di Google Cloud Console
3. **Backup Firestore** secara berkala (Firebase Console → Firestore → Import/Export)
4. **Gunakan Firebase Analytics** untuk tracking usage
5. **Setup Error Reporting** dengan Firebase Crashlytics

## 🆘 Butuh Bantuan?

Cek file berikut:
- `functions/index.js` - Kode Cloud Functions
- `firestore.rules` - Security rules database
- `storage.rules` - Security rules file storage
- Browser DevTools (F12) - Lihat error JavaScript
- Firebase Console → Functions → Logs - Lihat error backend

## 🎉 Selamat!

Aplikasi Anda sudah live di Firebase! 🚀

**URL Aplikasi:**
- Form Komplain: `https://your-project-id.web.app/komplain.html`
- Admin Dashboard: `https://your-project-id.web.app/admin.html`

**Testing Checklist:**
- [ ] User bisa submit komplain
- [ ] Upload gambar berhasil
- [ ] Nomor tiket ter-generate
- [ ] Admin bisa login
- [ ] Admin bisa lihat daftar tiket
- [ ] Admin bisa lihat bukti gambar
- [ ] Pagination berfungsi
- [ ] Rate limiting berfungsi
- [ ] Copy nomor tiket berfungsi

---

**Happy Coding!** 💻✨
