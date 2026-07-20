import { pool } from './src/db';
import bcrypt from 'bcryptjs';

async function testNewEndToEndFlow() {
  try {
    console.log('--- STARTING NEW END-TO-END FLOW TEST ---');
    
    // 1. Create a dummy applicant
    const dummyEmail = `test_student_${Date.now()}@gmail.com`;
    const dummyWhatsApp = '03001234567';
    const dummyCnic = `12345-${Date.now().toString().slice(-7)}-1`;
    
    console.log(`\n1. Creating dummy application for ${dummyEmail} with WhatsApp ${dummyWhatsApp}...`);
    const insertRes = await pool.query(`
      INSERT INTO training_applications 
      (full_name, father_name, cnic, age, whatsapp, gmail, university_name, department, semester, tracks, status) 
      VALUES 
      ('Test Student', 'Test Father', $3, 20, $1, $2, 'FAST', 'CS', 5, '{"fullstack-ai"}', 'pending')
      RETURNING id
    `, [dummyWhatsApp, dummyEmail, dummyCnic]);
    
    const appId = insertRes.rows[0].id;
    console.log(`-> Application created with ID: ${appId}`);
    
    // 2. Call the approve endpoint logic manually since we can't easily fetch local endpoint with nextjs proxy from node script, 
    // actually we can just hit the local express server!
    console.log(`\n2. Approving application via local Express API...`);
    const approveRes = await fetch(`http://localhost:5000/api/training-applications/${appId}/approve`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ note: 'Welcome test user!' })
    });
    
    const approveData = await approveRes.json();
    console.log(`-> Approval API Response:`, approveData);
    
    // 3. Calculate expected password using our new logic
    const expectedPassword = 'FalconSwift@4567';
    console.log(`\n3. Calculated expected temporary password: ${expectedPassword}`);
    
    // 4. Attempt to log in via local Express API
    console.log(`\n4. Attempting to log in with Email: ${dummyEmail} and Password: ${expectedPassword}...`);
    const loginRes = await fetch(`http://localhost:5000/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: dummyEmail, password: expectedPassword })
    });
    
    const loginData = await loginRes.json();
    
    if (loginData.success) {
      console.log(`\n✅ LOGIN SUCCESSFUL!`);
      console.log(`-> JWT Token Received: ${loginData.token.substring(0, 20)}...`);
      console.log(`-> Logged in User ID: ${loginData.user.id}`);
      console.log(`-> Role: ${loginData.user.role}`);
      console.log(`-> Student Profile ID: ${loginData.user.student.id}`);
    } else {
      console.log(`\n❌ LOGIN FAILED!`);
      console.log(`-> Error: ${loginData.error}`);
    }
    
  } catch (err) {
    console.error('Test failed with error:', err);
  } finally {
    pool.end();
  }
}

testNewEndToEndFlow();
