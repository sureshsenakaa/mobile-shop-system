const { Shop, User, SubscriptionPayment, GlobalNotice } = require('../models');
const { Op } = require('sequelize');

exports.getAllShops = async (req, res) => {
  try {
    const shops = await Shop.findAll({ order: [['dateCreated', 'DESC']] });
    const users = await User.findAll({ attributes: ['shopId', 'lastLoginAt'] });
    
    const lastActiveMap = {};
    users.forEach(u => {
      if (u.shopId && u.lastLoginAt) {
        if (!lastActiveMap[u.shopId] || new Date(u.lastLoginAt) > new Date(lastActiveMap[u.shopId])) {
          lastActiveMap[u.shopId] = u.lastLoginAt;
        }
      }
    });

    const shopsWithLastActive = shops.map(shop => {
      const shopObj = shop.toJSON();
      shopObj.lastActive = lastActiveMap[shop.id] || null;
      return shopObj;
    });

    res.json(shopsWithLastActive);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.getRevenueStats = async (req, res) => {
  try {
    const payments = await SubscriptionPayment.findAll({
      where: { status: 'Approved' }
    });

    let totalRevenue = 0;
    let mrr = 0;
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();

    payments.forEach(p => {
      totalRevenue += p.amount;
      const paymentDate = new Date(p.paymentDate);
      if (paymentDate.getMonth() === currentMonth && paymentDate.getFullYear() === currentYear) {
        mrr += p.amount;
      }
    });

    res.json({ totalRevenue, mrr });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.updateGlobalNotice = async (req, res) => {
  try {
    const { message, isActive } = req.body;
    
    let notice = await GlobalNotice.findOne();
    if (notice) {
      notice.message = message !== undefined ? message : notice.message;
      notice.isActive = isActive !== undefined ? isActive : notice.isActive;
      await notice.save();
    } else {
      notice = await GlobalNotice.create({ message, isActive });
    }

    res.json(notice);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.getGlobalNotice = async (req, res) => {
  try {
    const notice = await GlobalNotice.findOne();
    res.json(notice || { message: '', isActive: false });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
