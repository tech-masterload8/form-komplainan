// =============================================
// File: public/assets/app-komplain.js
// Deskripsi: JavaScript untuk halaman form komplain
// =============================================

// =============================================
// IMPORT FIREBASE SDK (Modular v9+)
// =============================================
// Import Firebase modules dari CDN
import { initializeApp } from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js';
import {
    getAuth,
    signInAnonymously,
    onAuthStateChanged
} from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js';
import {
    getStorage,
    ref,
    uploadBytes,
    getDownloadURL
} from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-storage.js';

// =============================================
// KONFIGURASI & INISIALISASI
// =============================================

// Ambil konfigurasi Firebase dari file firebase-config.js
const firebaseConfig = window.firebaseConfig;

// Inisialisasi Firebase App
// CATATAN: Pastikan firebase-config.js sudah dimuat terlebih dahulu
const app = initializeApp(firebaseConfig);

// Inisialisasi Firebase Authentication
const auth = getAuth(app);

// Inisialisasi Firebase Storage
const storage = getStorage(app);

// Konfigurasi API endpoint
// PENTING: Ganti dengan URL API Anda yang sebenarnya
const API_BASE_URL = '/api'; // Sesuaikan dengan lokasi API Anda
const API_CREATE_TICKET = `${API_BASE_URL}/create_ticket.php`;

// =============================================
// DOM ELEMENTS
// =============================================
const formKomplain = document.getElementById('formKomplain');
const btnSubmit = document.getElementById('btnSubmit');
const alertError = document.getElementById('alertError');
const alertInfo = document.getElementById('alertInfo');
const successSection = document.getElementById('successSection');
const ticketNumberText = document.getElementById('ticketNumberText');
const btnCopy = document.getElementById('btnCopy');
const btnNewComplaint = document.getElementById('btnNewComplaint');

// Form inputs
const inputKodeUser = document.getElementById('kodeUser');
const inputNamaToko = document.getElementById('namaToko');
const inputTanggal = document.getElementById('tanggal');
const inputPengirim = document.getElementById('pengirim');
const inputNominal = document.getElementById('nominal');
const inputBank = document.getElementById('bank');
const inputRRN = document.getElementById('rrn');
const inputBuktiTransfer = document.getElementById('buktiTransfer');
const groupRRN = document.getElementById('groupRRN');

// =============================================
// STATE MANAGEMENT
// =============================================
let isAuthenticated = false;
let isSubmitting = false;

// =============================================
// FIREBASE AUTHENTICATION - ANONYMOUS SIGN IN
// =============================================
/**
 * Fungsi untuk melakukan anonymous sign in ke Firebase
 * Diperlukan agar user bisa upload file ke Firebase Storage
 */
async function initAnonymousAuth() {
    try {
        showInfo('Menginisialisasi aplikasi...');

        // Sign in secara anonymous
        const userCredential = await signInAnonymously(auth);

        console.log('Anonymous auth berhasil:', userCredential.user.uid);
        isAuthenticated = true;

        hideInfo();
        enableForm();
    } catch (error) {
        console.error('Error saat anonymous auth:', error);
        showError('Gagal menginisialisasi aplikasi. Silakan refresh halaman.');
        disableForm();
    }
}

// =============================================
// FIREBASE AUTH STATE LISTENER
// =============================================
/**
 * Monitor status autentikasi user
 * Pastikan user sudah signed in sebelum bisa menggunakan form
 */
onAuthStateChanged(auth, (user) => {
    if (user) {
        // User sudah signed in (anonymous)
        console.log('User authenticated:', user.uid);
        isAuthenticated = true;
        hideInfo();
        enableForm();
    } else {
        // User belum signed in
        console.log('User not authenticated, signing in...');
        isAuthenticated = false;
        initAnonymousAuth();
    }
});

// =============================================
// FORM VALIDATION
// =============================================
/**
 * Validasi semua input form sebelum submit
 */
