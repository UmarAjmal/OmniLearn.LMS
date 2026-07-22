import 'dotenv/config';
import express from 'express';
import { authenticateToken, requireAdmin, requireTrainer, requireStudent, requireAdminOrTrainer } from './middleware/auth.js';
import fs from 'fs';
import cors from 'cors';
import nodemailer from 'nodemailer';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import campaignRoutes from './routes/campaigns.js';
import notificationRoutes from './routes/notifications.js';
import { NotificationEngine } from './services/NotificationEngine.js';
import { supabase, pool } from './db.js';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// dotenv.config() is now handled at the top of the file

const JWT_SECRET = process.env.JWT_SECRET || 'your-super-secret-jwt-key';

// ==========================================
// GitHub Image Upload Configuration
// ==========================================
const GITHUB_OWNER = 'UmarAjmal';
const GITHUB_REPO = 'OmniLearn.LMS';
const GITHUB_BRANCH = 'main';
const GITHUB_IMAGES_FOLDER = 'images';

async function uploadToGitHub(safeFilename: string, base64Content: string): Promise<string> {
  const token = process.env.GITHUB_TOKEN;
  if (!token) {
    throw new Error('GITHUB_TOKEN environment variable is not set. Cannot upload images.');
  }

  const apiUrl = `https://api.github.com/repos/${GITHUB_OWNER}/${GITHUB_REPO}/contents/${GITHUB_IMAGES_FOLDER}/${safeFilename}`;

  const response = await fetch(apiUrl, {
    method: 'PUT',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
      'Accept': 'application/vnd.github.v3+json',
      'X-GitHub-Api-Version': '2022-11-28'
    },
    body: JSON.stringify({
      message: `Upload image: ${safeFilename}`,
      content: base64Content,
      branch: GITHUB_BRANCH
    })
  });

  if (!response.ok) {
    const errorBody = await response.text();
    throw new Error(`GitHub API error (${response.status}): ${errorBody}`);
  }

  // Return the raw.githubusercontent URL for serving the image
  return `https://raw.githubusercontent.com/${GITHUB_OWNER}/${GITHUB_REPO}/${GITHUB_BRANCH}/${GITHUB_IMAGES_FOLDER}/${safeFilename}`;
}

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
app.use(express.json({ limit: '15mb' }));
app.use(express.urlencoded({ limit: '15mb', extended: true }));

// Mount modular routes
app.use('/api', campaignRoutes);
app.use('/api/notifications', notificationRoutes);

// Serve local uploads
app.use('/api/uploads', express.static(path.join(__dirname, '../uploads')));

