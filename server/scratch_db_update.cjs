require('dotenv').config({ path: '/Users/umarsaleem/Documents/OmniLearn.LMS/server/.env' });
const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL
});

async function run() {
  try {
    console.log("Altering table...");
    await pool.query("ALTER TABLE users ADD COLUMN IF NOT EXISTS must_change_password BOOLEAN DEFAULT false;");
    console.log("Success!");
  } catch (err) {
    console.error("DB Error:", err.message);
  } finally {
    pool.end();
  }
}

run();
