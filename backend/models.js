const cls = require('cls-hooked');
const namespace = cls.createNamespace('multi-tenant-rls');
const { Sequelize, DataTypes } = require('sequelize');
Sequelize.useCLS(namespace);

const sequelize = new Sequelize(process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/mobile-shop', {
  dialect: 'postgres',
  logging: false,
});

const commonVirtuals = {
  _id: {
    type: DataTypes.VIRTUAL,
    get() {
      return this.id;
    }
  }
};

const Shop = sequelize.define('Shop', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  ...commonVirtuals,
  name: { type: DataTypes.STRING, allowNull: false },
  ownerName: { type: DataTypes.STRING },
  phone: { type: DataTypes.STRING },
  address: { type: DataTypes.STRING },
  isActive: { type: DataTypes.BOOLEAN, defaultValue: true },
  logoUrl: { type: DataTypes.STRING },
  printLogo: { type: DataTypes.BOOLEAN, defaultValue: false },
  themeColor: { type: DataTypes.STRING, defaultValue: '#3b82f6' },
  billingStatus: { type: DataTypes.STRING, defaultValue: 'active' }, // 'active', 'overdue'
  nextBillingDate: { type: DataTypes.DATE },
  dateCreated: { type: DataTypes.DATE, defaultValue: Sequelize.NOW }
});

const Customer = sequelize.define('Customer', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  ...commonVirtuals,
  name: { type: DataTypes.STRING, allowNull: false },
  mobile: { type: DataTypes.STRING, allowNull: false },
  email: { type: DataTypes.STRING },
  address1: { type: DataTypes.STRING },
  address2: { type: DataTypes.STRING },
  city: { type: DataTypes.STRING },
  state: { type: DataTypes.STRING },
  zip: { type: DataTypes.STRING },
  marketingOptIn: { type: DataTypes.BOOLEAN, defaultValue: false },
  notes: { type: DataTypes.TEXT },
  profilePhoto: { type: DataTypes.STRING },
  dateAdded: { type: DataTypes.DATE, defaultValue: Sequelize.NOW },
  customerType: { type: DataTypes.STRING, defaultValue: 'Regular' }, // 'Regular', 'VIP', 'Wholesale'
  outstandingCredit: { type: DataTypes.FLOAT, defaultValue: 0 },
  creditLimit: { type: DataTypes.FLOAT, defaultValue: 0 },
  deviceNotes: { type: DataTypes.STRING }
});

const Supplier = sequelize.define('Supplier', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  ...commonVirtuals,
  name: { type: DataTypes.STRING, allowNull: false },
  phone: { type: DataTypes.STRING, allowNull: false },
  email: { type: DataTypes.STRING },
  address: { type: DataTypes.STRING },
  city: { type: DataTypes.STRING },
  zip: { type: DataTypes.STRING },
  accountNumber: { type: DataTypes.STRING },
  notes: { type: DataTypes.TEXT },
  dateAdded: { type: DataTypes.DATE, defaultValue: Sequelize.NOW },
  totalStock: { type: DataTypes.INTEGER, defaultValue: 0 },
  categories: { type: DataTypes.JSON, defaultValue: [] },
  brands: { type: DataTypes.JSON, defaultValue: [] },
  warrantyTerms: { type: DataTypes.STRING },
  outstandingBalance: { type: DataTypes.FLOAT, defaultValue: 0 },
  creditLimit: { type: DataTypes.FLOAT, defaultValue: 0 }
});

const Investor = sequelize.define('Investor', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  ...commonVirtuals,
  name: { type: DataTypes.STRING, allowNull: false },
  amountInvested: { type: DataTypes.FLOAT, allowNull: false },
  dateInvested: { type: DataTypes.DATE, defaultValue: Sequelize.NOW },
  monthlyRate: { type: DataTypes.FLOAT, allowNull: false },
  nextPaymentDate: { type: DataTypes.DATE },
  notes: { type: DataTypes.TEXT }
});

