import express from 'express';
import { pool } from '../db.js';
import { authenticateToken, requireAdmin, requireAdminOrTrainer, requireStudent } from '../middleware/auth.js';
import { NotificationEngine } from '../services/NotificationEngine.js';

const router = express.Router();

// ==========================================
// ADMIN / TRAINER CAMPAIGN MANAGEMENT
// ==========================================

// Create Campaign
router.post('/campaigns', authenticateToken, requireAdminOrTrainer, async (req, res) => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const { 
      title, description, platforms, target_batch, target_trainer, 
      target_leads, daily_target, priority, start_date, deadline, 
      instructions, keywords, student_ids 
    } = req.body;

    const insertCampaign = await client.query(`
      INSERT INTO lead_campaigns 
      (title, description, platforms, target_batch, target_trainer, target_leads, daily_target, priority, start_date, deadline, instructions, created_by)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
      RETURNING *
    `, [title, description, JSON.stringify(platforms || []), target_batch, target_trainer, target_leads, daily_target, priority, start_date, deadline, instructions, req.user?.id]);
    
    const campaignId = insertCampaign.rows[0].id;

    if (keywords && keywords.length > 0) {
      for (const kw of keywords) {
        await client.query('INSERT INTO campaign_keywords (campaign_id, keyword) VALUES ($1, $2)', [campaignId, kw]);
      }
    }

    if (student_ids && student_ids.length > 0) {
      for (const sId of student_ids) {
        await client.query('INSERT INTO campaign_students (campaign_id, student_id) VALUES ($1, $2)', [campaignId, sId]);
      }
      
      // Dispatch Campaign Assignment Notification
      await NotificationEngine.createNotification({
        type: 'lead_campaign',
        title: `New Campaign: ${title}`,
        message: `You have been assigned to campaign "${title}". Target: ${target_leads} leads. Deadline: ${deadline ? new Date(deadline).toLocaleDateString() : 'N/A'}.`,
        priority: 'critical',
        recipients: student_ids,
        createdBy: req.user?.id
      });
    }

    await client.query('COMMIT');
    res.json({ success: true, data: insertCampaign.rows[0] });
  } catch (err: any) {
    await client.query('ROLLBACK');
    res.status(500).json({ success: false, error: err.message });
  } finally {
    client.release();
  }
});

