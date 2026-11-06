require('dotenv').config({ path: __dirname + '/.env' });
const { sequelize } = require('./models');

async function migrate() {
    try {
        await sequelize.query('ALTER TABLE IF EXISTS "Users" ADD COLUMN IF NOT EXISTS "basicSalary" DOUBLE PRECISION DEFAULT 0;');
        await sequelize.query('ALTER TABLE IF EXISTS "CashRegisters" ADD COLUMN IF NOT EXISTS "shiftNumber" INTEGER DEFAULT 1;');
        await sequelize.query('ALTER TABLE IF EXISTS "CashRegisters" ADD COLUMN IF NOT EXISTS "openedBy" INTEGER;');
        await sequelize.query('ALTER TABLE IF EXISTS "CashRegisters" ADD COLUMN IF NOT EXISTS "openedAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW();');
        await sequelize.query('ALTER TABLE IF EXISTS "CashRegisters" ADD COLUMN IF NOT EXISTS "cashIn" DOUBLE PRECISION DEFAULT 0;');
        await sequelize.query('ALTER TABLE IF EXISTS "CashRegisters" ADD COLUMN IF NOT EXISTS "cardIn" DOUBLE PRECISION DEFAULT 0;');
        await sequelize.query('ALTER TABLE IF EXISTS "CashRegisters" ADD COLUMN IF NOT EXISTS "cashOut" DOUBLE PRECISION DEFAULT 0;');
        await sequelize.query('ALTER TABLE IF EXISTS "CashRegisters" ADD COLUMN IF NOT EXISTS "currentBalance" DOUBLE PRECISION DEFAULT 0;');
        console.log("Migration successful.");
    } catch (e) {
        console.error("Migration failed:", e);
    }
    process.exit(0);
}

migrate();
