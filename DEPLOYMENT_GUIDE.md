# Panduan Deployment ke Production

Panduan lengkap untuk deploy sistem tiket komplain ke server production.

## 📋 Pre-Deployment Checklist

### Server Requirements
- [x] PHP 7.4+ dengan extension: mysqli, json, curl
- [x] MySQL 5.7+ atau MariaDB 10.3+
- [x] Apache dengan mod_rewrite atau Nginx
- [x] SSL Certificate (untuk HTTPS)
- [x] Composer (jika menggunakan Firebase Admin SDK)

### Firebase Requirements
- [x] Project Firebase sudah dibuat
- [x] Firebase Authentication diaktifkan (Email/Password + Anonymous)
- [x] Firebase Storage diaktifkan
- [x] Storage Rules sudah dikonfigurasi
- [x] Admin user sudah dibuat di Firebase Console

## 🚀 Langkah Deployment

### 1. Persiapan File

#### a. Clone/Download Repository

```bash
git clone <repository-url>
cd form-komplainan
```

#### b. Install Dependencies (Opsional tapi Recommended)

Untuk keamanan maksimal, install Firebase Admin SDK:

```bash
composer install
```

#### c. Setup Firebase Service Account (untuk Firebase Admin SDK)

1. Buka Firebase Console > Project Settings > Service Accounts
2. Klik "Generate new private key"
3. Download file JSON
4. Simpan di folder `api/` dengan nama `serviceAccountKey.json`
5. **PENTING**: Jangan commit file ini ke git!

### 2. Konfigurasi

#### a. Database

Edit `api/config.php`:

```php
define('DB_HOST', 'localhost');        // Atau IP server database
define('DB_USER', 'komplain_user');    // User dengan privilege terbatas
define('DB_PASS', 'STRONG_PASSWORD');  // Password yang kuat
define('DB_NAME', 'komplain_db');
```

#### b. Firebase

Edit `public/assets/firebase-config.js`:

```javascript
const firebaseConfig = {
  apiKey: "YOUR_PRODUCTION_API_KEY",
  authDomain: "your-project.firebaseapp.com",
  projectId: "your-project-id",
  storageBucket: "your-project.appspot.com",
  messagingSenderId: "1234567890",
  appId: "1:1234567890:web:abcdef1234567890"
};
```

#### c. CORS (Production)

Edit `api/config.php`, ganti:

```php
// Development (allow all)
header('Access-Control-Allow-Origin: *');

// Production (specific domain)
header('Access-Control-Allow-Origin: https://yourdomain.com');
```

#### d. Error Display (Production)

Edit `api/.htaccess`:

```apache
<IfModule mod_php7.c>
    php_flag display_errors Off
    php_flag log_errors On
</IfModule>
```

### 3. Database Setup

#### a. Buat Database User dengan Privilege Terbatas

```sql
-- Login sebagai root
mysql -u root -p

-- Buat user baru
CREATE USER 'komplain_user'@'localhost' IDENTIFIED BY 'STRONG_PASSWORD';

-- Beri privilege hanya untuk database komplain_db
GRANT SELECT, INSERT, UPDATE ON komplain_db.* TO 'komplain_user'@'localhost';

-- Flush privileges
FLUSH PRIVILEGES;
```

#### b. Import Schema Database

```bash
mysql -u root -p komplain_db < database.sql
```

### 4. File Permissions

Set permission yang benar untuk keamanan:

```bash
# Ownership
chown -R www-data:www-data /path/to/form-komplainan

# Directories
find /path/to/form-komplainan -type d -exec chmod 755 {} \;

# Files
find /path/to/form-komplainan -type f -exec chmod 644 {} \;

# Config files (read-only)
chmod 400 api/config.php
chmod 400 api/serviceAccountKey.json
```

### 5. Web Server Configuration

#### Apache

File `.htaccess` sudah disediakan. Pastikan:

