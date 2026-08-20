/**
 * Shop Scope Middleware + PostgreSQL RLS Context
 * 
 * මේ middleware එක දෙකක් කරනවා:
 * 
 * 1. req.shopId set කරනවා (app-level filtering)
 * 2. PostgreSQL RLS context set කරනවා (database-level filtering)
 *    - Transaction එකක් start කරලා SET LOCAL app.current_shop_id = X කරනවා
 *    - CLS (Continuation Local Storage) නිසා, ඒ transaction එක ඊළඟ query 
 *      හැමතැනටම auto apply වෙනවා
 *    - Controller එකේ where: { shopId } අමතක වුණත්, Database එකෙන්ම block කරනවා
 */

const { sequelize } = require('../models');

function injectShopFilter(req, res, next) {
  if (!req.user) {
    return res.status(401).json({ message: 'Unauthorized' });
  }

  if (req.user.role === 'super_admin') {
    // Super admins can pass shopId via query param to view specific shops
    req.shopId = req.query.shopId || req.body.shopId || null;
  } else {
    // Everyone else is locked to their own shop
    req.shopId = req.user.shopId;

    if (!req.shopId) {
      return res.status(403).json({ message: 'Forbidden: No shop assigned to user' });
    }
  }

  // ─── PostgreSQL RLS Context ───────────────────────────────────────
  // '0' = super admin → RLS policy allows ALL rows
  // Otherwise = specific shopId → RLS policy filters to matching rows only
  const rlsShopId = req.shopId ? String(req.shopId) : '0';

  // ─── Billing Check (Read-Only Mode) ─────────────────────────────────
  // Prevent POST, PUT, DELETE if shop is overdue
  if (['POST', 'PUT', 'DELETE'].includes(req.method) && req.user.role !== 'super_admin' && req.shopId) {
    const { Shop } = require('../models');
    Shop.findByPk(req.shopId).then(shop => {
      if (shop && shop.billingStatus === 'overdue') {
        return res.status(402).json({
          message: 'Payment Required: Your shop account is overdue. You are in Read-Only mode.',
          code: 'BILLING_OVERDUE'
        });
      }
      continueWithTransaction();
    }).catch(next);
  } else {
    continueWithTransaction();
  }

  function continueWithTransaction() {
    const cls = require('cls-hooked');
    const namespace = cls.getNamespace('multi-tenant-rls');
    
    // Fallback if namespace is somehow not found (though it should be created in models.js)
    if (!namespace) {
      return next(new Error('CLS namespace multi-tenant-rls not found'));
    }

    namespace.run(() => {
      sequelize.transaction(async (t) => {
        // Now t is automatically in CLS namespace for all Sequelize queries in this request!
        await sequelize.query(
          `SET LOCAL app.current_shop_id = :shopId`,
          { replacements: { shopId: rlsShopId } } // Automatically uses t
        );

        req._rlsTransaction = t;

        return new Promise((resolve, reject) => {
          res.on('finish', () => {
            if (res.statusCode >= 400) {
              reject(new Error(`Rollback due to status code ${res.statusCode}`));
            } else {
              resolve();
            }
          });
          res.on('close', () => {
            reject(new Error('Client disconnected prematurely'));
          });

          // Proceed with routing
          next();
        });
      }).catch(err => {
        // If it was a managed rollback due to status code or disconnect, just ignore it.
        // If it was a real error, pass it to Express error handler ONLY if headers not sent.
        if (!res.headersSent && err.message !== 'Client disconnected prematurely' && !err.message.startsWith('Rollback due to')) {
          next(err);
        }
      });
    });
  } // end of continueWithTransaction
}

module.exports = { injectShopFilter };
