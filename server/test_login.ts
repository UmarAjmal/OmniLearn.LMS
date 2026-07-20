import { pool } from './src/db';
import bcrypt from 'bcryptjs';

async function testLogin() {
  try {
    console.log('--- STARTING AUTHENTICATION DEBUG LOG ---');
    // Find ALL existing students
    const studentRes = await pool.query(`
      SELECT s.id, s.user_id, s.first_name, s.last_name, u.email, u.password_hash
      FROM students s
      JOIN users u ON s.user_id = u.id
      ORDER BY s.id DESC
    `);
    
    if (studentRes.rows.length === 0) {
      console.log('No students found in the database.');
      return;
    }
    
    console.log(`Found ${studentRes.rows.length} students. Checking each...`);
    let anySuccess = false;
    
    for (const student of studentRes.rows) {
      console.log(`\n======================================`);
      console.log(`Checking Student: ${student.first_name} ${student.last_name} (${student.email})`);
      
      let trainingWhatsapp = null;
      const appRes = await pool.query('SELECT whatsapp FROM training_applications WHERE gmail = $1', [student.email]);
      if (appRes.rows.length > 0) {
        trainingWhatsapp = appRes.rows[0].whatsapp;
      }

      let applicantPhone = null;
      const applicantRes = await pool.query('SELECT phone FROM applicants WHERE email = $1', [student.email]);
      if (applicantRes.rows.length > 0) {
        applicantPhone = applicantRes.rows[0].phone;
      }
      
      const trainingDigits = (trainingWhatsapp || '').replace(/\D/g, '').slice(-4) || '1234';
      const applicantDigits = (applicantPhone || '').replace(/\D/g, '').slice(-4) || '1234';
      
      const passwordsToTest = [
        `FalconSwift@${trainingDigits}`,
        `FalconSwift@${applicantDigits}`,
        trainingWhatsapp,
        applicantPhone,
        'FalconSwift123',
        'FalconSwift@1234',
        'password123',
        '123456'
      ].filter(Boolean);
      
      let matchedPassword = null;
      for (const pwd of passwordsToTest) {
        const isMatch = await bcrypt.compare(pwd as string, student.password_hash);
        if (isMatch) {
          matchedPassword = pwd;
          break;
        }
      }
      
      if (matchedPassword) {
        console.log(`✅ Login SUCCEEDS! Password: "${matchedPassword}"`);
        anySuccess = true;
        break; // Stop after first success to output the one we found
      } else {
        console.log(`❌ Login FAILED. Hash does not match any expected generated password.`);
      }
    }
    
    if (!anySuccess) {
      console.log('\n❌ ALL existing students failed login. Their passwords were changed manually or hashed with an unknown value.');
    }
    
  } catch (err) {
    console.error('Error during test:', err);
  } finally {
    pool.end();
  }
}

testLogin();
