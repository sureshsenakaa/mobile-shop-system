const { Shop, User, GlobalNotice } = require('../models');
const bcrypt = require('bcrypt');

exports.createShop = async (req, res) => {
  try {
    const shop = await Shop.create(req.body);
    res.status(201).json(shop);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

exports.getShops = async (req, res) => {
  try {
    const shops = await Shop.findAll({ order: [['dateCreated', 'DESC']] });
    res.json(shops);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.updateShop = async (req, res) => {
  try {
    const { id } = req.params;
    await Shop.update(req.body, { where: { id } });
    const shop = await Shop.findByPk(id);
    res.json(shop);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.createShopAdmin = async (req, res) => {
  try {
    const { id } = req.params; // shopId
    const { username } = req.body;
    
    if (!username) {
      return res.status(400).json({ error: 'Username required' });
    }

    const shop = await Shop.findByPk(id);
    if (!shop) return res.status(404).json({ error: 'Shop not found' });

    // Check if username already exists
    const existingUser = await User.findOne({ where: { username } });
    if (existingUser) {
        return res.status(400).json({ error: 'Username already exists' });
    }

    const temporaryPassword = Math.random().toString(36).slice(-8);
    const passwordHash = await bcrypt.hash(temporaryPassword, 10);
    const user = await User.create({
      username,
      passwordHash,
      role: 'shop_admin',
      shopId: id,
      mustChangePassword: true
    });

    res.status(201).json({ message: 'Shop admin created', temporaryPassword, user: { id: user.id, username: user.username, role: user.role } });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.getNotice = async (req, res) => {
  try {
    const notice = await GlobalNotice.findOne();
    res.json(notice || { message: '', isActive: false });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
