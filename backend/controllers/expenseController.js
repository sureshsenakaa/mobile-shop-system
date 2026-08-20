const { Expense, sequelize } = require('../models');
const { Op } = require('sequelize');

exports.createExpense = async (req, res) => {
  try {
    const expense = await Expense.create({ ...req.body, shopId: req.shopId });
    res.status(201).json(expense);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

exports.getExpenses = async (req, res) => {
  try {
    const { month } = req.query;
    if (month) {
      const start = new Date(`${month}-01T00:00:00.000Z`);
      const end = new Date(start);
      end.setMonth(end.getMonth() + 1);
      const expenses = await Expense.findAll({
        where: { date: { [Op.gte]: start, [Op.lt]: end }, shopId: req.shopId },
        order: [['date', 'ASC']]
      });
      return res.json(expenses);
    }
    const expenses = await Expense.findAll({ 
      where: { shopId: req.shopId },
      order: [['date', 'DESC']] 
    });
    res.json(expenses);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.getMonthlyExpenses = async (req, res) => {
  try {
    const { month } = req.query;
    let where = { shopId: req.shopId };
    if (month) {
      const start = new Date(`${month}-01T00:00:00.000Z`);
      const end = new Date(start);
      end.setMonth(end.getMonth() + 1);
      where.date = { [Op.gte]: start, [Op.lt]: end };
    }

    const agg = await Expense.findAll({
      where,
      attributes: [
        'category',
        [sequelize.fn('SUM', sequelize.col('amount')), 'total'],
        [sequelize.fn('COUNT', sequelize.col('id')), 'count']
      ],
      group: ['category']
    });

    res.json(agg.map(a => ({
      category: a.category,
      total: Number(a.getDataValue('total')),
      count: Number(a.getDataValue('count'))
    })));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.updateExpense = async (req, res) => {
  try {
    const { id } = req.params;
    const expense = await Expense.findOne({ where: { id, shopId: req.shopId } });
    if (!expense) return res.status(404).json({ error: 'Expense not found' });
    
    await expense.update(req.body);
    res.json(expense);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

exports.deleteExpense = async (req, res) => {
  try {
    const { id } = req.params;
    const deleted = await Expense.destroy({ where: { id, shopId: req.shopId } });
    if (!deleted) return res.status(404).json({ error: 'Expense not found' });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
