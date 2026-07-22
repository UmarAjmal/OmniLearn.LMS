// using global fetch
const assert = require('assert');
const { Pool } = require('pg');
require('dotenv').config({ path: '../server/.env' });

const BASE_URL = 'http://localhost:5000/api';

const pool = new Pool({
  host: process.env.DB_HOST, port: process.env.DB_PORT, user: process.env.DB_USER, password: process.env.DB_PASSWORD, database: process.env.DB_NAME, ssl: { rejectUnauthorized: false }
});

async function login(email, password) {
  const res = await fetch(BASE_URL + '/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password })
  });
  if(!res.ok) throw new Error("Login failed for " + email + ": " + await res.text());
  const data = await res.json();
  return data;
}

async function runE2E() {
  try {
    console.log('--- STARTING QA E2E TESTS ---');
    
    // 1. Authenticate users
    console.log('Logging in Admin...');
    const adminAuth = await login('qa_admin@test.com', 'password123');
    console.log('Logging in Trainer...');
    const trainerAuth = await login('qa_trainer@test.com', 'password123');
    console.log('Logging in Student...');
    const studentAuth = await login('qa_student@test.com', 'password123');
    console.log('StudentAuth:', studentAuth);

    // Get student ID
    const stuRes = await pool.query("SELECT id FROM students WHERE user_id = $1", [studentAuth.user.id]);
    const studentId = stuRes.rows[0].id;

    // 2. Admin Creates Campaign
    console.log('\n[TEST] Admin creates a new Lead Campaign...');
    let res = await fetch(BASE_URL + '/campaigns', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': "Bearer " + adminAuth.token },
      body: JSON.stringify({
        title: 'QA Automated Campaign',
        description: 'Test Campaign',
        target_leads: 10,
        daily_target: 2,
        deadline: new Date(Date.now() + 86400000).toISOString(),
        keywords: ['software', 'QA'],
        platforms: ['LinkedIn'],
        student_ids: [studentId]
      })
    });
    let campaignData = await res.json();
    assert(campaignData.success, 'Campaign creation failed');
    const campaignId = campaignData.data.id;
    console.log('✓ Campaign created with ID:', campaignId);

    // Verify Notification
    const notifRes = await pool.query("SELECT * FROM notifications WHERE type='lead_campaign' ORDER BY id DESC LIMIT 1");
    assert(notifRes.rows.length > 0, 'Notification not created');
    console.log('✓ Notification created:', notifRes.rows[0].title);

    // 3. Student Workflow
    console.log('\n[TEST] Student submits a lead...');
    res = await fetch(BASE_URL + '/leads', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': "Bearer " + studentAuth.token },
      body: JSON.stringify({
        campaign_id: campaignId,
        student_id: studentId,
        business_name: 'Acme QA Corp',
        contact_person: 'John Doe',
        business_url: 'https://acme.com',
        phone: '+1234567890',
        email: 'qa@acme.com',
        status: 'Contacted',
        screenshot_url: 'https://example.com/screenshot.png'
      })
    });
    let submissionData = await res.json();
    assert(submissionData.success, 'Lead submission failed: ' + JSON.stringify(submissionData));
    const leadId = submissionData.data.id;
    console.log('✓ Lead submitted successfully with ID:', leadId);

    // Duplicate Lead
    console.log('\n[TEST] Student submits DUPLICATE lead...');
    res = await fetch(BASE_URL + '/leads', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': "Bearer " + studentAuth.token },
      body: JSON.stringify({
        campaign_id: campaignId,
        student_id: studentId,
        business_name: 'Acme QA Corp',
        business_url: 'https://acme.com',
        phone: '+1234567890',
        email: 'qa@acme.com'
      })
    });
    let dupData = await res.json();
    assert(dupData.success === false, 'Duplicate lead was incorrectly allowed!');
    console.log('✓ Duplicate lead correctly rejected:', dupData.error);

    // 4. Trainer Review
    console.log('\n[TEST] Trainer reviews lead...');
    res = await fetch(BASE_URL + '/leads/' + leadId + '/review', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': "Bearer " + trainerAuth.token },
      body: JSON.stringify({
        status: 'approved',
        feedback: 'Looks great!',
        points_awarded: 10
      })
    });
    let reviewData = await res.json();
    assert(reviewData.success, 'Review failed: ' + JSON.stringify(reviewData));
    console.log('✓ Trainer approved lead and awarded points');

    const pointsRes = await pool.query("SELECT * FROM lead_points_ledger WHERE lead_id=$1", [leadId]);
    assert(pointsRes.rows.length === 1 && pointsRes.rows[0].points === 10, 'Points not recorded correctly');
    console.log('✓ Points ledger updated:', pointsRes.rows[0].points);

    console.log('\n--- ALL TESTS PASSED! ---');
  } catch(err) {
    console.error('\n❌ TEST FAILED:', err.message);
  } finally {
    pool.end();
  }
}

runE2E();
