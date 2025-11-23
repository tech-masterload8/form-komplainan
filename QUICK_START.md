# 🚀 Quick Start Guide - 5 Menit Setup!

Panduan super cepat untuk deploy sistem tiket komplain ke Firebase.

## Prerequisites

```bash
# Install Firebase CLI
npm install -g firebase-tools

# Login ke Firebase
firebase login
```

## Step 1: Setup Firebase Project

### Opsi A: Buat Project Baru via Web
1. Buka https://console.firebase.google.com/
2. Klik "Add project" → Beri nama → Create
3. Skip Analytics (opsional)

### Opsi B: Via CLI
```bash
# List projects
firebase projects:list

# Use existing project
firebase use your-project-id
```

## Step 2: Edit Konfigurasi

### a. Edit `.firebaserc`
```json
{
  "projects": {
    "default": "YOUR-PROJECT-ID"
  }
}
```

### b. Edit `public/assets/firebase-config.js`

Dapatkan config dari:
Firebase Console → Project Settings → Your apps → Web app → SDK setup

```javascript
const firebaseConfig = {
  apiKey: "YOUR_API_KEY",
  authDomain: "your-project.firebaseapp.com",
  projectId: "your-project-id",
  storageBucket: "your-project.appspot.com",
  messagingSenderId: "123456789",
  appId: "1:123456789:web:abc123"
};

window.firebaseConfig = firebaseConfig;
```

## Step 3: Aktifkan Layanan di Firebase Console

### Authentication
1. Buka Authentication → Get started
2. Enable **Email/Password** ✅
3. Enable **Anonymous** ✅
4. Tab Users → Add user (untuk admin) → Save

### Firestore Database
1. Buka Firestore Database → Create database
2. Start in **production mode**
3. Pilih location (e.g., asia-southeast1)

### Storage
1. Buka Storage → Get started
2. Start in **production mode**
3. Pilih location yang sama dengan Firestore

## Step 4: Install Dependencies

```bash
# Install dependencies untuk Cloud Functions
npm run setup

# Atau manual:
cd functions
npm install
cd ..
```

## Step 5: Deploy! 🚀

```bash
# Deploy semuanya
firebase deploy

# Atau deploy satu-satu:
npm run deploy:hosting    # Frontend saja
npm run deploy:functions   # Backend saja
npm run deploy:firestore   # Database rules
npm run deploy:storage     # Storage rules
```

**Selesai!** Aplikasi sudah live di:
- `https://YOUR-PROJECT-ID.web.app/komplain.html` (Form user)
- `https://YOUR-PROJECT-ID.web.app/admin.html` (Dashboard admin)

## Step 6: Test Aplikasi

### Test Form Komplain
1. Buka `/komplain.html`
2. Isi form dan upload gambar
3. Submit → Dapatkan nomor tiket

### Test Admin Dashboard
1. Buka `/admin.html`
2. Login dengan email/password yang dibuat di Step 3
3. Lihat daftar tiket
4. Klik "Lihat Bukti" untuk preview

## 🧪 Testing Lokal (Opsional)

Sebelum deploy, test dengan emulator:

```bash
# Jalankan emulator
npm run serve

# Atau:
firebase emulators:start

# Buka browser:
# - App: http://localhost:5000
# - Emulator UI: http://localhost:4000
```

## 🛠 Troubleshooting

### Error: "Not authorized"
```bash
firebase login
```

### Error: "Permission denied"
```bash
# Deploy ulang firestore rules
firebase deploy --only firestore,storage
```

### Error: Functions tidak jalan
```bash
# Lihat logs
npm run logs

# Re-deploy
npm run deploy:functions
```

### Error: "Module not found"
```bash
cd functions
rm -rf node_modules package-lock.json
npm install
cd ..
```

## 📊 Monitoring

```bash
# Lihat logs Functions
npm run logs

# Atau langsung:
firebase functions:log
```

## 🔄 Update Aplikasi

```bash
# Ubah kode → lalu deploy
npm run deploy

# Deploy spesifik:
npm run deploy:hosting   # Jika ubah frontend
npm run deploy:functions # Jika ubah backend
```

## 💡 Tips

1. **Testing:** Gunakan emulator untuk testing gratis
2. **Logs:** Cek logs jika ada error: `npm run logs`
3. **Cost:** Pantau usage di Firebase Console → Usage
4. **Backup:** Export Firestore data berkala (Console → Firestore → Import/Export)

## 🎉 Done!

Aplikasi sudah live dan siap digunakan!

**Next Steps:**
- [ ] Test submit komplain
- [ ] Test admin login
- [ ] Setup custom domain (opsional)
- [ ] Enable Analytics (opsional)
- [ ] Setup billing alerts

Baca dokumentasi lengkap di: [README_FIREBASE.md](README_FIREBASE.md)
