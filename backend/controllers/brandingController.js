const { Shop } = require('../models');
const path = require('path');
const fs = require('fs');
const sharp = require('sharp');

exports.updateBranding = async (req, res) => {
  try {
    const shop = await Shop.findByPk(req.shopId);
    if (!shop) return res.status(404).json({ error: 'Shop not found' });

    const updates = {};
    if (req.body.themeColor) updates.themeColor = req.body.themeColor;
    if (req.body.printLogo !== undefined) updates.printLogo = req.body.printLogo === 'true' || req.body.printLogo === true;

    if (req.file) {
      // User uploaded a logo. Convert to B&W 1-bit dithered image for thermal printer
      const filename = `shop_${shop.id}_logo_${Date.now()}.png`;
      const outputPath = path.join(__dirname, '..', 'public', 'uploads', filename);

      // Ensure directory exists
      if (!fs.existsSync(path.dirname(outputPath))) {
        fs.mkdirSync(path.dirname(outputPath), { recursive: true });
      }

      // 384px is a common width for 58mm thermal printers. 80mm printers use 576px.
      // Greyscale + threshold(128) ensures it's pure black and white, preventing blurry messes.
      await sharp(req.file.buffer)
        .resize({ width: 384, withoutEnlargement: true })
        .greyscale()
        .threshold(128)
        .png()
        .toFile(outputPath);

      updates.logoUrl = `/uploads/${filename}`;
    }

    await shop.update(updates);
    res.json({ message: 'Branding updated successfully', shop });
  } catch (err) {
    console.error('Branding update error:', err);
    res.status(500).json({ error: err.message });
  }
};

exports.getBranding = async (req, res) => {
  try {
    const shop = await Shop.findByPk(req.shopId, {
      attributes: ['id', 'themeColor', 'logoUrl', 'printLogo']
    });
    if (!shop) return res.status(404).json({ error: 'Shop not found' });
    res.json(shop);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
