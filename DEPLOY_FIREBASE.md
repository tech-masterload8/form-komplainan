# 🚀 Panduan Deploy ke Firebase Hosting - SUPER SIMPLE!

Panduan lengkap deploy sistem tiket komplain ke Firebase Hosting dalam **5 langkah mudah**.

---

## 📋 Prasyarat

- Node.js versi 18+ (download: https://nodejs.org)
- Akun Google (untuk Firebase)
- Internet connection

---

## 🎯 Step 1: Install Firebase CLI

Buka terminal/command prompt di folder project ini:

```bash
# Install Firebase CLI global
npm install -g firebase-tools

# Verify installation
firebase --version
# Output: 13.x.x atau lebih tinggi
```

---

## 🔐 Step 2: Login ke Firebase

```bash
# Login dengan akun Google Anda
firebase login

# Browser akan terbuka, pilih akun Google
# Klik "Allow" untuk memberikan akses
# Tunggu sampai muncul "Success! Logged in as ..."
```

**Tips:** Jika browser tidak terbuka otomatis, copy URL yang muncul di terminal dan paste di browser.

---

## 🏗 Step 3: Setup Firebase Project

### A. Buat Project di Firebase Console

1. Buka https://console.firebase.google.com/
2. Klik **"Add project"** atau **"Create a project"**
3. Masukkan nama project (contoh: `komplain-transfer`)
4. **Disable Google Analytics** (tidak wajib untuk project ini)
5. Klik **"Create project"**
6. Tunggu sampai selesai, lalu klik **"Continue"**

### B. Aktifkan Layanan Firebase

Sekarang aktifkan layanan yang dibutuhkan:

#### ✅ **1. Authentication**

1. Di sidebar kiri, klik **"Authentication"**
2. Klik **"Get started"**
3. Tab **"Sign-in method"**
4. Klik **"Email/Password"** → Toggle **"Enable"** → **"Save"**
5. Klik **"Anonymous"** → Toggle **"Enable"** → **"Save"**

#### ✅ **2. Firestore Database**

1. Di sidebar kiri, klik **"Firestore Database"**
2. Klik **"Create database"**
3. Pilih **"Start in production mode"** → **"Next"**
4. Pilih lokasi terdekat (contoh: `asia-southeast1` untuk Asia) → **"Enable"**
5. Tunggu sampai selesai

#### ✅ **3. Storage**

1. Di sidebar kiri, klik **"Storage"**
2. Klik **"Get started"**
3. Klik **"Next"** (gunakan default rules)
4. Pilih lokasi **SAMA** dengan Firestore → **"Done"**

#### ✅ **4. Buat Admin User**

1. Kembali ke **"Authentication"**
2. Klik tab **"Users"**
3. Klik **"Add user"**
4. Masukkan:
   - **Email:** admin@example.com (atau email Anda)
   - **Password:** minimal 6 karakter (ingat password ini!)
5. Klik **"Add user"**

---

## ⚙️ Step 4: Konfigurasi Project

### A. Dapatkan Firebase Config

1. Di Firebase Console, klik ⚙️ (Settings) → **"Project settings"**
2. Scroll ke bawah ke bagian **"Your apps"**
3. Klik icon **Web** (`</>`)
4. Masukkan nickname: `Komplain App` → **"Register app"**
5. **Copy** kode config yang muncul (mulai dari `const firebaseConfig = {`)

### B. Edit firebase-config.js

Buka file `public/assets/firebase-config.js` dan **ganti** dengan config yang baru Anda copy:

```javascript
const firebaseConfig = {
  apiKey: "AIzaSyXXXXXXXXXXXXXXXXXXXXXXXXXX",  // Ganti dengan punya Anda
  authDomain: "komplain-transfer.firebaseapp.com",
  projectId: "komplain-transfer",
  storageBucket: "komplain-transfer.appspot.com",
  messagingSenderId: "123456789012",
  appId: "1:123456789012:web:abcdef123456"
};

window.firebaseConfig = firebaseConfig;
```

**Save file!** ✅

### C. Edit .firebaserc

Buka file `.firebaserc` dan **ganti** `your-project-id` dengan **Project ID** Anda:

```json
{
  "projects": {
    "default": "komplain-transfer"
  }
}
```

**Project ID** bisa dilihat di Firebase Console → Project Settings → Project ID.

**Save file!** ✅

---

## 📦 Step 5: Install Dependencies

Di terminal, jalankan:

```bash
# Install dependencies untuk Cloud Functions
cd functions
npm install

# Tunggu sampai selesai (bisa 1-2 menit)
# Kembali ke root folder
cd ..
```

---

## 🚀 Step 6: DEPLOY!

Sekarang tinggal 1 command untuk deploy semuanya:

```bash
firebase deploy
```

**Proses:**
1. ✅ Deploy Hosting (frontend)
2. ✅ Deploy Functions (backend)
3. ✅ Deploy Firestore Rules (database security)
4. ✅ Deploy Storage Rules (file security)

**Tunggu 2-5 menit** sampai muncul:

```
✔  Deploy complete!

Hosting URL: https://komplain-transfer.web.app
```

**SELESAI!** 🎉

---

## 🎉 Step 7: Buka Aplikasi Anda!

Aplikasi Anda sudah **LIVE** di internet!

### 🔗 URL Aplikasi:

**Form Komplain (untuk user):**
```
https://YOUR-PROJECT-ID.web.app/komplain.html
```

**Dashboard Admin:**
```
https://YOUR-PROJECT-ID.web.app/admin.html
```

**Atau:**
```
https://YOUR-PROJECT-ID.firebaseapp.com/komplain.html
https://YOUR-PROJECT-ID.firebaseapp.com/admin.html
```

---

## ✅ Testing Aplikasi

### Test 1: Form Komplain

1. Buka `https://YOUR-PROJECT-ID.web.app/komplain.html`
2. Tunggu sampai loading selesai (anonymous auth)
3. Isi semua field:
   - Kode User: `TEST001`
   - Nama Toko: `Toko Testing`
   - Tanggal: Pilih hari ini
   - Pengirim: `John Doe`
   - Nominal: `100000`
   - Bank: Pilih `BCA` (atau `QRIS` untuk test field RRN)
   - Upload gambar (max 5MB, JPG/PNG)
4. Klik **"Kirim Komplain"**
5. Tunggu sampai muncul nomor tiket
6. Klik **"Copy Nomor Tiket"**

**✅ Berhasil?** Lanjut test admin!

### Test 2: Dashboard Admin

1. Buka `https://YOUR-PROJECT-ID.web.app/admin.html`
2. Login dengan:
   - Email: yang Anda buat di Step 3.B.4
   - Password: password yang Anda buat
3. Klik **"Login"**
4. Anda akan melihat tiket yang baru saja dibuat
5. Klik **"Lihat Bukti"** untuk preview gambar
6. Test pagination jika ada banyak data
7. Klik **"Logout"** untuk keluar

**✅ Semua berfungsi?** Aplikasi Anda sudah siap digunakan!

---

## 🎨 Bonus: Custom Domain (Opsional)

Ingin pakai domain sendiri? (contoh: `komplain.yourdomain.com`)

1. Buka Firebase Console → **Hosting** → **Add custom domain**
2. Masukkan domain Anda
3. Ikuti instruksi setup DNS
4. Firebase akan otomatis setup **SSL certificate GRATIS!**

---

## 🔄 Update Aplikasi di Masa Depan

Jika Anda ubah kode dan ingin deploy ulang:

```bash
# Deploy semua perubahan
firebase deploy

# Atau deploy spesifik:
firebase deploy --only hosting      # Frontend saja
firebase deploy --only functions    # Backend saja
```

---

## 📊 Monitoring & Logs

### Lihat Logs Functions

```bash
firebase functions:log

# Atau spesifik function:
firebase functions:log --only createTicket
```

### Firebase Console

Buka Firebase Console untuk monitoring:
- **Functions:** Lihat usage, errors, execution time
- **Firestore:** Lihat data tiket real-time
- **Authentication:** Lihat users
- **Storage:** Lihat gambar yang diupload
- **Hosting:** Lihat traffic dan bandwidth

---

## 🛠 Troubleshooting

### ❌ Error: "Permission denied"

**Solusi:**
```bash
firebase login --reauth
```

### ❌ Error: "Firebase config not found"

**Solusi:**
- Pastikan `public/assets/firebase-config.js` sudah diedit dengan benar
- Pastikan tidak ada syntax error (tanda koma, kurung, dll)

### ❌ Error: "Functions deployment failed"

**Solusi:**
```bash
# Hapus node_modules dan install ulang
cd functions
rm -rf node_modules package-lock.json
npm install
cd ..

# Deploy ulang
firebase deploy --only functions
```

### ❌ Error: "CORS policy" atau "Network error"

**Solusi:**
- Pastikan Firestore Rules dan Storage Rules sudah di-deploy
- Deploy ulang: `firebase deploy --only firestore,storage`

### ❌ Error: Upload gambar gagal

**Solusi:**
- Cek di Firebase Console → Storage → Rules
- Pastikan rules sudah benar (seharusnya otomatis dari `firebase deploy`)

### ❌ Admin tidak bisa login

**Solusi:**
- Cek di Firebase Console → Authentication → Users
- Pastikan user admin sudah dibuat
- Coba reset password di console

---

## 💰 Biaya (FREE Tier)

Firebase **GRATIS** untuk:
- ✅ 50,000 document reads/day
- ✅ 20,000 document writes/day
- ✅ 10 GB storage
- ✅ 125,000 function invocations/month
- ✅ 10 GB hosting bandwidth/month

**Untuk traffic kecil-menengah = 100% GRATIS!**

Jika traffic tinggi, bisa upgrade ke **Blaze Plan** (pay as you go).

---

## 📱 Aplikasi Sudah Live!

**Share URL ini ke user:**
```
https://YOUR-PROJECT-ID.web.app/komplain.html
```

**URL Admin:**
```
https://YOUR-PROJECT-ID.web.app/admin.html
```

---

## 🎓 Command Berguna

```bash
# Deploy
firebase deploy                       # Deploy semua
firebase deploy --only hosting        # Frontend saja
firebase deploy --only functions      # Backend saja

# Monitoring
firebase functions:log                # Lihat logs
firebase open hosting:site            # Buka website di browser
firebase open console                 # Buka Firebase Console

# Project Management
firebase projects:list                # List semua project
firebase use your-project-id          # Switch project
firebase logout                       # Logout
```

---

## 🎉 SELESAI!

Aplikasi Anda sudah **LIVE DI INTERNET!** 🌍

**Testing Checklist:**
- [ ] User bisa submit komplain ✅
- [ ] Upload gambar berhasil ✅
- [ ] Nomor tiket ter-generate ✅
- [ ] Admin bisa login ✅
- [ ] Admin bisa lihat daftar tiket ✅
- [ ] Admin bisa lihat bukti gambar ✅
- [ ] Pagination berfungsi ✅
- [ ] Rate limiting berfungsi (coba submit 2x dalam 3 menit) ✅

**Butuh bantuan?**
- Cek `README_FIREBASE.md` untuk dokumentasi lengkap
- Lihat logs: `firebase functions:log`
- Cek Firebase Console untuk monitoring

---

**Happy Deploying!** 🚀✨
