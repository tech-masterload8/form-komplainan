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
const API_UPDATE_TICKET_STATUS = '/api/updateTicketStatus';

// ALTERNATIF: Jika ingin pakai direct Functions URL (region: asia-southeast1)
// const API_LIST_TICKETS = 'https://asia-southeast1-form-komplain-masterload8.cloudfunctions.net/listTickets';
// const API_UPDATE_TICKET_STATUS = 'https://asia-southeast1-form-komplain-masterload8.cloudfunctions.net/updateTicketStatus';

// ALTERNATIF: Jika testing dengan Firebase Emulator
// const API_LIST_TICKETS = 'http://localhost:5001/form-komplain-masterload8/asia-southeast1/listTickets';
// const API_UPDATE_TICKET_STATUS = 'http://localhost:5001/form-komplain-masterload8/asia-southeast1/updateTicketStatus';

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

// Modal Image
const modalImage = document.getElementById('modalImage');
const modalImagePreview = document.getElementById('modalImagePreview');
const btnCloseModal = document.getElementById('btnCloseModal');

// Filter & Search
const filterStatus = document.getElementById('filterStatus');
const searchType = document.getElementById('searchType');
const searchInput = document.getElementById('searchInput');
const btnSearch = document.getElementById('btnSearch');
const btnResetSearch = document.getElementById('btnResetSearch');

// Modal Petugas
const modalPetugas = document.getElementById('modalPetugas');
const formPetugas = document.getElementById('formPetugas');
const petugasName = document.getElementById('petugasName');
const ticketIdHidden = document.getElementById('ticketIdHidden');
const btnClosePetugasModal = document.getElementById('btnClosePetugasModal');
const btnCancelPetugas = document.getElementById('btnCancelPetugas');

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

