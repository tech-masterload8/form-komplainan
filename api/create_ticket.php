<?php
// =============================================
// File: api/create_ticket.php
// Deskripsi: Endpoint untuk membuat tiket komplain baru
// =============================================

require_once 'config.php';

// =============================================
// VALIDASI METHOD REQUEST
// =============================================
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    sendJsonResponse(false, 'Method tidak diizinkan', null, 405);
}

// =============================================
// AMBIL DATA INPUT
// =============================================
// Baca raw input JSON
$rawInput = file_get_contents('php://input');
$input = json_decode($rawInput, true);

// Cek apakah JSON valid
if (json_last_error() !== JSON_ERROR_NONE) {
    sendJsonResponse(false, 'Format JSON tidak valid', null, 400);
}

// =============================================
// AMBIL DAN BERSIHKAN DATA INPUT
// =============================================
$kodeUser = isset($input['kode_user']) ? cleanInput($input['kode_user']) : null;
$namaToko = isset($input['nama_toko']) ? cleanInput($input['nama_toko']) : null;
$tanggal = isset($input['tanggal']) ? cleanInput($input['tanggal']) : null;
$pengirim = isset($input['pengirim']) ? cleanInput($input['pengirim']) : null;
$nominal = isset($input['nominal']) ? floatval($input['nominal']) : 0;
$bank = isset($input['bank']) ? cleanInput($input['bank']) : null;
$rrn = isset($input['rrn']) ? cleanInput($input['rrn']) : null;
$buktiUrl = isset($input['bukti_url']) ? cleanInput($input['bukti_url']) : null;

// =============================================
// VALIDASI INPUT
// =============================================
$errors = [];

if (empty($kodeUser)) {
    $errors[] = 'Kode user harus diisi';
}

if (empty($namaToko)) {
    $errors[] = 'Nama toko harus diisi';
}

if (empty($tanggal)) {
    $errors[] = 'Tanggal harus diisi';
} else {
    // Validasi format tanggal
    $dateObj = DateTime::createFromFormat('Y-m-d', $tanggal);
    if (!$dateObj || $dateObj->format('Y-m-d') !== $tanggal) {
        $errors[] = 'Format tanggal tidak valid (harus YYYY-MM-DD)';
    }
}

if (empty($pengirim)) {
    $errors[] = 'Nama pengirim harus diisi';
}

if ($nominal <= 0) {
    $errors[] = 'Nominal harus lebih dari 0';
}

if (empty($bank)) {
    $errors[] = 'Bank harus dipilih';
}

// Validasi RRN khusus untuk QRIS
if ($bank === 'QRIS' && empty($rrn)) {
    $errors[] = 'RRN wajib diisi untuk transaksi QRIS';
}

if (empty($buktiUrl)) {
    $errors[] = 'Bukti transfer harus diupload';
}

// Jika ada error validasi, kirim response error
if (!empty($errors)) {
    sendJsonResponse(false, 'Data tidak valid: ' . implode(', ', $errors), null, 400);
}

// =============================================
// ANTI-SPAM: CEK RATE LIMIT PER IP
// =============================================
$clientIP = getClientIP();

// Koneksi ke database
$conn = getDBConnection();

// Cek apakah IP ini baru saja mengirim tiket
$stmt = $conn->prepare("
    SELECT last_submit_at
    FROM ip_rate_limit
    WHERE ip_address = ?
");
$stmt->bind_param("s", $clientIP);
$stmt->execute();
$result = $stmt->get_result();

if ($result->num_rows > 0) {
    $row = $result->fetch_assoc();
    $lastSubmitAt = strtotime($row['last_submit_at']);
    $currentTime = time();
    $timeDiff = ($currentTime - $lastSubmitAt) / 60; // dalam menit

    // Jika selisih waktu kurang dari RATE_LIMIT_MINUTES_PER_IP
    if ($timeDiff < RATE_LIMIT_MINUTES_PER_IP) {
        $waitTime = ceil(RATE_LIMIT_MINUTES_PER_IP - $timeDiff);
        $stmt->close();
        $conn->close();

        sendJsonResponse(
            false,
            "Terlalu sering mengirim komplain. Silakan tunggu {$waitTime} menit lagi.",
            null,
            429
        );
    }
}
$stmt->close();

// =============================================
// GENERATE NOMOR TIKET UNIK
// =============================================
$ticketNumber = generateTicketNumber($conn);

// =============================================
// INSERT DATA TIKET KE DATABASE
// =============================================
try {
    // Mulai transaction
    $conn->begin_transaction();

    // Insert tiket baru
    $stmt = $conn->prepare("
        INSERT INTO tickets (
            ticket_number,
            kode_user,
            nama_toko,
            tanggal,
            pengirim,
            nominal,
            bank,
            rrn,
            bukti_url,
            ip_address
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    ");

    $stmt->bind_param(
        "sssssdssss",
        $ticketNumber,
        $kodeUser,
        $namaToko,
        $tanggal,
        $pengirim,
        $nominal,
        $bank,
        $rrn,
        $buktiUrl,
        $clientIP
    );

    if (!$stmt->execute()) {
        throw new Exception("Gagal menyimpan tiket: " . $stmt->error);
    }

    $stmt->close();

    // Update atau insert rate limit untuk IP ini
    $currentDateTime = date('Y-m-d H:i:s');
    $stmt = $conn->prepare("
        INSERT INTO ip_rate_limit (ip_address, last_submit_at, submit_count)
        VALUES (?, ?, 1)
        ON DUPLICATE KEY UPDATE
            last_submit_at = VALUES(last_submit_at),
            submit_count = submit_count + 1
    ");

    $stmt->bind_param("ss", $clientIP, $currentDateTime);
    $stmt->execute();
    $stmt->close();

    // Commit transaction
    $conn->commit();

    // Tutup koneksi
    $conn->close();

    // =============================================
    // RESPONSE SUKSES
    // =============================================
    sendJsonResponse(
        true,
        'Komplain berhasil dikirim',
        [
            'ticket_number' => $ticketNumber
        ],
        201
    );

} catch (Exception $e) {
    // Rollback transaction jika ada error
    $conn->rollback();
    $conn->close();

    // Log error (opsional)
    error_log("Error creating ticket: " . $e->getMessage());

    sendJsonResponse(false, 'Terjadi kesalahan saat menyimpan data', null, 500);
}
