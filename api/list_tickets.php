<?php
// =============================================
// File: api/list_tickets.php
// Deskripsi: Endpoint untuk mengambil daftar tiket (ADMIN ONLY)
// =============================================

require_once 'config.php';

// =============================================
// VALIDASI METHOD REQUEST
// =============================================
if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
    sendJsonResponse(false, 'Method tidak diizinkan', null, 405);
}

// =============================================
// AUTENTIKASI ADMIN: VERIFIKASI FIREBASE ID TOKEN
// =============================================
// Ambil Bearer token dari header Authorization
$idToken = getBearerToken();

if (empty($idToken)) {
    sendJsonResponse(false, 'Token autentikasi tidak ditemukan', null, 401);
}

// Verifikasi Firebase ID Token
$verificationResult = verifyFirebaseIdToken($idToken);

if (!$verificationResult['success']) {
    $errorMessage = isset($verificationResult['error'])
        ? $verificationResult['error']
        : 'Token tidak valid';

    sendJsonResponse(false, $errorMessage, null, 401);
}

// Token valid, admin terautentikasi
$adminUid = $verificationResult['uid'];
$adminEmail = isset($verificationResult['email']) ? $verificationResult['email'] : null;

// Log admin access (opsional)
// error_log("Admin access: UID={$adminUid}, Email={$adminEmail}");

// =============================================
// AMBIL PARAMETER PAGINATION
// =============================================
$page = isset($_GET['page']) ? intval($_GET['page']) : 1;
$perPage = isset($_GET['per_page']) ? intval($_GET['per_page']) : 10;

// Validasi pagination parameters
if ($page < 1) {
    $page = 1;
}

if ($perPage < 1 || $perPage > 100) {
    $perPage = 10;
}

// Hitung offset untuk query
$offset = ($page - 1) * $perPage;

// =============================================
// KONEKSI DATABASE
// =============================================
$conn = getDBConnection();

// =============================================
// HITUNG TOTAL TIKET
// =============================================
try {
    $stmt = $conn->prepare("SELECT COUNT(*) as total FROM tickets");
    $stmt->execute();
    $result = $stmt->get_result();
    $row = $result->fetch_assoc();
    $totalTickets = intval($row['total']);
    $stmt->close();

    // Hitung total halaman
    $totalPages = $totalTickets > 0 ? ceil($totalTickets / $perPage) : 1;

    // Jika page melebihi total pages, set ke page terakhir
    if ($page > $totalPages && $totalPages > 0) {
        $page = $totalPages;
        $offset = ($page - 1) * $perPage;
    }

} catch (Exception $e) {
    $conn->close();
    error_log("Error counting tickets: " . $e->getMessage());
    sendJsonResponse(false, 'Terjadi kesalahan saat mengambil data', null, 500);
}

// =============================================
// AMBIL DATA TIKET DENGAN PAGINATION
// =============================================
try {
    $stmt = $conn->prepare("
        SELECT
            id,
            ticket_number,
            kode_user,
            nama_toko,
            tanggal,
            pengirim,
            nominal,
            bank,
            rrn,
            bukti_url,
            ip_address,
            created_at
        FROM tickets
        ORDER BY created_at DESC
        LIMIT ? OFFSET ?
    ");

    $stmt->bind_param("ii", $perPage, $offset);
    $stmt->execute();
    $result = $stmt->get_result();

    $tickets = [];

    while ($row = $result->fetch_assoc()) {
        // Format data sebelum dikirim ke client
        $tickets[] = [
            'id' => intval($row['id']),
            'ticket_number' => $row['ticket_number'],
            'kode_user' => $row['kode_user'],
            'nama_toko' => $row['nama_toko'],
            'tanggal' => $row['tanggal'],
            'pengirim' => $row['pengirim'],
            'nominal' => floatval($row['nominal']),
            'bank' => $row['bank'],
            'rrn' => $row['rrn'],
            'bukti_url' => $row['bukti_url'],
            'ip_address' => $row['ip_address'], // Opsional, bisa dihapus jika tidak perlu
            'created_at' => $row['created_at']
        ];
    }

    $stmt->close();
    $conn->close();

    // =============================================
    // RESPONSE SUKSES
    // =============================================
    sendJsonResponse(
        true,
        'Data berhasil diambil',
        [
            'data' => $tickets,
            'pagination' => [
                'page' => $page,
                'per_page' => $perPage,
                'total' => $totalTickets,
                'total_pages' => $totalPages
            ]
        ],
        200
    );

} catch (Exception $e) {
    $conn->close();
    error_log("Error fetching tickets: " . $e->getMessage());
    sendJsonResponse(false, 'Terjadi kesalahan saat mengambil data', null, 500);
}
