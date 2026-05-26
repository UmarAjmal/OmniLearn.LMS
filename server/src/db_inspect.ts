import { pool } from './db.js';

async function inspectDB() {
  try {
    console.log('Inspecting database tables...');
    const result = await pool.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
    `);
    console.log('Tables found:', result.rows.map(r => r.table_name));
    
    // Check structure of courses or similar if they exist
    for (const row of result.rows) {
      const columns = await pool.query(`
        SELECT column_name, data_type, is_nullable
        FROM information_schema.columns
        WHERE table_name = $1
      `, [row.table_name]);
      console.log(`\nTable: ${row.table_name}`);
      console.table(columns.rows);
    }
  } catch (err) {
    console.error('Error during database inspection:', err);
  } finally {
    await pool.end();
  }
}

inspectDB();