const Product = sequelize.define('Product', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  ...commonVirtuals,
  brand: { type: DataTypes.STRING, allowNull: false },
  model: { type: DataTypes.STRING, allowNull: false },
  ram: { type: DataTypes.STRING },
  storage: { type: DataTypes.STRING },
  color: { type: DataTypes.STRING },
  price: { type: DataTypes.FLOAT, allowNull: false },
  cost: { type: DataTypes.FLOAT, defaultValue: 0 },
  accessoryType: { type: DataTypes.STRING },
  dateAdded: { type: DataTypes.DATE, defaultValue: Sequelize.NOW },
  imei: { type: DataTypes.STRING },
  imeiList: { type: DataTypes.JSON, defaultValue: [] },
  investorName: { type: DataTypes.STRING },
  stock: { type: DataTypes.INTEGER, allowNull: false },
  barcode: { type: DataTypes.STRING },
  supplierName: { type: DataTypes.STRING },
  warrantyPeriodDays: { type: DataTypes.INTEGER, defaultValue: 0 }
});

const Part = sequelize.define('Part', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  ...commonVirtuals,
  partName: { type: DataTypes.STRING, allowNull: false },
  category: { type: DataTypes.STRING, defaultValue: 'Other' },
  phoneModel: { type: DataTypes.STRING },
  sku: { type: DataTypes.STRING, allowNull: true },
  barcode: { type: DataTypes.STRING },
  quantity: { type: DataTypes.INTEGER, defaultValue: 0 },
  cost: { type: DataTypes.FLOAT, defaultValue: 0 },
  dateAdded: { type: DataTypes.DATE, defaultValue: Sequelize.NOW }
});

const Sale = sequelize.define('Sale', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  ...commonVirtuals,
  customerName: { type: DataTypes.STRING },
  customerMobile: { type: DataTypes.STRING },
  subtotal: { type: DataTypes.FLOAT, allowNull: false },
  discount: { type: DataTypes.FLOAT, defaultValue: 0 },
  total: { type: DataTypes.FLOAT, allowNull: false },
  date: { type: DataTypes.DATE, defaultValue: Sequelize.NOW },
  returned: { type: DataTypes.BOOLEAN, defaultValue: false },
  paymentMethod: { type: DataTypes.JSON, defaultValue: { cash: 0, card: 0, bank: 0, credit: 0 } },
  commissionAmount: { type: DataTypes.FLOAT, defaultValue: 0 },
  commissionTo: { type: DataTypes.INTEGER }
});

const SaleItem = sequelize.define('SaleItem', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  ...commonVirtuals,
  productName: { type: DataTypes.STRING },
  price: { type: DataTypes.FLOAT, allowNull: false },
  quantity: { type: DataTypes.INTEGER, allowNull: false },
  subtotal: { type: DataTypes.FLOAT, allowNull: false },
  imei: { type: DataTypes.STRING },
  warrantyExpiry: { type: DataTypes.DATE }
  // shopId added via Shop.hasMany relationship below
});

const Repair = sequelize.define('Repair', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  ...commonVirtuals,
  repairId: { type: DataTypes.STRING }, // Unique ticket ID
  customerName: { type: DataTypes.STRING },
  customerMobile: { type: DataTypes.STRING },
  serviceType: { type: DataTypes.STRING, defaultValue: 'Carry In' },
  brand: { type: DataTypes.STRING },
  device: { type: DataTypes.STRING },
  serialNumber: { type: DataTypes.STRING },
  lockCredential: { type: DataTypes.STRING },
  issue: { type: DataTypes.STRING }, // problemReported
  productCondition: { type: DataTypes.STRING },
  assignedTechnician: { type: DataTypes.STRING },
  technicianComment: { type: DataTypes.STRING },
  estimatedCost: { type: DataTypes.FLOAT, defaultValue: 0 },
  cost: { type: DataTypes.FLOAT, defaultValue: 0 }, // totalPrice
  paidAmount: { type: DataTypes.FLOAT, defaultValue: 0 },
  usedParts: { type: DataTypes.JSON, defaultValue: [] },
  status: { type: DataTypes.STRING, defaultValue: 'Pending' }, // Pending, Waiting Parts, Complete
  dueDate: { type: DataTypes.STRING },
  dateCreated: { type: DataTypes.DATE, defaultValue: Sequelize.NOW },
  warrantyExpiry: { type: DataTypes.DATE },
  commissionAmount: { type: DataTypes.FLOAT, defaultValue: 0 },
  commissionTo: { type: DataTypes.INTEGER }
});

const Expense = sequelize.define('Expense', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  ...commonVirtuals,
  category: { type: DataTypes.STRING, allowNull: false },
  amount: { type: DataTypes.FLOAT, allowNull: false },
  date: { type: DataTypes.DATE, defaultValue: Sequelize.NOW },
  notes: { type: DataTypes.TEXT }
});

