import { pool } from './db.js';

async function migrate() {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    
    // Rename old table if it exists
    await client.query(`ALTER TABLE IF EXISTS notifications RENAME TO legacy_notifications;`);
    
    // Create new table
    await client.query(`
      CREATE TABLE notifications (
        id SERIAL PRIMARY KEY,
        type VARCHAR(100) NOT NULL,
        title VARCHAR(255) NOT NULL,
        message TEXT,
        priority VARCHAR(50) DEFAULT 'normal',
        action_url VARCHAR(500),
        attachment_url VARCHAR(500),
        created_by INT REFERENCES users(id) ON DELETE SET NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);
    
    await client.query('COMMIT');
    console.log("Migration complete.");
  } catch(e) {
    await client.query('ROLLBACK');
    console.error("Migration failed", e);
  } finally {
    client.release();
    process.exit(0);
  }
}
migrate();