function validateForm() {
    let isValid = true;

    // Reset semua error message
    clearAllErrors();

    // Validasi Kode User
    if (!inputKodeUser.value.trim()) {
        showFieldError('kodeUser', 'Kode user harus diisi');
        isValid = false;
    }

    // Validasi Nama Toko
    if (!inputNamaToko.value.trim()) {
        showFieldError('namaToko', 'Nama toko harus diisi');
        isValid = false;
    }

    // Validasi Tanggal
    if (!inputTanggal.value) {
        showFieldError('tanggal', 'Tanggal harus diisi');
        isValid = false;
    }

    // Validasi Pengirim
    if (!inputPengirim.value.trim()) {
        showFieldError('pengirim', 'Nama pengirim harus diisi');
        isValid = false;
    }

    // Validasi Nominal
    const nominal = parseFloat(inputNominal.value);
    if (!inputNominal.value || nominal <= 0) {
        showFieldError('nominal', 'Nominal harus lebih dari 0');
        isValid = false;
    }

    // Validasi Bank
    if (!inputBank.value) {
        showFieldError('bank', 'Pilih bank terlebih dahulu');
        isValid = false;
    }

    // Validasi RRN (hanya jika bank = QRIS)
    if (inputBank.value === 'QRIS' && !inputRRN.value.trim()) {
        showFieldError('rrn', 'RRN wajib diisi untuk transaksi QRIS');
        isValid = false;
    }

    // Validasi File Upload
    if (!inputBuktiTransfer.files || inputBuktiTransfer.files.length === 0) {
        showFieldError('buktiTransfer', 'Bukti transfer harus diupload');
        isValid = false;
    } else {
        const file = inputBuktiTransfer.files[0];

        // Validasi ukuran file (max 5 MB)
        const maxSize = 5 * 1024 * 1024; // 5 MB
        if (file.size > maxSize) {
            showFieldError('buktiTransfer', 'Ukuran file maksimal 5 MB');
            isValid = false;
        }

        // Validasi tipe file
        const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png'];
        if (!allowedTypes.includes(file.type)) {
            showFieldError('buktiTransfer', 'Format file harus JPG atau PNG');
            isValid = false;
        }
    }

    return isValid;
}

// =============================================
// UPLOAD FILE KE FIREBASE STORAGE
// =============================================
/**
 * Upload file bukti transfer ke Firebase Storage
 * @param {File} file - File yang akan diupload
 * @returns {Promise<string>} - URL download file yang sudah diupload
 */
async function uploadToFirebaseStorage(file) {
    try {
        // Buat nama file unik dengan timestamp dan random string
        const timestamp = Date.now();
        const randomStr = Math.random().toString(36).substring(2, 8);
        const fileExt = file.name.split('.').pop();
        const fileName = `${timestamp}-${randomStr}.${fileExt}`;

        // Buat reference ke lokasi storage
        // Path: bukti-transfer/{fileName}
        const storageRef = ref(storage, `bukti-transfer/${fileName}`);

        console.log('Uploading file to:', storageRef.fullPath);

        // Upload file
        const snapshot = await uploadBytes(storageRef, file);

        console.log('Upload success:', snapshot);

        // Dapatkan download URL
        const downloadURL = await getDownloadURL(snapshot.ref);

        console.log('Download URL:', downloadURL);

        return downloadURL;
    } catch (error) {
        console.error('Error uploading file:', error);
        throw new Error('Gagal mengupload bukti transfer: ' + error.message);
    }
}

// =============================================
// SUBMIT FORM KE BACKEND API
// =============================================
/**
 * Kirim data tiket komplain ke backend PHP
 * @param {Object} data - Data tiket yang akan dikirim
 */
async function submitTicketToBackend(data) {
    try {
        const response = await fetch(API_CREATE_TICKET, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(data)
        });

        // Parse response JSON
        const result = await response.json();

        if (!response.ok || !result.success) {
            throw new Error(result.message || 'Gagal mengirim komplain');
        }

        return result;
    } catch (error) {
        console.error('Error submitting ticket:', error);
        throw error;
    }
}

// =============================================
// FORM SUBMIT HANDLER
// =============================================
formKomplain.addEventListener('submit', async (e) => {
    e.preventDefault();

    // Cek apakah sedang dalam proses submit
    if (isSubmitting) {
        return;
    }

    // Cek apakah user sudah authenticated
    if (!isAuthenticated) {
        showError('Aplikasi belum siap. Silakan tunggu beberapa saat.');
        return;
    }

    // Validasi form
    if (!validateForm()) {
        showError('Mohon lengkapi semua field yang wajib diisi');
        return;
    }

    // Mulai proses submit
    isSubmitting = true;
    setSubmitButtonLoading(true);
    hideError();

    try {
        // 1. Upload file ke Firebase Storage
        showInfo('Mengupload bukti transfer...');
        const file = inputBuktiTransfer.files[0];
        const buktiUrl = await uploadToFirebaseStorage(file);

        // 2. Siapkan data untuk dikirim ke backend
        const ticketData = {
            kode_user: inputKodeUser.value.trim(),
            nama_toko: inputNamaToko.value.trim(),
            tanggal: inputTanggal.value,
            pengirim: inputPengirim.value.trim(),
            nominal: parseFloat(inputNominal.value),
            bank: inputBank.value,
            rrn: inputBank.value === 'QRIS' ? inputRRN.value.trim() : null,
            bukti_url: buktiUrl,
            user_agent: navigator.userAgent
        };

        // 3. Kirim data ke backend
        showInfo('Mengirim data komplain...');
        const result = await submitTicketToBackend(ticketData);

        // 4. Tampilkan hasil sukses
        hideInfo();
        showSuccessResult(result.ticket_number);

        // Reset form
        formKomplain.reset();
    } catch (error) {
        hideInfo();
        showError(error.message || 'Terjadi kesalahan. Silakan coba lagi.');
        console.error('Submit error:', error);
    } finally {
        isSubmitting = false;
        setSubmitButtonLoading(false);
    }
});