const User = sequelize.define('User', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  ...commonVirtuals,
  username: { type: DataTypes.STRING, allowNull: false, unique: true },
  passwordHash: { type: DataTypes.STRING, allowNull: false },
  role: { type: DataTypes.STRING, defaultValue: 'staff' }, // 'super_admin', 'shop_admin', 'staff'
  permissions: { type: DataTypes.JSON, defaultValue: [] },
  basicSalary: { type: DataTypes.FLOAT, defaultValue: 0 },
  commissionRateSales: { type: DataTypes.FLOAT, defaultValue: 0 },
  commissionRateRepairs: { type: DataTypes.FLOAT, defaultValue: 0 },
  passwordChangedAt: { type: DataTypes.DATE },
  twoFactorSecret: { type: DataTypes.STRING },
  twoFactorEnabled: { type: DataTypes.BOOLEAN, defaultValue: false },
  mustChangePassword: { type: DataTypes.BOOLEAN, defaultValue: false },
  failedLoginAttempts: { type: DataTypes.INTEGER, defaultValue: 0 },
  lockoutUntil: { type: DataTypes.DATE },
  lastLoginAt: { type: DataTypes.DATE },
  dateCreated: { type: DataTypes.DATE, defaultValue: Sequelize.NOW }
});

const AuditLog = sequelize.define('AuditLog', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  ...commonVirtuals,
  action: { type: DataTypes.STRING, allowNull: false },
  target: { type: DataTypes.STRING }, // e.g. "Product", "Sale"
  description: { type: DataTypes.STRING },
  date: { type: DataTypes.DATE, defaultValue: Sequelize.NOW }
});

const PurchaseOrder = sequelize.define('PurchaseOrder', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  ...commonVirtuals,
  supplierId: { type: DataTypes.INTEGER },
  status: { type: DataTypes.STRING, defaultValue: 'Draft' }, // Draft, Sent, Received, Cancelled
  items: { type: DataTypes.JSON, defaultValue: [] }, // Array of { productId, quantity, cost }
  totalAmount: { type: DataTypes.FLOAT, defaultValue: 0 },
  dateCreated: { type: DataTypes.DATE, defaultValue: Sequelize.NOW }
});

const Return = sequelize.define('Return', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  ...commonVirtuals,
  saleId: { type: DataTypes.INTEGER },
  customerId: { type: DataTypes.INTEGER },
  itemsReturned: { type: DataTypes.JSON, defaultValue: [] }, // Array of { productId, quantity, imei, refundAmount, reason }
  totalRefund: { type: DataTypes.FLOAT, defaultValue: 0 },
  dateCreated: { type: DataTypes.DATE, defaultValue: Sequelize.NOW }
});

const SubscriptionPayment = sequelize.define('SubscriptionPayment', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  ...commonVirtuals,
  amount: { type: DataTypes.FLOAT, allowNull: false },
  paymentDate: { type: DataTypes.DATE, allowNull: false },
  referenceNumber: { type: DataTypes.STRING, allowNull: false },
  slipImageUrl: { type: DataTypes.STRING, allowNull: false },
  status: { type: DataTypes.STRING, defaultValue: 'Pending' }, // Pending, Approved, Rejected
  adminNotes: { type: DataTypes.STRING },
  dateSubmitted: { type: DataTypes.DATE, defaultValue: Sequelize.NOW }
});

const CashRegister = sequelize.define('CashRegister', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  ...commonVirtuals,
  date: { type: DataTypes.DATEONLY, allowNull: false },
  openingBalance: { type: DataTypes.FLOAT, defaultValue: 0 },
  closingBalance: { type: DataTypes.FLOAT },
  expectedBalance: { type: DataTypes.FLOAT },
  difference: { type: DataTypes.FLOAT, defaultValue: 0 },
  notes: { type: DataTypes.TEXT },
  status: { type: DataTypes.STRING, defaultValue: 'open' },
  closedBy: { type: DataTypes.INTEGER },
  closedAt: { type: DataTypes.DATE }
});

