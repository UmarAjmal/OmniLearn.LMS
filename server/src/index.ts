import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { supabase, pool } from './db.js';

dotenv.config();

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

// Example route using Supabase Data API (if setup)
app.get('/api/users', async (req, res) => {
  if (!supabase) {
    return res.status(500).json({ error: 'Supabase client is not configured' });
  }

  const { data, error } = await supabase.from('users').select('*');
  if (error) return res.status(500).json({ error: error.message });
  res.json({ data });
});

app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
