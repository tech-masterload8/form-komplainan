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
  apiKey: "AIzaSyAuDU61lSnZQCVcw7G43yD2IYVwdlAOl1o",
  authDomain: "form-komplain-masterload8.firebaseapp.com",
  projectId: "form-komplain-masterload8",
  storageBucket: "form-komplain-masterload8.firebasestorage.app",
  messagingSenderId: "54455997906",
  appId: "1:54455997906:web:93751835984cb728c3240b",
  measurementId: "G-98ZRS0088B"
};

// Export config untuk digunakan di file lain
window.firebaseConfig = firebaseConfig;
