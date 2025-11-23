/**
 * =============================================
 * Firebase Functions untuk Sistem Tiket Komplain
 * =============================================
 *
 * Functions:
 * 1. createTicket - Membuat tiket baru dengan rate limiting
 *
 * Database: Cloud Firestore
 * Collections:
 * - tickets: Data tiket komplain
 * - ipRateLimit: Rate limiting per IP
 */

const {onRequest} = require("firebase-functions/v2/https");
const admin = require("firebase-admin");

// Inisialisasi Firebase Admin
admin.initializeApp();

const db = admin.firestore();

/**
 * =============================================
 * KONFIGURASI
 * =============================================
 */
const RATE_LIMIT_MINUTES = 3; // Waktu minimum antar submit dari IP yang sama
const TICKET_NUMBER_LENGTH = 18; // Panjang nomor tiket (YYYYMMDDHHMMSS + 4 random)

/**
 * =============================================
 * HELPER: Generate Nomor Tiket Unik
 * =============================================
 * Format: YYYYMMDDHHMMSS + 4 karakter random (huruf + angka)
 * Contoh: 20250123143022A7B9
 */
function generateTicketNumber() {
  const now = new Date();

  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  const hour = String(now.getHours()).padStart(2, "0");
  const minute = String(now.getMinutes()).padStart(2, "0");
  const second = String(now.getSeconds()).padStart(2, "0");

  const timestamp = `${year}${month}${day}${hour}${minute}${second}`;

  // Generate 4 karakter random (A-Z, 0-9)
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  let random = "";
  for (let i = 0; i < 4; i++) {
    random += chars.charAt(Math.floor(Math.random() * chars.length));
  }

  return timestamp + random;
}

/**
 * =============================================
 * HELPER: Validasi Input
 * =============================================
 */
function validateTicketInput(data) {
  const errors = [];

  if (!data.kode_user || typeof data.kode_user !== "string" || !data.kode_user.trim()) {
    errors.push("Kode user harus diisi");
  }

  if (!data.nama_toko || typeof data.nama_toko !== "string" || !data.nama_toko.trim()) {
    errors.push("Nama toko harus diisi");
  }

  if (!data.tanggal || typeof data.tanggal !== "string") {
    errors.push("Tanggal harus diisi");
  } else {
    // Validasi format tanggal YYYY-MM-DD
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    if (!dateRegex.test(data.tanggal)) {
      errors.push("Format tanggal tidak valid (harus YYYY-MM-DD)");
    }
  }

  if (!data.pengirim || typeof data.pengirim !== "string" || !data.pengirim.trim()) {
    errors.push("Nama pengirim harus diisi");
  }

  if (!data.nominal || typeof data.nominal !== "number" || data.nominal <= 0) {
    errors.push("Nominal harus lebih dari 0");
  }

  if (!data.bank || typeof data.bank !== "string") {
    errors.push("Bank harus dipilih");
  }

  // Validasi RRN khusus untuk QRIS
  if (data.bank === "QRIS") {
    if (!data.rrn || typeof data.rrn !== "string" || !data.rrn.trim()) {
      errors.push("RRN wajib diisi untuk transaksi QRIS");
    }
  }

  if (!data.bukti_url || typeof data.bukti_url !== "string" || !data.bukti_url.trim()) {
    errors.push("Bukti transfer harus diupload");
  }

  return errors;
}

/**
 * =============================================
 * HELPER: Dapatkan IP Address dari Request
 * =============================================
 */
function getClientIP(req) {
  // Coba berbagai header untuk mendapatkan IP asli
  const forwardedFor = req.headers["x-forwarded-for"];
  if (forwardedFor) {
    // x-forwarded-for bisa berisi multiple IP, ambil yang pertama
    const ips = forwardedFor.split(",");
    return ips[0].trim();
  }

  return req.headers["x-real-ip"] ||
         req.headers["x-client-ip"] ||
         req.connection?.remoteAddress ||
         req.socket?.remoteAddress ||
         "unknown";
}

