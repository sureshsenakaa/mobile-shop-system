const { AuditLog } = require('../models');

const globalAuditLogger = async (req, res, next) => {
  res.on('finish', async () => {
    // Only log successful modifying requests
    if (res.statusCode >= 200 && res.statusCode < 300 && ['POST', 'PUT', 'DELETE'].includes(req.method)) {
      if (req.user && req.shopId) {
        try {
          // Extract target from path (e.g. /api/products/1 -> products)
          const pathParts = req.originalUrl.split('?')[0].split('/');
          // pathParts is something like ["", "api", "products", "1"]
          const target = pathParts[2] || 'system';
          
          let action = 'CREATE';
          let description = 'Created new record';
          const idParam = req.params.id || pathParts[pathParts.length - 1];
          
          if (req.method === 'PUT') {
             action = 'UPDATE';
             description = `Updated record ID: ${idParam}`;
          } else if (req.method === 'DELETE') {
             action = 'DELETE';
             description = `Deleted record ID: ${idParam}`;
          }

          if (target !== 'auth') {
            await AuditLog.create({
              action,
              target,
              description,
              userId: req.user.id,
              shopId: req.shopId
            });
          }
        } catch (err) {
          console.error('Audit Log Error:', err);
        }
      }
    }
  });
  next();
};

module.exports = { globalAuditLogger };
