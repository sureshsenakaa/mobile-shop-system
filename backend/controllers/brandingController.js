const { Shop } = require('../models');
const path = require('path');
const fs = require('fs');

let sharp;
try {
  sharp = require('sharp');
} catch (e) {
  console.warn('Sharp module not available or failed to load:', e.message);
}

exports.updateBranding = async (req, res) => {
  try {
    let targetShopId = req.shopId;
    if (!targetShopId && req.user && req.user.role === 'super_admin') {
      targetShopId = req.body.shopId || req.query.shopId || 1;
    }

    let shop = targetShopId ? await Shop.findByPk(targetShopId) : null;
    if (!shop) {
      shop = await Shop.findOne();
    }
    if (!shop) return res.status(404).json({ error: 'Shop not found' });

    const updates = {};
    if (req.body.name && req.body.name.trim()) updates.name = req.body.name.trim();
    if (req.body.phone !== undefined) updates.phone = req.body.phone.trim();
    if (req.body.address !== undefined) updates.address = req.body.address.trim();
    if (req.body.themeColor) updates.themeColor = req.body.themeColor;
    if (req.body.printLogo !== undefined) updates.printLogo = req.body.printLogo === 'true' || req.body.printLogo === true;
    if (req.body.removeLogo === 'true' || req.body.removeLogo === true) updates.logoUrl = null;

    if (req.file) {
      const ext = path.extname(req.file.originalname || '') || '.png';
      const isSvg = ext.toLowerCase() === '.svg';
      const filename = `shop_${shop.id}_logo_${Date.now()}${isSvg ? '.svg' : '.png'}`;
      const uploadDir = path.join(__dirname, '..', 'public', 'uploads');
      const outputPath = path.join(uploadDir, filename);

      // Ensure directory exists
      if (!fs.existsSync(uploadDir)) {
        fs.mkdirSync(uploadDir, { recursive: true });
      }

      let processed = false;
      if (sharp && req.file.buffer && !isSvg) {
        try {
          await sharp(req.file.buffer)
            .resize({ width: 400, withoutEnlargement: true })
            .png({ quality: 90 })
            .toFile(outputPath);
          processed = true;
        } catch (sharpErr) {
          console.warn('Sharp processing failed, falling back to direct write:', sharpErr.message);
        }
      }

      if (!processed) {
        fs.writeFileSync(outputPath, req.file.buffer);
      }

      updates.logoUrl = `/uploads/${filename}`;
    }

    await shop.update(updates);
    const updatedShop = await Shop.findByPk(shop.id, {
      attributes: ['id', 'name', 'phone', 'address', 'themeColor', 'logoUrl', 'printLogo']
    });
    res.json({ message: 'Shop details and branding updated successfully', shop: updatedShop });
  } catch (err) {
    console.error('Branding update error:', err);
    res.status(500).json({ error: err.message || 'Internal server error while updating branding' });
  }
};

exports.getBranding = async (req, res) => {
  try {
    let targetShopId = req.shopId;
    if (!targetShopId && req.user && req.user.role === 'super_admin') {
      targetShopId = req.query.shopId || 1;
    }

    let shop = targetShopId ? await Shop.findByPk(targetShopId, {
      attributes: ['id', 'name', 'phone', 'address', 'themeColor', 'logoUrl', 'printLogo']
    }) : null;

    if (!shop) {
      shop = await Shop.findOne({
        attributes: ['id', 'name', 'phone', 'address', 'themeColor', 'logoUrl', 'printLogo']
      });
    }

    if (!shop) return res.status(404).json({ error: 'Shop not found' });
    res.json(shop);
  } catch (err) {
    console.error('getBranding error:', err);
    res.status(500).json({ error: err.message || 'Failed to fetch branding' });
  }
};

