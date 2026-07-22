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
        hands_on_task TEXT,
        project_milestone VARCHAR(255),
        tech_stack VARCHAR(255),
        difficulty VARCHAR(50),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    console.log('✅ "lessons" table initialized successfully!');

    // 4. Create users table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        email VARCHAR(255) UNIQUE NOT NULL,
        password_hash VARCHAR(255) NOT NULL,
        role VARCHAR(50) DEFAULT 'student',
        must_change_password BOOLEAN DEFAULT false,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    console.log('✅ "users" table initialized successfully!');

    // 5. Create applicants table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS applicants (
        id SERIAL PRIMARY KEY,
        first_name VARCHAR(100) NOT NULL,
        last_name VARCHAR(100) NOT NULL,
        email VARCHAR(255) UNIQUE NOT NULL,
        phone VARCHAR(50) NOT NULL,
        academic_background TEXT,
        course_interest VARCHAR(255),
        status VARCHAR(50) DEFAULT 'pending',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    console.log('✅ "applicants" table initialized successfully!');

    // 6. Create students table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS students (
        id SERIAL PRIMARY KEY,
        user_id INT REFERENCES users(id) ON DELETE CASCADE,
        first_name VARCHAR(100) NOT NULL,
        last_name VARCHAR(100) NOT NULL,
        enrollment_id VARCHAR(100) UNIQUE,
        program TEXT,
        avatar_url TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    console.log('✅ "students" table initialized successfully!');

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

    // --- Lead Campaigns Module ---
    
    // 14. lead_campaigns
    await pool.query(`
      CREATE TABLE IF NOT EXISTS lead_campaigns (
        id SERIAL PRIMARY KEY,
        title VARCHAR(255) NOT NULL,
        description TEXT,
        platforms JSONB,
        target_batch VARCHAR(100),
        target_trainer VARCHAR(100),
        target_leads INT,
        daily_target INT,
        priority VARCHAR(50) DEFAULT 'medium',
        start_date TIMESTAMP,
        deadline TIMESTAMP,
        status VARCHAR(50) DEFAULT 'active',
        instructions TEXT,
        attachments JSONB,
        created_by INT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    console.log('✅ "lead_campaigns" table verified successfully!');

    // 15. campaign_keywords
    await pool.query(`
      CREATE TABLE IF NOT EXISTS campaign_keywords (
        id SERIAL PRIMARY KEY,
        campaign_id INT REFERENCES lead_campaigns(id) ON DELETE CASCADE,
        keyword VARCHAR(255) NOT NULL
      )
    `);
    console.log('✅ "campaign_keywords" table verified successfully!');

    // 16. campaign_students
    await pool.query(`
      CREATE TABLE IF NOT EXISTS campaign_students (
        id SERIAL PRIMARY KEY,
        campaign_id INT REFERENCES lead_campaigns(id) ON DELETE CASCADE,
        student_id INT REFERENCES students(id) ON DELETE CASCADE,
        UNIQUE(campaign_id, student_id)
      )
    `);
    console.log('✅ "campaign_students" table verified successfully!');

    // 17. lead_submissions
    await pool.query(`
      CREATE TABLE IF NOT EXISTS lead_submissions (
        id SERIAL PRIMARY KEY,
        campaign_id INT REFERENCES lead_campaigns(id) ON DELETE CASCADE,
        student_id INT REFERENCES students(id) ON DELETE CASCADE,
        business_name VARCHAR(255) NOT NULL,
        contact_person VARCHAR(255),
        phone VARCHAR(100),
        email VARCHAR(255),
        website VARCHAR(500),
        address TEXT,
        city VARCHAR(100),
        country VARCHAR(100),
        industry VARCHAR(100),
        platform VARCHAR(100),
        keyword VARCHAR(255),
        business_url VARCHAR(500),
        lead_quality VARCHAR(50),
        screenshot_url VARCHAR(500),
        notes TEXT,
        status VARCHAR(50) DEFAULT 'pending',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(campaign_id, phone),
        UNIQUE(campaign_id, email),
        UNIQUE(campaign_id, website),
        UNIQUE(campaign_id, business_url)
      )
    `);
    console.log('✅ "lead_submissions" table verified successfully!');

    // 18. lead_reviews
    await pool.query(`
      CREATE TABLE IF NOT EXISTS lead_reviews (
        id SERIAL PRIMARY KEY,
        lead_id INT REFERENCES lead_submissions(id) ON DELETE CASCADE,
        reviewer_id INT NOT NULL,
        reviewer_role VARCHAR(50) NOT NULL,
        feedback TEXT,
        points_awarded INT DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    console.log('✅ "lead_reviews" table verified successfully!');

    // 19. lead_points_ledger
    await pool.query(`
      CREATE TABLE IF NOT EXISTS lead_points_ledger (
        id SERIAL PRIMARY KEY,
        student_id INT REFERENCES students(id) ON DELETE CASCADE,
        lead_id INT REFERENCES lead_submissions(id) ON DELETE CASCADE,
        points INT DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    console.log('✅ "lead_points_ledger" table verified successfully!');

    // 20. notifications
    await pool.query(`
      CREATE TABLE IF NOT EXISTS notifications (
        id SERIAL PRIMARY KEY,
        type VARCHAR(100) NOT NULL,
        title VARCHAR(255) NOT NULL,
        message TEXT,
        priority VARCHAR(50) DEFAULT 'normal',
        action_url VARCHAR(500),
        attachment_url VARCHAR(500),
        created_by INT REFERENCES users(id) ON DELETE SET NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    console.log('✅ "notifications" table verified successfully!');

    // 21. notification_recipients
    await pool.query(`
      CREATE TABLE IF NOT EXISTS notification_recipients (
        id SERIAL PRIMARY KEY,
        notification_id INT REFERENCES notifications(id) ON DELETE CASCADE,
        student_id INT REFERENCES students(id) ON DELETE CASCADE,
        is_read BOOLEAN DEFAULT false,
        read_at TIMESTAMP,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(notification_id, student_id)
      )
    `);
    console.log('✅ "notification_recipients" table verified successfully!');

    // 22. notification_logs
    await pool.query(`
      CREATE TABLE IF NOT EXISTS notification_logs (
        id SERIAL PRIMARY KEY,
        notification_id INT REFERENCES notifications(id) ON DELETE CASCADE,
        student_id INT REFERENCES students(id) ON DELETE CASCADE,
        action VARCHAR(50) NOT NULL,
        ip_address VARCHAR(100),
        user_agent TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    console.log('✅ "notification_logs" table verified successfully!');

    // 23. user_fcm_tokens
    await pool.query(`
      CREATE TABLE IF NOT EXISTS user_fcm_tokens (
        id SERIAL PRIMARY KEY,
        user_id INT REFERENCES users(id) ON DELETE CASCADE,
        token TEXT NOT NULL,
        device_type VARCHAR(50),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(user_id, token)
      )
    `);
    console.log('✅ "user_fcm_tokens" table verified successfully!');

  } catch (err) {
    console.error('❌ Error during database schema initialization:', err);
    throw err;
  } finally {
    await pool.end();
  }
}

initDB();
