const { User } = require('../models');
const bcrypt = require('bcrypt');

exports.createStaff = async (req, res) => {
  try {
    const { username, password } = req.body;
    if (!username || !password) {
      return res.status(400).json({ error: 'Username and password required' });
    }

    // Check if username already exists
    const existingUser = await User.findOne({ where: { username } });
    if (existingUser) {
        return res.status(400).json({ error: 'Username already exists' });
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const user = await User.create({
      username,
      passwordHash,
      role: 'staff',
      shopId: req.shopId, // From shopScope middleware
      permissions: req.body.permissions || [],
      basicSalary: req.body.basicSalary || 0,
      commissionRateSales: req.body.commissionRateSales || 0,
      commissionRateRepairs: req.body.commissionRateRepairs || 0
    });

    res.status(201).json({ message: 'Staff created', user: { id: user.id, username: user.username } });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.getStaffList = async (req, res) => {
  try {
    const staff = await User.findAll({
      where: {
        shopId: req.shopId,
        role: 'staff'
      },
      attributes: ['id', 'username', 'role', 'permissions', 'dateCreated', 'basicSalary', 'commissionRateSales', 'commissionRateRepairs']
    });
    res.json(staff);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.deleteStaff = async (req, res) => {
  try {
    const { id } = req.params;
    const user = await User.findOne({ where: { id, shopId: req.shopId, role: 'staff' } });
    if (!user) {
      return res.status(404).json({ error: 'Staff member not found or access denied' });
    }
    await user.destroy();
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.updateStaff = async (req, res) => {
  try {
    const { id } = req.params;
    const { permissions, basicSalary, commissionRateSales, commissionRateRepairs } = req.body;
    const user = await User.findOne({ where: { id, shopId: req.shopId, role: 'staff' } });
    if (!user) return res.status(404).json({ error: 'Staff member not found' });
    
    await user.update({ 
        permissions: permissions || user.permissions,
        basicSalary: basicSalary !== undefined ? basicSalary : user.basicSalary,
        commissionRateSales: commissionRateSales !== undefined ? commissionRateSales : user.commissionRateSales,
        commissionRateRepairs: commissionRateRepairs !== undefined ? commissionRateRepairs : user.commissionRateRepairs
    });
    res.json({ success: true, user });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.getCurrentUser = async (req, res) => {
  try {
    const { Shop } = require('../models');
    const user = await User.findByPk(req.user.id, {
      attributes: ['id', 'username', 'role', 'shopId', 'permissions'],
      include: [{ model: Shop }]
    });
    res.json({
        id: user.id, 
        username: user.username, 
        role: user.role, 
        shopId: user.shopId,
        shopName: user.Shop ? user.Shop.name : (user.role === 'super_admin' ? 'Super Admin' : null),
        logoUrl: user.Shop ? user.Shop.logoUrl : null,
        printLogo: user.Shop ? user.Shop.printLogo : false,
        themeColor: user.Shop ? user.Shop.themeColor : '#3b82f6',
        permissions: user.permissions || []
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
