# MobileShop Pro — Installation & Setup Documentation

> **Version 1.0.0** | Complete POS, Inventory & Repair Management System for Phone Shops

---

## Table of Contents

1. [System Requirements](#1-system-requirements)
2. [Quick Start (Local Development)](#2-quick-start-local-development)
3. [Environment Variables](#3-environment-variables)
4. [Database Setup](#4-database-setup)
5. [Production Deployment on VPS](#5-production-deployment-on-vps)
6. [Nginx Reverse Proxy Configuration](#6-nginx-reverse-proxy-configuration)
7. [SSL Certificate (HTTPS)](#7-ssl-certificate-https)
8. [Thermal Printer Setup](#8-thermal-printer-setup)
9. [Admin Panel Guide](#9-admin-panel-guide)
10. [Staff Account Setup & Permissions](#10-staff-account-setup--permissions)
11. [Multi-Shop Management](#11-multi-shop-management)
12. [Subscription & Billing (SaaS Mode)](#12-subscription--billing-saas-mode)
13. [WhatsApp Bot Setup (Optional)](#13-whatsapp-bot-setup-optional)
14. [Backup & Restore](#14-backup--restore)
15. [Troubleshooting](#15-troubleshooting)
16. [FAQ](#16-faq)

---

## 1. System Requirements

### Minimum Requirements

| Component | Requirement |
|-----------|------------|
| **Operating System** | Ubuntu 20.04+ LTS (recommended), Debian 11+, CentOS 8+, or Windows Server 2019+ |
| **Node.js** | v18.0.0 or higher (LTS recommended) |
| **npm** | v9.0.0 or higher |
| **PostgreSQL** | v14.0 or higher |
| **RAM** | 2 GB minimum |
| **Storage** | 10 GB minimum (for database, uploads, and logs) |
| **CPU** | 1 vCPU minimum |

### Recommended for Production

| Component | Recommendation |
|-----------|---------------|
| **RAM** | 4 GB or higher |
| **CPU** | 2+ vCPU |
| **Storage** | 50 GB SSD |
| **OS** | Ubuntu 22.04 LTS |
| **Node.js** | v20 LTS |
| **PostgreSQL** | v16 |

### Software Dependencies

- **Git** (for cloning the repository)
- **PM2** (for production process management) — installed globally
- **Nginx** (for reverse proxy and serving frontend)
- **Certbot** (for free SSL certificates via Let's Encrypt)

---

## 2. Quick Start (Local Development)

### Step 1: Clone the Repository

```bash
git clone https://github.com/your-username/mobileshop-pro.git
cd mobileshop-pro
```

### Step 2: Setup Backend

```bash
cd backend
npm install
```

### Step 3: Create Environment File

```bash
cp .env.example .env
```

Edit `.env` with your settings (see [Section 3](#3-environment-variables)).

### Step 4: Setup PostgreSQL Database

```bash
# Login to PostgreSQL
sudo -u postgres psql

# Create database and user
CREATE DATABASE "mobile-shop";
CREATE USER mobileshop_user WITH ENCRYPTED PASSWORD 'your_strong_password';
GRANT ALL PRIVILEGES ON DATABASE "mobile-shop" TO mobileshop_user;
\q
```

### Step 5: Start the Backend

```bash
npm run dev
```

The backend will start on `http://localhost:5000` and automatically:
- Connect to PostgreSQL
- Create all database tables
- Create default super admin account
- Create a default shop with shop admin
- Set up Row-Level Security (RLS)

### Step 6: Setup Frontend

```bash
cd ../frontend
npm install
```

### Step 7: Configure API URL

Edit `frontend/src/api/config.js` and set the API base URL:

```javascript
export const API_BASE_URL = 'http://localhost:5000/api';
```

### Step 8: Start the Frontend

```bash
npm start
```

The frontend will start on `http://localhost:5173` (Vite default).

### Step 9: Login

Open your browser and navigate to `http://localhost:5173`.

**Default Super Admin Credentials:**
- **Username:** `sureshsenaka76` (or your `INITIAL_ADMIN_USER` env value)
- **Password:** `Sure@#600660` (or your `INITIAL_ADMIN_PASS` env value)

**Default Shop Admin Credentials:**
- **Username:** `shopadmin` (or your `INITIAL_SHOP_ADMIN_USER` env value)
- **Password:** `ShopAdmin@2026` (or your `INITIAL_SHOP_ADMIN_PASS` env value)

> ⚠️ **IMPORTANT:** Change all default passwords immediately after first login!

---

## 3. Environment Variables

Create a `.env` file in the `backend/` directory:

```env
# ============================================
# DATABASE
# ============================================
DATABASE_URL="postgresql://mobileshop_user:your_strong_password@localhost:5432/mobile-shop"

# ============================================
# AUTHENTICATION
# ============================================
JWT_SECRET="your_super_secret_jwt_key_here_make_it_long_and_random"

# ============================================
# INITIAL SUPER ADMIN (created on first run)
# ============================================
INITIAL_ADMIN_USER="admin"
INITIAL_ADMIN_PASS="YourStrongAdminPass@2026"

# ============================================
# INITIAL SHOP ADMIN (created with default shop)
# ============================================
INITIAL_SHOP_ADMIN_USER="shopadmin"
INITIAL_SHOP_ADMIN_PASS="YourStrongShopPass@2026"

# ============================================
# SERVER
# ============================================
PORT=5000
```

### Variable Reference

| Variable | Required | Description |
|----------|----------|-------------|
| `DATABASE_URL` | ✅ | PostgreSQL connection string |
| `JWT_SECRET` | ✅ | Secret key for JWT token signing (use a long random string) |
| `INITIAL_ADMIN_USER` | ❌ | Super admin username (default: `admin`) |
| `INITIAL_ADMIN_PASS` | ❌ | Super admin password (default: `Admin@2026`) |
| `INITIAL_SHOP_ADMIN_USER` | ❌ | Default shop admin username |
| `INITIAL_SHOP_ADMIN_PASS` | ❌ | Default shop admin password |
| `PORT` | ❌ | Backend server port (default: `5000`) |

> 🔐 **Security Tip:** Generate a strong JWT secret using:
> ```bash
> node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
> ```

---

## 4. Database Setup

### PostgreSQL Installation (Ubuntu)

```bash
# Install PostgreSQL
sudo apt update
sudo apt install postgresql postgresql-contrib -y

# Start and enable PostgreSQL
sudo systemctl start postgresql
sudo systemctl enable postgresql

# Create database
sudo -u postgres psql
```

```sql
-- Create the database
CREATE DATABASE "mobile-shop";

-- Create a dedicated user
CREATE USER mobileshop_user WITH ENCRYPTED PASSWORD 'your_strong_password';

-- Grant privileges
GRANT ALL PRIVILEGES ON DATABASE "mobile-shop" TO mobileshop_user;

-- Grant schema permissions (PostgreSQL 15+)
\c "mobile-shop"
GRANT ALL ON SCHEMA public TO mobileshop_user;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO mobileshop_user;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON SEQUENCES TO mobileshop_user;

\q
```

### Auto-Migration

MobileShop Pro handles database migrations **automatically**. When the server starts:

1. **Tables are created** via Sequelize `sync()`
2. **Missing columns are added** via ALTER TABLE statements
3. **Default data is seeded** (super admin, default shop, shop admin)
4. **Orphan records are migrated** to the default shop
5. **Row-Level Security policies** are applied to all tenant tables

No manual migration is needed.

---

## 5. Production Deployment on VPS

### Step 1: Provision a VPS

Get a VPS from DigitalOcean, Vultr, Linode, AWS, or any provider:
- **Ubuntu 22.04 LTS**
- **2 GB RAM minimum** (4 GB recommended)
- **2 vCPU**

### Step 2: Initial Server Setup

```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install essential tools
sudo apt install curl git build-essential -y
```

### Step 3: Install Node.js (via nvm)

```bash
# Install nvm
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.7/install.sh | bash
source ~/.bashrc

# Install Node.js LTS
nvm install --lts
nvm use --lts

# Verify
node -v
npm -v
```

### Step 4: Install PostgreSQL

```bash
sudo apt install postgresql postgresql-contrib -y
sudo systemctl start postgresql
sudo systemctl enable postgresql
```

Follow [Section 4](#4-database-setup) to create the database and user.

### Step 5: Install PM2 (Process Manager)

```bash
npm install -g pm2
```

### Step 6: Clone and Setup the Application

```bash
# Clone project
cd /var/www
git clone https://github.com/your-username/mobileshop-pro.git
cd mobileshop-pro

# Setup backend
cd backend
npm install --production
cp .env.example .env
nano .env  # Edit with your production settings
```

### Step 7: Build the Frontend

```bash
cd ../frontend
npm install

# Edit API URL for production
nano src/api/config.js
# Set: export const API_BASE_URL = 'https://yourdomain.com/api';

# Build for production
npm run build
```

### Step 8: Start with PM2

```bash
cd ../backend

# Start the backend
pm2 start server.js --name "mobileshop-api"

# Save PM2 process list
pm2 save

# Enable PM2 startup on reboot
pm2 startup
```

### Step 9: Verify

```bash
# Check if running
pm2 status

# View logs
pm2 logs mobileshop-api
```

---

## 6. Nginx Reverse Proxy Configuration

### Install Nginx

```bash
sudo apt install nginx -y
sudo systemctl enable nginx
```

### Create Nginx Configuration

```bash
sudo nano /etc/nginx/sites-available/mobileshop
```

Paste the following configuration:

```nginx
server {
    listen 80;
    server_name yourdomain.com www.yourdomain.com;

    # Frontend - Serve the built React app
    root /var/www/mobileshop-pro/frontend/build;
    index index.html;

    # Gzip compression
    gzip on;
    gzip_vary on;
    gzip_min_length 1024;
    gzip_types text/plain text/css application/json application/javascript text/xml application/xml application/xml+rss text/javascript;

    # API Proxy - Forward /api requests to Node.js backend
    location /api/ {
        proxy_pass http://127.0.0.1:5000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;

        # Increase timeout for large operations
        proxy_read_timeout 120s;
        proxy_send_timeout 120s;
    }

    # Serve uploaded files (logos, images)
    location /uploads/ {
        proxy_pass http://127.0.0.1:5000/uploads/;
        proxy_set_header Host $host;
    }

    # React Router - Handle client-side routing
    location / {
        try_files $uri $uri/ /index.html;
    }

    # Security Headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;

    # File upload size limit (for product images, logos, payment slips)
    client_max_body_size 10M;
}
```

### Enable the Site

```bash
# Enable the configuration
sudo ln -s /etc/nginx/sites-available/mobileshop /etc/nginx/sites-enabled/

# Remove default site
sudo rm /etc/nginx/sites-enabled/default

# Test configuration
sudo nginx -t

# Restart Nginx
sudo systemctl restart nginx
```

---

## 7. SSL Certificate (HTTPS)

### Install Certbot

```bash
sudo apt install certbot python3-certbot-nginx -y
```

### Obtain SSL Certificate

```bash
sudo certbot --nginx -d yourdomain.com -d www.yourdomain.com
```

Follow the prompts to set up automatic HTTPS redirection.

### Auto-Renewal

Certbot sets up automatic renewal. Verify with:

```bash
sudo certbot renew --dry-run
```

---

## 8. Thermal Printer Setup

MobileShop Pro supports **thermal receipt printers** (58mm and 80mm) for printing sales receipts.

### How Printing Works

The system uses the **browser's native `window.print()` API** with CSS `@media print` styles optimized for thermal printers. No special drivers or additional software are required beyond the printer's own drivers.

### Setup Steps

#### Step 1: Install Printer Drivers

- Install your thermal printer's USB or network drivers
- Common brands: Epson TM-T88, Star TSP100, Xprinter, POS-80

#### Step 2: Set as Default Printer (Recommended)

- Go to **Control Panel → Devices and Printers**
- Right-click your thermal printer → **Set as default printer**

#### Step 3: Configure Paper Size

- Open printer properties → **Preferences**
- Set paper width: **58mm** or **80mm** (depending on your printer)
- Set margins to **0** or **minimum**

#### Step 4: Browser Print Settings

When printing a receipt:

1. Click the **Print Receipt** button on the sale
2. In the browser print dialog:
   - **Destination**: Select your thermal printer
   - **Paper size**: Custom — 80mm × 297mm (or 58mm × 297mm)
   - **Margins**: None
   - **Scale**: 100%
   - **Headers/Footers**: Off
3. Check **"Remember these settings"** for future prints

#### Step 5: Enable Shop Logo on Receipts

1. Go to **Settings** → Upload your shop logo
2. Toggle **"Print Logo on Receipts"** to ON
3. The logo will appear at the top of every receipt

### Supported Printer Brands

| Brand | Models | Connection |
|-------|--------|-----------|
| Epson | TM-T88V, TM-T20III | USB, Network |
| Star | TSP100, TSP143 | USB, Network |
| Xprinter | XP-80C, XP-58 | USB |
| HOIN | HOP-H58, HOP-H80 | USB |
| Generic | Any 58mm/80mm ESC/POS | USB, Network |

---

## 9. Admin Panel Guide

### Super Admin Panel

The **Super Admin** manages the entire system across all shops.

#### Accessing Super Admin

Login with the super admin credentials → You'll see the **Shops** and **Subscriptions** tabs.

#### Shop Management (🏬 Shops)

- **Add Shop**: Create new shops with name, owner, phone, and address
- **Edit Shop**: Update shop details, upload logo, set theme color
- **Activate/Deactivate**: Toggle shop status (deactivated shops cannot login)
- **View Staff**: See all users assigned to each shop

#### Subscription Approvals (💳 Subscriptions)

- Review payment slip uploads from shop admins
- **Approve**: Extend the shop's billing date
- **Reject**: Add notes explaining the rejection
- Manage billing status (active/overdue)

---

### Shop Admin Panel

The **Shop Admin** manages everything within their shop.

#### Navigation Pillars

| Tab | Purpose |
|-----|---------|
| 🛍️ **Sales** | Create sales, view sales history, print receipts |
| 📦 **Stock & IMEI** | Manage products, track IMEI numbers, barcode scanning |
| 🔧 **Repairs** | Create repair tickets, manage parts, track status |
| 📊 **Dashboard** | Real-time business overview and KPIs |
| ⚡ **More Tools** | Access CRM, suppliers, POs, analytics, payroll, and more |

#### More Tools Menu

| Tool | Description |
|------|-------------|
| 🏧 Cash Register | Open/close daily shifts, track cash flow |
| 📝 Quotations | Create and manage customer quotations |
| 👥 Customer CRM | Manage customer profiles and credit |
| 🚚 Suppliers | Manage suppliers and their stock |
| 🛒 Purchase Orders | Create POs and receive goods |
| 🔙 Returns / Warranty | Process product returns |
| 📈 Analytics & Reports | Advanced reporting and trend analysis |
| 💸 Staff Payroll | Calculate salaries and commissions |
| 💼 Investor Accounts | Manage investor investments and returns |
| 🛡️ Staff & Permissions | Add staff and configure access |
| 💳 System Subscription | Pay for system subscription |

---

## 10. Staff Account Setup & Permissions

### Creating Staff Accounts

1. Navigate to **⚡ More Tools → 🛡️ Staff & Permissions**
2. Click **"Add Staff"**
3. Fill in:
   - **Username** — Must be unique
   - **Password** — Strong password required
   - **Role** — `shop_admin` or `staff`
   - **Basic Salary** — Monthly base salary
   - **Commission Rate (Sales)** — Percentage commission on sales
   - **Commission Rate (Repairs)** — Percentage commission on repairs
4. Click **Save**

### Configuring Permissions

Staff members can be given granular permissions:

| Permission | Description |
|-----------|-------------|
| **Sales** | View and create sales |
| **Products** | View, add, and edit products |
| **Repairs** | View and manage repair tickets |
| **Customers** | View and manage customers |
| **Dashboard** | Access dashboard and analytics |
| **Suppliers** | View and manage suppliers |
| **Expenses** | View and log expenses |
| **Investors** | View investor accounts |
| **Staff** | View and manage other staff |
| **Settings** | Access shop settings |
| **Purchase Orders** | Create and manage POs |
| **Returns** | Process product returns |
| **Cash Register** | Operate daily cash register |
| **Quotations** | Create and manage quotations |

### Two-Factor Authentication (2FA)

1. Go to **⚙️ Settings**
2. Click **"Enable 2FA"**
3. Scan the QR code with **Google Authenticator** or any TOTP app
4. Enter the verification code to confirm
5. 2FA is now required on every login

### Force Password Change

Shop admins can force staff to change their password on next login:
- Go to **Staff & Permissions** → Edit a staff member
- Toggle **"Must Change Password"** to ON

---

## 11. Multi-Shop Management

### Architecture

MobileShop Pro uses **PostgreSQL Row-Level Security (RLS)** for multi-tenancy:

```
┌─────────────────────────────────────────┐
│              Super Admin                │
│     (sees all shops, manages system)    │
├──────────┬──────────┬──────────────────┤
│  Shop A  │  Shop B  │  Shop C   ...    │
│  Admin   │  Admin   │  Admin           │
│  Staff1  │  Staff1  │  Staff1          │
│  Staff2  │  Staff2  │  Staff2          │
│  (Data)  │  (Data)  │  (Data)          │
└──────────┴──────────┴──────────────────┘
```

- Each shop's data is **completely isolated** at the database level
- Shop A cannot see Shop B's customers, sales, or inventory
- Super Admin can see and manage everything

### Adding a New Shop

1. Login as **Super Admin**
2. Go to **🏬 Shops**
3. Click **"Add Shop"**
4. Enter:
   - Shop name
   - Owner name
   - Phone number
   - Address
5. Save → A new shop admin account is automatically created
6. Share the shop admin credentials with the shop owner

---

## 12. Subscription & Billing (SaaS Mode)

If you're running MobileShop Pro as a **SaaS platform** serving multiple shop owners:

### How It Works

1. **Super Admin** sets billing dates for each shop
2. **Shop Admins** see their billing status in **💳 System Subscription**
3. When payment is due, shop admins upload a **payment slip** image with:
   - Payment amount
   - Payment date
   - Reference number
4. **Super Admin** reviews and approves/rejects in **💳 Subscriptions**
5. Upon approval, the shop's billing date is extended

### Managing Overdue Shops

- Super Admin can mark shops as **"overdue"**
- Overdue shops see a billing notification
- Super Admin can deactivate shops that fail to pay

---

## 13. WhatsApp Bot Setup (Optional)

MobileShop Pro includes an optional **WhatsApp Bot** for automated customer communication.

### Setup

```bash
cd whatsapp-bot
npm install

# Create environment file
cp .env.example .env
nano .env
```

Configure the `.env` file with your settings, then:

```bash
# Start the bot
node bot.js
```

Scan the QR code with your WhatsApp to link the bot.

### Features

- Automated customer responses
- Product inquiry handling via AI
- Sales knowledge base integration

---

## 14. Backup & Restore

### Database Backup

```bash
# Full database backup
pg_dump -U mobileshop_user -h localhost "mobile-shop" > backup_$(date +%Y%m%d_%H%M%S).sql

# Compressed backup
pg_dump -U mobileshop_user -h localhost "mobile-shop" | gzip > backup_$(date +%Y%m%d_%H%M%S).sql.gz
```

### Automated Daily Backup (Cron)

```bash
crontab -e
```

Add this line:

```cron
0 2 * * * pg_dump -U mobileshop_user -h localhost "mobile-shop" | gzip > /var/backups/mobileshop/backup_$(date +\%Y\%m\%d).sql.gz
```

### Restore from Backup

```bash
# Drop and recreate database
sudo -u postgres psql -c 'DROP DATABASE "mobile-shop";'
sudo -u postgres psql -c 'CREATE DATABASE "mobile-shop" OWNER mobileshop_user;'

# Restore
psql -U mobileshop_user -h localhost "mobile-shop" < backup_20261106.sql

# Or from compressed backup
gunzip -c backup_20261106.sql.gz | psql -U mobileshop_user -h localhost "mobile-shop"
```

### File Backup

Don't forget to backup uploaded files:

```bash
tar -czf uploads_backup.tar.gz /var/www/mobileshop-pro/backend/public/uploads/
```

---

## 15. Troubleshooting

### Common Issues

#### ❌ "PostgreSQL connection error"

**Cause:** Database connection string is incorrect or PostgreSQL is not running.

**Fix:**
```bash
# Check if PostgreSQL is running
sudo systemctl status postgresql

# Verify connection string in .env
# Format: postgresql://USER:PASSWORD@HOST:PORT/DATABASE
```

#### ❌ "EADDRINUSE: Port 5000 already in use"

**Cause:** Another process is using port 5000.

**Fix:**
```bash
# Find the process
lsof -i :5000

# Kill it
kill -9 <PID>

# Or change PORT in .env
PORT=5001
```

#### ❌ "JWT_SECRET is not set"

**Cause:** Missing `.env` file or missing `JWT_SECRET` variable.

**Fix:** Ensure the `.env` file exists in the `backend/` directory and contains `JWT_SECRET`.

#### ❌ "Cannot find module 'xyz'"

**Cause:** Dependencies not installed.

**Fix:**
```bash
cd backend && npm install
cd ../frontend && npm install
```

#### ❌ Thermal printer not printing correctly

**Fix:**
1. Check paper width setting matches your printer (58mm or 80mm)
2. Set margins to **None** in browser print settings
3. Disable browser headers/footers in print dialog
4. Use Chrome or Edge for best print compatibility

#### ❌ "Permission denied" on VPS

**Fix:**
```bash
# Fix ownership
sudo chown -R $USER:$USER /var/www/mobileshop-pro

# Fix node_modules permissions
cd /var/www/mobileshop-pro/backend && npm rebuild
```

#### ❌ Frontend shows blank page after deployment

**Fix:**
1. Verify the frontend was built: `ls frontend/build/`
2. Check Nginx root path points to the build directory
3. Verify the API URL in `frontend/src/api/config.js` is correct
4. Check browser console for errors (F12 → Console)

#### ❌ "Rate limit exceeded"

**Cause:** Too many API requests from one IP.

**Fix:** The default limit is 1,500 requests per minute per IP. If needed, adjust in `server.js`:
```javascript
const apiLimiter = rateLimit({
  windowMs: 1 * 60 * 1000,
  max: 3000, // Increase if needed
});
```

#### ❌ Database migration errors on startup

**Cause:** Schema changes that conflict with existing data.

**Fix:** The system attempts auto-migration. If errors persist:
```bash
# Check server logs
pm2 logs mobileshop-api

# Manually apply missing columns
sudo -u postgres psql -d "mobile-shop"
# Run the ALTER TABLE commands from server.js
```

### Checking Logs

```bash
# PM2 logs (production)
pm2 logs mobileshop-api
pm2 logs mobileshop-api --lines 100

# Real-time monitoring
pm2 monit
```

---

## 16. FAQ

**Q: Can I use MySQL instead of PostgreSQL?**
A: PostgreSQL is required because the system uses Row-Level Security (RLS) for multi-tenant data isolation, which is a PostgreSQL-specific feature.

**Q: Is it mobile responsive?**
A: The system is optimized for desktop/tablet use at the point-of-sale counter. Public pages (warranty check, repair tracking) work on mobile devices.

**Q: Can I run multiple instances on one server?**
A: Yes. Use different ports for each instance and configure Nginx to proxy each domain to its respective port.

**Q: How many shops can it handle?**
A: There is no hard limit. The system uses PostgreSQL RLS for data isolation, which scales efficiently. Dozens of shops on a single instance is typical.

**Q: Can customers access the system?**
A: Customers can access two public pages without logging in:
1. **Warranty Check** (`/warranty`) — Check product warranty by IMEI
2. **Repair Tracking** (`/tracking`) — Check repair status by ticket ID

**Q: How do I update to a newer version?**
A:
```bash
cd /var/www/mobileshop-pro
git pull origin main
cd backend && npm install
cd ../frontend && npm install && npm run build
pm2 restart mobileshop-api
sudo systemctl restart nginx
```

---

## Support

If you encounter any issues not covered in this documentation, please reach out:

- 📧 **Email:** [your-support-email]
- 💬 **CodeCanyon Comments:** Post on the item page
- 🐛 **Bug Reports:** Include error logs and steps to reproduce

---

*Thank you for purchasing MobileShop Pro! We hope it helps you run your mobile phone shop more efficiently.* 🚀
