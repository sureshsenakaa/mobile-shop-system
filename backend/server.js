require('dotenv').config();

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const bcrypt = require('bcrypt');
const { sequelize, User, Shop } = require('./models');

const authRoutes = require('./routes/authRoutes');
const shopRoutes = require('./routes/shopRoutes');
const userRoutes = require('./routes/userRoutes');
const customerRoutes = require('./routes/customerRoutes');
const productRoutes = require('./routes/productRoutes');
const saleRoutes = require('./routes/saleRoutes');
const repairRoutes = require('./routes/repairRoutes');
const supplierRoutes = require('./routes/supplierRoutes');
const expenseRoutes = require('./routes/expenseRoutes');
const investorRoutes = require('./routes/investorRoutes');
const partRoutes = require('./routes/partRoutes');
const auditLogRoutes = require('./routes/auditLogRoutes');
const warrantyRoutes = require('./routes/warrantyRoutes');
const publicRoutes = require('./routes/publicRoutes');
const payrollRoutes = require('./routes/payrollRoutes');
const poRoutes = require('./routes/poRoutes');
const returnRoutes = require('./routes/returnRoutes');
const analyticsRoutes = require('./routes/analyticsRoutes');

const app = express();
app.use(express.json());
app.use(cors());
app.use(helmet());

