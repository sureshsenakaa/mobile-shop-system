const { AuditLog, User } = require('../models');

exports.getLogs = async (req, res) => {
  try {
    const logs = await AuditLog.findAll({
      where: { shopId: req.shopId },
      include: [{ model: User, attributes: ['id', 'username', 'role'] }],
      order: [['date', 'DESC']],
      limit: 100 // Only send the last 100 logs to prevent payload bloat
    });
    res.json(logs);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
