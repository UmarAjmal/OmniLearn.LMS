import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import nodemailer from 'nodemailer';
import { supabase, pool } from './db.js';

dotenv.config();

// ==========================================
// EMAIL TRANSPORTER (Nodemailer + Gmail SMTP)
// ==========================================
const emailTransporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || 'smtp.gmail.com',
  port: Number(process.env.SMTP_PORT) || 587,
  secure: false, // TLS
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

const ADMIN_EMAIL = process.env.ADMIN_EMAIL || process.env.SMTP_USER || '';

async function sendEmail(to: string, subject: string, html: string): Promise<boolean> {
  if (!process.env.SMTP_USER || !process.env.SMTP_PASS ||
      process.env.SMTP_USER.includes('your_admin') || process.env.SMTP_PASS.includes('your_gmail')) {
    console.warn('⚠️  SMTP not configured — skipping email send. Fill SMTP_USER & SMTP_PASS in server/.env');
    return false;
  }
  try {
    await emailTransporter.sendMail({
      from: `"Falcon Swift Team" <${ADMIN_EMAIL}>`,
      to,
      subject,
      html,
    });
    console.log(`✅ Email sent to ${to}`);
    return true;
  } catch (err: any) {
    console.error('❌ Email send error:', err.message);
    return false;
  }
}

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

// Root route
app.get('/', (req, res) => {
  res.send('OmniLearn LMS Backend API is running perfectly!');
});

// Health check
app.get('/api/health', async (req, res) => {
  try {
    const result = await pool.query('SELECT NOW() as current_time');
    res.json({ 
      status: 'ok', 
      message: 'LMS Server is running and DB is connected!',
      dbTime: result.rows[0].current_time
    });
  } catch (err: any) {
    res.status(500).json({ status: 'error', error: err.message });
  }
});

// ==========================================
// COURSE BUILDER API ROUTES
// ==========================================

