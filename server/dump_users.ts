import { pool } from './src/db';

async function dumpUsers() {
  try {
    const studentRes = await pool.query(`
      SELECT s.id, s.user_id, s.first_name, s.last_name, u.email, u.password_hash, u.role
      FROM students s
      JOIN users u ON s.user_id = u.id
      ORDER BY s.id DESC
    `);
    console.log(studentRes.rows);
  } finally {
    pool.end();
  }
}
dumpUsers();