const Quotation = sequelize.define('Quotation', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  ...commonVirtuals,
  quotationNumber: { type: DataTypes.STRING },
  customerName: { type: DataTypes.STRING },
  customerMobile: { type: DataTypes.STRING },
  items: { type: DataTypes.JSON, defaultValue: [] },
  subtotal: { type: DataTypes.FLOAT, allowNull: false },
  discount: { type: DataTypes.FLOAT, defaultValue: 0 },
  total: { type: DataTypes.FLOAT, allowNull: false },
  validUntil: { type: DataTypes.DATE },
  status: { type: DataTypes.STRING, defaultValue: 'pending' },
  convertedSaleId: { type: DataTypes.INTEGER },
  notes: { type: DataTypes.TEXT },
  dateCreated: { type: DataTypes.DATE, defaultValue: Sequelize.NOW }
});

const GlobalNotice = sequelize.define('GlobalNotice', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  message: { type: DataTypes.TEXT, allowNull: false },
  isActive: { type: DataTypes.BOOLEAN, defaultValue: true },
  createdAt: { type: DataTypes.DATE, defaultValue: Sequelize.NOW }
});

// Shop Relationships
Shop.hasMany(User, { foreignKey: 'shopId' });
User.belongsTo(Shop, { foreignKey: 'shopId' });

Shop.hasMany(Customer, { foreignKey: 'shopId' });
Customer.belongsTo(Shop, { foreignKey: 'shopId' });

Shop.hasMany(Supplier, { foreignKey: 'shopId' });
Supplier.belongsTo(Shop, { foreignKey: 'shopId' });

Shop.hasMany(Investor, { foreignKey: 'shopId' });
Investor.belongsTo(Shop, { foreignKey: 'shopId' });

Shop.hasMany(Product, { foreignKey: 'shopId' });
Product.belongsTo(Shop, { foreignKey: 'shopId' });

Shop.hasMany(Part, { foreignKey: 'shopId' });
Part.belongsTo(Shop, { foreignKey: 'shopId' });

Shop.hasMany(Sale, { foreignKey: 'shopId' });
Sale.belongsTo(Shop, { foreignKey: 'shopId' });

Shop.hasMany(Repair, { foreignKey: 'shopId' });
Repair.belongsTo(Shop, { foreignKey: 'shopId' });

Shop.hasMany(Expense, { foreignKey: 'shopId' });
Expense.belongsTo(Shop, { foreignKey: 'shopId' });

Shop.hasMany(SaleItem, { foreignKey: 'shopId' });
SaleItem.belongsTo(Shop, { foreignKey: 'shopId' });

Shop.hasMany(AuditLog, { foreignKey: 'shopId' });
AuditLog.belongsTo(Shop, { foreignKey: 'shopId' });

User.hasMany(AuditLog, { foreignKey: 'userId' });
AuditLog.belongsTo(User, { foreignKey: 'userId' });

Shop.hasMany(PurchaseOrder, { foreignKey: 'shopId' });
PurchaseOrder.belongsTo(Shop, { foreignKey: 'shopId' });

Shop.hasMany(Return, { foreignKey: 'shopId' });
Return.belongsTo(Shop, { foreignKey: 'shopId' });

Shop.hasMany(SubscriptionPayment, { foreignKey: 'shopId' });
SubscriptionPayment.belongsTo(Shop, { foreignKey: 'shopId' });

Shop.hasMany(CashRegister, { foreignKey: 'shopId' });
CashRegister.belongsTo(Shop, { foreignKey: 'shopId' });

Shop.hasMany(Quotation, { foreignKey: 'shopId' });
Quotation.belongsTo(Shop, { foreignKey: 'shopId' });

// Existing Relationships
Investor.hasMany(Product, { foreignKey: 'investor' });
Product.belongsTo(Investor, { foreignKey: 'investor' });

Supplier.hasMany(Product, { foreignKey: 'supplier' });
Product.belongsTo(Supplier, { foreignKey: 'supplier' });

Sale.hasMany(SaleItem, { foreignKey: 'saleId', as: 'items' });
SaleItem.belongsTo(Sale, { foreignKey: 'saleId' });

Product.hasMany(SaleItem, { foreignKey: 'productId' });
SaleItem.belongsTo(Product, { foreignKey: 'productId' });

Customer.hasMany(Repair, { foreignKey: 'customerId' });
Repair.belongsTo(Customer, { foreignKey: 'customerId' });

module.exports = {
  sequelize,
  Shop,
  Customer,
  Product,
  Part,
  Sale,
  SaleItem,
  Repair,
  Supplier,
  Expense,
  Investor,
  User,
  AuditLog,
  PurchaseOrder,
  Return,
  SubscriptionPayment,
  CashRegister,
  Quotation,
  GlobalNotice
};
