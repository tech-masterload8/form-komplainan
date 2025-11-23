<?php
// =============================================
// File: api/config.php
// Deskripsi: Konfigurasi database dan fungsi helper untuk backend
// =============================================

// Izinkan CORS untuk development (sesuaikan untuk production)
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');
header('Content-Type: application/json; charset=utf-8');

// Handle preflight request
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

// =============================================
// KONFIGURASI DATABASE
// =============================================
// PENTING: Ganti nilai-nilai di bawah sesuai dengan server MySQL Anda
define('DB_HOST', 'localhost');
define('DB_USER', 'root');           // Ganti dengan user database Anda
define('DB_PASS', '');               // Ganti dengan password database Anda
define('DB_NAME', 'komplain_db');    // Nama database yang sudah dibuat

// =============================================
// KONFIGURASI RATE LIMITING
// =============================================
// Waktu minimum (dalam menit) antara pengiriman tiket dari IP yang sama
define('RATE_LIMIT_MINUTES_PER_IP', 3);

// =============================================
// KONFIGURASI UMUM
// =============================================
// Maksimal ukuran file (sudah divalidasi di frontend, ini sebagai backup)
define('MAX_FILE_SIZE', 5 * 1024 * 1024); // 5 MB

// Format nomor tiket: YYYYMMDDHHMMSS + 4 digit random
define('TICKET_NUMBER_FORMAT', 'YmdHis');

// =============================================
// KONEKSI DATABASE
// =============================================
function getDBConnection() {
    try {
        $conn = new mysqli(DB_HOST, DB_USER, DB_PASS, DB_NAME);

        if ($conn->connect_error) {
            throw new Exception("Koneksi database gagal: " . $conn->connect_error);
        }

        // Set charset ke utf8mb4 untuk mendukung emoji dan karakter khusus
        $conn->set_charset("utf8mb4");

        return $conn;
    } catch (Exception $e) {
        sendJsonResponse(false, "Terjadi kesalahan pada server database", null, 500);
        exit();
    }
}

// =============================================
// FUNGSI HELPER: MENDAPATKAN IP ADDRESS CLIENT
// =============================================
// Fungsi ini mencoba mendapatkan IP address sebenarnya dari user
// bahkan jika menggunakan proxy atau load balancer
function getClientIP() {
    $ip = '';

    if (!empty($_SERVER['HTTP_CLIENT_IP'])) {
        // IP dari shared internet
        $ip = $_SERVER['HTTP_CLIENT_IP'];
    } elseif (!empty($_SERVER['HTTP_X_FORWARDED_FOR'])) {
        // IP dari proxy
        // Bisa berisi multiple IP, ambil yang pertama
        $ips = explode(',', $_SERVER['HTTP_X_FORWARDED_FOR']);
        $ip = trim($ips[0]);
    } elseif (!empty($_SERVER['HTTP_X_FORWARDED'])) {
        $ip = $_SERVER['HTTP_X_FORWARDED'];
    } elseif (!empty($_SERVER['HTTP_FORWARDED_FOR'])) {
        $ip = $_SERVER['HTTP_FORWARDED_FOR'];
    } elseif (!empty($_SERVER['HTTP_FORWARDED'])) {
        $ip = $_SERVER['HTTP_FORWARDED'];
    } else {
        // IP standar
        $ip = $_SERVER['REMOTE_ADDR'];
    }

    // Validasi format IP
    $ip = filter_var($ip, FILTER_VALIDATE_IP);

    return $ip ?: 'unknown';
}

// =============================================
// FUNGSI HELPER: KIRIM RESPONSE JSON
// =============================================
/**
 * Mengirim response dalam format JSON
 *
 * @param bool $success - Status berhasil/gagal
 * @param string $message - Pesan untuk user
 * @param mixed $data - Data tambahan (opsional)
 * @param int $httpCode - HTTP status code (default: 200)
 */
