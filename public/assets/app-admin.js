// =============================================
// File: public/assets/app-admin.js
// Deskripsi: JavaScript untuk halaman admin dashboard
// =============================================

// =============================================
// IMPORT FIREBASE SDK (Modular v9+)
// =============================================
import { initializeApp } from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js';
import {
    getAuth,
    signInWithEmailAndPassword,
    signOut,
    onAuthStateChanged
} from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js';

// =============================================
// KONFIGURASI & INISIALISASI
// =============================================

// Ambil konfigurasi Firebase dari file firebase-config.js
const firebaseConfig = window.firebaseConfig;

// Inisialisasi Firebase App
const app = initializeApp(firebaseConfig);

// Inisialisasi Firebase Authentication
const auth = getAuth(app);

// Konfigurasi API endpoint
// Gunakan Firebase Hosting rewrites (path relatif)
const API_LIST_TICKETS = '/api/listTickets';

// ALTERNATIF: Jika ingin pakai direct Functions URL (region: asia-southeast1)
// const API_LIST_TICKETS = 'https://asia-southeast1-form-komplain-masterload8.cloudfunctions.net/listTickets';

// ALTERNATIF: Jika testing dengan Firebase Emulator
// const API_LIST_TICKETS = 'http://localhost:5001/form-komplain-masterload8/asia-southeast1/listTickets';

// =============================================
// DOM ELEMENTS
// =============================================

// Login Section
const loginSection = document.getElementById('loginSection');
const formLogin = document.getElementById('formLogin');
const inputLoginEmail = document.getElementById('loginEmail');
const inputLoginPassword = document.getElementById('loginPassword');
const btnLogin = document.getElementById('btnLogin');
const loginError = document.getElementById('loginError');

// Dashboard Section
const dashboardSection = document.getElementById('dashboardSection');
const btnLogout = document.getElementById('btnLogout');
const btnRefresh = document.getElementById('btnRefresh');
const dashboardError = document.getElementById('dashboardError');
const dashboardInfo = document.getElementById('dashboardInfo');
const tableBody = document.getElementById('tableBody');

// Pagination
const btnPrevPage = document.getElementById('btnPrevPage');
const btnNextPage = document.getElementById('btnNextPage');
const paginationInfo = document.getElementById('paginationInfo');

// Modal
const modalImage = document.getElementById('modalImage');
const modalImagePreview = document.getElementById('modalImagePreview');
const btnCloseModal = document.getElementById('btnCloseModal');

// =============================================
// STATE MANAGEMENT
// =============================================
let currentUser = null;
let currentIdToken = null;
let currentPage = 1;
let totalPages = 1;
let perPage = 10;
let totalTickets = 0;
let isLoadingTickets = false;

// =============================================
// FIREBASE AUTH STATE LISTENER
// =============================================
/**
 * Monitor status autentikasi admin
 * Jika sudah login, tampilkan dashboard
 * Jika belum login, tampilkan form login
 */
onAuthStateChanged(auth, async (user) => {
    if (user) {
        // Admin sudah login
        console.log('Admin logged in:', user.email);
        currentUser = user;

        // Dapatkan ID token untuk autentikasi ke backend
        try {
            currentIdToken = await user.getIdToken();
            console.log('ID Token obtained');

            // Tampilkan dashboard
            showDashboard();

            // Load data tiket
            loadTickets();
        } catch (error) {
            console.error('Error getting ID token:', error);
            showLoginError('Gagal mendapatkan token autentikasi');
        }
    } else {
        // Admin belum login
        console.log('Admin not logged in');
        currentUser = null;
        currentIdToken = null;
        showLogin();
    }
});

// =============================================
// LOGIN HANDLER
// =============================================
formLogin.addEventListener('submit', async (e) => {
    e.preventDefault();

    const email = inputLoginEmail.value.trim();
    const password = inputLoginPassword.value;

    if (!email || !password) {
        showLoginError('Email dan password harus diisi');
        return;
    }

    // Set loading state
    setLoginButtonLoading(true);
    hideLoginError();

    try {
        // Sign in dengan email dan password
        const userCredential = await signInWithEmailAndPassword(auth, email, password);

        console.log('Login success:', userCredential.user.email);

        // Reset form
        formLogin.reset();

        // onAuthStateChanged akan otomatis dipanggil dan menampilkan dashboard
    } catch (error) {
        console.error('Login error:', error);

        let errorMessage = 'Gagal login. Silakan coba lagi.';

        // Customize error message berdasarkan error code
        switch (error.code) {
            case 'auth/invalid-email':
                errorMessage = 'Format email tidak valid';
                break;
            case 'auth/user-disabled':
                errorMessage = 'Akun ini telah dinonaktifkan';
                break;
            case 'auth/user-not-found':
                errorMessage = 'Email tidak terdaftar';
                break;
            case 'auth/wrong-password':
                errorMessage = 'Password salah';
                break;
            case 'auth/invalid-credential':
                errorMessage = 'Email atau password salah';
                break;
            case 'auth/too-many-requests':
                errorMessage = 'Terlalu banyak percobaan login. Coba lagi nanti.';
                break;
        }

        showLoginError(errorMessage);
    } finally {
        setLoginButtonLoading(false);
    }
});