// 1. Get all courses (including sections and lessons count)
app.get('/api/courses', async (req, res) => {
  try {
    const query = `
      SELECT c.*, 
             COALESCE(COUNT(DISTINCT s.id), 0) as sections_count,
             COALESCE(COUNT(DISTINCT l.id), 0) as lessons_count
      FROM courses c
      LEFT JOIN sections s ON s.course_id = c.id
      LEFT JOIN lessons l ON l.section_id = s.id
      GROUP BY c.id
      ORDER BY c.created_at DESC
    `;
    const result = await pool.query(query);
    res.json({ success: true, data: result.rows });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// 2. Get a single course with nested sections and lessons
app.get('/api/courses/:id', async (req, res) => {
  const { id } = req.params;
  try {
    // A. Fetch course metadata
    const courseResult = await pool.query('SELECT * FROM courses WHERE id = $1', [id]);
    if (courseResult.rows.length === 0) {
      return res.status(404).json({ success: false, error: 'Course not found' });
    }
    const course = courseResult.rows[0];

    // B. Fetch sections for this course
    const sectionsResult = await pool.query(
      'SELECT * FROM sections WHERE course_id = $1 ORDER BY sort_order ASC, id ASC',
      [id]
    );
    const sections = sectionsResult.rows;

    // C. Fetch lessons for this course's sections
    const lessonsResult = await pool.query(
      `SELECT l.* FROM lessons l 
       JOIN sections s ON l.section_id = s.id 
       WHERE s.course_id = $1 
       ORDER BY l.sort_order ASC, l.id ASC`,
      [id]
    );
    const lessons = lessonsResult.rows;

    // D. Nest lessons inside their parent sections
    const nestedSections = sections.map(section => {
      return {
        ...section,
        lessons: lessons.filter(lesson => lesson.section_id === section.id)
      };
    });

    res.json({
      success: true,
      data: {
        ...course,
        sections: nestedSections
      }
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// 3. Create a new course (Step 1)
app.post('/api/courses', async (req, res) => {
  const { title, category, description, thumbnail_url } = req.body;
  try {
    const query = `
      INSERT INTO courses (title, category, description, thumbnail_url, status)
      VALUES ($1, $2, $3, $4, 'draft')
      RETURNING *
    `;
    const result = await pool.query(query, [
      title || 'Untitled Course',
      category || 'Technology',
      description || '',
      thumbnail_url || ''
    ]);
    res.status(201).json({ success: true, data: result.rows[0] });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// 4. Update a course (Step 1 / 4)
app.put('/api/courses/:id', async (req, res) => {
  const { id } = req.params;
  const { title, category, description, thumbnail_url, price, status } = req.body;
  try {
    const query = `
      UPDATE courses 
      SET title = COALESCE($1, title),
          category = COALESCE($2, category),
          description = COALESCE($3, description),
          thumbnail_url = COALESCE($4, thumbnail_url),
          price = COALESCE($5, price),
          status = COALESCE($6, status),
          updated_at = CURRENT_TIMESTAMP
      WHERE id = $7
      RETURNING *
    `;
    const result = await pool.query(query, [title, category, description, thumbnail_url, price, status, id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, error: 'Course not found' });
    }
    res.json({ success: true, data: result.rows[0] });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// ==========================================
// SECTIONS MANAGEMENT ROUTES
// ==========================================

// 5. Add a section to a course
app.post('/api/courses/:id/sections', async (req, res) => {
  const { id } = req.params;
  const { title, sort_order } = req.body;
  try {
    const query = `
      INSERT INTO sections (course_id, title, sort_order)
      VALUES ($1, $2, $3)
      RETURNING *
    `;
    const result = await pool.query(query, [id, title || 'New Section', sort_order || 0]);
    res.status(201).json({ success: true, data: { ...result.rows[0], lessons: [] } });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// 6. Update section (title, sort_order)
app.put('/api/sections/:id', async (req, res) => {
  const { id } = req.params;
  const { title, sort_order } = req.body;
  try {
    const query = `
      UPDATE sections
      SET title = COALESCE($1, title),
          sort_order = COALESCE($2, sort_order)
      WHERE id = $3
      RETURNING *
    `;
    const result = await pool.query(query, [title, sort_order, id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, error: 'Section not found' });
    }
    res.json({ success: true, data: result.rows[0] });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// 7. Delete a section
app.delete('/api/sections/:id', async (req, res) => {
  const { id } = req.params;
  try {
    await pool.query('DELETE FROM sections WHERE id = $1', [id]);
    res.json({ success: true, message: 'Section deleted successfully' });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// ==========================================
// LESSONS MANAGEMENT ROUTES
// ==========================================

// 8. Add a lesson to a section
app.post('/api/sections/:sectionId/lessons', async (req, res) => {
  const { sectionId } = req.params;
  const { title, duration, sort_order, media_url } = req.body;
  try {
    const query = `
      INSERT INTO lessons (section_id, title, duration, sort_order, media_url)
      VALUES ($1, $2, $3, $4, $5)
      RETURNING *
    `;
    const result = await pool.query(query, [
      sectionId, 
      title || 'New Lesson', 
      duration || '00:00', 
      sort_order || 0,
      media_url || ''
    ]);
    res.status(201).json({ success: true, data: result.rows[0] });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// 9. Update a lesson (title, duration, sort_order, media_url)
app.put('/api/lessons/:id', async (req, res) => {
  const { id } = req.params;
  const { title, duration, sort_order, media_url } = req.body;
  try {
    const query = `
      UPDATE lessons
      SET title = COALESCE($1, title),
          duration = COALESCE($2, duration),
          sort_order = COALESCE($3, sort_order),
          media_url = COALESCE($4, media_url)
      WHERE id = $5
      RETURNING *
    `;
    const result = await pool.query(query, [title, duration, sort_order, media_url, id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, error: 'Lesson not found' });
    }
    res.json({ success: true, data: result.rows[0] });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// 10. Delete a lesson
app.delete('/api/lessons/:id', async (req, res) => {
  const { id } = req.params;
  try {
    await pool.query('DELETE FROM lessons WHERE id = $1', [id]);
    res.json({ success: true, message: 'Lesson deleted successfully' });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// 11. Publish a course with its price
app.post('/api/courses/:id/publish', async (req, res) => {
  const { id } = req.params;
  const { price } = req.body;
  try {
    const query = `
      UPDATE courses
      SET status = 'published',
          price = $1,
          updated_at = CURRENT_TIMESTAMP
      WHERE id = $2
      RETURNING *
    `;
    const result = await pool.query(query, [price || 0.00, id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, error: 'Course not found' });
    }
    res.json({ success: true, message: 'Course published successfully', data: result.rows[0] });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// 12. Parse and Import Curriculum (Mock/Helper for Step 2 upload)
app.post('/api/courses/:id/import-curriculum', async (req, res) => {
  const { id } = req.params;
  const { textData } = req.body; // Expecting raw text/csv rows
  try {
    // Helper parser for a CSV string: section_name, lesson_name, duration
    const lines = textData.split('\n');
    let currentSectionId: number | null = null;
    let currentSectionName = '';
    let sectionSort = 1;
    let lessonSort = 1;
    
    const importedData = [];

    for (let line of lines) {
      line = line.trim();
      if (!line) continue;
      
      const parts = line.split(',').map((p: string) => p.trim());
      const sectionName = parts[0] || 'Introduction';
      const lessonName = parts[1];
      const duration = parts[2] || '05:00';

      // If new section name, create the section
      if (sectionName !== currentSectionName) {
        currentSectionName = sectionName;
        const sectQuery = `
          INSERT INTO sections (course_id, title, sort_order)
          VALUES ($1, $2, $3)
          RETURNING *
        `;
        const sectRes = await pool.query(sectQuery, [id, sectionName, sectionSort++]);
        currentSectionId = sectRes.rows[0].id;
        lessonSort = 1;
        
        importedData.push({
          ...sectRes.rows[0],
          lessons: []
        });
      }

      // If lesson name provided, insert the lesson into current section
      if (lessonName && currentSectionId) {
        const lessQuery = `
          INSERT INTO lessons (section_id, title, duration, sort_order)
          VALUES ($1, $2, $3, $4)
          RETURNING *
        `;
        const lessRes = await pool.query(lessQuery, [currentSectionId, lessonName, duration, lessonSort++]);
        
        // Push into the last imported section
        if (importedData.length > 0) {
          importedData[importedData.length - 1].lessons.push(lessRes.rows[0]);
        }
      }
    }

    res.json({ success: true, message: 'Curriculum imported successfully', data: importedData });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// 13. Bulk Save Curriculum (Replaces all sections/lessons with a new structured list)
app.post('/api/courses/:id/bulk-curriculum', async (req, res) => {
  const { id } = req.params;
  const { sections } = req.body; // Expecting array of { title, sort_order, lessons: [...] }
  
  try {
    // We run this inside a transaction to ensure database consistency
    await pool.query('BEGIN');
    
    // 1. Delete all existing sections (will cascade delete all lessons)
    await pool.query('DELETE FROM sections WHERE course_id = $1', [id]);
    
    // 2. Insert new sections and lessons
    if (sections && Array.isArray(sections)) {
      for (let sIdx = 0; sIdx < sections.length; sIdx++) {
        const section = sections[sIdx];
        const sectRes = await pool.query(
          'INSERT INTO sections (course_id, title, sort_order) VALUES ($1, $2, $3) RETURNING id',
          [id, section.title || `Section ${sIdx + 1}`, section.sort_order || (sIdx + 1)]
        );
        const sectionId = sectRes.rows[0].id;
        
        if (section.lessons && Array.isArray(section.lessons)) {
          for (let lIdx = 0; lIdx < section.lessons.length; lIdx++) {
            const lesson = section.lessons[lIdx];
            await pool.query(
              'INSERT INTO lessons (section_id, title, duration, sort_order, media_url, hands_on_task, project_milestone, tech_stack, difficulty) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)',
              [
                sectionId,
                lesson.title || `Lesson ${lIdx + 1}`,
                lesson.duration || '10:00',
                lesson.sort_order || (lIdx + 1),
                lesson.media_url || '',
                lesson.hands_on_task || '',
                lesson.project_milestone || '',
                lesson.tech_stack || '',
                lesson.difficulty || 'Beginner'
              ]
            );
          }
        }
      }
    }
    
    await pool.query('COMMIT');
    res.json({ success: true, message: 'Curriculum bulk saved successfully' });
  } catch (err: any) {
    await pool.query('ROLLBACK');
    res.status(500).json({ success: false, error: err.message });
  }
});

// Example route using Supabase Data API (if setup)
app.get('/api/users', async (req, res) => {
  if (!supabase) {
    return res.status(500).json({ error: 'Supabase client is not configured' });
  }

  const { data, error } = await supabase.from('users').select('*');
  if (error) return res.status(500).json({ error: error.message });
  res.json({ data });
});

// ==========================================
// APPLICANTS & STUDENTS API ROUTES
// ==========================================

import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'your-super-secret-jwt-key';

// Submit new Application
app.post('/api/applicants', async (req, res) => {
  const { first_name, last_name, email, phone, program, academic_background, course_interest } = req.body;
  try {
    const query = `
      INSERT INTO applicants (first_name, last_name, email, phone, academic_background, course_interest, program)
      VALUES ($1, $2, $3, $4, $5, $6, $7)
      RETURNING *
    `;
    const result = await pool.query(query, [
      first_name, 
      last_name, 
      email, 
      phone, 
      academic_background || '', 
      course_interest || '',
      program || ''
    ]);
    res.status(201).json({ success: true, data: result.rows[0] });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Get all pending applicants
app.get('/api/applicants', async (req, res) => {
  try {
    const result = await pool.query("SELECT * FROM applicants WHERE status = 'pending' ORDER BY created_at DESC");
    res.json({ success: true, data: result.rows });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Approve Applicant (Creates User & Student)
app.post('/api/applicants/:id/approve', async (req, res) => {
  const { id } = req.params;
  const client = await pool.connect();
  
  try {
    await client.query('BEGIN');
    
    // 1. Get applicant
    const applicantRes = await client.query('SELECT * FROM applicants WHERE id = $1', [id]);
    if (applicantRes.rows.length === 0) {
      throw new Error("Applicant not found");
    }
    const applicant = applicantRes.rows[0];
    
    if (applicant.status === 'approved') {
      throw new Error("Applicant already approved");
    }

    // 2. Hash phone as password
    const hashedPassword = await bcrypt.hash(applicant.phone, 10);
    
    // 3. Create User
    const userRes = await client.query(`
      INSERT INTO users (email, password_hash, role)
      VALUES ($1, $2, 'student')
      RETURNING id
    `, [applicant.email, hashedPassword]);
    const userId = userRes.rows[0].id;

    // 4. Create Student
    const enrollmentId = 'ENR-' + Date.now().toString().slice(-6) + '-' + applicant.id;
    await client.query(`
      INSERT INTO students (user_id, first_name, last_name, enrollment_id, program)
      VALUES ($1, $2, $3, $4, $5)
    `, [userId, applicant.first_name, applicant.last_name, enrollmentId, applicant.program]);

    // 5. Update Applicant Status
    await client.query("UPDATE applicants SET status = 'approved' WHERE id = $1", [id]);

    await client.query('COMMIT');
    res.json({ success: true, message: 'Applicant approved. User and Student accounts created successfully.' });
  } catch (err: any) {
    await client.query('ROLLBACK');
    res.status(500).json({ success: false, error: err.message });
  } finally {
    client.release();
  }
});

// Reject Applicant
app.post('/api/applicants/:id/reject', async (req, res) => {
  const { id } = req.params;
  try {
    await pool.query("UPDATE applicants SET status = 'rejected' WHERE id = $1", [id]);
    res.json({ success: true, message: 'Applicant rejected.' });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// ==========================================
// AUTHENTICATION API ROUTES (JWT)
// ==========================================

app.post('/api/auth/login', async (req, res) => {
  const { email, password } = req.body;
  try {
    // 1. Find user by email
    const userRes = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
    if (userRes.rows.length === 0) {
      return res.status(401).json({ success: false, error: 'Invalid email or password' });
    }
    const user = userRes.rows[0];

    // 2. Check password
    const isMatch = await bcrypt.compare(password, user.password_hash);
    if (!isMatch) {
      return res.status(401).json({ success: false, error: 'Invalid email or password' });
    }

    // 3. Generate token
    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.role },
      JWT_SECRET,
      { expiresIn: '24h' }
    );

    res.json({ 
      success: true, 
      token, 
      user: { 
        id: user.id, 
        email: user.email, 
        role: user.role 
      } 
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// ==========================================
// REGISTERED STUDENTS ROUTES
// ==========================================

// Get all registered students
app.get('/api/students', async (req, res) => {
  try {
    const query = `
      SELECT s.*, u.email, COALESCE(a.phone, t.whatsapp) as phone 
      FROM students s 
      JOIN users u ON s.user_id = u.id 
      LEFT JOIN applicants a ON a.email = u.email 
      LEFT JOIN training_applications t ON t.gmail = u.email
      ORDER BY s.created_at DESC
    `;
    const result = await pool.query(query);
    res.json({ success: true, data: result.rows });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});



// POST submit a new training application (from public apply form)
app.post('/api/training-applications', async (req, res) => {
  const {
    fullName,
    fatherName,
    cnic,
    age,
    whatsapp,
    gmail,
    universityName,
    department,
    semester,
    tracks,
    referenceCode,
    createAccount,
    password
  } = req.body;

  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    // 1. Check duplicates
    const checkDup = await client.query(
      "SELECT id FROM training_applications WHERE cnic = $1 OR gmail = $2",
      [cnic, gmail]
    );
    if (checkDup.rows.length > 0) {
      client.release();
      return res.status(400).json({
        success: false,
        error: "An application with this CNIC or Gmail already exists."
      });
    }

    // 2. Optional user login account creation
    if (createAccount && password) {
      const checkUser = await client.query("SELECT id FROM users WHERE email = $1", [gmail]);
      if (checkUser.rows.length > 0) {
        client.release();
        return res.status(400).json({
          success: false,
          error: "A portal account with this email address already exists. Please choose a different email or proceed without account creation."
        });
      }

      const hashedPassword = await bcrypt.hash(password, 10);
      await client.query(
        "INSERT INTO users (email, password_hash, role) VALUES ($1, $2, 'student')",
        [gmail, hashedPassword]
      );
    }

    // 3. Insert application
    const query = `
      INSERT INTO training_applications (
        full_name, father_name, cnic, age, whatsapp, gmail, 
        university_name, department, semester, tracks, reference_code, status
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, 'pending')
      RETURNING *
    `;
    const result = await client.query(query, [
      fullName,
      fatherName,
      cnic,
      age,
      whatsapp,
      gmail,
      universityName,
      department,
      semester,
      tracks,
      referenceCode
    ]);

    await client.query('COMMIT');
    client.release();

    res.status(201).json({ success: true, data: result.rows[0] });
  } catch (err: any) {
    await client.query('ROLLBACK');
    client.release();
    console.error("Error inserting application:", err.message);
    res.status(500).json({ success: false, error: "Database error. Please try again." });
  }
});

// GET all pending training applications
app.get('/api/training-applications', async (req, res) => {
  try {
    const result = await pool.query(
      "SELECT * FROM training_applications WHERE status = 'pending' ORDER BY created_at DESC"
    );
    res.json({ success: true, data: result.rows });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// GET count of pending training applications (for badge)
app.get('/api/training-applications/count', async (req, res) => {
  try {
    const result = await pool.query(
      "SELECT COUNT(*) as count FROM training_applications WHERE status = 'pending'"
    );
    res.json({ success: true, count: parseInt(result.rows[0].count || '0') });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// POST approve a training application + send acceptance email
app.post('/api/training-applications/:id/approve', async (req, res) => {
  const { id } = req.params;
  const { note } = req.body;
  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    // 1. Fetch the application
    const fetchRes = await client.query(
      "SELECT * FROM training_applications WHERE id = $1",
      [id]
    );
    if (fetchRes.rows.length === 0) {
      client.release();
      return res.status(404).json({ success: false, error: 'Application not found' });
    }
    const app_data = fetchRes.rows[0];

    // 2. Update status to 'approved'
    await client.query(
      "UPDATE training_applications SET status = 'approved', reviewed_at = NOW() WHERE id = $1",
      [id]
    );

    // 3. Check or Create User Account
    let userRes = await client.query("SELECT id FROM users WHERE email = $1", [app_data.gmail]);
    let userId;
    if (userRes.rows.length > 0) {
      userId = userRes.rows[0].id;
    } else {
      // Create user with default password (using whatsapp phone number as password)
      const defaultPassword = app_data.whatsapp || 'FalconSwift123';
      const hashedPassword = await bcrypt.hash(defaultPassword, 10);
      const newUserRes = await client.query(
        "INSERT INTO users (email, password_hash, role) VALUES ($1, $2, 'student') RETURNING id",
        [app_data.gmail, hashedPassword]
      );
      userId = newUserRes.rows[0].id;
    }

    // 4. Check or Create Student Registry (Shift/Enroll Student)
    const studentRes = await client.query("SELECT id FROM students WHERE user_id = $1", [userId]);
    if (studentRes.rows.length === 0) {
      const enrollmentId = 'ENR-' + Date.now().toString().slice(-6) + '-' + app_data.id;
      const programName = app_data.tracks && app_data.tracks.length > 0 ? app_data.tracks[0] : 'General';
      const nameParts = app_data.full_name.trim().split(/\s+/);
      const firstName = nameParts[0] || 'Student';
      const lastName = nameParts.slice(1).join(' ') || 'User';

      await client.query(
        "INSERT INTO students (user_id, first_name, last_name, enrollment_id, program) VALUES ($1, $2, $3, $4, $5)",
        [userId, firstName, lastName, enrollmentId, programName]
      );
    }

    await client.query('COMMIT');
    client.release();

    // 5. Send acceptance email
    const trackLabels: Record<string, string> = {
      'fullstack-ai': 'Full Stack AI Engineer',
      'devops': 'DevOps',
      'app-dev': 'App Development',
      'web-dev': 'Web Development',
    };
    const tracksHtml = (app_data.tracks || [])
      .map((t: string) => `<span style="display:inline-block;padding:4px 12px;background:#e0f0ff;border-radius:20px;font-size:13px;font-weight:600;color:#1a5280;margin:3px;">${trackLabels[t] || t}</span>`)
      .join('');

    const noteSection = note && note.trim()
      ? `<div style="margin-top:20px;padding:16px;background:#f0f9ff;border-left:4px solid #206393;border-radius:8px;">
           <p style="font-size:13px;font-weight:700;color:#206393;margin:0 0 6px;text-transform:uppercase;letter-spacing:0.05em;">Note from Admin</p>
           <p style="font-size:14px;color:#1e3a5f;margin:0;line-height:1.6;">${note.trim()}</p>
         </div>`
      : '';

    const emailHtml = `
      <!DOCTYPE html>
      <html lang="en">
      <head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1.0"></head>
      <body style="margin:0;padding:0;background:#f4f7fb;font-family:'Segoe UI',Arial,sans-serif;">
        <div style="max-width:600px;margin:40px auto;background:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.08);">
          <!-- Header -->
          <div style="background:linear-gradient(135deg,#206393 0%,#0a3d62 100%);padding:40px 40px 32px;text-align:center;">
            <div style="width:64px;height:64px;background:rgba(255,255,255,0.15);border-radius:50%;display:inline-flex;align-items:center;justify-content:center;margin-bottom:16px;">
              <span style="font-size:32px;">🎉</span>
            </div>
            <h1 style="color:#ffffff;font-size:26px;font-weight:800;margin:0 0 8px;letter-spacing:-0.5px;">Application Accepted!</h1>
            <p style="color:rgba(255,255,255,0.75);font-size:15px;margin:0;">Falcon Swift Training & Internships</p>
          </div>
          <!-- Body -->
          <div style="padding:36px 40px;">
            <p style="font-size:16px;color:#1e293b;margin:0 0 16px;">Dear <strong>${app_data.full_name}</strong>,</p>
            <p style="font-size:15px;color:#475569;line-height:1.7;margin:0 0 20px;">
              We are delighted to inform you that your application for <strong>Falcon Swift Training & Internships</strong> has been <strong style="color:#16a34a;">accepted</strong>. Congratulations on taking this important step in your career journey!
            </p>
            <div style="margin-bottom:20px;">
              <p style="font-size:13px;font-weight:700;color:#64748b;text-transform:uppercase;letter-spacing:0.06em;margin:0 0 10px;">Selected Tracks</p>
              <div>${tracksHtml}</div>
            </div>
            ${noteSection}
            <div style="margin-top:24px;padding:20px;background:#f8fafc;border-radius:12px;border:1px solid #e2e8f0;">
              <p style="font-size:13px;font-weight:700;color:#64748b;text-transform:uppercase;letter-spacing:0.06em;margin:0 0 12px;">Your Details on File</p>
              <table style="width:100%;font-size:14px;color:#1e293b;">
                <tr><td style="padding:4px 0;color:#64748b;width:130px;">University</td><td><strong>${app_data.university_name}</strong></td></tr>
                <tr><td style="padding:4px 0;color:#64748b;">Department</td><td><strong>${app_data.department}</strong></td></tr>
                <tr><td style="padding:4px 0;color:#64748b;">Semester</td><td><strong>${app_data.semester}</strong></td></tr>
                <tr><td style="padding:4px 0;color:#64748b;">WhatsApp</td><td><strong>${app_data.whatsapp}</strong></td></tr>
              </table>
            </div>
            <p style="font-size:15px;color:#475569;line-height:1.7;margin:24px 0 0;">
              Our team will reach out to you on your WhatsApp number (<strong>${app_data.whatsapp}</strong>) with further details about the schedule and onboarding process.
            </p>
          </div>
          <!-- Footer -->
          <div style="padding:24px 40px;background:#f8fafc;border-top:1px solid #e2e8f0;text-align:center;">
            <p style="font-size:13px;color:#94a3b8;margin:0;">© ${new Date().getFullYear()} Falcon Swift Training & Internships. All rights reserved.</p>
            <p style="font-size:12px;color:#cbd5e1;margin:6px 0 0;">This email was sent from the admin portal. Please do not reply directly.</p>
          </div>
        </div>
      </body>
      </html>
    `;

    await sendEmail(
      app_data.gmail,
      '🎉 Application Accepted — Falcon Swift Training & Internships',
      emailHtml
    );

    res.json({ success: true, message: 'Application approved, user/student enrolled, and email sent.' });
  } catch (err: any) {
    await client.query('ROLLBACK');
    client.release();
    res.status(500).json({ success: false, error: err.message });
  }
});

// POST reject a training application + send rejection email
app.post('/api/training-applications/:id/reject', async (req, res) => {
  const { id } = req.params;
  const { note } = req.body;

  try {
    // 1. Fetch the application using pg pool
    const fetchRes = await pool.query(
      "SELECT * FROM training_applications WHERE id = $1",
      [id]
    );
    if (fetchRes.rows.length === 0) {
      return res.status(404).json({ success: false, error: 'Application not found' });
    }
    const app_data = fetchRes.rows[0];

    // 2. Update status to 'rejected'
    await pool.query(
      "UPDATE training_applications SET status = 'rejected', reviewed_at = NOW() WHERE id = $1",
      [id]
    );

    // 3. Send rejection email
    const noteSection = note && note.trim()
      ? `<div style="margin-top:20px;padding:16px;background:#fef2f2;border-left:4px solid #dc2626;border-radius:8px;">
           <p style="font-size:13px;font-weight:700;color:#dc2626;margin:0 0 6px;text-transform:uppercase;letter-spacing:0.05em;">Note from Admin</p>
           <p style="font-size:14px;color:#991b1b;margin:0;line-height:1.6;">${note.trim()}</p>
         </div>`
      : '';

    const emailHtml = `
      <!DOCTYPE html>
      <html lang="en">
      <head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1.0"></head>
      <body style="margin:0;padding:0;background:#f4f7fb;font-family:'Segoe UI',Arial,sans-serif;">
        <div style="max-width:600px;margin:40px auto;background:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.08);">
          <!-- Header -->
          <div style="background:linear-gradient(135deg,#334155 0%,#1e293b 100%);padding:40px 40px 32px;text-align:center;">
            <div style="width:64px;height:64px;background:rgba(255,255,255,0.1);border-radius:50%;display:inline-flex;align-items:center;justify-content:center;margin-bottom:16px;">
              <span style="font-size:32px;">📋</span>
            </div>
            <h1 style="color:#ffffff;font-size:26px;font-weight:800;margin:0 0 8px;letter-spacing:-0.5px;">Application Status Update</h1>
            <p style="color:rgba(255,255,255,0.65);font-size:15px;margin:0;">Falcon Swift Training & Internships</p>
          </div>
          <!-- Body -->
          <div style="padding:36px 40px;">
            <p style="font-size:16px;color:#1e293b;margin:0 0 16px;">Dear <strong>${app_data.full_name}</strong>,</p>
            <p style="font-size:15px;color:#475569;line-height:1.7;margin:0 0 20px;">
              Thank you sincerely for your interest in <strong>Falcon Swift Training & Internships</strong> and for taking the time to submit your application.
            </p>
            <p style="font-size:15px;color:#475569;line-height:1.7;margin:0 0 20px;">
              After careful review of all applications received, we regret to inform you that we are <strong style="color:#dc2626;">unable to offer you a position</strong> in the current training batch. This was a highly competitive process, and we encourage you not to be discouraged.
            </p>
            ${noteSection}
            <div style="padding:20px;background:#fff7ed;border-left:4px solid #f97316;border-radius:8px;margin-bottom:20px;margin-top:20px;">
              <p style="font-size:14px;color:#9a3412;font-weight:600;margin:0 0 6px;">Keep Growing! 💪</p>
              <p style="font-size:14px;color:#7c2d12;margin:0;line-height:1.6;">
                We invite you to apply again in our next batch. Continue building your skills and stay connected with us for future opportunities.
              </p>
            </div>
            <p style="font-size:15px;color:#475569;line-height:1.7;margin:0;">
              We wish you the very best in your academic and professional journey. Thank you once again for your interest in Falcon Swift.
            </p>
          </div>
          <!-- Footer -->
          <div style="padding:24px 40px;background:#f8fafc;border-top:1px solid #e2e8f0;text-align:center;">
            <p style="font-size:13px;color:#94a3b8;margin:0;">© ${new Date().getFullYear()} Falcon Swift Training & Internships. All rights reserved.</p>
            <p style="font-size:12px;color:#cbd5e1;margin:6px 0 0;">This email was sent from the admin portal. Please do not reply directly.</p>
          </div>
        </div>
      </body>
      </html>
    `;

    await sendEmail(
      app_data.gmail,
      'Application Status — Falcon Swift Training & Internships',
      emailHtml
    );

    res.json({ success: true, message: 'Application rejected and email sent.' });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// ==========================================
// TASKS ROUTES
// ==========================================

// GET all tasks (with optional course filter)
app.get('/api/tasks', async (req, res) => {
  const { course } = req.query;
  try {
    let query = `SELECT * FROM tasks ORDER BY created_at DESC`;
    let params: any[] = [];
    if (course) {
      query = `SELECT * FROM tasks WHERE course_id = $1 ORDER BY created_at DESC`;
      params = [course];
    }
    const result = await pool.query(query, params);
    res.json({ success: true, data: result.rows });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// POST create a new task
app.post('/api/tasks', async (req, res) => {
  const { title, description, courseId, courseLabel, points, dueDate, referenceLinks, assignedStudentIds } = req.body;
  if (!title || !courseId) return res.status(400).json({ success: false, error: 'Title and courseId are required.' });
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const taskRes = await client.query(
      `INSERT INTO tasks (title, description, course_id, course_label, points, due_date, reference_links)
       VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *`,
      [title, description, courseId, courseLabel, points || 100, dueDate || null, JSON.stringify(referenceLinks || [])]
    );
    const task = taskRes.rows[0];
    // Insert student-task assignments
    if (assignedStudentIds && assignedStudentIds.length > 0) {
      for (const studentId of assignedStudentIds) {
        await client.query(
          `INSERT INTO task_assignments (task_id, student_id, status) VALUES ($1, $2, 'pending')
           ON CONFLICT (task_id, student_id) DO NOTHING`,
          [task.id, studentId]
        );
      }
    }
    await client.query('COMMIT');
    client.release();
    res.status(201).json({ success: true, data: task });
  } catch (err: any) {
    await client.query('ROLLBACK');
    client.release();
    res.status(500).json({ success: false, error: err.message });
  }
});

// ── IMPORTANT: All /api/tasks/assignments/... routes MUST come BEFORE /api/tasks/:id
// ── otherwise Express captures 'assignments' as :id and returns 404.

// GET task assignments for a course
app.get('/api/tasks/assignments/by-course/:courseId', async (req, res) => {
  const { courseId } = req.params;
  try {
    const result = await pool.query(`
      SELECT
        ta.id AS assignment_id,
        ta.task_id,
        ta.student_id,
        ta.status,
        ta.score,
        ta.graded_at,
        ta.created_at AS assigned_at,
        t.title AS task_name,
        t.description AS task_description,
        t.course_id,
        t.course_label,
        t.points,
        t.due_date,
        t.reference_links,
        s.first_name,
        s.last_name,
        s.enrollment_id,
        s.program,
        u.email
      FROM task_assignments ta
      JOIN tasks t ON t.id = ta.task_id
      JOIN students s ON s.id = ta.student_id
      JOIN users u ON u.id = s.user_id
      WHERE t.course_id = $1
      ORDER BY ta.created_at DESC
    `, [courseId]);
    res.json({ success: true, data: result.rows });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// POST submit task proof (student submission)
app.post('/api/tasks/assignments/:assignmentId/submit', async (req, res) => {
  const { assignmentId } = req.params;
  const { description, githubUrl, liveUrl, additionalLinks, imageUrls, videoUrl, notes } = req.body;
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    await client.query(
      `INSERT INTO task_submissions (assignment_id, description, github_url, live_url, additional_links, image_urls, video_url, notes, submitted_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW())
       ON CONFLICT (assignment_id) DO UPDATE SET
         description = EXCLUDED.description,
         github_url = EXCLUDED.github_url,
         live_url = EXCLUDED.live_url,
         additional_links = EXCLUDED.additional_links,
         image_urls = EXCLUDED.image_urls,
         video_url = EXCLUDED.video_url,
         notes = EXCLUDED.notes,
         submitted_at = NOW()`,
      [assignmentId, description, githubUrl, liveUrl, JSON.stringify(additionalLinks || []), JSON.stringify(imageUrls || []), videoUrl, notes]
    );
    await client.query(
      `UPDATE task_assignments SET status = 'completed' WHERE id = $1`,
      [assignmentId]
    );
    await client.query('COMMIT');
    client.release();
    res.json({ success: true, message: 'Submission saved successfully.' });
  } catch (err: any) {
    await client.query('ROLLBACK');
    client.release();
    res.status(500).json({ success: false, error: err.message });
  }
});

// POST grade a task assignment
app.post('/api/tasks/assignments/:assignmentId/grade', async (req, res) => {
  const { assignmentId } = req.params;
  const { score, feedback } = req.body;
  const scoreNum = Number(score);
  if (isNaN(scoreNum) || scoreNum < 0 || scoreNum > 100) {
    return res.status(400).json({ success: false, error: 'Score must be between 0 and 100.' });
  }
  try {
    await pool.query(
      `UPDATE task_assignments SET status = 'marked', score = $1, feedback = $2, graded_at = NOW() WHERE id = $3`,
      [scoreNum, feedback || null, assignmentId]
    );
    res.json({ success: true, message: 'Task graded successfully.' });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// GET single task assignment with submission details
app.get('/api/tasks/assignments/:assignmentId', async (req, res) => {
  const { assignmentId } = req.params;
  try {
    const result = await pool.query(`
      SELECT
        ta.id AS assignment_id,
        ta.task_id,
        ta.student_id,
        ta.status,
        ta.score,
        ta.graded_at,
        ta.feedback,
        ta.created_at AS assigned_at,
        t.title AS task_name,
        t.description AS task_description,
        t.course_id,
        t.course_label,
        t.points,
        t.due_date,
        t.reference_links,
        s.first_name,
        s.last_name,
        s.enrollment_id,
        s.program,
        u.email
      FROM task_assignments ta
      JOIN tasks t ON t.id = ta.task_id
      JOIN students s ON s.id = ta.student_id
      JOIN users u ON u.id = s.user_id
      WHERE ta.id = $1
    `, [assignmentId]);
    if (result.rows.length === 0) return res.status(404).json({ success: false, error: 'Assignment not found' });

    const submissionRes = await pool.query(
      'SELECT * FROM task_submissions WHERE assignment_id = $1 ORDER BY submitted_at DESC LIMIT 1',
      [assignmentId]
    );

    const historyRes = await pool.query(`
      SELECT ta2.score, ta2.graded_at, t2.title AS task_name, ta2.status
      FROM task_assignments ta2
      JOIN tasks t2 ON t2.id = ta2.task_id
      WHERE ta2.student_id = $1 AND ta2.status = 'marked' AND ta2.id != $2
      ORDER BY ta2.graded_at DESC
      LIMIT 5
    `, [result.rows[0].student_id, assignmentId]);

    res.json({
      success: true,
      data: {
        ...result.rows[0],
        submission: submissionRes.rows[0] || null,
        scoring_history: historyRes.rows
      }
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// GET single task by id — MUST be LAST among /api/tasks/* routes
app.get('/api/tasks/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const result = await pool.query('SELECT * FROM tasks WHERE id = $1', [id]);
    if (result.rows.length === 0) return res.status(404).json({ success: false, error: 'Task not found' });
    res.json({ success: true, data: result.rows[0] });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

app.listen(PORT, async () => {
  console.log(`Server is running on http://localhost:${PORT}`);
  try {
    await pool.query("ALTER TABLE applicants ADD COLUMN IF NOT EXISTS program VARCHAR(100)");
    console.log('✅ "applicants" table program column auto-migrated successfully!');
  } catch (dbErr: any) {
    console.error("Database self-correction failed:", dbErr.message);
  }
  // Auto-create/migrate training_applications table
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS training_applications (
        id SERIAL PRIMARY KEY,
        full_name VARCHAR(255) NOT NULL,
        father_name VARCHAR(255) NOT NULL,
        cnic VARCHAR(50) UNIQUE NOT NULL,
        age INT NOT NULL,
        whatsapp VARCHAR(50) NOT NULL,
        gmail VARCHAR(255) UNIQUE NOT NULL,
        university_name VARCHAR(255) NOT NULL,
        department VARCHAR(100) NOT NULL,
        semester INT NOT NULL,
        tracks TEXT[] NOT NULL,
        reference_code VARCHAR(100),
        status VARCHAR(50) DEFAULT 'pending',
        reviewed_at TIMESTAMPTZ,
        created_at TIMESTAMPTZ DEFAULT NOW()
      );
    `);
    console.log('✅ "training_applications" table created/verified successfully!');
  } catch (dbErr: any) {
    console.error('❌ Failed to verify/create "training_applications" table:', dbErr.message);
  }

  // Auto-create tasks table
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS tasks (
        id SERIAL PRIMARY KEY,
        title VARCHAR(500) NOT NULL,
        description TEXT,
        course_id VARCHAR(100) NOT NULL,
        course_label VARCHAR(255),
        points INT DEFAULT 100,
        due_date TIMESTAMPTZ,
        reference_links JSONB DEFAULT '[]',
        created_at TIMESTAMPTZ DEFAULT NOW()
      );
    `);
    console.log('✅ "tasks" table created/verified successfully!');
  } catch (dbErr: any) {
    console.error('❌ Failed to verify/create "tasks" table:', dbErr.message);
  }

  // Auto-create task_assignments table
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS task_assignments (
        id SERIAL PRIMARY KEY,
        task_id INT REFERENCES tasks(id) ON DELETE CASCADE NOT NULL,
        student_id INT REFERENCES students(id) ON DELETE CASCADE NOT NULL,
        status VARCHAR(50) DEFAULT 'pending',
        score NUMERIC(5,2),
        feedback TEXT,
        graded_at TIMESTAMPTZ,
        created_at TIMESTAMPTZ DEFAULT NOW(),
        UNIQUE(task_id, student_id)
      );
    `);
    console.log('✅ "task_assignments" table created/verified successfully!');
  } catch (dbErr: any) {
    console.error('❌ Failed to verify/create "task_assignments" table:', dbErr.message);
  }

  // Auto-create task_submissions table
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS task_submissions (
        id SERIAL PRIMARY KEY,
        assignment_id INT REFERENCES task_assignments(id) ON DELETE CASCADE NOT NULL UNIQUE,
        description TEXT,
        github_url VARCHAR(500),
        live_url VARCHAR(500),
        additional_links JSONB DEFAULT '[]',
        image_urls JSONB DEFAULT '[]',
        video_url VARCHAR(500),
        notes TEXT,
        submitted_at TIMESTAMPTZ DEFAULT NOW()
      );
    `);
    console.log('✅ "task_submissions" table created/verified successfully!');
  } catch (dbErr: any) {
    console.error('❌ Failed to verify/create "task_submissions" table:', dbErr.message);
  }
});
