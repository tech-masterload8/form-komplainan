# ✅ Deployment Checklist - Firebase Hosting

Quick checklist untuk deploy sistem tiket komplain ke Firebase.

---

## 📋 Pre-Deployment

- [ ] Node.js 18+ ter-install (`node --version`)
- [ ] Akun Google untuk Firebase
- [ ] Internet connection

---

## 🚀 Deployment Steps

### 1️⃣ Install Firebase CLI
```bash
npm install -g firebase-tools
firebase --version
```

### 2️⃣ Login Firebase
```bash
firebase login
# Browser akan terbuka, login dengan Google
```

### 3️⃣ Buat Firebase Project

Di https://console.firebase.google.com/:
- [ ] Buat project baru
- [ ] Aktifkan **Authentication** (Email/Password + Anonymous)
- [ ] Aktifkan **Firestore Database** (production mode)
- [ ] Aktifkan **Storage**
- [ ] Buat **admin user** di Authentication → Users

### 4️⃣ Konfigurasi Project

**A. Firebase Console → Project Settings → Your apps → Web:**
- [ ] Copy Firebase config

**B. Edit `public/assets/firebase-config.js`:**
- [ ] Paste Firebase config yang baru dicopy
- [ ] Save file

**C. Edit `.firebaserc`:**
- [ ] Ganti `your-project-id` dengan Project ID Anda
- [ ] Save file

### 5️⃣ Install Dependencies
```bash
cd functions
npm install
cd ..
```

### 6️⃣ Deploy!
```bash
firebase deploy
```

Tunggu sampai muncul:
```
✔  Deploy complete!
Hosting URL: https://your-project-id.web.app
```

---

## ✅ Post-Deployment Testing

### Test Form Komplain
- [ ] Buka `https://your-project-id.web.app/komplain.html`
- [ ] Isi form lengkap
- [ ] Upload gambar (max 5MB)
- [ ] Submit berhasil
- [ ] Nomor tiket muncul
- [ ] Copy nomor tiket berhasil

### Test Admin Dashboard
- [ ] Buka `https://your-project-id.web.app/admin.html`
- [ ] Login dengan admin credentials
- [ ] Dashboard tampil
- [ ] Lihat daftar tiket
- [ ] Klik "Lihat Bukti" → gambar muncul
- [ ] Pagination berfungsi
- [ ] Logout berhasil

### Test Rate Limiting
- [ ] Submit komplain
- [ ] Tunggu < 3 menit
- [ ] Submit lagi → Error "Terlalu sering"
- [ ] Tunggu > 3 menit
- [ ] Submit lagi → Berhasil

---

## 🎯 Final Checklist

- [ ] Aplikasi bisa diakses via URL
- [ ] User bisa submit komplain
- [ ] Admin bisa login dan lihat data
- [ ] Upload gambar berfungsi
- [ ] Rate limiting berfungsi
- [ ] Semua fitur tested

---

## 🔗 URLs Aplikasi

**Form Komplain:**
```
https://YOUR-PROJECT-ID.web.app/komplain.html
```

**Admin Dashboard:**
```
https://YOUR-PROJECT-ID.web.app/admin.html
```

---

## 🛠 Troubleshooting Quick Fix

### Error saat deploy
```bash
firebase login --reauth
firebase deploy
```

### Error di Functions
```bash
cd functions
rm -rf node_modules
npm install
cd ..
firebase deploy --only functions
```

### Upload gagal
```bash
firebase deploy --only storage
```

---

## 📊 Monitoring

```bash
# Lihat logs
firebase functions:log

# Buka console
firebase open console
```

---

## 🎉 DONE!

Aplikasi sudah live di:
**https://YOUR-PROJECT-ID.web.app** 🚀

Share URL ke users dan admin!
