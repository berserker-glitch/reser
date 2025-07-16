# Backend Installation Guide

## Prerequisites Installation

The backend requires PHP 8.2+ and Composer to be installed on Windows.

### Step 1: Install PHP 8.2+

1. **Download PHP:**
   - Visit https://windows.php.net/download/
   - Download PHP 8.2+ (Thread Safe version)
   - Extract to `C:\php`

2. **Configure PHP:**
   - Add `C:\php` to Windows PATH environment variable
   - Copy `php.ini-development` to `php.ini`
   - Enable required extensions in `php.ini`:
     ```ini
     extension=curl
     extension=fileinfo
     extension=gd
     extension=mbstring
     extension=openssl
     extension=pdo_mysql
     extension=zip
     ```

3. **Verify Installation:**
   ```bash
   php --version
   # Should show PHP 8.2+ version
   ```

### Step 2: Install Composer

1. **Download Composer:**
   - Visit https://getcomposer.org/download/
   - Download and run `Composer-Setup.exe`
   - Follow installation wizard

2. **Verify Installation:**
   ```bash
   composer --version
   # Should show Composer version
   ```

### Step 3: Install MySQL 8

1. **Download MySQL:**
   - Visit https://dev.mysql.com/downloads/mysql/
   - Download MySQL 8.0+ Community Server
   - Install with default settings

2. **Configure MySQL:**
   - Set root password during installation
   - Remember credentials for Laravel configuration

## Laravel Backend Setup

Once PHP and Composer are installed, run these commands:

### Step 1: Create Laravel Project
```bash
composer create-project laravel/laravel backend
cd backend
```

### Step 2: Install Required Packages
```bash
composer require tymon/jwt-auth spatie/laravel-schedule-monitor laravel/ide-helper
```

### Step 3: Configure Environment
```bash
# Copy .env.example to .env
copy .env.example .env

# Generate application key
php artisan key:generate

# Publish JWT configuration
php artisan vendor:publish --provider="Tymon\JWTAuth\Providers\LaravelServiceProvider"

# Generate JWT secret
php artisan jwt:secret
```

### Step 4: Database Configuration

Update `.env` file with your database credentials:
```env
DB_CONNECTION=mysql
DB_HOST=127.0.0.1
DB_PORT=3306
DB_DATABASE=salon_reservation
DB_USERNAME=root
DB_PASSWORD=your_mysql_password
```

Create the database:
```sql
CREATE DATABASE salon_reservation CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
```

### Step 5: Test Installation
```bash
# Test Laravel installation
php artisan --version

# Test database connection
php artisan migrate:status

# Start development server
php artisan serve
# Should be accessible at http://localhost:8000
```

## Next Steps

After successful installation:

1. **Run Phase 1:** Database schema & Eloquent models
2. **Run Phase 2:** JWT Auth & Route structure  
3. **Run Phase 3:** Holiday import & availability engine
4. **Run Phase 4:** Reservation endpoints & business rules

## Troubleshooting

### Common Issues:

1. **"php is not recognized"**
   - Ensure PHP directory is in Windows PATH
   - Restart command prompt after PATH changes

2. **"composer is not recognized"**
   - Reinstall Composer with admin privileges
   - Ensure Composer is in Windows PATH

3. **MySQL Connection Errors**
   - Verify MySQL service is running
   - Check database credentials in `.env`
   - Ensure database exists

4. **Extension Not Found Errors**
   - Check `php.ini` extensions are uncommented
   - Verify extension files exist in PHP ext directory

## Performance Notes

- Enable OPcache in production
- Configure MySQL for optimal performance
- Use Redis for caching in production environment 