// Simple request logger
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.originalUrl}`);
  next();
});

const rateLimit = require('express-rate-limit');
const apiLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 300, // Limit each IP to 300 requests per `window` (here, per 1 minute)
  message: { error: 'Too many requests from this IP, please try again after a minute' },
  standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
  legacyHeaders: false, // Disable the `X-RateLimit-*` headers
});

app.use('/api', apiLimiter);

// Serve static uploads (for logos)
app.use('/uploads', express.static(require('path').join(__dirname, 'public', 'uploads')));

// Global Audit Logger for modifying requests
const { globalAuditLogger } = require('./middleware/auditLogger');
app.use(globalAuditLogger);

// Public Routes (No Auth/RLS)
app.use('/api/public', publicRoutes);

// Use routes
app.use('/api/auth', authRoutes);
app.use('/api/admin', require('./routes/adminRoutes'));
app.use('/api/shops', shopRoutes);
app.use('/api/users', userRoutes);
app.use('/api/settings', require('./routes/settingsRoutes'));
app.use('/api/customers', customerRoutes);
app.use('/api/products', productRoutes);
app.use('/api/sales', saleRoutes);
app.use('/api/repairs', repairRoutes);
app.use('/api/suppliers', supplierRoutes);
app.use('/api/expenses', expenseRoutes);
app.use('/api/investors', investorRoutes);
app.use('/api/parts', partRoutes);
app.use('/api/audit-logs', auditLogRoutes);
app.use('/api/warranty', warrantyRoutes);
app.use('/api/payroll', payrollRoutes);
app.use('/api/purchase-orders', poRoutes);
app.use('/api/returns', returnRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/subscriptions', require('./routes/subscriptionRoutes'));
app.use('/api/cash-register', require('./routes/cashRegisterRoutes'));
app.use('/api/quotations', require('./routes/quotationRoutes'));

app.get('/', (req, res) => {
  res.send('Mobile Shop Backend API (Multi-Tenant)');
});

// Return JSON for any unmatched /api routes
app.use('/api', (req, res) => {
  res.status(404).json({ error: `API endpoint not found: ${req.method} ${req.originalUrl}` });
});

// Setup DB and Seed Data
sequelize.authenticate()
  .then(async () => {
    console.log('PostgreSQL connected');
    try {
      await sequelize.query('ALTER TABLE IF EXISTS "Parts" ADD COLUMN IF NOT EXISTS "category" VARCHAR(255) DEFAULT \'Other\';');
      await sequelize.query('ALTER TABLE IF EXISTS "Parts" ADD COLUMN IF NOT EXISTS "phoneModel" VARCHAR(255);');
      await sequelize.query('ALTER TABLE IF EXISTS "Parts" ADD COLUMN IF NOT EXISTS "barcode" VARCHAR(255);');
      await sequelize.query('ALTER TABLE IF EXISTS "Parts" ADD COLUMN IF NOT EXISTS "shopId" INTEGER;');
      await sequelize.query('ALTER TABLE IF EXISTS "Parts" ALTER COLUMN "sku" DROP NOT NULL;').catch(() => {});
      await sequelize.query('ALTER TABLE IF EXISTS "PurchaseOrders" ADD COLUMN IF NOT EXISTS "shopId" INTEGER;');
      await sequelize.query('ALTER TABLE IF EXISTS "Returns" ADD COLUMN IF NOT EXISTS "shopId" INTEGER;');
      await sequelize.query('ALTER TABLE IF EXISTS "Users" ADD COLUMN IF NOT EXISTS "basicSalary" DOUBLE PRECISION DEFAULT 0;');
    } catch (e) {
      console.log('Schema migration notice:', e.message);
    }
    // Use sync() without alter/force for production safety.
    return sequelize.sync(); 
  })
  .then(async () => {
    console.log('Database synchronized');

    try {
      // 1. Ensure Super Admin exists (using environment variables)
      const initialAdminUser = process.env.INITIAL_ADMIN_USER || 'sureshsenaka76';
      const initialAdminPass = process.env.INITIAL_ADMIN_PASS || 'Sure@#600660';

      let superAdmin = await User.findOne({ where: { role: 'super_admin' } });
      if (!superAdmin) {
        const passwordHash = await bcrypt.hash(initialAdminPass, 10);
        superAdmin = await User.create({
          username: initialAdminUser,
          passwordHash,
          role: 'super_admin',
          shopId: null // Super admin has no specific shop
        });
        console.log(`Default super admin created (${initialAdminUser})`);
      } else if (superAdmin.username === 'admin') {
        // Automatically migrate legacy default admin to configured credentials
        const passwordHash = await bcrypt.hash(initialAdminPass, 10);
        await superAdmin.update({
          username: initialAdminUser,
          passwordHash
        });
        console.log(`Updated legacy super admin username and password to (${initialAdminUser})`);
      }

      // 2. Ensure a default Shop exists for data migration
      let defaultShop = await Shop.findOne({ where: { name: 'Main Shop' } });
      if (!defaultShop) {
        defaultShop = await Shop.create({
          name: 'Main Shop',
          ownerName: 'Admin',
          isActive: true
        });
        console.log('Default shop "Main Shop" created.');

        // Also create a shop admin for this default shop
        const initialShopAdminUser = process.env.INITIAL_SHOP_ADMIN_USER || 'shopadmin';
        const initialShopAdminPass = process.env.INITIAL_SHOP_ADMIN_PASS || 'ShopAdmin@2026';
        const adminHash = await bcrypt.hash(initialShopAdminPass, 10);
        await User.create({
          username: initialShopAdminUser,
          passwordHash: adminHash,
          role: 'shop_admin',
          shopId: defaultShop.id
        });
        console.log(`Default shop admin created (${initialShopAdminUser})`);
      }

      // 3. Migrate existing records (set their shopId to the default shop)
      // This allows existing users to retain their data without errors
      const modelsToUpdate = [
        require('./models').Customer,
        require('./models').Product,
        require('./models').Sale,
        require('./models').Repair,
        require('./models').Supplier,
        require('./models').Expense,
        require('./models').Investor,
        require('./models').User
      ];

      for (const Model of modelsToUpdate) {
        if (Model.name !== 'User') { // Avoid changing super_admin's shopId
          const count = await Model.count({ where: { shopId: null } });
          if (count > 0) {
            await Model.update({ shopId: defaultShop.id }, { where: { shopId: null } });
            console.log(`Migrated ${count} records in ${Model.name} to default shop.`);
          }
        } else {
          // For users, migrate only those who are not super admins and have no shopId
          const { Op } = require('sequelize');
          const count = await User.count({ where: { shopId: null, role: { [Op.ne]: 'super_admin' } } });
          if (count > 0) {
            await User.update({ shopId: defaultShop.id }, { where: { shopId: null, role: { [Op.ne]: 'super_admin' } } });
            console.log(`Migrated ${count} staff/admin users to default shop.`);
          }
        }
      }

    } catch (seedErr) {
      console.error('Error seeding database:', seedErr);
    }

    // 4. Set up PostgreSQL Row-Level Security (RLS)
    try {
      const { setupRLS } = require('./setup_rls');
      await setupRLS();
    } catch (rlsErr) {
      console.error('RLS setup error:', rlsErr);
    }
  })
  .catch((err) => {
    console.error('PostgreSQL connection error:', err);
  });

// 5. Cron Job to delete Audit Logs older than 60 days
const cron = require('node-cron');
const { Op } = require('sequelize');

// Runs every day at midnight
cron.schedule('0 0 * * *', async () => {
  try {
    const sixtyDaysAgo = new Date();
    sixtyDaysAgo.setDate(sixtyDaysAgo.getDate() - 60);

    const { AuditLog } = require('./models');
    const deletedCount = await AuditLog.destroy({
      where: {
        date: { [Op.lt]: sixtyDaysAgo }
      }
    });

    if (deletedCount > 0) {
      console.log(`CRON: Deleted ${deletedCount} old audit logs.`);
    }
  } catch (err) {
    console.error('CRON Error deleting old logs:', err);
  }
});

// Global Error Handler (must be the last middleware)
app.use(require('./middleware/errorHandler'));

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