// Filter & Search State
let currentStatusFilter = '';
let currentSearchType = 'ticket';
let currentSearchQuery = '';

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
        let url = `${API_LIST_TICKETS}?page=${currentPage}&perPage=${perPage}`;

        // Tambahkan filter status jika ada
        if (currentStatusFilter) {
            url += `&status=${encodeURIComponent(currentStatusFilter)}`;
        }

        // Tambahkan search parameters jika ada
        if (currentSearchQuery) {
            url += `&searchType=${encodeURIComponent(currentSearchType)}`;
            url += `&search=${encodeURIComponent(currentSearchQuery)}`;
        }

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
                <td colspan="12" class="table-empty">
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

        // Status badge
        const status = ticket.status || 'Open';
        const statusBadgeClass = `badge badge-status-${status.toLowerCase()}`;
        const statusBadge = `<span class="${statusBadgeClass}">${status}</span>`;

        // Petugas name
        const petugasText = ticket.petugas_name ? escapeHtml(ticket.petugas_name) : '-';

        // Action buttons based on status
        let actionButtons = '';
        if (status === 'Open') {
            actionButtons = `
                <button
                    type="button"
                    class="btn btn-proses"
                    onclick="window.showPetugasModal('${ticket.id}')"
                >
                    Proses
                </button>
            `;
        } else if (status === 'Proses') {
            actionButtons = `
                <div class="action-buttons">
                    <button
                        type="button"
                        class="btn btn-done"
                        onclick="window.updateStatus('${ticket.id}', 'Done')"
                    >
                        Done
                    </button>
                    <button
                        type="button"
                        class="btn btn-batal"
                        onclick="window.updateStatus('${ticket.id}', 'Batal')"
                    >
                        Batal
                    </button>
                </div>
            `;
        } else {
            actionButtons = '<span class="text-muted">-</span>';
        }

        row.innerHTML = `
            <td><strong>${ticket.ticket_number}</strong></td>
            <td>${tanggalFormatted}</td>
            <td>${escapeHtml(ticket.kode_user)}</td>
            <td>${escapeHtml(ticket.nama_toko)}</td>
            <td>${escapeHtml(ticket.pengirim)}</td>
            <td>${nominalFormatted}</td>
            <td><span class="badge badge-primary">${escapeHtml(ticket.bank)}</span></td>
            <td>${ticket.rrn ? escapeHtml(ticket.rrn) : '-'}</td>
            <td>${statusBadge}</td>
            <td>${petugasText}</td>
            <td>
                <button
                    type="button"
                    class="btn btn-secondary btn-sm"
                    onclick="window.showBuktiImage('${escapeHtml(ticket.bukti_url)}')"
                >
                    Lihat Bukti
                </button>
            </td>
            <td>${actionButtons}</td>
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
    if (e.key === 'Escape') {
        if (modalImage.classList.contains('show')) {
            closeModal();
        }
        if (modalPetugas.classList.contains('show')) {
            closePetugasModal();
        }
    }
});

// =============================================
// FILTER & SEARCH HANDLERS
// =============================================

/**
 * Handle filter status change
 */
filterStatus.addEventListener('change', () => {
    currentStatusFilter = filterStatus.value;
    currentPage = 1; // Reset ke halaman pertama
    loadTickets();
});

/**
 * Handle search button click
 */
btnSearch.addEventListener('click', () => {
    currentSearchType = searchType.value;
    currentSearchQuery = searchInput.value.trim();
    currentPage = 1; // Reset ke halaman pertama
    loadTickets();
});

/**
 * Handle enter key di search input
 */
searchInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
        btnSearch.click();
    }
});

/**
 * Handle reset search button
 */
btnResetSearch.addEventListener('click', () => {
    filterStatus.value = '';
    searchType.value = 'ticket';
    searchInput.value = '';
    currentStatusFilter = '';
    currentSearchType = 'ticket';
    currentSearchQuery = '';
    currentPage = 1;
    loadTickets();
});

// =============================================
// PETUGAS MODAL HANDLERS
// =============================================

/**
 * Show modal untuk input nama petugas
 * Dipanggil dari onclick button "Proses"
 */
window.showPetugasModal = function(ticketId) {
    ticketIdHidden.value = ticketId;
    petugasName.value = '';
    modalPetugas.classList.add('show');
    petugasName.focus();
};

/**
 * Close modal petugas
 */
function closePetugasModal() {
    modalPetugas.classList.remove('show');
    ticketIdHidden.value = '';
    petugasName.value = '';
}

btnClosePetugasModal.addEventListener('click', closePetugasModal);
btnCancelPetugas.addEventListener('click', closePetugasModal);

// Tutup modal jika klik di luar dialog
modalPetugas.addEventListener('click', (e) => {
    if (e.target === modalPetugas) {
        closePetugasModal();
    }
});

/**
 * Handle submit form petugas (Proses tiket)
 */
formPetugas.addEventListener('submit', async (e) => {
    e.preventDefault();

    const ticketId = ticketIdHidden.value;
    const name = petugasName.value.trim();

    if (!ticketId || !name) {
        showDashboardError('Data tidak lengkap');
        return;
    }

    // Update status to "Proses" with petugas name
    await updateTicketStatus(ticketId, 'Proses', name);

    closePetugasModal();
});

// =============================================
// UPDATE TICKET STATUS
// =============================================

/**
 * Update status tiket (Done atau Batal)
 * Dipanggil dari onclick button "Done" atau "Batal"
 */
window.updateStatus = async function(ticketId, newStatus) {
    await updateTicketStatus(ticketId, newStatus, null);
};

/**
 * Fungsi umum untuk update status tiket
 */
async function updateTicketStatus(ticketId, newStatus, petugasNameValue) {
    if (!currentIdToken) {
        showDashboardError('Token autentikasi tidak tersedia');
        return;
    }

    showDashboardInfo(`Mengubah status tiket menjadi ${newStatus}...`);
    hideDashboardError();

    try {
        const payload = {
            ticket_id: ticketId,
            status: newStatus
        };

        // Tambahkan nama petugas jika ada (untuk status Proses)
        if (petugasNameValue) {
            payload.petugas_name = petugasNameValue;
        }

        const response = await fetch(API_UPDATE_TICKET_STATUS, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${currentIdToken}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(payload)
        });

        const result = await response.json();

        if (!response.ok) {
            throw new Error(result.message || 'Gagal mengubah status tiket');
        }

        if (!result.success) {
            throw new Error(result.message || 'Gagal mengubah status tiket');
        }

        // Reload tiket untuk menampilkan perubahan
        showDashboardInfo(result.message || 'Status tiket berhasil diubah');
        setTimeout(() => {
            loadTickets();
        }, 500);

    } catch (error) {
        console.error('Error updating ticket status:', error);
        showDashboardError(error.message || 'Terjadi kesalahan saat mengubah status');
    }
}

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
