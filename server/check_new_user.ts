import { pool } from './src/db';
import bcrypt from 'bcryptjs';

async function checkNewUser() {
  try {
    const res = await pool.query(`SELECT * FROM users ORDER BY id DESC LIMIT 1`);
    console.log('User Record:', res.rows[0]);
    const hash = res.rows[0].password_hash;
    
    console.log('Checking expected password: FalconSwift@4567');
    console.log('Match expected?', await bcrypt.compare('FalconSwift@4567', hash));
    console.log('Match old logic (phone)?', await bcrypt.compare('03001234567', hash));
    console.log('Match old logic (FalconSwift123)?', await bcrypt.compare('FalconSwift123', hash));
    
  } finally {
    pool.end();
  }
}
checkNewUser();