```apache
# Aktifkan mod_rewrite
a2enmod rewrite

# Aktifkan mod_headers
a2enmod headers

# Restart Apache
systemctl restart apache2
```

**VirtualHost Configuration:**

```apache
<VirtualHost *:80>
    ServerName yourdomain.com
    DocumentRoot /var/www/form-komplainan/public

    <Directory /var/www/form-komplainan/public>
        AllowOverride All
        Require all granted
    </Directory>

    # Redirect ke HTTPS
    RewriteEngine On
    RewriteCond %{HTTPS} off
    RewriteRule ^ https://%{HTTP_HOST}%{REQUEST_URI} [L,R=301]
</VirtualHost>

<VirtualHost *:443>
    ServerName yourdomain.com
    DocumentRoot /var/www/form-komplainan/public

    SSLEngine on
    SSLCertificateFile /path/to/certificate.crt
    SSLCertificateKeyFile /path/to/private.key
    SSLCertificateChainFile /path/to/chain.crt

    <Directory /var/www/form-komplainan/public>
        AllowOverride All
        Require all granted
    </Directory>
</VirtualHost>
```

#### Nginx

```nginx
server {
    listen 80;
    server_name yourdomain.com;

    # Redirect ke HTTPS
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name yourdomain.com;

    root /var/www/form-komplainan/public;
    index komplain.html;

    # SSL Configuration
    ssl_certificate /path/to/certificate.crt;
    ssl_certificate_key /path/to/private.key;

    # Security headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header X-Content-Type-Options "nosniff" always;

    # PHP API handling
    location ~ ^/api/.+\.php$ {
        include snippets/fastcgi-php.conf;
        fastcgi_pass unix:/var/run/php/php7.4-fpm.sock;
        fastcgi_param SCRIPT_FILENAME $document_root$fastcgi_script_name;
    }

    # Block access to config.php
    location ~ /api/config\.php$ {
        deny all;
    }

    # Static files caching
    location ~* \.(jpg|jpeg|png|gif|css|js)$ {
        expires 30d;
        add_header Cache-Control "public, immutable";
    }
}
```

### 6. SSL Certificate

#### Menggunakan Let's Encrypt (Gratis)

```bash
# Install Certbot
apt-get install certbot python3-certbot-apache

# Generate certificate (Apache)
certbot --apache -d yourdomain.com

# Generate certificate (Nginx)
certbot --nginx -d yourdomain.com

# Auto-renewal
certbot renew --dry-run
```

### 7. Firebase Admin SDK Setup (Production)

Edit `api/config.php`, uncomment bagian Firebase Admin SDK:

```php
function verifyFirebaseIdToken($idToken) {
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
}
```

### 8. Testing Production

#### a. Test Frontend

1. Buka `https://yourdomain.com/komplain.html`
2. Cek console browser untuk error
3. Test submit form komplain
4. Verify upload gambar ke Firebase Storage

#### b. Test Admin Dashboard

1. Buka `https://yourdomain.com/admin.html`
2. Login dengan admin credentials
3. Verify data tiket tampil
4. Test pagination
5. Test preview gambar

#### c. Test API Endpoints

```bash
# Test create ticket (seharusnya gagal tanpa data valid)
curl -X POST https://yourdomain.com/api/create_ticket.php

# Test list tickets (seharusnya gagal tanpa token)
curl https://yourdomain.com/api/list_tickets.php
```

### 9. Monitoring & Logging

#### a. PHP Error Logs

```bash
# Lihat error log
tail -f /var/log/apache2/error.log
# atau
tail -f /var/log/nginx/error.log
```

#### b. Application Logs

Tambahkan logging di `api/config.php`:

```php
// Custom error logging
error_log("API Error: " . $message, 3, __DIR__ . "/../logs/app.log");
```

Buat folder logs:

```bash
mkdir -p /var/www/form-komplainan/logs
chmod 755 /var/www/form-komplainan/logs
```

#### c. Database Logging

Monitor slow queries:

