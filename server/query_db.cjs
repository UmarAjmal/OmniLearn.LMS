require('dotenv').config({ path: '/Users/umarsaleem/Documents/OmniLearn.LMS/server/.env' });
const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL
});

async function run() {
  try {
    const res = await pool.query("SELECT id, full_name, gmail, status, created_at FROM training_applications ORDER BY created_at DESC LIMIT 5");
    console.table(res.rows);
  } catch (err) {
    console.error("DB Error:", err.message);
  } finally {
    pool.end();
  }
}

run();
