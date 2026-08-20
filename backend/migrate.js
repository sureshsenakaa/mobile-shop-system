const { sequelize } = require('./models');

async function migrate() {
    try {
        await sequelize.query('ALTER TABLE IF EXISTS "Users" ADD COLUMN IF NOT EXISTS "basicSalary" DOUBLE PRECISION DEFAULT 0;');
        console.log("Migration successful.");
    } catch (e) {
        console.error("Migration failed:", e);
    }
    process.exit(0);
}

migrate();
