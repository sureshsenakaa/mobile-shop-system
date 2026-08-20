const { Client } = require('pg');

async function createDb() {
  let client;

  try {
    console.log("Connecting as postgres...");
    client = new Client({
      user: 'postgres',
      password: 'bookdjz_admin',
      host: 'localhost',
      port: 5432,
      database: 'postgres',
    });
    await client.connect();
    console.log("Connected successfully.");

    const resDb = await client.query("SELECT 1 FROM pg_database WHERE datname='mobile-shop'");
    if (resDb.rowCount === 0) {
      await client.query('CREATE DATABASE "mobile-shop"');
      console.log('Database "mobile-shop" created.');
    } else {
      console.log('Database "mobile-shop" already exists.');
    }

    const resUser = await client.query("SELECT 1 FROM pg_roles WHERE rolname='admin@bookdjz.com'");
    if (resUser.rowCount === 0) {
      await client.query("CREATE USER \"admin@bookdjz.com\" WITH PASSWORD 'Password@123'");
      console.log('User "admin@bookdjz.com" created.');
    } else {
      // update password just in case
      await client.query("ALTER USER \"admin@bookdjz.com\" WITH PASSWORD 'Password@123'");
      console.log('User "admin@bookdjz.com" password updated.');
    }

    await client.query('GRANT ALL PRIVILEGES ON DATABASE "mobile-shop" TO "admin@bookdjz.com"');
    console.log('Database Privileges granted.');

    // Connect to the new DB to grant schema privileges
    const clientDb = new Client({
      user: 'postgres',
      password: 'bookdjz_admin',
      host: 'localhost',
      port: 5432,
      database: 'mobile-shop',
    });
    await clientDb.connect();
    await clientDb.query('GRANT ALL ON SCHEMA public TO "admin@bookdjz.com"');
    console.log('Schema Privileges granted.');
    await clientDb.end();

  } catch (err) {
    console.error('Error executing queries:', err);
  } finally {
    if (client) await client.end();
  }
}

createDb();
