const { Shop } = require('../models');
const path = require('path');
const fs = require('fs');
const sharp = require('sharp');

exports.updateBranding = async (req, res) => {
  try {
    const shop = await Shop.findByPk(req.shopId);
    if (!shop) return res.status(404).json({ error: 'Shop not found' });

    const updates = {};
    if (req.body.name && req.body.name.trim()) updates.name = req.body.name.trim();
    if (req.body.phone !== undefined) updates.phone = req.body.phone.trim();
    if (req.body.address !== undefined) updates.address = req.body.address.trim();
    if (req.body.themeColor) updates.themeColor = req.body.themeColor;
    if (req.body.printLogo !== undefined) updates.printLogo = req.body.printLogo === 'true' || req.body.printLogo === true;
    if (req.body.removeLogo === 'true' || req.body.removeLogo === true) updates.logoUrl = null;

    if (req.file) {
      const filename = `shop_${shop.id}_logo_${Date.now()}.png`;
      const outputPath = path.join(__dirname, '..', 'public', 'uploads', filename);

      // Ensure directory exists
      if (!fs.existsSync(path.dirname(outputPath))) {
        fs.mkdirSync(path.dirname(outputPath), { recursive: true });
      }

      // Resize preserving aspect ratio, crisp details and transparent alpha channel
      await sharp(req.file.buffer)
        .resize({ width: 400, withoutEnlargement: true })
        .png({ quality: 90 })
        .toFile(outputPath);

      updates.logoUrl = `/uploads/${filename}`;
    }

    await shop.update(updates);
    const updatedShop = await Shop.findByPk(shop.id, {
      attributes: ['id', 'name', 'phone', 'address', 'themeColor', 'logoUrl', 'printLogo']
    });
    res.json({ message: 'Shop details and branding updated successfully', shop: updatedShop });
  } catch (err) {
    console.error('Branding update error:', err);
    res.status(500).json({ error: err.message });
  }
};

exports.getBranding = async (req, res) => {
  try {
    const shop = await Shop.findByPk(req.shopId, {
      attributes: ['id', 'name', 'phone', 'address', 'themeColor', 'logoUrl', 'printLogo']
    });
    if (!shop) return res.status(404).json({ error: 'Shop not found' });
    res.json(shop);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