// =============================================
// LOGOUT HANDLER
// =============================================
btnLogout.addEventListener('click', async () => {
    try {
        await signOut(auth);
        console.log('Logout success');

        // Reset state
        currentUser = null;
        currentIdToken = null;
        currentPage = 1;

        // onAuthStateChanged akan otomatis dipanggil dan menampilkan form login
    } catch (error) {
        console.error('Logout error:', error);
        showDashboardError('Gagal logout. Silakan coba lagi.');
    }
});

// =============================================
// LOAD TICKETS FROM BACKEND
// =============================================
/**
 * Mengambil data tiket dari backend API
 * Memerlukan Firebase ID token untuk autentikasi
 */
async function loadTickets() {
    if (isLoadingTickets) return;

    if (!currentIdToken) {
        showDashboardError('Token autentikasi tidak tersedia');
        return;
    }

    isLoadingTickets = true;
    showDashboardInfo('Memuat data tiket...');
    hideDashboardError();

    try {
        // Buat URL dengan query parameters
        const url = `${API_LIST_TICKETS}?page=${currentPage}&per_page=${perPage}`;

        // Panggil API dengan Authorization header
        const response = await fetch(url, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${currentIdToken}`,
                'Content-Type': 'application/json'
            }
        });

        // Parse response
        const result = await response.json();

        if (!response.ok) {
            throw new Error(result.message || 'Gagal memuat data tiket');
        }

        if (!result.success) {
            throw new Error(result.message || 'Gagal memuat data tiket');
        }

        // Update state pagination
        if (result.pagination) {
            currentPage = result.pagination.page;
            totalPages = result.pagination.total_pages;
            totalTickets = result.pagination.total;
        }

        // Render data ke tabel
        renderTicketsTable(result.data || []);

        // Update pagination UI
        updatePaginationUI();

        hideDashboardInfo();
    } catch (error) {
        console.error('Error loading tickets:', error);
        showDashboardError(error.message || 'Terjadi kesalahan saat memuat data');

        // Jika error 401, mungkin token expired
        if (error.message.includes('401') || error.message.includes('tidak valid')) {
            // Refresh token
            try {
                currentIdToken = await currentUser.getIdToken(true);
                // Retry load tickets
                setTimeout(() => loadTickets(), 1000);
            } catch (tokenError) {
                console.error('Error refreshing token:', tokenError);
                showDashboardError('Sesi Anda telah berakhir. Silakan login kembali.');
            }
        }
    } finally {
        isLoadingTickets = false;
        hideDashboardInfo();
    }
}

// =============================================
// RENDER TICKETS TABLE
// =============================================
/**
 * Render data tiket ke dalam tabel
 */
function renderTicketsTable(tickets) {
    tableBody.innerHTML = '';

    if (!tickets || tickets.length === 0) {
        tableBody.innerHTML = `
            <tr>
                <td colspan="9" class="table-empty">
                    Tidak ada data tiket
                </td>
            </tr>
        `;
        return;
    }

    tickets.forEach(ticket => {
        const row = document.createElement('tr');

        // Format nominal sebagai rupiah
        const nominalFormatted = formatRupiah(ticket.nominal);

        // Format tanggal
        const tanggalFormatted = formatTanggal(ticket.tanggal);

        row.innerHTML = `
            <td><strong>${ticket.ticket_number}</strong></td>
            <td>${tanggalFormatted}</td>
            <td>${escapeHtml(ticket.kode_user)}</td>
            <td>${escapeHtml(ticket.nama_toko)}</td>
            <td>${escapeHtml(ticket.pengirim)}</td>
            <td>${nominalFormatted}</td>
            <td><span class="badge badge-primary">${escapeHtml(ticket.bank)}</span></td>
            <td>${ticket.rrn ? escapeHtml(ticket.rrn) : '-'}</td>
            <td>
                <button
                    type="button"
                    class="btn btn-secondary btn-sm"
                    onclick="window.showBuktiImage('${escapeHtml(ticket.bukti_url)}')"
                >
                    Lihat Bukti
                </button>
            </td>
        `;

        tableBody.appendChild(row);
    });
}

// =============================================
// PAGINATION HANDLERS
// =============================================
btnPrevPage.addEventListener('click', () => {
    if (currentPage > 1) {
        currentPage--;
        loadTickets();
    }
});

btnNextPage.addEventListener('click', () => {
    if (currentPage < totalPages) {
        currentPage++;
        loadTickets();
    }
});

btnRefresh.addEventListener('click', () => {
    loadTickets();
});

/**
 * Update UI pagination (enable/disable tombol, info halaman)
 */
function updatePaginationUI() {
    // Update info halaman
    paginationInfo.textContent = `Halaman ${currentPage} dari ${totalPages} (Total: ${totalTickets} tiket)`;

    // Enable/disable tombol prev
    btnPrevPage.disabled = currentPage <= 1;

    // Enable/disable tombol next
    btnNextPage.disabled = currentPage >= totalPages;
}

// =============================================
// MODAL IMAGE HANDLERS
// =============================================
/**
 * Tampilkan modal dengan preview gambar bukti transfer
 * Fungsi ini dipanggil dari onclick di HTML (window.showBuktiImage)
 */
window.showBuktiImage = function(imageUrl) {
    modalImagePreview.src = imageUrl;
    modalImage.classList.add('show');
};

/**
 * Tutup modal
 */
function closeModal() {
    modalImage.classList.remove('show');
    modalImagePreview.src = '';
}

btnCloseModal.addEventListener('click', closeModal);

// Tutup modal jika klik di luar gambar
modalImage.addEventListener('click', (e) => {
    if (e.target === modalImage) {
        closeModal();
    }
});

// Tutup modal dengan tombol ESC
document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && modalImage.classList.contains('show')) {
        closeModal();
    }
});

// =============================================
// UI HELPER FUNCTIONS
// =============================================

/**
 * Tampilkan section login
 */
function showLogin() {
    loginSection.classList.remove('hidden');
    dashboardSection.classList.remove('show');
}

/**
 * Tampilkan section dashboard
 */
function showDashboard() {
    loginSection.classList.add('hidden');
    dashboardSection.classList.add('show');
}

/**
 * Tampilkan error di login form
 */
function showLoginError(message) {
    loginError.textContent = message;
    loginError.classList.remove('hidden');
}

/**
 * Sembunyikan error di login form
 */
function hideLoginError() {
    loginError.classList.add('hidden');
}

/**
 * Set tombol login dalam mode loading
 */
function setLoginButtonLoading(isLoading) {
    if (isLoading) {
        btnLogin.disabled = true;
        btnLogin.innerHTML = '<span class="spinner"></span> Memproses...';
    } else {
        btnLogin.disabled = false;
        btnLogin.innerHTML = 'Login';
    }
}

/**
 * Tampilkan error di dashboard
 */
function showDashboardError(message) {
    dashboardError.textContent = message;
    dashboardError.classList.remove('hidden');
}

/**
 * Sembunyikan error di dashboard
 */
function hideDashboardError() {
    dashboardError.classList.add('hidden');
}

/**
 * Tampilkan info di dashboard
 */
function showDashboardInfo(message) {
    dashboardInfo.textContent = message;
    dashboardInfo.classList.remove('hidden');
}

/**
 * Sembunyikan info di dashboard
 */
function hideDashboardInfo() {
    dashboardInfo.classList.add('hidden');
}

// =============================================
// UTILITY FUNCTIONS
// =============================================

/**
 * Format angka menjadi format rupiah
 */
function formatRupiah(angka) {
    const number = parseFloat(angka);
    if (isNaN(number)) return 'Rp 0';

    return 'Rp ' + number.toLocaleString('id-ID', {
        minimumFractionDigits: 0,
        maximumFractionDigits: 2
    });
}

/**
 * Format tanggal ke format Indonesia (dd/mm/yyyy)
 */
function formatTanggal(tanggal) {
    if (!tanggal) return '-';

    try {
        const date = new Date(tanggal);
        const day = String(date.getDate()).padStart(2, '0');
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const year = date.getFullYear();

        return `${day}/${month}/${year}`;
    } catch (error) {
        return tanggal;
    }
}

/**
 * Escape HTML untuk mencegah XSS
 */
function escapeHtml(text) {
    if (!text) return '';

    const map = {
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#039;'
    };

    return String(text).replace(/[&<>"']/g, (m) => map[m]);
}

// =============================================
// INITIALIZATION
// =============================================
console.log('App Admin initialized');