// =============================================
// BANK SELECT HANDLER (Show/Hide RRN)
// =============================================
inputBank.addEventListener('change', () => {
    if (inputBank.value === 'QRIS') {
        // Tampilkan field RRN jika bank = QRIS
        groupRRN.classList.remove('hidden');
        inputRRN.required = true;
    } else {
        // Sembunyikan field RRN jika bank bukan QRIS
        groupRRN.classList.add('hidden');
        inputRRN.required = false;
        inputRRN.value = '';
    }
});

// =============================================
// COPY TICKET NUMBER HANDLER
// =============================================
btnCopy.addEventListener('click', async () => {
    try {
        const text = ticketNumberText.value;

        // Gunakan Clipboard API jika tersedia
        if (navigator.clipboard && navigator.clipboard.writeText) {
            await navigator.clipboard.writeText(text);
        } else {
            // Fallback untuk browser lama
            ticketNumberText.select();
            document.execCommand('copy');
        }

        // Ubah teks tombol sementara
        const originalText = btnCopy.textContent;
        btnCopy.textContent = '✓ Tersalin!';
        btnCopy.classList.remove('btn-success');
        btnCopy.classList.add('btn-primary');

        setTimeout(() => {
            btnCopy.textContent = originalText;
            btnCopy.classList.remove('btn-primary');
            btnCopy.classList.add('btn-success');
        }, 2000);
    } catch (error) {
        console.error('Error copying text:', error);
        alert('Gagal menyalin teks. Silakan copy manual.');
    }
});

// =============================================
// NEW COMPLAINT BUTTON HANDLER
// =============================================
btnNewComplaint.addEventListener('click', () => {
    // Sembunyikan section success
    successSection.classList.remove('show');

    // Tampilkan kembali form
    formKomplain.classList.remove('hidden');

    // Scroll ke atas
    window.scrollTo({ top: 0, behavior: 'smooth' });
});

// =============================================
// UTILITY FUNCTIONS
// =============================================

/**
 * Tampilkan pesan error umum
 */
function showError(message) {
    alertError.textContent = message;
    alertError.classList.remove('hidden');
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

/**
 * Sembunyikan pesan error umum
 */
function hideError() {
    alertError.classList.add('hidden');
}

/**
 * Tampilkan pesan info
 */
function showInfo(message) {
    alertInfo.textContent = message;
    alertInfo.classList.remove('hidden');
}

/**
 * Sembunyikan pesan info
 */
function hideInfo() {
    alertInfo.classList.add('hidden');
}

/**
 * Tampilkan error pada field tertentu
 */
function showFieldError(fieldName, message) {
    const errorElement = document.getElementById(`error${fieldName.charAt(0).toUpperCase() + fieldName.slice(1)}`);
    const inputElement = document.getElementById(fieldName);

    if (errorElement && inputElement) {
        errorElement.textContent = message;
        errorElement.classList.add('show');
        inputElement.classList.add('error');
    }
}

/**
 * Hapus semua error message
 */
function clearAllErrors() {
    const errorElements = document.querySelectorAll('.error-message');
    const inputElements = document.querySelectorAll('.form-input, .form-select');

    errorElements.forEach(el => {
        el.classList.remove('show');
        el.textContent = '';
    });

    inputElements.forEach(el => {
        el.classList.remove('error');
    });
}

/**
 * Set tombol submit dalam mode loading
 */
function setSubmitButtonLoading(isLoading) {
    if (isLoading) {
        btnSubmit.disabled = true;
        btnSubmit.innerHTML = '<span class="spinner"></span> Mengirim...';
    } else {
        btnSubmit.disabled = false;
        btnSubmit.innerHTML = 'Kirim Komplain';
    }
}

/**
 * Enable form (setelah authenticated)
 */
function enableForm() {
    formKomplain.querySelectorAll('input, select, button').forEach(el => {
        el.disabled = false;
    });
}

/**
 * Disable form (sebelum authenticated)
 */
function disableForm() {
    formKomplain.querySelectorAll('input, select, button').forEach(el => {
        el.disabled = true;
    });
}

/**
 * Tampilkan hasil sukses dengan nomor tiket
 */
function showSuccessResult(ticketNumber) {
    // Buat teks untuk ditampilkan dan dicopy
    const resultText = `Komplain berhasil dikirim dengan nomor tiket #${ticketNumber}\n\nSilakan kirim nomor tiket ini ke CS WhatsApp kami.`;

    // Set teks ke textarea
    ticketNumberText.value = resultText;

    // Sembunyikan form
    formKomplain.classList.add('hidden');

    // Tampilkan section success
    successSection.classList.add('show');

    // Scroll ke section success
    successSection.scrollIntoView({ behavior: 'smooth' });
}

// =============================================
// INITIALIZATION
// =============================================
// Set tanggal hari ini sebagai default
inputTanggal.value = new Date().toISOString().split('T')[0];

// Disable form sampai authenticated
disableForm();

console.log('App Komplain initialized');
