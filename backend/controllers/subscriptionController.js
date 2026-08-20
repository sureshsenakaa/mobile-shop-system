const { Shop, SubscriptionPayment, AuditLog } = require('../models');
const fs = require('fs');
const path = require('path');
const sharp = require('sharp');

// Ensure upload directory exists
const uploadDir = path.join(__dirname, '../public/uploads/slips');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// 1. Upload Slip (Shop Admin)
exports.uploadSlip = async (req, res) => {
  try {
    const { amount, paymentDate, referenceNumber } = req.body;
    const shopId = req.shopId; // injected by shopScope middleware
    
    if (!req.file) {
      return res.status(400).json({ error: 'Bank slip image is required' });
    }

    // Process image with sharp
    const filename = `slip-${shopId}-${Date.now()}.jpg`;
    const filepath = path.join(uploadDir, filename);

    await sharp(req.file.buffer)
      .resize({ width: 800, withoutEnlargement: true }) // reasonable max size
      .jpeg({ quality: 80 })
      .toFile(filepath);

    const slipImageUrl = `/uploads/slips/${filename}`;

    const payment = await SubscriptionPayment.create({
      shopId,
      amount,
      paymentDate,
      referenceNumber,
      slipImageUrl,
      status: 'Pending'
    });

    await AuditLog.create({
      action: 'Create',
      target: 'SubscriptionPayment',
      description: `Uploaded bank slip for Rs.${amount}`,
      userId: req.user.id,
      shopId
    });

    res.status(201).json(payment);
  } catch (err) {
    console.error('Error uploading slip:', err);
    res.status(500).json({ error: 'Server error uploading slip' });
  }
};

// 2. Get Shop History (Shop Admin)
exports.getShopHistory = async (req, res) => {
  try {
    const shopId = req.shopId;
    const history = await SubscriptionPayment.findAll({
      where: { shopId },
      order: [['dateSubmitted', 'DESC']]
    });
    res.json(history);
  } catch (err) {
    console.error('Error fetching subscription history:', err);
    res.status(500).json({ error: 'Server error fetching history' });
  }
};

// 3. Get All Payments (Super Admin)
exports.getAllPayments = async (req, res) => {
  try {
    const payments = await SubscriptionPayment.findAll({
      include: [{ model: Shop, attributes: ['name', 'ownerName'] }],
      order: [['dateSubmitted', 'DESC']]
    });
    res.json(payments);
  } catch (err) {
    console.error('Error fetching all payments:', err);
    res.status(500).json({ error: 'Server error fetching payments' });
  }
};

// 4. Approve Payment (Super Admin)
exports.approvePayment = async (req, res) => {
  try {
    const { id } = req.params;
    const { extendMonths } = req.body;
    const months = parseInt(extendMonths) || 1;

    const payment = await SubscriptionPayment.findByPk(id, { include: Shop });
    if (!payment) return res.status(404).json({ error: 'Payment not found' });
    
    if (payment.status !== 'Pending') {
      return res.status(400).json({ error: 'Payment is already processed' });
    }

    const shop = payment.Shop;
    
    // Calculate new nextBillingDate
    let currentNextDate = shop.nextBillingDate ? new Date(shop.nextBillingDate) : new Date();
    // If overdue and the date has passed, calculate from today to avoid just catching up to past dates
    if (currentNextDate < new Date()) {
        currentNextDate = new Date();
    }
    
    currentNextDate.setMonth(currentNextDate.getMonth() + months);

    await shop.update({
      billingStatus: 'active',
      nextBillingDate: currentNextDate
    });

    await payment.update({ status: 'Approved', adminNotes: `Approved for ${months} month(s)` });

    await AuditLog.create({
      action: 'Approve',
      target: 'SubscriptionPayment',
      description: `Approved slip #${id} for ${shop.name} (${months} months)`,
      userId: req.user.id,
      shopId: shop.id
    });

    res.json({ success: true, payment, shop });
  } catch (err) {
    console.error('Error approving payment:', err);
    res.status(500).json({ error: 'Server error approving payment' });
  }
};

// 5. Reject Payment (Super Admin)
exports.rejectPayment = async (req, res) => {
  try {
    const { id } = req.params;
    const { reason } = req.body;

    const payment = await SubscriptionPayment.findByPk(id);
    if (!payment) return res.status(404).json({ error: 'Payment not found' });

    if (payment.status !== 'Pending') {
      return res.status(400).json({ error: 'Payment is already processed' });
    }

    await payment.update({ status: 'Rejected', adminNotes: reason || 'Rejected by admin' });

    await AuditLog.create({
      action: 'Reject',
      target: 'SubscriptionPayment',
      description: `Rejected slip #${id}. Reason: ${reason}`,
      userId: req.user.id,
      shopId: payment.shopId
    });

    res.json({ success: true, payment });
  } catch (err) {
    console.error('Error rejecting payment:', err);
    res.status(500).json({ error: 'Server error rejecting payment' });
  }
};
