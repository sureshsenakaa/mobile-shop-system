const { Customer } = require('../models');

exports.createCustomer = async (req, res) => {
  try {
    const mobile = req.body.mobile && req.body.mobile.trim();
    if (!mobile) return res.status(400).json({ error: 'Mobile number is required' });

    const existing = await Customer.findOne({ where: { mobile, shopId: req.shopId } });
    if (existing) return res.status(409).json({ error: 'Customer with this mobile number already exists in this shop' });

    const customer = await Customer.create({ ...req.body, mobile, shopId: req.shopId });
    res.status(201).json(customer);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

exports.getCustomers = async (req, res) => {
  try {
    const customers = await Customer.findAll({ where: { shopId: req.shopId } });
    res.json(customers);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.getCustomerById = async (req, res) => {
  try {
    const { id } = req.params;
    const customer = await Customer.findOne({ where: { id, shopId: req.shopId } });
    if (!customer) return res.status(404).json({ error: 'Customer not found' });
    res.json(customer);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.deleteCustomer = async (req, res) => {
  try {
    const { id } = req.params;
    const deleted = await Customer.destroy({ where: { id, shopId: req.shopId } });
    if (!deleted) return res.status(404).json({ error: 'Customer not found' });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.updateCustomer = async (req, res) => {
  try {
    const { id } = req.params;
    const customer = await Customer.findOne({ where: { id, shopId: req.shopId } });
    if (!customer) return res.status(404).json({ error: 'Customer not found' });

    if (req.body.mobile) {
      const mobile = req.body.mobile.trim();
      if (mobile !== customer.mobile) {
        const existing = await Customer.findOne({ where: { mobile, shopId: req.shopId } });
        if (existing) return res.status(409).json({ error: 'Customer with this mobile number already exists in this shop' });
      }
    }

    await customer.update(req.body);
    res.json(customer);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

exports.payCustomerDebt = async (req, res) => {
  try {
    const { id } = req.params;
    const { amount } = req.body;
    
    if (!amount || amount <= 0) return res.status(400).json({ error: 'Valid payment amount is required' });
    
    const customer = await Customer.findOne({ where: { id, shopId: req.shopId } });
    if (!customer) return res.status(404).json({ error: 'Customer not found' });
    
    if (customer.outstandingCredit < amount) {
      return res.status(400).json({ error: 'Payment amount exceeds outstanding credit' });
    }
    
    await customer.decrement('outstandingCredit', { by: amount });
    
    // We should also log this as income
    const { Expense } = require('../models');
    await Expense.create({
      category: 'Credit Payment Received',
      amount: -amount, // Negative expense = income
      date: new Date(),
      notes: `Debt settlement from ${customer.name} (Mobile: ${customer.mobile})`,
      shopId: req.shopId
    });
    
    res.json({ success: true, outstandingCredit: customer.outstandingCredit - amount });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
