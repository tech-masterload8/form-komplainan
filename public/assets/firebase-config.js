// =============================================
// File: public/assets/firebase-config.js
// Deskripsi: Konfigurasi Firebase untuk aplikasi
// =============================================

// INSTRUKSI PENTING:
// 1. Ganti nilai-nilai di bawah dengan konfigurasi Firebase Anda yang sebenarnya
// 2. Dapatkan config ini dari Firebase Console > Project Settings > Your apps > SDK setup and configuration
// 3. Pastikan Firebase Authentication dan Storage sudah diaktifkan di Firebase Console
// 4. Atur Firebase Storage Rules untuk mengizinkan anonymous user upload:
//    rules_version = '2';
//    service firebase.storage {
//      match /b/{bucket}/o {
//        match /bukti-transfer/{allPaths=**} {
//          allow read: if true;
//          allow write: if request.auth != null && request.resource.size < 5 * 1024 * 1024;
//        }
//      }
//    }

const firebaseConfig = {
  apiKey: "AIzaSy...GANTI_DENGAN_API_KEY_ANDA",
  authDomain: "your-project.firebaseapp.com",
  projectId: "your-project-id",
  storageBucket: "your-project.appspot.com",
  messagingSenderId: "1234567890",
  appId: "1:1234567890:web:abcdef1234567890"
};

// Export config untuk digunakan di file lain
window.firebaseConfig = firebaseConfig;