// ==========================================
// Image Upload Endpoint — GitHub Contents API
// ==========================================
app.post('/api/upload', authenticateToken, async (req, res) => {
  const { filename, base64Data } = req.body;
  if (!filename || !base64Data) {
    return res.status(400).json({ success: false, error: 'filename and base64Data are required' });
  }

  try {
    // Extract pure base64 content (strip the data:image/...;base64, prefix)
    const matches = base64Data.match(/^data:([A-Za-z-+\/]+);base64,(.+)$/);
    if (!matches || matches.length !== 3) {
      return res.status(400).json({ success: false, error: 'Invalid base64 image data format' });
    }

    const pureBase64 = matches[2];

    // Sanitize filename
    const safeFilename = Date.now() + '_' + path.basename(filename).replace(/[^a-zA-Z0-9.\-_]/g, '');

    let imageUrl = '';
    
    if (process.env.GITHUB_TOKEN) {
      // Upload via GitHub Contents API (creates a commit in the repo)
      imageUrl = await uploadToGitHub(safeFilename, pureBase64);
    } else {
      console.warn('⚠️ GITHUB_TOKEN not set. Saving image locally.');
      const uploadsDir = path.join(__dirname, '../uploads');
      if (!fs.existsSync(uploadsDir)) {
        fs.mkdirSync(uploadsDir, { recursive: true });
      }
      const localPath = path.join(uploadsDir, safeFilename);
      fs.writeFileSync(localPath, Buffer.from(pureBase64, 'base64'));
      imageUrl = `/api/uploads/${safeFilename}`;
    }

    res.json({ success: true, url: imageUrl });
  } catch (err: any) {
    console.error('❌ Image upload error:', err.message);
    res.status(500).json({ success: false, error: err.message });
  }
});

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
app.get('/api/courses', authenticateToken, requireAdmin, async (req, res) => {
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
app.get('/api/courses/:id', authenticateToken, requireAdmin, async (req, res) => {
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
app.post('/api/courses', authenticateToken, requireAdmin, async (req, res) => {
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
app.put('/api/courses/:id', authenticateToken, requireAdmin, async (req, res) => {
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
app.post('/api/courses/:id/sections', authenticateToken, requireAdmin, async (req, res) => {
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
app.put('/api/sections/:id', authenticateToken, requireAdmin, async (req, res) => {
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
app.delete('/api/sections/:id', authenticateToken, requireAdmin, async (req, res) => {
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
app.post('/api/sections/:sectionId/lessons', authenticateToken, requireAdmin, async (req, res) => {
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
app.put('/api/lessons/:id', authenticateToken, requireAdmin, async (req, res) => {
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
app.delete('/api/lessons/:id', authenticateToken, requireAdmin, async (req, res) => {
  const { id } = req.params;
  try {
    await pool.query('DELETE FROM lessons WHERE id = $1', [id]);
    res.json({ success: true, message: 'Lesson deleted successfully' });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// 11. Publish a course with its price
app.post('/api/courses/:id/publish', authenticateToken, requireAdmin, async (req, res) => {
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
app.post('/api/courses/:id/import-curriculum', authenticateToken, requireAdmin, async (req, res) => {
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
app.post('/api/courses/:id/bulk-curriculum', authenticateToken, requireAdmin, async (req, res) => {
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
app.get('/api/users', authenticateToken, requireAdmin, async (req, res) => {
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
app.get('/api/applicants', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const result = await pool.query("SELECT * FROM applicants WHERE status = 'pending' ORDER BY created_at DESC");
    res.json({ success: true, data: result.rows });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Approve Applicant (Creates User & Student)
app.post('/api/applicants/:id/approve', authenticateToken, requireAdmin, async (req, res) => {
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

    // 2. Hash default password
    const hashedPassword = await bcrypt.hash('Password@123', 10);

    // 3. Create User
    const userRes = await client.query(`
      INSERT INTO users (email, password_hash, role, must_change_password)
      VALUES ($1, $2, 'student', true)
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
app.post('/api/applicants/:id/reject', authenticateToken, requireAdmin, async (req, res) => {
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
    let user = null;

    // Hardcoded Admin Fallback
    if ((email === 'admin' || email === 'admin@enterprise.com') && password === 'admin123') {
      user = { id: 0, email: 'admin@enterprise.com', role: 'admin', password_hash: '' };
    } else {
      // 1. Find user by email
      const userRes = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
      if (userRes.rows.length === 0) {
        return res.status(401).json({ success: false, error: 'Invalid email or password' });
      }
      user = userRes.rows[0];

      // 2. Check password
      const isMatch = await bcrypt.compare(password, user.password_hash);
      if (!isMatch) {
        return res.status(401).json({ success: false, error: 'Invalid email or password' });
      }
    }

    // 3. Generate token
    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.role },
      JWT_SECRET,
      { expiresIn: '24h' }
    );

    let studentInfo = null;
    if (user.role === 'student') {
      const studentRes = await pool.query('SELECT * FROM students WHERE user_id = $1', [user.id]);
      if (studentRes.rows.length > 0) {
        studentInfo = studentRes.rows[0];
      }
    }

    res.json({
      success: true,
      token,
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
        mustChangePassword: user.must_change_password || false,
        student: studentInfo
      }
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// POST change password
app.post('/api/auth/change-password', authenticateToken, async (req, res) => {
  const { currentPassword, newPassword } = req.body;
  // Use user id attached to req by authenticateToken
  const userId = (req as any).user?.id;

  if (!userId) {
    return res.status(401).json({ success: false, error: 'Unauthorized' });
  }

  const client = await pool.connect();
  try {
    const userRes = await client.query('SELECT * FROM users WHERE id = $1', [userId]);
    if (userRes.rows.length === 0) {
      client.release();
      return res.status(404).json({ success: false, error: 'User not found' });
    }
    const user = userRes.rows[0];

    const isMatch = await bcrypt.compare(currentPassword, user.password_hash);
    if (!isMatch) {
      client.release();
      return res.status(401).json({ success: false, error: 'Incorrect current password' });
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);
    await client.query(
      'UPDATE users SET password_hash = $1, must_change_password = false WHERE id = $2',
      [hashedPassword, userId]
    );

    client.release();
    res.json({ success: true, message: 'Password updated successfully.' });
  } catch (err: any) {
    client.release();
    res.status(500).json({ success: false, error: err.message });
  }
});

// GET student profile
app.get('/api/students/profile', authenticateToken, requireStudent, async (req, res) => {
  const { userId } = req.query;
  if (!userId) return res.status(400).json({ success: false, error: 'userId is required' });
  try {
    const studentRes = await pool.query('SELECT * FROM students WHERE user_id = $1', [userId]);
    if (studentRes.rows.length === 0) {
      return res.status(404).json({ success: false, error: 'Student profile not found.' });
    }
    const student = studentRes.rows[0];
    const userRes = await pool.query('SELECT email FROM users WHERE id = $1', [userId]);
    const email = userRes.rows[0]?.email;

    // Fallback to training_applications or applicants if profile fields are empty
    if (email) {
      const appRes = await pool.query(
        'SELECT * FROM training_applications WHERE gmail = $1 LIMIT 1',
        [email]
      );
      if (appRes.rows.length > 0) {
        const appData = appRes.rows[0];
        if (!student.whatsapp) student.whatsapp = appData.whatsapp;
        if (!student.cnic) student.cnic = appData.cnic;
        if (!student.university) student.university = appData.university_name;
        if (!student.semester) student.semester = appData.semester;
      } else {
        const applicantRes = await pool.query(
          'SELECT * FROM applicants WHERE email = $1 LIMIT 1',
          [email]
        );
        if (applicantRes.rows.length > 0) {
          const appData = applicantRes.rows[0];
          if (!student.whatsapp) student.whatsapp = appData.phone;
          if (!student.university) student.university = appData.academic_background;
        }
      }
    }
    res.json({ success: true, data: student });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// PUT update student profile
app.put('/api/students/profile', authenticateToken, requireStudent, async (req, res) => {
  const {
    userId, firstName, lastName, whatsapp, cnic, university, semester,
    avatarUrl, linkedinUrl, githubUrl, portfolioUrl, resumeUrl
  } = req.body;

  if (!userId) return res.status(400).json({ success: false, error: 'userId is required' });

  try {
    // 1. Fetch existing student profile to preserve program track
    const currentRes = await pool.query('SELECT program FROM students WHERE user_id = $1', [userId]);
    if (currentRes.rows.length === 0) {
      return res.status(404).json({ success: false, error: 'Student profile not found.' });
    }
    const currentProgram = currentRes.rows[0].program;

    // 2. Perform update
    const result = await pool.query(
      `UPDATE students 
       SET first_name = $1, last_name = $2, whatsapp = $3, cnic = $4, university = $5, semester = $6, 
           program = $7, avatar_url = $8, linkedin_url = $9, github_url = $10, portfolio_url = $11, resume_url = $12
       WHERE user_id = $13
       RETURNING *`,
      [
        firstName, lastName, whatsapp, cnic, university, Number(semester) || null,
        currentProgram, avatarUrl, linkedinUrl, githubUrl, portfolioUrl, resumeUrl, userId
      ]
    );

    res.json({ success: true, data: result.rows[0] });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// GET student tasks list
app.get('/api/students/:studentId/tasks', authenticateToken, requireStudent, async (req, res) => {
  const { studentId } = req.params;
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
        t.reference_links
      FROM task_assignments ta
      JOIN tasks t ON t.id = ta.task_id
      WHERE ta.student_id = $1
      ORDER BY ta.created_at DESC
    `, [studentId]);
    res.json({ success: true, data: result.rows });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// GET student dashboard stats
app.get('/api/students/:studentId/dashboard-stats', authenticateToken, requireStudent, async (req, res) => {
  const { studentId } = req.params;
  try {
    const totalRes = await pool.query('SELECT COUNT(*) FROM task_assignments WHERE student_id = $1', [studentId]);
    const completedRes = await pool.query("SELECT COUNT(*) FROM task_assignments WHERE student_id = $1 AND status = 'completed'", [studentId]);
    const gradedRes = await pool.query("SELECT COUNT(*) FROM task_assignments WHERE student_id = $1 AND status = 'marked'", [studentId]);
    const avgScoreRes = await pool.query("SELECT AVG(score) FROM task_assignments WHERE student_id = $1 AND status = 'marked'", [studentId]);

    res.json({
      success: true,
      data: {
        totalTasks: parseInt(totalRes.rows[0].count) || 0,
        completedTasks: parseInt(completedRes.rows[0].count) || 0,
        gradedTasks: parseInt(gradedRes.rows[0].count) || 0,
        pendingTasks: (parseInt(totalRes.rows[0].count) || 0) - (parseInt(completedRes.rows[0].count) || 0) - (parseInt(gradedRes.rows[0].count) || 0),
        averageScore: Math.round(parseFloat(avgScoreRes.rows[0].avg)) || 0
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
app.get('/api/students', authenticateToken, requireAdminOrTrainer, async (req, res) => {
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
app.get('/api/training-applications', authenticateToken, requireAdmin, async (req, res) => {
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
app.get('/api/training-applications/count', authenticateToken, requireAdmin, async (req, res) => {
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
app.post('/api/training-applications/:id/approve', authenticateToken, requireAdmin, async (req, res) => {
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
    
    // Default password for new accounts
    const tempPassword = 'Password@123';
    
    if (userRes.rows.length > 0) {
      userId = userRes.rows[0].id;
      // Also ensure they have to change their password if they were just approved
      await client.query("UPDATE users SET password_hash = $1, must_change_password = true WHERE id = $2", [await bcrypt.hash(tempPassword, 10), userId]);
    } else {
      // Create user with the documented temporary password
      const hashedPassword = await bcrypt.hash(tempPassword, 10);
      const newUserRes = await client.query(
        "INSERT INTO users (email, password_hash, role, must_change_password) VALUES ($1, $2, 'student', true) RETURNING id",
        [app_data.gmail, hashedPassword]
      );
      userId = newUserRes.rows[0].id;
    }

    // 4. Check or Create Student Registry (Shift/Enroll Student)
    const studentRes = await client.query("SELECT id FROM students WHERE user_id = $1", [userId]);
    let studentId;
    if (studentRes.rows.length === 0) {
      const enrollmentId = 'ENR-' + Date.now().toString().slice(-6) + '-' + app_data.id;
      const programName = app_data.tracks && app_data.tracks.length > 0 ? app_data.tracks[0] : 'General';
      const nameParts = app_data.full_name.trim().split(/\\s+/);
      const firstName = nameParts[0] || 'Student';
      const lastName = nameParts.slice(1).join(' ') || 'User';

      const insertedStudent = await client.query(
        "INSERT INTO students (user_id, first_name, last_name, enrollment_id, program) VALUES ($1, $2, $3, $4, $5) RETURNING id",
        [userId, firstName, lastName, enrollmentId, programName]
      );
      studentId = insertedStudent.rows[0].id;
    } else {
      studentId = studentRes.rows[0].id;
    }

    // 4.b Initialize Fees
    const feeCheckRes = await client.query("SELECT id FROM fees WHERE student_id = $1", [studentId]);
    if (feeCheckRes.rows.length === 0) {
      await client.query(
        "INSERT INTO fees (student_id, course_id, total_fee, paid_amount, remaining_amount, status) VALUES ($1, $2, $3, 0, $4, $5)",
        [studentId, null, null, null, 'fee_not_configured']
      );
    }

    await client.query('COMMIT');
    client.release();

    // 5. Send acceptance email WITH login credentials
    const LOGIN_URL = process.env.NEXT_PUBLIC_APP_URL
      ? `${process.env.NEXT_PUBLIC_APP_URL}/login/student`
      : 'https://omnilearn-lms.vercel.app/login/student';

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
              We are delighted to inform you that your application for <strong>Falcon Swift Training & Internships</strong> has been <strong style="color:#16a34a;">accepted</strong>. Congratulations!
            </p>
            <div style="margin-bottom:20px;">
              <p style="font-size:13px;font-weight:700;color:#64748b;text-transform:uppercase;letter-spacing:0.06em;margin:0 0 10px;">Selected Tracks</p>
              <div>${tracksHtml}</div>
            </div>
            ${noteSection}

            <!-- ✅ LOGIN CREDENTIALS BOX -->
            <div style="margin-top:28px;margin-bottom:8px;padding:24px;background:linear-gradient(135deg,#f0fdf4,#dcfce7);border-radius:14px;border:1.5px solid #86efac;">
              <p style="font-size:13px;font-weight:800;color:#15803d;text-transform:uppercase;letter-spacing:0.08em;margin:0 0 14px;">🔑 Your Student Portal Login</p>
              <table style="width:100%;font-size:15px;color:#1e293b;border-collapse:collapse;">
                <tr>
                  <td style="padding:6px 0;color:#64748b;width:130px;font-size:13px;">Login URL</td>
                  <td><a href="${LOGIN_URL}" style="color:#1d4ed8;font-weight:600;">${LOGIN_URL}</a></td>
                </tr>
                <tr>
                  <td style="padding:6px 0;color:#64748b;font-size:13px;">Email</td>
                  <td><strong>${app_data.gmail}</strong></td>
                </tr>
                <tr>
                  <td style="padding:6px 0;color:#64748b;font-size:13px;">Temp Password</td>
                  <td><strong style="font-size:17px;letter-spacing:0.05em;color:#166534;background:#bbf7d0;padding:2px 8px;border-radius:6px;">${tempPassword}</strong></td>
                </tr>
              </table>
              <p style="font-size:12px;color:#64748b;margin:14px 0 0;line-height:1.6;">
                ⚠️ This is a <strong>temporary password</strong>. Please log in and change it from your Student Profile page immediately.
              </p>
            </div>

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
              Our team will also reach out on WhatsApp (<strong>${app_data.whatsapp}</strong>) with schedule and onboarding details.
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
app.post('/api/training-applications/:id/reject', authenticateToken, requireAdmin, async (req, res) => {
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
app.get('/api/tasks', authenticateToken, requireAdminOrTrainer, async (req, res) => {
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
app.post('/api/tasks', authenticateToken, requireAdminOrTrainer, async (req, res) => {
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
app.get('/api/tasks/assignments/by-course/:courseId', authenticateToken, requireAdminOrTrainer, async (req, res) => {
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
app.post('/api/tasks/assignments/:assignmentId/submit', authenticateToken, requireStudent, async (req, res) => {
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
app.post('/api/tasks/assignments/:assignmentId/grade', authenticateToken, requireAdminOrTrainer, async (req, res) => {
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
app.get('/api/tasks/assignments/:assignmentId', authenticateToken, requireAdminOrTrainer, async (req, res) => {
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
// GET all submitted tasks (for trainer review)
app.get('/api/tasks/submitted', authenticateToken, requireAdminOrTrainer, async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT
        ta.id AS assignment_id,
        ta.task_id,
        ta.student_id,
        ta.status,
        ta.score,
        ta.feedback,
        ta.graded_at,
        ta.created_at AS assigned_at,
        t.title AS task_name,
        t.course_label,
        t.due_date,
        s.first_name,
        s.last_name,
        s.enrollment_id,
        s.avatar_url,
        u.email,
        ts.github_url,
        ts.live_url,
        ts.description AS submission_desc,
        ts.notes AS submission_notes,
        ts.submitted_at,
        ts.image_urls,
        ts.additional_links
      FROM task_assignments ta
      JOIN tasks t ON t.id = ta.task_id
      JOIN students s ON s.id = ta.student_id
      JOIN users u ON u.id = s.user_id
      LEFT JOIN task_submissions ts ON ts.assignment_id = ta.id
      WHERE ta.status IN ('completed', 'marked')
      ORDER BY ts.submitted_at DESC NULLS LAST, ta.created_at DESC
    `);
    res.json({ success: true, data: result.rows });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// GET single task by id — MUST be LAST among /api/tasks/* routes
app.get('/api/tasks/:id', authenticateToken, requireAdminOrTrainer, async (req, res) => {
  const { id } = req.params;
  try {
    const result = await pool.query('SELECT * FROM tasks WHERE id = $1', [id]);
    if (result.rows.length === 0) return res.status(404).json({ success: false, error: 'Task not found' });
    res.json({ success: true, data: result.rows[0] });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});


// ==========================================
// TRAINER ROUTES
// ==========================================

// GET all trainers
app.get('/api/trainers', authenticateToken, requireAdminOrTrainer, async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT tr.*, u.email, u.role
      FROM trainers tr
      JOIN users u ON u.id = tr.user_id
      ORDER BY tr.created_at DESC
    `);
    res.json({ success: true, data: result.rows });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// POST create trainer (Admin)
app.post('/api/trainers', authenticateToken, requireAdminOrTrainer, async (req, res) => {
  const { firstName, lastName, email, phone, department, assignedCourses, password } = req.body;
  if (!firstName || !lastName || !email) {
    return res.status(400).json({ success: false, error: 'firstName, lastName, email are required.' });
  }
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    // Check duplicate
    const dup = await client.query('SELECT id FROM users WHERE email = $1', [email]);
    if (dup.rows.length > 0) {
      throw new Error('A user with this email already exists.');
    }
    const rawPassword = password || 'FalconSwift@123';
    const hashedPassword = await bcrypt.hash(rawPassword, 10);
    const userRes = await client.query(
      "INSERT INTO users (email, password_hash, role) VALUES ($1, $2, 'trainer') RETURNING id",
      [email, hashedPassword]
    );
    const userId = userRes.rows[0].id;
    const employeeId = 'EMP-' + Date.now().toString().slice(-6);
    await client.query(
      `INSERT INTO trainers (user_id, first_name, last_name, employee_id, department, phone, assigned_courses)
       VALUES ($1, $2, $3, $4, $5, $6, $7::text[])`,
      [userId, firstName, lastName, employeeId, department || '', phone || '', assignedCourses || []]
    );
    await client.query('COMMIT');
    client.release();
    // Send welcome email
    const welcomeHtml = `
      <div style="font-family:'Segoe UI',Arial,sans-serif;max-width:600px;margin:0 auto;">
        <div style="background:linear-gradient(135deg,#F6B32B,#E09B18);padding:32px;text-align:center;border-radius:16px 16px 0 0;">
          <h1 style="color:#000;margin:0;font-size:24px;">Welcome to Falcon Swift LMS!</h1>
        </div>
        <div style="padding:32px;background:#fff;border-radius:0 0 16px 16px;border:1px solid #e2e8f0;">
          <p style="font-size:16px;color:#1e293b;">Dear <strong>${firstName} ${lastName}</strong>,</p>
          <p style="color:#475569;">Your Trainer account has been created. Here are your login credentials:</p>
          <div style="background:#f8fafc;padding:16px;border-radius:8px;margin:16px 0;border-left:4px solid #F6B32B;">
            <p style="margin:4px 0;"><strong>Email:</strong> ${email}</p>
            <p style="margin:4px 0;"><strong>Employee ID:</strong> ${employeeId}</p>
            <p style="margin:4px 0;"><strong>Password:</strong> ${rawPassword}</p>
          </div>
          <p style="color:#64748b;font-size:13px;">Please change your password after first login.</p>
        </div>
      </div>`;
    await sendEmail(email, '🎓 Trainer Account Created — Falcon Swift LMS', welcomeHtml);
    res.status(201).json({ success: true, message: 'Trainer created successfully.', employeeId });
  } catch (err: any) {
    await client.query('ROLLBACK');
    client.release();
    res.status(500).json({ success: false, error: err.message });
  }
});

// GET trainer profile by userId
app.get('/api/trainers/profile', authenticateToken, requireTrainer, async (req, res) => {
  const { userId } = req.query;
  if (!userId) return res.status(400).json({ success: false, error: 'userId required' });
  try {
    const result = await pool.query(
      'SELECT tr.*, u.email FROM trainers tr JOIN users u ON u.id = tr.user_id WHERE tr.user_id = $1',
      [userId]
    );
    if (result.rows.length === 0) return res.status(404).json({ success: false, error: 'Trainer not found' });
    res.json({ success: true, data: result.rows[0] });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// PUT update trainer profile (self)
app.put('/api/trainers/profile', authenticateToken, requireTrainer, async (req, res) => {
  const { userId, phone, avatarUrl } = req.body;
  if (!userId) return res.status(400).json({ success: false, error: 'userId required' });
  try {
    const result = await pool.query(
      'UPDATE trainers SET phone = COALESCE($1, phone), avatar_url = COALESCE($2, avatar_url) WHERE user_id = $3 RETURNING *',
      [phone, avatarUrl, userId]
    );
    res.json({ success: true, data: result.rows[0] });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// DELETE trainer by id (Admin)
app.delete('/api/trainers/:id', async (req, res) => {
  const { id } = req.params;
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    // Get the user_id linked to this trainer
    const trainerRes = await client.query('SELECT user_id FROM trainers WHERE id = $1', [id]);
    if (trainerRes.rows.length === 0) {
      client.release();
      return res.status(404).json({ success: false, error: 'Trainer not found.' });
    }
    const userId = trainerRes.rows[0].user_id;
    // Delete trainer record
    await client.query('DELETE FROM trainers WHERE id = $1', [id]);
    // Delete the linked user account
    await client.query('DELETE FROM users WHERE id = $1', [userId]);
    await client.query('COMMIT');
    client.release();
    res.json({ success: true, message: 'Trainer deleted successfully.' });
  } catch (err: any) {
    await client.query('ROLLBACK');
    client.release();
    res.status(500).json({ success: false, error: err.message });
  }
});

// GET trainer stats dashboard
app.get('/api/trainers/dashboard-stats', authenticateToken, requireTrainer, async (req, res) => {
  const { userId } = req.query;
  try {
    const totalStudents = await pool.query('SELECT COUNT(*) FROM students');
    const pendingReviews = await pool.query("SELECT COUNT(*) FROM task_assignments WHERE status = 'completed'");
    const assignedTasks = await pool.query('SELECT COUNT(*) FROM tasks');
    const submissions = await pool.query("SELECT COUNT(*) FROM task_assignments WHERE status IN ('completed','marked')");
    const totalAssignments = await pool.query('SELECT COUNT(*) FROM task_assignments');
    const todayDate = new Date().toISOString().split('T')[0];
    const todayAttendance = await pool.query(
      "SELECT COUNT(*) FROM attendance WHERE date = $1 AND status = 'present'",
      [todayDate]
    );
    res.json({
      success: true,
      data: {
        totalStudents: parseInt(totalStudents.rows[0].count) || 0,
        pendingReviews: parseInt(pendingReviews.rows[0].count) || 0,
        assignedTasks: parseInt(assignedTasks.rows[0].count) || 0,
        submissions: parseInt(submissions.rows[0].count) || 0,
        totalAssignments: parseInt(totalAssignments.rows[0].count) || 0,
        todayAttendance: parseInt(todayAttendance.rows[0].count) || 0,
        submissionRate: totalAssignments.rows[0].count > 0
          ? Math.round((parseInt(submissions.rows[0].count) / parseInt(totalAssignments.rows[0].count)) * 100)
          : 0,
      }
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// POST publish/grade task + send notification + email
app.post('/api/tasks/assignments/:assignmentId/publish', authenticateToken, requireAdminOrTrainer, async (req, res) => {
  const { assignmentId } = req.params;
  const { score, feedback, grade } = req.body;
  const scoreNum = Number(score);
  if (isNaN(scoreNum) || scoreNum < 0 || scoreNum > 100) {
    return res.status(400).json({ success: false, error: 'Score must be 0–100.' });
  }
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    // 1. Update assignment
    await client.query(
      `UPDATE task_assignments SET status = 'marked', score = $1, feedback = $2, graded_at = NOW() WHERE id = $3`,
      [scoreNum, feedback || null, assignmentId]
    );
    // 2. Get details for notification/email
    const detailRes = await client.query(`
      SELECT ta.student_id, t.title AS task_name, s.first_name, s.last_name, u.email, u.id AS user_id
      FROM task_assignments ta
      JOIN tasks t ON t.id = ta.task_id
      JOIN students s ON s.id = ta.student_id
      JOIN users u ON u.id = s.user_id
      WHERE ta.id = $1
    `, [assignmentId]);
    if (detailRes.rows.length > 0) {
      const d = detailRes.rows[0];
      // 3. Create notification via NotificationEngine (Normal Priority)
      await NotificationEngine.createNotification({
        type: 'other',
        title: `Task Reviewed: ${d.task_name}`,
        message: `Your task "${d.task_name}" has been reviewed. Score: ${scoreNum}/100. ${feedback ? 'Feedback: ' + feedback : ''}`,
        priority: 'normal',
        recipients: [d.student_id],
        createdBy: req.user?.id
      });
      await client.query('COMMIT');
      client.release();
      // 4. Send email
      const gradeLabel = grade || (scoreNum >= 90 ? 'A+' : scoreNum >= 80 ? 'A' : scoreNum >= 70 ? 'B' : scoreNum >= 60 ? 'C' : 'F');
      const emailHtml = `
        <div style="font-family:'Segoe UI',Arial,sans-serif;max-width:600px;margin:0 auto;">
          <div style="background:linear-gradient(135deg,#1D4ED8,#3B82F6);padding:32px;text-align:center;border-radius:16px 16px 0 0;">
            <h1 style="color:#fff;margin:0;font-size:22px;">📝 Task Review Published</h1>
          </div>
          <div style="padding:32px;background:#fff;border-radius:0 0 16px 16px;border:1px solid #e2e8f0;">
            <p style="font-size:16px;color:#1e293b;">Dear <strong>${d.first_name} ${d.last_name}</strong>,</p>
            <p style="color:#475569;">Your submission for <strong>${d.task_name}</strong> has been reviewed.</p>
            <div style="background:#f0fdf4;padding:16px;border-radius:8px;border-left:4px solid #22c55e;margin:16px 0;">
              <p style="margin:4px 0;font-size:20px;font-weight:700;color:#15803d;">Score: ${scoreNum}/100 — Grade: ${gradeLabel}</p>
            </div>
            ${feedback ? `<div style="background:#f8fafc;padding:16px;border-radius:8px;margin:8px 0;"><p style="color:#475569;margin:0;"><strong>Feedback:</strong> ${feedback}</p></div>` : ''}
          </div>
        </div>`;
      await sendEmail(d.email, `✅ Task Reviewed — ${d.task_name} | Falcon Swift LMS`, emailHtml);
    } else {
      await client.query('COMMIT');
      client.release();
    }
    res.json({ success: true, message: 'Task graded and published.' });
  } catch (err: any) {
    await client.query('ROLLBACK');
    client.release();
    res.status(500).json({ success: false, error: err.message });
  }
});

// POST assign task with email notification
app.post('/api/tasks/assign-with-email', authenticateToken, requireAdmin, async (req, res) => {
  const { title, description, instructions, courseId, courseLabel, points, dueDate, referenceLinks, assignedStudentIds, trainerName } = req.body;
  if (!title || !courseId || !assignedStudentIds?.length) {
    return res.status(400).json({ success: false, error: 'title, courseId, and assignedStudentIds are required.' });
  }
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const taskRes = await client.query(
      `INSERT INTO tasks (title, description, course_id, course_label, points, due_date, reference_links)
       VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *`,
      [title, description || instructions || '', courseId, courseLabel, points || 100, dueDate || null, JSON.stringify(referenceLinks || [])]
    );
    const task = taskRes.rows[0];
    const studentDetails: any[] = [];
    for (const studentId of assignedStudentIds) {
      await client.query(
        `INSERT INTO task_assignments (task_id, student_id, status) VALUES ($1, $2, 'pending')
         ON CONFLICT (task_id, student_id) DO NOTHING`,
        [task.id, studentId]
      );
      // Get student email + user_id for notification
      const sRes = await client.query(
        'SELECT s.first_name, s.last_name, u.email, u.id AS user_id FROM students s JOIN users u ON u.id = s.user_id WHERE s.id = $1',
        [studentId]
      );
      if (sRes.rows.length > 0) studentDetails.push(sRes.rows[0]);
    }
    // Create notifications via NotificationEngine (Critical Priority)
    await NotificationEngine.createNotification({
      type: 'assignment',
      title: `New Task: ${title}`,
      message: `A new task "${title}" has been assigned in ${courseLabel || courseId}. Deadline: ${dueDate ? new Date(dueDate).toLocaleDateString() : 'N/A'}`,
      priority: 'critical',
      recipients: assignedStudentIds,
      createdBy: req.user?.id
    });
    await client.query('COMMIT');
    client.release();
    // Send emails in background
    const deadlineStr = dueDate ? new Date(dueDate).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }) : 'No deadline set';
    for (const s of studentDetails) {
      const emailHtml = `
        <div style="font-family:'Segoe UI',Arial,sans-serif;max-width:600px;margin:0 auto;">
          <div style="background:linear-gradient(135deg,#F6B32B,#E09B18);padding:32px;text-align:center;border-radius:16px 16px 0 0;">
            <h1 style="color:#000;margin:0;font-size:22px;">📋 New Task Assigned</h1>
          </div>
          <div style="padding:32px;background:#fff;border-radius:0 0 16px 16px;border:1px solid #e2e8f0;">
            <p style="font-size:16px;color:#1e293b;">Dear <strong>${s.first_name} ${s.last_name}</strong>,</p>
            <p style="color:#475569;">A new task has been assigned to you.</p>
            <div style="background:#fffbeb;padding:16px;border-radius:8px;border-left:4px solid #F6B32B;margin:16px 0;">
              <p style="margin:4px 0;font-weight:700;font-size:18px;color:#92400e;">${title}</p>
              <p style="margin:4px 0;color:#78350f;"><strong>Course:</strong> ${courseLabel || courseId}</p>
              <p style="margin:4px 0;color:#78350f;"><strong>Trainer:</strong> ${trainerName || 'Falcon Swift Team'}</p>
              <p style="margin:4px 0;color:#dc2626;"><strong>Deadline:</strong> ${deadlineStr}</p>
              <p style="margin:4px 0;color:#78350f;"><strong>Points:</strong> ${points || 100}</p>
            </div>
            <p style="color:#475569;">${description || instructions || ''}</p>
            <a href="${process.env.NEXT_PUBLIC_APP_URL || 'https://omnilearn-lms.vercel.app'}/login/student" style="display:inline-block;background:linear-gradient(135deg,#F6B32B,#E09B18);color:#000;font-weight:700;padding:12px 28px;border-radius:8px;text-decoration:none;margin-top:16px;">Open LMS Portal</a>
          </div>
        </div>`;
      await sendEmail(s.email, `📋 New Task: ${title} — Falcon Swift LMS`, emailHtml);
    }
    res.status(201).json({ success: true, data: task, emailsSent: studentDetails.length });
  } catch (err: any) {
    await client.query('ROLLBACK');
    client.release();
    res.status(500).json({ success: false, error: err.message });
  }
});

// ==========================================
// ATTENDANCE ROUTES
// ==========================================

// POST mark attendance (Trainer)
app.post('/api/attendance', authenticateToken, requireAdminOrTrainer, async (req, res) => {
  const { records, date } = req.body;
  // records = [{ studentId, status, notes }]
  if (!records || !Array.isArray(records) || !date) {
    return res.status(400).json({ success: false, error: 'records array and date are required.' });
  }
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    for (const record of records) {
      await client.query(
        `INSERT INTO attendance (student_id, date, status, notes)
         VALUES ($1, $2, $3, $4)
         ON CONFLICT (student_id, date) DO UPDATE SET status = EXCLUDED.status, notes = EXCLUDED.notes, marked_at = NOW()`,
        [record.studentId, date, record.status || 'present', record.notes || '']
      );
      // Create notification for student
      const sRes = await client.query(
        'SELECT u.id AS user_id FROM students s JOIN users u ON u.id = s.user_id WHERE s.id = $1',
        [record.studentId]
      );
      if (sRes.rows.length > 0) {
        const statusLabel = record.status === 'present' ? 'Present ✅' : record.status === 'absent' ? 'Absent ❌' : record.status === 'late' ? 'Late ⏰' : 'On Leave 📋';
        await NotificationEngine.createNotification({
          type: 'other',
          title: `Attendance Marked: ${new Date(date).toDateString()}`,
          message: `Your attendance for ${new Date(date).toDateString()} has been marked as ${statusLabel}.`,
          priority: 'normal',
          recipients: [record.studentId],
          createdBy: req.user?.id
        });
      }
    }
    await client.query('COMMIT');
    client.release();
    res.json({ success: true, message: `Attendance marked for ${records.length} student(s).` });
  } catch (err: any) {
    await client.query('ROLLBACK');
    client.release();
    res.status(500).json({ success: false, error: err.message });
  }
});

// GET student attendance
app.get('/api/attendance/student/:studentId', authenticateToken, requireStudent, async (req, res) => {
  const { studentId } = req.params;
  const { month, year } = req.query;
  try {
    let query = 'SELECT * FROM attendance WHERE student_id = $1 ORDER BY date DESC';
    let params: any[] = [studentId];
    if (month && year) {
      query = `SELECT * FROM attendance WHERE student_id = $1 AND EXTRACT(MONTH FROM date) = $2 AND EXTRACT(YEAR FROM date) = $3 ORDER BY date ASC`;
      params = [studentId, month, year];
    }
    const result = await pool.query(query, params);
    // Summary stats
    const all = result.rows;
    const total = all.length;
    const present = all.filter(r => r.status === 'present').length;
    const absent = all.filter(r => r.status === 'absent').length;
    const late = all.filter(r => r.status === 'late').length;
    const leave = all.filter(r => r.status === 'leave').length;
    const attendancePercent = total > 0 ? Math.round(((present + late) / total) * 100) : 0;
    res.json({
      success: true,
      data: result.rows,
      stats: { total, present, absent, late, leave, attendancePercent }
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// GET all students attendance for a date (Trainer view)
app.get('/api/attendance/date/:date', authenticateToken, requireAdminOrTrainer, async (req, res) => {
  const { date } = req.params;
  try {
    const result = await pool.query(`
      SELECT a.*, s.first_name, s.last_name, s.enrollment_id, s.program, s.avatar_url
      FROM attendance a
      JOIN students s ON s.id = a.student_id
      WHERE a.date = $1
      ORDER BY s.first_name ASC
    `, [date]);
    res.json({ success: true, data: result.rows });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// GET attendance summary for admin report
app.get('/api/attendance/summary', authenticateToken, requireAdminOrTrainer, async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT
        s.id AS student_id,
        s.first_name,
        s.last_name,
        s.enrollment_id,
        s.program,
        COUNT(a.id) AS total_days,
        SUM(CASE WHEN a.status = 'present' THEN 1 ELSE 0 END) AS present_count,
        SUM(CASE WHEN a.status = 'absent' THEN 1 ELSE 0 END) AS absent_count,
        SUM(CASE WHEN a.status = 'late' THEN 1 ELSE 0 END) AS late_count,
        SUM(CASE WHEN a.status = 'leave' THEN 1 ELSE 0 END) AS leave_count
      FROM students s
      LEFT JOIN attendance a ON a.student_id = s.id
      GROUP BY s.id, s.first_name, s.last_name, s.enrollment_id, s.program
      ORDER BY s.first_name ASC
    `);
    res.json({ success: true, data: result.rows });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// ==========================================
// ANNOUNCEMENTS ROUTES
// ==========================================

// POST create announcement
app.post('/api/announcements', authenticateToken, requireAdmin, async (req, res) => {
  const { title, content, authorId, authorName, role, target, sendEmail: doSendEmail } = req.body;
  if (!title || !content) return res.status(400).json({ success: false, error: 'title and content required.' });
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const result = await client.query(
      `INSERT INTO announcements (title, content, author_id, author_name, role, target)
       VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
      [title, content, req.user?.id || null, authorName || 'Admin', role || 'admin', target || 'all']
    );
    // Create notifications for all students via NotificationEngine (Critical Priority)
    const studentsRes = await client.query('SELECT id FROM students');
    const studentIds = studentsRes.rows.map(row => row.id);
    
    await client.query('COMMIT');
    client.release();

    if (studentIds.length > 0) {
      await NotificationEngine.createNotification({
        type: 'announcement',
        title: `📢 ${title}`,
        message: content.substring(0, 200),
        priority: 'critical',
        recipients: studentIds,
        createdBy: req.user?.id
      });
    }
    // Optional: send email to all students
    if (doSendEmail) {
      const emailStudents = await pool.query('SELECT u.email, s.first_name FROM students s JOIN users u ON u.id = s.user_id');
      for (const s of emailStudents.rows) {
        const emailHtml = `
          <div style="font-family:'Segoe UI',Arial,sans-serif;max-width:600px;margin:0 auto;">
            <div style="background:linear-gradient(135deg,#6366f1,#8b5cf6);padding:32px;text-align:center;border-radius:16px 16px 0 0;">
              <h1 style="color:#fff;margin:0;font-size:22px;">📢 New Announcement</h1>
            </div>
            <div style="padding:32px;background:#fff;border-radius:0 0 16px 16px;border:1px solid #e2e8f0;">
              <p>Dear <strong>${s.first_name}</strong>,</p>
              <h2 style="color:#1e293b;">${title}</h2>
              <p style="color:#475569;line-height:1.7;">${content}</p>
              <p style="color:#94a3b8;font-size:12px;margin-top:24px;">— ${authorName || 'Falcon Swift Team'}</p>
            </div>
          </div>`;
        await sendEmail(s.email, `📢 ${title} — Falcon Swift LMS`, emailHtml);
      }
    }
    res.status(201).json({ success: true, data: result.rows[0] });
  } catch (err: any) {
    await client.query('ROLLBACK');
    client.release();
    res.status(500).json({ success: false, error: err.message });
  }
});

// GET all announcements (paginated)
app.get('/api/announcements', authenticateToken, async (req, res) => {
  const { limit = 20, offset = 0 } = req.query;
  try {
    let query = 'SELECT * FROM announcements ';
    
    // Students only see announcements meant for 'all' or 'students'
    if (req.user?.role === 'student') {
      query += "WHERE target = 'all' OR target = 'students' ";
    }
    
    query += 'ORDER BY created_at DESC LIMIT $1 OFFSET $2';
    
    const result = await pool.query(query, [limit, offset]);
    res.json({ success: true, data: result.rows });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// PUT update announcement
app.put('/api/announcements/:id', authenticateToken, requireAdminOrTrainer, async (req, res) => {
  const { id } = req.params;
  const { title, content } = req.body;
  if (!title || !content) return res.status(400).json({ success: false, error: 'title and content are required.' });
  try {
    const result = await pool.query(
      'UPDATE announcements SET title = $1, content = $2 WHERE id = $3 RETURNING *',
      [title, content, id]
    );
    if (result.rows.length === 0) return res.status(404).json({ success: false, error: 'Announcement not found.' });
    res.json({ success: true, data: result.rows[0] });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// DELETE announcement
app.delete('/api/announcements/:id', authenticateToken, requireAdminOrTrainer, async (req, res) => {
  const { id } = req.params;
  try {
    await pool.query('DELETE FROM announcements WHERE id = $1', [id]);
    res.json({ success: true, message: 'Announcement deleted.' });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// ==========================================
// NOTIFICATIONS ROUTES
// ==========================================

// GET notifications for a user
app.get('/api/notifications', async (req, res) => {
  const { userId, limit = 20 } = req.query;
  if (!userId) return res.status(400).json({ success: false, error: 'userId required' });
  try {
    const result = await pool.query(
      'SELECT * FROM notifications WHERE user_id = $1 ORDER BY created_at DESC LIMIT $2',
      [userId, limit]
    );
    const unreadCount = result.rows.filter((n: any) => !n.is_read).length;
    res.json({ success: true, data: result.rows, unreadCount });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// PUT mark notification as read
app.put('/api/notifications/:id/read', async (req, res) => {
  const { id } = req.params;
  try {
    await pool.query('UPDATE notifications SET is_read = TRUE WHERE id = $1', [id]);
    res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// PUT mark ALL notifications as read for a user
app.put('/api/notifications/read-all', async (req, res) => {
  const { userId } = req.body;
  if (!userId) return res.status(400).json({ success: false, error: 'userId required' });
  try {
    await pool.query('UPDATE notifications SET is_read = TRUE WHERE user_id = $1', [userId]);
    res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// ==========================================
// ADMIN DASHBOARD STATS
// ==========================================

app.get('/api/dashboard/admin-stats', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const [
      studentsRes,
      trainersRes,
      campaignsRes,
      activeTasksRes,
      pendingRegsRes,
      submissionsRes,
      admissionsWeeklyRes,
      taskCompletionRes,
    ] = await Promise.all([
      pool.query('SELECT COUNT(*) FROM students'),
      pool.query("SELECT COUNT(*) FROM users WHERE role = 'trainer'"),
      pool.query('SELECT COUNT(*) FROM lead_campaigns'),
      pool.query("SELECT COUNT(*) FROM tasks"),
      pool.query("SELECT COUNT(*) FROM training_applications WHERE status = 'pending'"),
      pool.query("SELECT COUNT(*) FROM task_assignments WHERE status IN ('completed','marked')"),
      // Weekly admissions (last 7 days)
      pool.query(`
        SELECT DATE(created_at) as day, COUNT(*) as count
        FROM training_applications
        WHERE created_at >= NOW() - INTERVAL '7 days'
        GROUP BY DATE(created_at)
        ORDER BY day ASC
      `),
      // Task completion rate
      pool.query(`
        SELECT
          COUNT(*) FILTER (WHERE status = 'pending') AS pending,
          COUNT(*) FILTER (WHERE status = 'completed') AS completed,
          COUNT(*) FILTER (WHERE status = 'marked') AS marked
        FROM task_assignments
      `),
    ]);

    const todayDate = new Date().toISOString().split('T')[0];
    const todayAttendance = await pool.query(
      "SELECT COUNT(*) FROM attendance WHERE date = $1 AND status = 'present'",
      [todayDate]
    );

    res.json({
      success: true,
      data: {
        students: parseInt(studentsRes.rows[0].count) || 0,
        trainers: parseInt(trainersRes.rows[0].count) || 0,
        campaigns: parseInt(campaignsRes.rows[0].count) || 0,
        activeTasks: parseInt(activeTasksRes.rows[0].count) || 0,
        pendingRegistrations: parseInt(pendingRegsRes.rows[0].count) || 0,
        submissions: parseInt(submissionsRes.rows[0].count) || 0,
        todayAttendance: parseInt(todayAttendance.rows[0].count) || 0,
        admissionsWeekly: admissionsWeeklyRes.rows,
        taskCompletion: taskCompletionRes.rows[0] || { pending: 0, completed: 0, marked: 0 },
      }
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// ==========================================
// STUDENT PERFORMANCE ROUTES
// ==========================================

app.get('/api/students/:studentId/performance', authenticateToken, requireStudent, async (req, res) => {
  const { studentId } = req.params;
  try {
    const result = await pool.query(`
      SELECT
        ta.id AS assignment_id,
        t.title AS task_name,
        t.course_label,
        t.points AS max_points,
        ta.score,
        ta.status,
        ta.feedback,
        ta.graded_at,
        ta.created_at AS assigned_at,
        CASE
          WHEN ta.score >= 90 THEN 'A+'
          WHEN ta.score >= 80 THEN 'A'
          WHEN ta.score >= 70 THEN 'B'
          WHEN ta.score >= 60 THEN 'C'
          WHEN ta.score IS NOT NULL THEN 'F'
          ELSE 'Pending'
        END AS grade
      FROM task_assignments ta
      JOIN tasks t ON t.id = ta.task_id
      WHERE ta.student_id = $1 AND ta.status = 'marked'
      ORDER BY ta.graded_at DESC
    `, [studentId]);

    const avgRes = await pool.query(
      "SELECT AVG(score) AS avg, COUNT(*) AS total, MAX(score) AS highest, MIN(score) AS lowest FROM task_assignments WHERE student_id = $1 AND status = 'marked'",
      [studentId]
    );
    const summary = avgRes.rows[0];

    res.json({
      success: true,
      data: result.rows,
      summary: {
        averageScore: Math.round(parseFloat(summary.avg)) || 0,
        totalGraded: parseInt(summary.total) || 0,
        highestScore: Math.round(parseFloat(summary.highest)) || 0,
        lowestScore: Math.round(parseFloat(summary.lowest)) || 0,
      }
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// ==========================================
// PASSWORD CHANGE ROUTE
// ==========================================

app.put('/api/auth/change-password', async (req, res) => {
  const { userId, currentPassword, newPassword } = req.body;
  if (!userId || !currentPassword || !newPassword) {
    return res.status(400).json({ success: false, error: 'userId, currentPassword, newPassword required.' });
  }
  try {
    const userRes = await pool.query('SELECT * FROM users WHERE id = $1', [userId]);
    if (userRes.rows.length === 0) return res.status(404).json({ success: false, error: 'User not found.' });
    const user = userRes.rows[0];
    const isMatch = await bcrypt.compare(currentPassword, user.password_hash);
    if (!isMatch) return res.status(401).json({ success: false, error: 'Current password is incorrect.' });
    const newHash = await bcrypt.hash(newPassword, 10);
    await pool.query('UPDATE users SET password_hash = $1 WHERE id = $2', [newHash, userId]);
    res.json({ success: true, message: 'Password changed successfully.' });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// GET all students with their task/performance summary (admin)
app.get('/api/students/full-report', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT
        s.id, s.first_name, s.last_name, s.enrollment_id, s.program, s.avatar_url,
        u.email,
        COUNT(ta.id) AS total_tasks,
        COUNT(ta.id) FILTER (WHERE ta.status = 'marked') AS graded_tasks,
        ROUND(AVG(ta.score) FILTER (WHERE ta.status = 'marked'), 1) AS avg_score,
        COUNT(a_att.id) AS total_attendance,
        COUNT(a_att.id) FILTER (WHERE a_att.status = 'present') AS present_days
      FROM students s
      JOIN users u ON u.id = s.user_id
      LEFT JOIN task_assignments ta ON ta.student_id = s.id
      LEFT JOIN attendance a_att ON a_att.student_id = s.id
      GROUP BY s.id, s.first_name, s.last_name, s.enrollment_id, s.program, s.avatar_url, u.email
      ORDER BY s.created_at DESC
    `);
    res.json({ success: true, data: result.rows });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// ==========================================
// FINANCE & FEE MANAGEMENT API ROUTES
// ==========================================

// 1. Get finance stats for Admin Dashboard
app.get('/api/finance/stats', authenticateToken, requireAdmin, async (req, res) => {

  try {
    const totalExpected = await pool.query('SELECT SUM(total_fee) as total FROM fees');
    const totalCollected = await pool.query('SELECT SUM(paid_amount) as total FROM fees');
    const outstanding = await pool.query('SELECT SUM(remaining_amount) as total FROM fees');
    const pendingStudents = await pool.query("SELECT COUNT(*) FROM fees WHERE status IN ('unpaid', 'partial')");

    res.json({
      success: true,
      data: {
        totalExpected: parseFloat(totalExpected.rows[0].total) || 0,
        totalCollected: parseFloat(totalCollected.rows[0].total) || 0,
        outstandingFees: parseFloat(outstanding.rows[0].total) || 0,
        pendingStudents: parseInt(pendingStudents.rows[0].count) || 0,
      }
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// 2. Get all students fee list
app.get('/api/finance/fees', authenticateToken, requireAdmin, async (req, res) => {

  try {
    const result = await pool.query(`
      SELECT 
        s.id as student_id,
        s.first_name,
        s.last_name,
        s.enrollment_id,
        s.program as course,
        u.email,
        s.whatsapp as phone,
        COALESCE(f.status, 'unpaid') as fee_status,
        COALESCE(f.total_fee, 0) as total_fee,
        COALESCE(f.paid_amount, 0) as paid_amount,
        COALESCE(f.remaining_amount, 0) as remaining_amount,
        (SELECT payment_date FROM fee_payments fp WHERE fp.fee_id = f.id ORDER BY payment_date DESC LIMIT 1) as last_payment_date
      FROM students s
      JOIN users u ON u.id = s.user_id
      LEFT JOIN fees f ON f.student_id = s.id
      ORDER BY s.created_at DESC
    `);
    res.json({ success: true, data: result.rows });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// 3. Get single student fee details & history
app.get('/api/finance/fees/:studentId', authenticateToken, requireAdmin, async (req, res) => {

  const { studentId } = req.params;
  try {
    const feeResult = await pool.query(`
      SELECT f.*, s.first_name, s.last_name, s.enrollment_id, s.program as course
      FROM fees f
      JOIN students s ON s.id = f.student_id
      WHERE f.student_id = $1
      LIMIT 1
    `, [studentId]);
    
    const feeData = feeResult.rows[0];
    let payments: any[] = [];
    
    if (feeData) {
      const paymentsResult = await pool.query(`
        SELECT * FROM fee_payments
        WHERE fee_id = $1
        ORDER BY payment_date DESC
      `, [feeData.id]);
      payments = paymentsResult.rows;
    } else {
      return res.json({
        success: true,
        data: { fee: null, payments: [] }
      });
    }

    res.json({ success: true, data: { fee: feeData, payments } });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// 4. Record a payment
app.post('/api/finance/fees/:studentId/pay', authenticateToken, requireAdmin, async (req, res) => {

  const { studentId } = req.params;
  const { amount, paymentMethod, transactionReference, remarks, paymentDate, recordedBy, totalFee } = req.body;

  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    let feeResult = await client.query('SELECT * FROM fees WHERE student_id = $1 FOR UPDATE', [studentId]);
    let fee = feeResult.rows[0];

    if (!fee) {
      await client.query('ROLLBACK');
      return res.status(404).json({ success: false, error: 'Fee record not found for this student.' });
    }

    if (fee.status === 'fee_not_configured' || fee.status === 'course_not_assigned') {
      await client.query('ROLLBACK');
      return res.status(400).json({ success: false, error: 'Cannot record payment. Total fee is not configured or course is not assigned.' });
    }

    const payAmount = parseFloat(amount);
    if (isNaN(payAmount) || payAmount <= 0) {
      await client.query('ROLLBACK');
      return res.status(400).json({ success: false, error: 'Invalid amount. Amount must be greater than zero.' });
    }

    const currentRemaining = parseFloat(fee.remaining_amount);
    if (payAmount > currentRemaining) {
      await client.query('ROLLBACK');
      return res.status(400).json({ success: false, error: `Payment amount (Rs. ${payAmount}) exceeds the remaining balance (Rs. ${currentRemaining}).` });
    }

    const insertPayment = await client.query(`
      INSERT INTO fee_payments (fee_id, student_id, amount, payment_method, transaction_reference, remarks, payment_date, recorded_by)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      RETURNING id
    `, [fee.id, studentId, payAmount, paymentMethod, transactionReference, remarks, paymentDate || new Date(), recordedBy || null]);
    
    const paymentId = insertPayment.rows[0].id;
    const year = new Date().getFullYear();
    const generatedReceipt = `REC-${year}-${String(paymentId).padStart(6, '0')}`;

    await client.query(`
      UPDATE fee_payments SET receipt_number = $1 WHERE id = $2
    `, [generatedReceipt, paymentId]);

    const newPaid = parseFloat(fee.paid_amount) + payAmount;
    let newRemaining = parseFloat(fee.total_fee) - newPaid;
    if (newRemaining < 0) newRemaining = 0;

    let status = 'partial';
    if (newRemaining === 0) status = 'paid';

    const updatedFeeResult = await client.query(`
      UPDATE fees
      SET paid_amount = $1, remaining_amount = $2, status = $3, updated_at = NOW()
      WHERE id = $4
      RETURNING *
    `, [newPaid, newRemaining, status, fee.id]);

    await client.query('COMMIT');
    res.json({ success: true, data: updatedFeeResult.rows[0] });
  } catch (err: any) {
    await client.query('ROLLBACK');
    res.status(500).json({ success: false, error: err.message });
  } finally {
    client.release();
  }
});

// 4.b Update Total Fee
app.put('/api/finance/fees/:studentId/total', authenticateToken, requireAdmin, async (req, res) => {

  const { studentId } = req.params;
  const { totalFee } = req.body;

  const newTotal = parseFloat(totalFee);
  if (isNaN(newTotal) || newTotal < 0) {
    return res.status(400).json({ success: false, error: 'Invalid total fee amount.' });
  }

  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    
    let feeResult = await client.query('SELECT * FROM fees WHERE student_id = $1 FOR UPDATE', [studentId]);
    let fee = feeResult.rows[0];

    if (!fee) {
      const insertFee = await client.query(`
        INSERT INTO fees (student_id, total_fee, paid_amount, remaining_amount, status)
        VALUES ($1, $2, 0, $2, 'unpaid')
        RETURNING *
      `, [studentId, newTotal]);
      fee = insertFee.rows[0];
    } else {
      const paid = parseFloat(fee.paid_amount);
      let newRemaining = newTotal - paid;
      if (newRemaining < 0) newRemaining = 0;
      
      let status = 'partial';
      if (newRemaining === 0) status = 'paid';
      if (paid === 0 && newTotal > 0) status = 'unpaid';

      const updateFee = await client.query(`
        UPDATE fees
        SET total_fee = $1, remaining_amount = $2, status = $3, updated_at = NOW()
        WHERE id = $4
        RETURNING *
      `, [newTotal, newRemaining, status, fee.id]);
      fee = updateFee.rows[0];
    }

    await client.query('COMMIT');
    res.json({ success: true, data: fee });
  } catch (err: any) {
    await client.query('ROLLBACK');
    res.status(500).json({ success: false, error: err.message });
  } finally {
    client.release();
  }
});

// 5. Get student own fees
app.get('/api/student/:studentId/fees', authenticateToken, requireStudent, async (req, res) => {
  const { studentId } = req.params;
  const client = await pool.connect();
  
  try {
    const studentCheck = await client.query('SELECT user_id FROM students WHERE id = $1', [studentId]);
    if (studentCheck.rows.length === 0 || studentCheck.rows[0].user_id !== req.user.id) {
      client.release();
      return res.status(403).json({ success: false, error: 'Unauthorized: Can only view your own fees' });
    }
    
    const feeResult = await client.query('SELECT * FROM fees WHERE student_id = $1 LIMIT 1', [studentId]);
    const feeData = feeResult.rows[0];
    let payments: any[] = [];
    if (feeData) {
      const paymentsResult = await client.query('SELECT * FROM fee_payments WHERE fee_id = $1 ORDER BY payment_date DESC', [feeData.id]);
      payments = paymentsResult.rows;
    }
    client.release();
    res.json({ success: true, data: { fee: feeData || null, payments } });
  } catch (err: any) {
    if (client) client.release();
    res.status(500).json({ success: false, error: err.message });
  }
});

app.use('/api', campaignRoutes);

app.listen(PORT, async () => {
  console.log(`Server is running on http://localhost:${PORT}`);
  try {
    await pool.query("ALTER TABLE users ADD COLUMN IF NOT EXISTS must_change_password BOOLEAN DEFAULT false");
    console.log('✅ "users" table must_change_password column auto-migrated successfully!');
  } catch (dbErr: any) {
    console.error("Users table self-correction failed:", dbErr.message);
  }
  try {
    await pool.query("ALTER TABLE applicants ADD COLUMN IF NOT EXISTS program VARCHAR(100)");
    console.log('✅ "applicants" table program column auto-migrated successfully!');
  } catch (dbErr: any) {
    console.error("Database self-correction failed:", dbErr.message);
  }
  try {
    await pool.query("ALTER TABLE students ADD COLUMN IF NOT EXISTS whatsapp VARCHAR(50)");
    await pool.query("ALTER TABLE students ADD COLUMN IF NOT EXISTS cnic VARCHAR(50)");
    await pool.query("ALTER TABLE students ADD COLUMN IF NOT EXISTS university VARCHAR(255)");
    await pool.query("ALTER TABLE students ADD COLUMN IF NOT EXISTS semester INT");
    await pool.query("ALTER TABLE students ADD COLUMN IF NOT EXISTS linkedin_url VARCHAR(500)");
    await pool.query("ALTER TABLE students ADD COLUMN IF NOT EXISTS github_url VARCHAR(500)");
    await pool.query("ALTER TABLE students ADD COLUMN IF NOT EXISTS portfolio_url VARCHAR(500)");
    await pool.query("ALTER TABLE students ADD COLUMN IF NOT EXISTS resume_url VARCHAR(500)");
    console.log('✅ "students" table columns auto-migrated successfully!');
  } catch (dbErr: any) {
    console.error("Students table self-correction failed:", dbErr.message);
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

  // Auto-create trainers table
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS trainers (
        id SERIAL PRIMARY KEY,
        user_id INT REFERENCES users(id) ON DELETE CASCADE,
        first_name VARCHAR(100) NOT NULL,
        last_name VARCHAR(100) NOT NULL,
        employee_id VARCHAR(100) UNIQUE,
        department VARCHAR(100),
        avatar_url TEXT,
        phone VARCHAR(50),
        assigned_courses TEXT[],
        created_at TIMESTAMPTZ DEFAULT NOW()
      );
    `);
    console.log('✅ "trainers" table created/verified successfully!');
  } catch (dbErr: any) {
    console.error('❌ Failed to verify/create "trainers" table:', dbErr.message);
  }

  // Auto-create attendance table
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS attendance (
        id SERIAL PRIMARY KEY,
        student_id INT REFERENCES students(id) ON DELETE CASCADE,
        date DATE NOT NULL,
        status VARCHAR(20) DEFAULT 'present',
        notes TEXT,
        marked_at TIMESTAMPTZ DEFAULT NOW(),
        UNIQUE(student_id, date)
      );
    `);
    console.log('✅ "attendance" table created/verified successfully!');
  } catch (dbErr: any) {
    console.error('❌ Failed to verify/create "attendance" table:', dbErr.message);
  }

  // Auto-create announcements table
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS announcements (
        id SERIAL PRIMARY KEY,
        title VARCHAR(500) NOT NULL,
        content TEXT NOT NULL,
        author_id INT REFERENCES users(id) ON DELETE SET NULL,
        author_name VARCHAR(255),
        role VARCHAR(50) DEFAULT 'admin',
        target VARCHAR(50) DEFAULT 'all',
        created_at TIMESTAMPTZ DEFAULT NOW()
      );
    `);
    console.log('✅ "announcements" table created/verified successfully!');
  } catch (dbErr: any) {
    console.error('❌ Failed to verify/create "announcements" table:', dbErr.message);
  }

  // Auto-create notifications table
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS notifications (
        id SERIAL PRIMARY KEY,
        user_id INT REFERENCES users(id) ON DELETE CASCADE,
        title VARCHAR(500) NOT NULL,
        message TEXT,
        type VARCHAR(100),
        is_read BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMPTZ DEFAULT NOW()
      );
    `);
    console.log('✅ "notifications" table created/verified successfully!');
  } catch (dbErr: any) {
    console.error('❌ Failed to verify/create "notifications" table:', dbErr.message);
  }

  // Auto-create fees table
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS fees (
        id SERIAL PRIMARY KEY,
        student_id INT REFERENCES students(id) ON DELETE CASCADE,
        course_id INT REFERENCES courses(id) ON DELETE SET NULL,
        total_fee NUMERIC(10, 2) NOT NULL DEFAULT 0,
        paid_amount NUMERIC(10, 2) NOT NULL DEFAULT 0,
        remaining_amount NUMERIC(10, 2) NOT NULL DEFAULT 0,
        status VARCHAR(20) DEFAULT 'unpaid',
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW()
      );
    `);
    console.log('✅ "fees" table created/verified successfully!');
  } catch (dbErr: any) {
    console.error('❌ Failed to verify/create "fees" table:', dbErr.message);
  }

  // Auto-create fee_payments table
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS fee_payments (
        id SERIAL PRIMARY KEY,
        fee_id INT REFERENCES fees(id) ON DELETE CASCADE,
        student_id INT REFERENCES students(id) ON DELETE CASCADE,
        amount NUMERIC(10, 2) NOT NULL,
        payment_method VARCHAR(50),
        transaction_reference VARCHAR(100),
        receipt_number VARCHAR(100),
        remarks TEXT,
        payment_date TIMESTAMPTZ DEFAULT NOW(),
        recorded_by INT REFERENCES users(id) ON DELETE SET NULL,
        created_at TIMESTAMPTZ DEFAULT NOW()
      );
    `);
    console.log('✅ "fee_payments" table created/verified successfully!');
  } catch (dbErr: any) {
    console.error('❌ Failed to verify/create "fee_payments" table:', dbErr.message);
  }
});