```sql
-- Enable slow query log
SET GLOBAL slow_query_log = 'ON';
SET GLOBAL long_query_time = 2;
```

### 10. Backup Strategy

#### a. Database Backup (Daily)

```bash
#!/bin/bash
# backup-db.sh

BACKUP_DIR="/backup/mysql"
DATE=$(date +%Y%m%d_%H%M%S)
DB_NAME="komplain_db"

mkdir -p $BACKUP_DIR

mysqldump -u backup_user -p'PASSWORD' $DB_NAME | gzip > $BACKUP_DIR/komplain_db_$DATE.sql.gz

# Keep only last 30 days
find $BACKUP_DIR -name "komplain_db_*.sql.gz" -mtime +30 -delete
```

Jadwalkan dengan cron:

```bash
crontab -e

# Daily backup at 2 AM
0 2 * * * /path/to/backup-db.sh
```

#### b. File Backup

Firebase Storage sudah otomatis ter-backup oleh Firebase.

Untuk file aplikasi:

```bash
# Backup aplikasi
tar -czf /backup/app/komplain_$(date +%Y%m%d).tar.gz /var/www/form-komplainan
```

### 11. Security Hardening

#### a. Firewall

```bash
# UFW (Ubuntu)
ufw allow 80/tcp
ufw allow 443/tcp
ufw allow 22/tcp
ufw enable
```

#### b. Fail2Ban

```bash
# Install
apt-get install fail2ban

# Configure
cat > /etc/fail2ban/jail.local << EOF
[DEFAULT]
bantime = 3600
findtime = 600
maxretry = 5

[apache-auth]
enabled = true
EOF

systemctl restart fail2ban
```

#### c. Update Reguler

```bash
# Ubuntu/Debian
apt-get update && apt-get upgrade

# CentOS/RHEL
yum update
```

### 12. Performance Optimization

#### a. PHP OpCache

Edit `php.ini`:

```ini
opcache.enable=1
opcache.memory_consumption=128
opcache.max_accelerated_files=10000
opcache.revalidate_freq=60
```

#### b. MySQL Optimization

Edit `my.cnf`:

```ini
[mysqld]
innodb_buffer_pool_size = 256M
innodb_log_file_size = 64M
query_cache_size = 32M
```

#### c. CDN (Opsional)

Gunakan CDN untuk static assets jika traffic tinggi.

## 🔍 Post-Deployment Checklist

- [ ] SSL Certificate terinstall dan valid
- [ ] HTTPS redirect berfungsi
- [ ] Form komplain bisa submit
- [ ] Upload gambar ke Firebase berhasil
- [ ] Admin bisa login
- [ ] Admin dashboard menampilkan data
- [ ] Rate limiting berfungsi
- [ ] Error log berfungsi
- [ ] Backup script terjadwal
- [ ] Monitoring aktif
- [ ] Firebase Admin SDK terinstall (untuk production)
- [ ] Service Account Key aman
- [ ] Database user memiliki privilege minimal
- [ ] CORS dikonfigurasi dengan benar
- [ ] Security headers aktif

## 🆘 Troubleshooting Production

### 500 Internal Server Error

1. Cek PHP error log
2. Cek file permissions
3. Cek database connection
4. Cek .htaccess syntax

### Cannot Upload to Firebase

1. Cek Firebase Storage Rules
2. Cek network firewall
3. Cek browser console untuk error

### Admin Cannot Login

1. Verify Firebase config
2. Check Firebase Console untuk user
3. Verify ID token verification

### Database Connection Failed

1. Check credentials di config.php
2. Verify database user privileges
3. Check MySQL/MariaDB service status

## 📞 Support

Jika ada masalah saat deployment, cek:
1. Error logs di `/var/log/apache2/` atau `/var/log/nginx/`
2. PHP error log
3. Browser console (F12)
4. Firebase Console

## 🎉 Done!

Sistem Anda sekarang sudah live di production! 🚀