function sendJsonResponse($success, $message, $data = null, $httpCode = 200) {
    http_response_code($httpCode);

    $response = [
        'success' => $success,
        'message' => $message
    ];

    if ($data !== null) {
        if (is_array($data)) {
            $response = array_merge($response, $data);
        } else {
            $response['data'] = $data;
        }
    }

    echo json_encode($response, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
    exit();
}

// =============================================
// FUNGSI HELPER: VALIDASI INPUT
// =============================================
/**
 * Membersihkan dan validasi input string
 */
function cleanInput($data) {
    if ($data === null) return null;
    $data = trim($data);
    $data = stripslashes($data);
    $data = htmlspecialchars($data, ENT_QUOTES, 'UTF-8');
    return $data;
}

// =============================================
// FUNGSI HELPER: GENERATE NOMOR TIKET UNIK
// =============================================
/**
 * Membuat nomor tiket unik dengan format:
 * YYYYMMDDHHMMSS + 4 digit random
 *
 * Contoh: 20250123143022A7B9
 */
function generateTicketNumber($conn) {
    $maxAttempts = 10;

    for ($i = 0; $i < $maxAttempts; $i++) {
        // Buat nomor tiket: timestamp + 4 karakter random (huruf kapital dan angka)
        $timestamp = date(TICKET_NUMBER_FORMAT);
        $randomChars = substr(str_shuffle('ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'), 0, 4);
        $ticketNumber = $timestamp . $randomChars;

        // Cek apakah nomor tiket sudah ada di database
        $stmt = $conn->prepare("SELECT id FROM tickets WHERE ticket_number = ? LIMIT 1");
        $stmt->bind_param("s", $ticketNumber);
        $stmt->execute();
        $result = $stmt->get_result();

        if ($result->num_rows === 0) {
            // Nomor tiket unik, return
            $stmt->close();
            return $ticketNumber;
        }

        $stmt->close();

        // Jika sudah ada, coba lagi dengan delay kecil
        usleep(100000); // 0.1 detik
    }

    // Jika setelah 10 percobaan masih gagal, gunakan microtime untuk lebih unik
    $microtime = str_replace('.', '', microtime(true));
    return substr($microtime, -14) . substr(str_shuffle('ABCDEFGHIJKLMNOPQRSTUVWXYZ'), 0, 4);
}

// =============================================
// FUNGSI HELPER: VERIFIKASI FIREBASE ID TOKEN (UNTUK ADMIN)
// =============================================
/**
 * CATATAN PENTING:
 * Untuk implementasi production yang sesungguhnya, gunakan Firebase Admin SDK for PHP
 * Library: kreait/firebase-php (install via Composer)
 *
 * Contoh implementasi dengan library:
 *
 * require 'vendor/autoload.php';
 * use Kreait\Firebase\Factory;
 *
 * $factory = (new Factory)->withServiceAccount('path/to/serviceAccountKey.json');
 * $auth = $factory->createAuth();
 *
 * try {
 *     $verifiedIdToken = $auth->verifyIdToken($idToken);
 *     $uid = $verifiedIdToken->claims()->get('sub');
 *     return $uid;
 * } catch (Exception $e) {
 *     return false;
 * }
 *
 * Untuk contoh sederhana ini, kita akan melakukan verifikasi dasar
 * dengan memanggil Firebase REST API
 */
function verifyFirebaseIdToken($idToken) {
    // OPSI 1: Gunakan Firebase Admin SDK (RECOMMENDED untuk production)
    // Uncomment jika sudah install kreait/firebase-php via Composer
    /*
    require_once __DIR__ . '/../vendor/autoload.php';

    try {
        $factory = (new \Kreait\Firebase\Factory)
            ->withServiceAccount(__DIR__ . '/serviceAccountKey.json');
        $auth = $factory->createAuth();

        $verifiedIdToken = $auth->verifyIdToken($idToken);
        $uid = $verifiedIdToken->claims()->get('sub');

        return [
            'success' => true,
            'uid' => $uid
        ];
    } catch (Exception $e) {
        return [
            'success' => false,
            'error' => $e->getMessage()
        ];
    }
    */

    // OPSI 2: Verifikasi sederhana via Google API (untuk development)
    // CATATAN: Ini kurang aman untuk production karena tidak memverifikasi audience dan issuer

    if (empty($idToken)) {
        return ['success' => false, 'error' => 'Token tidak boleh kosong'];
    }

    // Untuk development/testing, kita bisa skip verifikasi atau gunakan method sederhana
    // PERINGATAN: Jangan gunakan ini untuk production!

    // Verifikasi via Google's tokeninfo endpoint (rate limited)
    $url = 'https://www.googleapis.com/oauth2/v3/tokeninfo?id_token=' . urlencode($idToken);

    $ch = curl_init();
    curl_setopt($ch, CURLOPT_URL, $url);
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    curl_setopt($ch, CURLOPT_TIMEOUT, 10);
    $response = curl_exec($ch);
    $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    curl_close($ch);

    if ($httpCode === 200) {
        $tokenInfo = json_decode($response, true);

        if (isset($tokenInfo['sub'])) {
            return [
                'success' => true,
                'uid' => $tokenInfo['sub'],
                'email' => $tokenInfo['email'] ?? null
            ];
        }
    }

    return [
        'success' => false,
        'error' => 'Token tidak valid atau sudah expired'
    ];
}

// =============================================
// FUNGSI HELPER: EXTRACT BEARER TOKEN
// =============================================
/**
 * Mengambil Bearer token dari Authorization header
 */
function getBearerToken() {
    $headers = null;

    if (isset($_SERVER['Authorization'])) {
        $headers = trim($_SERVER["Authorization"]);
    } else if (isset($_SERVER['HTTP_AUTHORIZATION'])) {
        $headers = trim($_SERVER["HTTP_AUTHORIZATION"]);
    } elseif (function_exists('apache_request_headers')) {
        $requestHeaders = apache_request_headers();
        $requestHeaders = array_combine(
            array_map('ucwords', array_keys($requestHeaders)),
            array_values($requestHeaders)
        );

        if (isset($requestHeaders['Authorization'])) {
            $headers = trim($requestHeaders['Authorization']);
        }
    }

    if (!empty($headers)) {
        if (preg_match('/Bearer\s(\S+)/', $headers, $matches)) {
            return $matches[1];
        }
    }

    return null;
}
