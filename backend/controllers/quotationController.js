const { Quotation, Sale, SaleItem, Product, Expense, Supplier, Customer, sequelize } = require('../models');
const { Op } = require('sequelize');

exports.createQuotation = async (req, res) => {
  try {
    // Auto-generate quotation number
    const lastQt = await Quotation.findOne({
      where: { shopId: req.shopId },
      order: [['id', 'DESC']]
    });

    let nextNum = 1;
    if (lastQt && lastQt.quotationNumber) {
      const match = lastQt.quotationNumber.match(/QT-(\d+)/);
      if (match) nextNum = parseInt(match[1]) + 1;
    }
    const quotationNumber = `QT-${String(nextNum).padStart(4, '0')}`;

    const quotation = await Quotation.create({
      ...req.body,
      quotationNumber,
      shopId: req.shopId
    });

    res.status(201).json(quotation);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

exports.getQuotations = async (req, res) => {
  try {
    const where = { shopId: req.shopId };
    const { status } = req.query;

    if (status) {
      where.status = status;
    }

    const quotations = await Quotation.findAll({
      where,
      order: [['dateCreated', 'DESC']]
    });

    res.json(quotations);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.getQuotation = async (req, res) => {
  try {
    const { id } = req.params;
    const quotation = await Quotation.findOne({
      where: { id, shopId: req.shopId }
    });

    if (!quotation) {
      return res.status(404).json({ error: 'Quotation not found' });
    }

    res.json(quotation);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.updateQuotation = async (req, res) => {
  try {
    const { id } = req.params;
    const quotation = await Quotation.findOne({
      where: { id, shopId: req.shopId }
    });

    if (!quotation) {
      return res.status(404).json({ error: 'Quotation not found' });
    }

    if (quotation.status !== 'pending') {
      return res.status(400).json({ error: 'Only pending quotations can be updated' });
    }

    await quotation.update(req.body);
    res.json(quotation);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

exports.deleteQuotation = async (req, res) => {
  try {
    const { id } = req.params;
    const deleted = await Quotation.destroy({
      where: { id, shopId: req.shopId }
    });

    if (!deleted) {
      return res.status(404).json({ error: 'Quotation not found' });
    }

    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.convertToSale = async (req, res) => {
  const transaction = req._rlsTransaction;
  try {
    const { id } = req.params;
    const { paymentMethod, paymentDetails } = req.body;

    const quotation = await Quotation.findOne({
      where: { id, shopId: req.shopId },
      transaction
    });

    if (!quotation) {
      return res.status(404).json({ error: 'Quotation not found' });
    }

    if (quotation.status !== 'pending') {
      return res.status(400).json({ error: 'Only pending quotations can be converted' });
    }

    // Create Sale from quotation data
    const sale = await Sale.create({
      customerName: quotation.customerName,
      customerMobile: quotation.customerMobile,
      subtotal: quotation.subtotal,
      discount: quotation.discount,
      total: quotation.total,
      paymentMethod: paymentMethod || { cash: quotation.total, card: 0, bank: 0, credit: 0 },
      date: new Date(),
      shopId: req.shopId
    }, { transaction });

    // Process items - create SaleItems, decrement stock, handle IMEI
    const items = Array.isArray(quotation.items) ? quotation.items : [];
    let totalCost = 0;

    for (const it of items) {
      await SaleItem.create({
        saleId: sale.id,
        productId: it.productId,
        productName: it.productName,
        price: it.price,
        quantity: it.quantity,
        subtotal: it.subtotal,
        imei: it.imei,
        shopId: req.shopId
      }, { transaction });

      if (it.productId) {
        const prod = await Product.findOne({
          where: { id: it.productId, shopId: req.shopId },
          transaction
        });

        if (prod) {
          await prod.decrement('stock', { by: it.quantity, transaction });

          if (it.imei && Array.isArray(prod.imeiList)) {
            prod.imeiList = prod.imeiList.filter(i => i !== it.imei);
            await prod.save({ transaction });
          }

          if (prod.supplier) {
            const sup = await Supplier.findOne({
              where: { id: prod.supplier, shopId: req.shopId },
              transaction
            });
            if (sup) await sup.decrement('totalStock', { by: it.quantity, transaction });
          }

          totalCost += (Number(prod.cost || 0) * Number(it.quantity || 0));
        }
      }
    }

    // Create COGS Expense
    if (totalCost > 0) {
      await Expense.create({
        category: 'Cost of Goods Sold',
        amount: totalCost,
        date: sale.date || new Date(),
        notes: `Auto-created for sale ${sale.id} (converted from quotation ${quotation.quotationNumber})`,
        shopId: req.shopId
      }, { transaction });
    }

    // Handle Credit Payments
    let creditAmount = 0;
    if (paymentMethod === 'Credit') {
      creditAmount = quotation.total;
    } else if (paymentMethod && typeof paymentMethod === 'object' && paymentMethod.credit) {
      creditAmount = Number(paymentMethod.credit);
    } else if (paymentDetails && paymentDetails.credit) {
      creditAmount = Number(paymentDetails.credit);
    }

    if (creditAmount > 0 && quotation.customerMobile) {
      const customer = await Customer.findOne({
        where: { mobile: quotation.customerMobile, shopId: req.shopId },
        transaction
      });
      if (customer) {
        await customer.increment('outstandingCredit', { by: creditAmount, transaction });
      }
    }

    // Update quotation status
    await quotation.update({
      status: 'converted',
      convertedSaleId: sale.id
    }, { transaction });

    // Fetch complete sale with items
    const completeSale = await Sale.findOne({
      where: { id: sale.id, shopId: req.shopId },
      include: ['items']
    });

    res.status(201).json({ sale: completeSale, quotation });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};
