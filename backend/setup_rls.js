/**
 * PostgreSQL Row-Level Security (RLS) Setup
 * 
 * මේකෙදි Database එකේම Policy හදනවා:
 * "මේ ලොග් වෙලා ඉන්න User ට, එයාගේ shopId එක තියෙන Row විතරයි බලන්න පුළුවන්"
 * 
 * Backend code එකේ where: { shopId } අමතක වුණත්, Database එකෙන්ම Block කරනවා.
 * 
 * How it works:
 * 1. Each request sets a PostgreSQL session variable: app.current_shop_id
 * 2. RLS policies check this variable against each row's shopId
 * 3. If shopId doesn't match, the row is invisible (SELECT) or blocked (INSERT/UPDATE)
 * 4. Super admin uses shopId = '0' which bypasses the policy
 */

const { sequelize } = require('./models');

// Tables that contain shop-specific data and need RLS
const TENANT_TABLES = [
  'Customers',
  'Suppliers',
  'Investors',
  'Products',
  'Sales',
  'SaleItems',
  'Repairs',
  'Expenses',
  'PurchaseOrders',
  'Returns'
];

async function setupRLS() {
  console.log('Setting up PostgreSQL Row-Level Security (RLS)...');

  for (const table of TENANT_TABLES) {
    try {
      // 1. Enable RLS on the table
      await sequelize.query(`ALTER TABLE "${table}" ENABLE ROW LEVEL SECURITY`);

      // 2. FORCE RLS even for table owner (important because Sequelize creates
      //    tables as the connected user, who is therefore the table owner,
      //    and owners bypass RLS by default)
      await sequelize.query(`ALTER TABLE "${table}" FORCE ROW LEVEL SECURITY`);

      // 3. Drop existing policy if any (for idempotency)
      await sequelize.query(`DROP POLICY IF EXISTS tenant_isolation ON "${table}"`);

      // 4. Create the RLS policy
      //    - current_setting('app.current_shop_id', true) returns NULL if not set
      //    - '0' means super admin → allow all rows
      //    - Otherwise, only allow rows where shopId matches
      await sequelize.query(`
        CREATE POLICY tenant_isolation ON "${table}"
          USING (
            current_setting('app.current_shop_id', true) = '0'
            OR "shopId"::text = current_setting('app.current_shop_id', true)
          )
          WITH CHECK (
            current_setting('app.current_shop_id', true) = '0'
            OR "shopId"::text = current_setting('app.current_shop_id', true)
          )
      `);

      console.log(`  ✅ RLS enabled on "${table}"`);
    } catch (err) {
      console.error(`  ❌ RLS failed on "${table}":`, err.message);
    }
  }

  console.log('RLS setup complete! Database-level tenant isolation is active. 🛡️');
}

module.exports = { setupRLS };
