// Mongoose models for mobile shop system
const mongoose = require('mongoose');

const customerSchema = new mongoose.Schema({
  firstName: { type: String, required: true },
  lastName: { type: String, required: true },
  mobile: { type: String, required: true },
  email: { type: String },
  address1: { type: String },
  address2: { type: String },
  city: { type: String },
  state: { type: String },
  zip: { type: String },
  marketingOptIn: { type: Boolean, default: false },
  notes: { type: String },
  profilePhoto: { type: String },
  dateAdded: { type: Date, default: Date.now }
});

const productSchema = new mongoose.Schema({
  brand: { type: String, required: true },
  model: { type: String, required: true },
  ram: { type: String },
  storage: { type: String },
  color: { type: String },
  price: { type: Number, required: true },
  cost: { type: Number, default: 0 },
  accessoryType: { type: String },
  dateAdded: { type: Date, default: Date.now },
  imei: { type: String },
  investor: { type: mongoose.Schema.Types.ObjectId, ref: 'Investor' },
  investorName: { type: String },
  stock: { type: Number, required: true },
  barcode: { type: String },
  supplier: { type: mongoose.Schema.Types.ObjectId, ref: 'Supplier' },
  supplierName: { type: String }
});

const saleSchema = new mongoose.Schema({
  // support multiple items per sale
  items: [{
    productId: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
    productName: { type: String },
    price: { type: Number, required: true },
    quantity: { type: Number, required: true },
    subtotal: { type: Number, required: true }
  }],
  customerName: { type: String },
  customerMobile: { type: String },
  subtotal: { type: Number, required: true }, // sum of item subtotals
  discount: { type: Number, default: 0 },
  total: { type: Number, required: true }, // net amount after discount
  date: { type: Date, default: Date.now },
  returned: { type: Boolean, default: false }
});

const repairSchema = new mongoose.Schema({
  customerName: { type: String },
  customerMobile: { type: String },
  customerId: { type: mongoose.Schema.Types.ObjectId, ref: 'Customer' },
  device: { type: String },
  issue: { type: String },
  cost: { type: Number, default: 0 },
  status: { type: String, default: 'Pending' },
  dateCreated: { type: Date, default: Date.now }
});

const supplierSchema = new mongoose.Schema({
  name: { type: String, required: true },
  phone: { type: String, required: true },
  email: { type: String },
  address: { type: String },
  city: { type: String },
  zip: { type: String },
  accountNumber: { type: String },
  notes: { type: String },
  dateAdded: { type: Date, default: Date.now },
  // Aggregate of stock across products assigned to this supplier
  totalStock: { type: Number, default: 0 }
});

const expenseSchema = new mongoose.Schema({
  category: { type: String, required: true },
  amount: { type: Number, required: true },
  date: { type: Date, default: Date.now },
  notes: { type: String }
});

const investorSchema = new mongoose.Schema({
  name: { type: String, required: true },
  amountInvested: { type: Number, required: true },
  dateInvested: { type: Date, default: Date.now },
  monthlyRate: { type: Number, required: true }, // percentage e.g., 2 for 2% per month
  nextPaymentDate: { type: Date },
  notes: { type: String }
});

const userSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true },
  passwordHash: { type: String, required: true },
  role: { type: String, default: 'user' },
  dateCreated: { type: Date, default: Date.now }
});

module.exports = {
  Customer: mongoose.model('Customer', customerSchema),
  Product: mongoose.model('Product', productSchema),
  Sale: mongoose.model('Sale', saleSchema),
  Repair: mongoose.model('Repair', repairSchema),
  Supplier: mongoose.model('Supplier', supplierSchema)
  , Expense: mongoose.model('Expense', expenseSchema)
  , Investor: mongoose.model('Investor', investorSchema)
  , User: mongoose.model('User', userSchema)
};
