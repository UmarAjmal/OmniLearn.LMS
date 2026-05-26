import { pool } from './db.js';

async function initDB() {
  try {
    console.log('Initializing PostgreSQL database schema...');

    // 1. Create courses table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS courses (
        id SERIAL PRIMARY KEY,
        title VARCHAR(255) NOT NULL,
        category VARCHAR(100),
        description TEXT,
        thumbnail_url TEXT,
        price NUMERIC(10, 2) DEFAULT 0.00,
        status VARCHAR(50) DEFAULT 'draft',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    console.log('✅ "courses" table initialized successfully!');

    // 2. Create sections table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS sections (
        id SERIAL PRIMARY KEY,
        course_id INT REFERENCES courses(id) ON DELETE CASCADE,
        title VARCHAR(255) NOT NULL,
        sort_order INT DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    console.log('✅ "sections" table initialized successfully!');

    // 3. Create lessons table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS lessons (
        id SERIAL PRIMARY KEY,
        section_id INT REFERENCES sections(id) ON DELETE CASCADE,
        title VARCHAR(255) NOT NULL,
        duration VARCHAR(50) DEFAULT '00:00',
        media_url TEXT,
        sort_order INT DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    console.log('✅ "lessons" table initialized successfully!');

    // Optional: Insert some initial mock courses if table is empty
    const courseCheck = await pool.query('SELECT COUNT(*) FROM courses');
    if (parseInt(courseCheck.rows[0].count) === 0) {
      console.log('Inserting mock seed courses...');
      
      // Seed course 1
      const c1 = await pool.query(`
        INSERT INTO courses (title, category, description, thumbnail_url, price, status)
        VALUES (
          'Advanced Distributed Systems', 
          'Technology', 
          'Master the art of building resilient, scalable, and highly available systems in the modern cloud era.', 
          'https://lh3.googleusercontent.com/aida-public/AB6AXuAADnCXLsbIOu6G3OcvLEcUKgkzT3v7V8cU0z9UiXSi85WD7SDPJMVc0c6LpHU5A8OL9OEvJ7qdR76iOOn1CI2j1CO7yXke82gY0L7MtOt9Mjq8rZYba0iDKBRAmfiN_l5IkGeMkuK8AxppAU9hhS-GuAI9epFgMQ2OwaEjG_lLeXawdSNLbRdmUxaf9PXvsOhoaWNuHwzBHOgBLgcDzJH7ahnX3We0P9kvMN4PGQ3scJQunkxmm8Swy0My4F4ZItW5TpyiFi6c53vl', 
          99.99, 
          'published'
        ) RETURNING id
      `);
      const courseId1 = c1.rows[0].id;
      
      const s1 = await pool.query(`
        INSERT INTO sections (course_id, title, sort_order) 
        VALUES ($1, 'Section 1: Foundations', 1) RETURNING id
      `, [courseId1]);
      const sectionId1 = s1.rows[0].id;

      await pool.query(`
        INSERT INTO lessons (section_id, title, duration, sort_order)
        VALUES ($1, 'Lesson 1.1: System Models & Network Topologies', '12:30', 1)
      `, [sectionId1]);

      // Seed course 2
      const c2 = await pool.query(`
        INSERT INTO courses (title, category, description, thumbnail_url, price, status)
        VALUES (
          'Data Engineering with Kafka', 
          'Technology', 
          'Learn to build real-time data pipelines and stream processing applications using Apache Kafka.', 
          'https://lh3.googleusercontent.com/aida-public/AB6AXuCIY4qHbJqqpP3isgw-O186FgdBZkomOsTxvbazV3Fqb2Kw9lde3KP59tmfLh_RGGgRe4v-4bsw7NoxMstmmK4OA1wIafTZKs8_MsTyu_0DZdu4-BlzYeUAzZRcQiUyZhfQEmwQwCEHxTUB3Mp6tXqHXhg-dwaZiyHVDq_IR9wLMOQlzakX8Drw5wqyltnnC6VKSzGSOy_v7Of7tqonhENpE46MCTTt3842rxI8lOjyEnFtdsnbgHMZR5sf0tkOCNyO38qEE2r556iE', 
          49.99, 
          'published'
        ) RETURNING id
      `);
      const courseId2 = c2.rows[0].id;

      const s2 = await pool.query(`
        INSERT INTO sections (course_id, title, sort_order) 
        VALUES ($1, 'Section 1: Kafka Basics', 1) RETURNING id
      `, [courseId2]);
      const sectionId2 = s2.rows[0].id;

      await pool.query(`
        INSERT INTO lessons (section_id, title, duration, sort_order)
        VALUES ($1, 'Lesson 1.1: Introduction to Broker & Topic Architecture', '18:15', 1)
      `, [sectionId2]);

      console.log('✅ Seed courses inserted successfully!');
    }

  } catch (err) {
    console.error('❌ Error during database schema initialization:', err);
    throw err;
  } finally {
    await pool.end();
  }
}

initDB();