/**
 * =============================================
 * CLOUD FUNCTION: Create Ticket
 * =============================================
 * Endpoint: POST /createTicket
 *
 * Request Body:
 * {
 *   kode_user: string,
 *   nama_toko: string,
 *   tanggal: string (YYYY-MM-DD),
 *   pengirim: string,
 *   nominal: number,
 *   bank: string,
 *   rrn: string | null,
 *   bukti_url: string
 * }
 *
 * Response:
 * {
 *   success: boolean,
 *   message: string,
 *   ticket_number: string (jika success)
 * }
 */
exports.createTicket = onRequest({cors: true, region: 'asia-southeast1'}, async (req, res) => {
  // Set CORS headers
  res.set("Access-Control-Allow-Origin", "*"); // Ubah untuk production!
  res.set("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.set("Access-Control-Allow-Headers", "Content-Type");

  // Handle preflight request
  if (req.method === "OPTIONS") {
    res.status(200).send("");
    return;
  }

  // Hanya izinkan POST
  if (req.method !== "POST") {
    res.status(405).json({
      success: false,
      message: "Method tidak diizinkan",
    });
    return;
  }

  try {
    const data = req.body;

    // =============================================
    // VALIDASI INPUT
    // =============================================
    const validationErrors = validateTicketInput(data);
    if (validationErrors.length > 0) {
      res.status(400).json({
        success: false,
        message: "Data tidak valid: " + validationErrors.join(", "),
      });
      return;
    }

    // =============================================
    // RATE LIMITING PER IP
    // =============================================
    const clientIP = getClientIP(req);
    const ipRateLimitRef = db.collection("ipRateLimit").doc(clientIP);

    const ipDoc = await ipRateLimitRef.get();

    if (ipDoc.exists) {
      const lastSubmit = ipDoc.data().lastSubmitAt.toDate();
      const now = new Date();
      const diffMinutes = (now - lastSubmit) / (1000 * 60);

      if (diffMinutes < RATE_LIMIT_MINUTES) {
        const waitTime = Math.ceil(RATE_LIMIT_MINUTES - diffMinutes);
        res.status(429).json({
          success: false,
          message: `Terlalu sering mengirim komplain. Silakan tunggu ${waitTime} menit lagi.`,
        });
        return;
      }
    }

    // =============================================
    // GENERATE NOMOR TIKET UNIK
    // =============================================
    let ticketNumber = generateTicketNumber();

    // Pastikan unik (retry jika collision, meskipun sangat jarang terjadi)
    let attempts = 0;
    const maxAttempts = 5;

    while (attempts < maxAttempts) {
      const existingTicket = await db.collection("tickets")
        .where("ticketNumber", "==", ticketNumber)
        .limit(1)
        .get();

      if (existingTicket.empty) {
        break; // Nomor tiket unik
      }

      // Generate ulang jika ada collision
      ticketNumber = generateTicketNumber();
      attempts++;
    }

    if (attempts >= maxAttempts) {
      res.status(500).json({
        success: false,
        message: "Gagal generate nomor tiket unik. Silakan coba lagi.",
      });
      return;
    }

    // =============================================
    // SIMPAN DATA TIKET
    // =============================================
    const ticketData = {
      ticketNumber: ticketNumber,
      kodeUser: data.kode_user.trim(),
      namaToko: data.nama_toko.trim(),
      tanggal: data.tanggal,
      pengirim: data.pengirim.trim(),
      nominal: data.nominal,
      bank: data.bank,
      rrn: data.bank === "QRIS" ? data.rrn.trim() : null,
      buktiUrl: data.bukti_url.trim(),
      ipAddress: clientIP,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
    };

    await db.collection("tickets").add(ticketData);

    // =============================================
    // UPDATE RATE LIMIT
    // =============================================
    await ipRateLimitRef.set({
      ipAddress: clientIP,
      lastSubmitAt: admin.firestore.FieldValue.serverTimestamp(),
      submitCount: admin.firestore.FieldValue.increment(1),
    }, {merge: true});

    // =============================================
    // RESPONSE SUCCESS
    // =============================================
    res.status(201).json({
      success: true,
      message: "Komplain berhasil dikirim",
      ticket_number: ticketNumber,
    });

  } catch (error) {
    console.error("Error creating ticket:", error);
    res.status(500).json({
      success: false,
      message: "Terjadi kesalahan pada server. Silakan coba lagi.",
    });
  }
});

/**
 * =============================================
 * CLOUD FUNCTION: List Tickets (ADMIN ONLY)
 * =============================================
 * Endpoint: GET /listTickets?page=1&perPage=10
 *
 * Headers:
 * Authorization: Bearer <firebase_id_token>
 *
 * Response:
 * {
 *   success: boolean,
 *   message: string,
 *   data: Array<Ticket>,
 *   pagination: {
 *     page: number,
 *     perPage: number,
 *     total: number,
 *     totalPages: number
 *   }
 * }
 */
exports.listTickets = onRequest({cors: true, region: 'asia-southeast1'}, async (req, res) => {
  // Set CORS headers
  res.set("Access-Control-Allow-Origin", "*"); // Ubah untuk production!
  res.set("Access-Control-Allow-Methods", "GET, OPTIONS");
  res.set("Access-Control-Allow-Headers", "Content-Type, Authorization");

  // Handle preflight request
  if (req.method === "OPTIONS") {
    res.status(200).send("");
    return;
  }

  // Hanya izinkan GET
  if (req.method !== "GET") {
    res.status(405).json({
      success: false,
      message: "Method tidak diizinkan",
    });
    return;
  }

  try {
    // =============================================
    // AUTENTIKASI ADMIN
    // =============================================
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      res.status(401).json({
        success: false,
        message: "Token autentikasi tidak ditemukan",
      });
      return;
    }

    const idToken = authHeader.split("Bearer ")[1];

    try {
      // Verifikasi Firebase ID token
      const decodedToken = await admin.auth().verifyIdToken(idToken);
      console.log("Admin authenticated:", decodedToken.uid);
    } catch (error) {
      console.error("Token verification error:", error);
      res.status(401).json({
        success: false,
        message: "Token tidak valid atau sudah expired",
      });
      return;
    }

    // =============================================
    // PAGINATION PARAMETERS
    // =============================================
    const page = parseInt(req.query.page) || 1;
    let perPage = parseInt(req.query.perPage) || 10;

    // Validasi pagination
    if (page < 1) {
      res.status(400).json({
        success: false,
        message: "Parameter page harus lebih dari 0",
      });
      return;
    }

    if (perPage < 1 || perPage > 100) {
      perPage = 10; // Default jika tidak valid
    }

    // =============================================
    // HITUNG TOTAL TIKET
    // =============================================
    const ticketsRef = db.collection("tickets");
    const snapshot = await ticketsRef.get();
    const total = snapshot.size;
    const totalPages = Math.ceil(total / perPage);

    // =============================================
    // AMBIL DATA TIKET DENGAN PAGINATION
    // =============================================
    const offset = (page - 1) * perPage;

    const ticketsQuery = await ticketsRef
      .orderBy("createdAt", "desc")
      .limit(perPage)
      .offset(offset)
      .get();

    const tickets = [];
    ticketsQuery.forEach((doc) => {
      const data = doc.data();
      tickets.push({
        id: doc.id,
        ticket_number: data.ticketNumber, // snake_case untuk compatibility dengan frontend
        kode_user: data.kodeUser,
        nama_toko: data.namaToko,
        tanggal: data.tanggal,
        pengirim: data.pengirim,
        nominal: data.nominal,
        bank: data.bank,
        rrn: data.rrn,
        bukti_url: data.buktiUrl,
        ip_address: data.ipAddress,
        created_at: data.createdAt ? data.createdAt.toDate().toISOString() : null,
      });
    });

    // =============================================
    // RESPONSE SUCCESS
    // =============================================
    res.status(200).json({
      success: true,
      message: "Data berhasil diambil",
      data: tickets,
      pagination: {
        page: page,
        perPage: perPage,
        total: total,
        totalPages: totalPages,
      },
    });

  } catch (error) {
    console.error("Error listing tickets:", error);
    res.status(500).json({
      success: false,
      message: "Terjadi kesalahan pada server. Silakan coba lagi.",
    });
  }
});
