require('dotenv').config();
const { sequelize } = require('./models');

async function updateDB() {
  try {
    await sequelize.authenticate();
    console.log('Connected to DB');
    
    // Use raw queries to safely add columns if they don't exist
    await sequelize.query('ALTER TABLE "Users" ADD COLUMN IF NOT EXISTS "failedLoginAttempts" INTEGER DEFAULT 0;');
    await sequelize.query('ALTER TABLE "Users" ADD COLUMN IF NOT EXISTS "lockoutUntil" TIMESTAMP WITH TIME ZONE;');
    
    console.log('Successfully updated Users table with security fields');
  } catch (err) {
    console.error('Error updating DB:', err);
  } finally {
    process.exit(0);
  }
}

updateDB();
