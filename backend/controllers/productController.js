const { Product, Supplier } = require('../models');
const xlsx = require('xlsx');

exports.createProduct = async (req, res) => {
  try {
    const data = { ...req.body, shopId: req.shopId };
    console.log('Creating product with data:', JSON.stringify(data));
    if (Array.isArray(data.imeiList) && data.imeiList.length > 0) {
      data.stock = data.imeiList.length;
    }
    const options = req._rlsTransaction ? { transaction: req._rlsTransaction } : {};
    const product = await Product.create(data, options);
    console.log('Product created:', product.toJSON());
    res.status(201).json(product);
  } catch (err) {
    console.error('Error creating product:', err);
    res.status(400).json({ error: err.message });
  }
};

exports.getProducts = async (req, res) => {
  try {
    console.log('Fetching products for shopId:', req.shopId);
    const products = await Product.findAll({ where: { shopId: req.shopId } });
    console.log(`Found ${products.length} products`);
    res.json(products);
  } catch (err) {
    console.error('Error fetching products:', err);
    res.status(500).json({ error: err.message });
  }
};

exports.deleteProduct = async (req, res) => {
  try {
    const deleted = await Product.destroy({ where: { id: req.params.id, shopId: req.shopId } });
    if (!deleted) return res.status(404).json({ error: 'Product not found' });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.updateProduct = async (req, res) => {
  try {
    const { id } = req.params;
    const allowed = ['brand','model','ram','storage','color','price','cost','stock','accessoryType','barcode','supplier','supplierName','investor','investorName','imei','imei1','imei2','serialNumber', 'imeiList'];
    const update = {};
    for (const key of allowed) {
      if (Object.prototype.hasOwnProperty.call(req.body, key)) {
        update[key] = req.body[key];
      }
    }
    if (Array.isArray(update.imeiList)) {
        update.stock = update.imeiList.length;
    }
    
    const product = await Product.findOne({ where: { id, shopId: req.shopId } });
    if (!product) return res.status(404).json({ error: 'Product not found' });

    await Product.update(update, { where: { id, shopId: req.shopId } });
    const updatedProduct = await Product.findByPk(id);
    res.json(updatedProduct);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.restockProduct = async (req, res) => {
  try {
    const { id } = req.params;
    const { quantity, supplierId, imeiList, cost, price } = req.body;
    const options = req._rlsTransaction ? { transaction: req._rlsTransaction } : {};
    
    const product = await Product.findOne({ where: { id, shopId: req.shopId }, ...options });
    if (!product) return res.status(404).json({ error: 'Product not found' });

    let qty = 0;
    if (Array.isArray(imeiList) && imeiList.length > 0) {
      // Append new IMEIs
      const currentList = Array.isArray(product.imeiList) ? product.imeiList : [];
      const newList = [...currentList, ...imeiList];
      product.imeiList = newList;
      qty = imeiList.length;
      product.stock = newList.length;
    } else {
      qty = Number(quantity);
      if (!qty || isNaN(qty) || qty <= 0) return res.status(400).json({ error: 'Invalid quantity' });
      
      const oldStock = Number(product.stock) || 0;
      const oldCost = Number(product.cost) || 0;
      
      // If a batch cost is supplied, compute Weighted Average Cost
      if (cost !== undefined && cost !== null && cost !== '') {
        const batchCost = Number(cost);
        if (!isNaN(batchCost) && batchCost >= 0) {
          if (oldStock <= 0) {
            product.cost = batchCost;
          } else {
            const totalInventoryValue = (oldStock * oldCost) + (qty * batchCost);
            const totalUnits = oldStock + qty;
            product.cost = Math.round((totalInventoryValue / totalUnits) * 100) / 100;
          }
        }
      }

      product.stock += qty;
    }

    // For IMEI-based devices, calculate average cost if cost was entered
    if (Array.isArray(imeiList) && imeiList.length > 0 && cost !== undefined && cost !== null && cost !== '') {
      const batchCost = Number(cost);
      if (!isNaN(batchCost) && batchCost >= 0) {
        const oldStock = (product.stock - qty) > 0 ? (product.stock - qty) : 0;
        const oldCost = Number(product.cost) || 0;
        if (oldStock <= 0) {
          product.cost = batchCost;
        } else {
          const totalInventoryValue = (oldStock * oldCost) + (qty * batchCost);
          const totalUnits = oldStock + qty;
          product.cost = Math.round((totalInventoryValue / totalUnits) * 100) / 100;
        }
      }
    }

    if (price !== undefined && price !== null && price !== '') {
      const numPrice = Number(price);
      if (!isNaN(numPrice) && numPrice >= 0) {
        product.price = numPrice;
      }
    }

    if (supplierId) {
      const sup = await Supplier.findOne({ where: { id: supplierId, shopId: req.shopId }, ...options });
      if (sup) {
        product.supplier = sup.id;
        product.supplierName = sup.name;
      }
    }
    await product.save(options);
    res.json(product);
  } catch (err) {
    console.error('restockProduct error:', err);
    res.status(500).json({ error: err.message });
  }
};

exports.downloadTemplate = (req, res) => {
  try {
    const ws_name = 'Products';
    const ws_data = [
      ['Brand', 'Model', 'RAM', 'Storage', 'Color', 'Price', 'Cost', 'Stock', 'IMEI_List', 'Barcode', 'AccessoryType'],
      ['Samsung', 'Galaxy S23', '8GB', '256GB', 'Black', 250000, 230000, 5, 'IMEI1,IMEI2', '123456789', ''],
      ['Apple', 'iPhone 14', '6GB', '128GB', 'White', 300000, 280000, 0, '', '987654321', ''],
      ['Spigen', 'S23 Case', '', '', 'Clear', 2500, 1500, 20, '', '111222333', 'Case']
    ];
    
    const ws = xlsx.utils.aoa_to_sheet(ws_data);
    const wb = xlsx.utils.book_new();
    xlsx.utils.book_append_sheet(wb, ws, ws_name);
    
    const buffer = xlsx.write(wb, { type: 'buffer', bookType: 'xlsx' });
    
    res.setHeader('Content-Disposition', 'attachment; filename="Product_Upload_Template.xlsx"');
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.send(buffer);
  } catch (err) {
    res.status(500).json({ error: 'Failed to generate template' });
  }
};

exports.bulkUpload = async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: 'No file uploaded' });

    const wb = xlsx.read(req.file.buffer, { type: 'buffer' });
    const sheetName = wb.SheetNames[0];
    const ws = wb.Sheets[sheetName];
    const data = xlsx.utils.sheet_to_json(ws);

    let addedCount = 0;
    const errors = [];
    const options = req._rlsTransaction ? { transaction: req._rlsTransaction } : {};

    for (let i = 0; i < data.length; i++) {
      const row = data[i];
      try {
        if (!row.Brand || !row.Model || !row.Price) {
          errors.push(`Row ${i + 2}: Missing required fields (Brand, Model, or Price)`);
          continue;
        }
        
        let stock = parseInt(row.Stock) || 0;
        let imeiList = [];
        if (row.IMEI_List) {
          imeiList = String(row.IMEI_List).split(',').map(s => s.trim()).filter(s => s);
          stock = imeiList.length > 0 ? imeiList.length : stock;
        }

        const productData = {
          shopId: req.shopId,
          brand: String(row.Brand),
          model: String(row.Model),
          ram: row.RAM ? String(row.RAM) : null,
          storage: row.Storage ? String(row.Storage) : null,
          color: row.Color ? String(row.Color) : null,
          price: parseFloat(row.Price),
          cost: parseFloat(row.Cost) || 0,
          stock: stock,
          imeiList: imeiList,
          barcode: row.Barcode ? String(row.Barcode) : null,
          accessoryType: row.AccessoryType ? String(row.AccessoryType) : null
        };
        
        // If a barcode or IMEI already exists, the database Unique Constraint might fail
        // However, we don't have a unique constraint on barcode/imei globally (only logical per shop maybe)
        // We will just insert
        await Product.create(productData, options);
        addedCount++;
      } catch (err) {
        errors.push(`Row ${i + 2}: ${err.message}`);
      }
    }

    res.json({ message: `Successfully added ${addedCount} products`, errors });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
