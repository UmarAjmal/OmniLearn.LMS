import pg from 'pg';
import dotenv from 'dotenv';
dotenv.config();

const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });

async function run() {
  const res = await pool.query('SELECT image_urls FROM task_submissions LIMIT 1');
  console.log(res.rows[0]);
  console.log(typeof res.rows[0]?.image_urls);
  process.exit(0);
}
run();