// Get all campaigns
router.get('/campaigns', authenticateToken, requireAdminOrTrainer, async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM lead_campaigns ORDER BY created_at DESC');
    res.json({ success: true, data: result.rows });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Get specific campaign details
router.get('/campaigns/:id', authenticateToken, async (req, res) => {
  try {
    const campaignRes = await pool.query('SELECT * FROM lead_campaigns WHERE id = $1', [req.params.id]);
    if (campaignRes.rows.length === 0) return res.status(404).json({ success: false, error: "Not found" });
    const campaign = campaignRes.rows[0];

    const kwRes = await pool.query('SELECT * FROM campaign_keywords WHERE campaign_id = $1', [campaign.id]);
    const stuRes = await pool.query(`
      SELECT s.id, s.first_name, s.last_name, s.enrollment_id 
      FROM campaign_students cs 
      JOIN students s ON cs.student_id = s.id 
      WHERE cs.campaign_id = $1
    `, [campaign.id]);

    res.json({ success: true, data: { ...campaign, keywords: kwRes.rows, students: stuRes.rows } });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Update Campaign
router.put('/campaigns/:id', authenticateToken, requireAdminOrTrainer, async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body; // allow updating status (active, completed, etc)
    const update = await pool.query('UPDATE lead_campaigns SET status = $1, updated_at = NOW() WHERE id = $2 RETURNING *', [status, id]);
    res.json({ success: true, data: update.rows[0] });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// ==========================================
// STUDENT CAMPAIGN DASHBOARD
// ==========================================

// Get student's assigned campaigns
router.get('/student/:id/campaigns', authenticateToken, requireStudent, async (req, res) => {
  try {
    const studentId = req.params.id;
    if (req.user?.id !== parseInt(studentId as string)) {
        // Wait, req.user.id is the User ID. studentId is the Student ID.
        // We need to verify if the student belongs to the user.
        const check = await pool.query('SELECT id FROM students WHERE id = $1 AND user_id = $2', [studentId, req.user?.id]);
        if (check.rows.length === 0) return res.status(403).json({ success: false, error: "Unauthorized" });
    }

    const campaigns = await pool.query(`
      SELECT lc.* 
      FROM lead_campaigns lc
      JOIN campaign_students cs ON lc.id = cs.campaign_id
      WHERE cs.student_id = $1
      ORDER BY lc.created_at DESC
    `, [studentId]);

    res.json({ success: true, data: campaigns.rows });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// ==========================================
// LEAD SUBMISSION & REVIEW
// ==========================================

// Student submits a lead
router.post('/leads', authenticateToken, requireStudent, async (req, res) => {
  try {
    const { campaign_id, student_id, business_name, contact_person, phone, email, website, address, city, country, industry, platform, keyword, business_url, lead_quality, notes } = req.body;
    
    // Duplicate Validation
    const dupeCheck = await pool.query(`
      SELECT id FROM lead_submissions 
      WHERE campaign_id = $1 AND (phone = $2 OR email = $3 OR website = $4 OR business_url = $5)
      LIMIT 1
    `, [campaign_id, phone || 'N/A', email || 'N/A', website || 'N/A', business_url || 'N/A']);
    
    if (dupeCheck.rows.length > 0) {
      return res.status(400).json({ success: false, error: "Duplicate lead detected in this campaign based on contact info or URLs." });
    }

    const insert = await pool.query(`
      INSERT INTO lead_submissions (campaign_id, student_id, business_name, contact_person, phone, email, website, address, city, country, industry, platform, keyword, business_url, lead_quality, notes)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16)
      RETURNING *
    `, [campaign_id, student_id, business_name, contact_person, phone, email, website, address, city, country, industry, platform, keyword, business_url, lead_quality, notes]);

    res.json({ success: true, data: insert.rows[0] });
  } catch (err: any) {
    if (err.code === '23505') { // unique constraint violation
        return res.status(400).json({ success: false, error: "Duplicate lead detected." });
    }
    res.status(500).json({ success: false, error: err.message });
  }
});

// Trainer/Admin gets all leads (with filters)
router.get('/leads', authenticateToken, requireAdminOrTrainer, async (req, res) => {
  try {
    const { campaign_id, student_id, status } = req.query;
    let query = 'SELECT ls.*, s.first_name, s.last_name, lc.title as campaign_title FROM lead_submissions ls JOIN students s ON ls.student_id = s.id JOIN lead_campaigns lc ON ls.campaign_id = lc.id WHERE 1=1';
    const params: any[] = [];
    let idx = 1;

    if (campaign_id) { query += ` AND ls.campaign_id = $${idx++}`; params.push(campaign_id); }
    if (student_id) { query += ` AND ls.student_id = $${idx++}`; params.push(student_id); }
    if (status) { query += ` AND ls.status = $${idx++}`; params.push(status); }

    query += ' ORDER BY ls.created_at DESC';
    const result = await pool.query(query, params);
    res.json({ success: true, data: result.rows });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Trainer/Admin reviews a lead
router.post('/leads/:id/review', authenticateToken, requireAdminOrTrainer, async (req, res) => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const leadId = req.params.id;
    const { status, feedback, points_awarded } = req.body;
    
    // Update Lead Status
    const updateLead = await client.query('UPDATE lead_submissions SET status = $1 WHERE id = $2 RETURNING student_id', [status, leadId]);
    const studentId = updateLead.rows[0].student_id;

    // Insert Review
    await client.query(`
      INSERT INTO lead_reviews (lead_id, reviewer_id, reviewer_role, feedback, points_awarded)
      VALUES ($1, $2, $3, $4, $5)
    `, [leadId, req.user?.id, req.user?.role, feedback, points_awarded]);

    // Insert Points Ledger
    if (points_awarded > 0) {
      await client.query(`
        INSERT INTO lead_points_ledger (student_id, lead_id, points)
        VALUES ($1, $2, $3)
      `, [studentId, leadId, points_awarded]);
    }

    await client.query('COMMIT');
    res.json({ success: true, message: "Review submitted successfully" });
  } catch (err: any) {
    await client.query('ROLLBACK');
    res.status(500).json({ success: false, error: err.message });
  } finally {
    client.release();
  }
});

// Leaderboard
router.get('/reports/leaderboard', authenticateToken, async (req, res) => {
  try {
    // Leaderboard aggregates points from lead_points_ledger and total leads from lead_submissions
    const lb = await pool.query(`
      SELECT 
        s.id as student_id,
        s.first_name,
        s.last_name,
        s.enrollment_id,
        COALESCE(SUM(lpl.points), 0) as total_points,
        (SELECT COUNT(*) FROM lead_submissions ls WHERE ls.student_id = s.id AND ls.status = 'approved') as approved_leads,
        (SELECT COUNT(*) FROM lead_submissions ls WHERE ls.student_id = s.id AND ls.status = 'rejected') as rejected_leads,
        (SELECT COUNT(*) FROM lead_submissions ls WHERE ls.student_id = s.id) as total_submissions
      FROM students s
      LEFT JOIN lead_points_ledger lpl ON s.id = lpl.student_id
      GROUP BY s.id, s.first_name, s.last_name, s.enrollment_id
      HAVING (SELECT COUNT(*) FROM lead_submissions ls WHERE ls.student_id = s.id) > 0
      ORDER BY total_points DESC
    `);
    res.json({ success: true, data: lb.rows });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

export default router;
