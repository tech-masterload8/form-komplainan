-- =============================================
-- File: database.sql
-- Deskripsi: Schema database untuk sistem tiket komplain
-- =============================================

-- Buat database (opsional, sesuaikan dengan kebutuhan)
CREATE DATABASE IF NOT EXISTS komplain_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE komplain_db;

-- Tabel untuk menyimpan data tiket komplain
CREATE TABLE IF NOT EXISTS tickets (
    id INT AUTO_INCREMENT PRIMARY KEY,
    ticket_number VARCHAR(50) UNIQUE NOT NULL COMMENT 'Nomor tiket unik',
    kode_user VARCHAR(100) NOT NULL COMMENT 'Kode identitas user',
    nama_toko VARCHAR(200) NOT NULL COMMENT 'Nama toko user',
    tanggal DATE NOT NULL COMMENT 'Tanggal transaksi',
    pengirim VARCHAR(200) NOT NULL COMMENT 'Nama pengirim transfer',
    nominal DECIMAL(15,2) NOT NULL COMMENT 'Nominal transfer dalam rupiah',
    bank VARCHAR(50) NOT NULL COMMENT 'Bank yang digunakan untuk transfer',
    rrn VARCHAR(100) DEFAULT NULL COMMENT 'RRN khusus untuk QRIS',
    bukti_url TEXT NOT NULL COMMENT 'URL bukti transfer dari Firebase Storage',
    ip_address VARCHAR(45) DEFAULT NULL COMMENT 'IP address user yang submit',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP COMMENT 'Waktu tiket dibuat',
    INDEX idx_ticket_number (ticket_number),
    INDEX idx_created_at (created_at),
    INDEX idx_ip_address (ip_address)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Tabel utama untuk menyimpan tiket komplain';

-- Tabel untuk rate limiting berdasarkan IP address
CREATE TABLE IF NOT EXISTS ip_rate_limit (
    id INT AUTO_INCREMENT PRIMARY KEY,
    ip_address VARCHAR(45) UNIQUE NOT NULL COMMENT 'IP address user',
    last_submit_at DATETIME NOT NULL COMMENT 'Waktu terakhir submit tiket',
    submit_count INT DEFAULT 1 COMMENT 'Jumlah submit (opsional untuk tracking)',
    INDEX idx_ip_last_submit (ip_address, last_submit_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Tabel untuk mencegah spam berdasarkan IP';

-- Insert data contoh (opsional, untuk testing)
-- INSERT INTO tickets (ticket_number, kode_user, nama_toko, tanggal, pengirim, nominal, bank, rrn, bukti_url, ip_address)
-- VALUES ('20250123120000ABCD', 'USER001', 'Toko ABC', '2025-01-23', 'John Doe', 500000, 'BCA', NULL, 'https://firebasestorage.googleapis.com/example.jpg', '127.0.0.1');
