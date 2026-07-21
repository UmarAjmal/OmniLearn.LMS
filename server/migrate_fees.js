import pg from 'pg';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '.env') });

const { Pool } = pg;
const pool = new Pool({
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  host: process.env.DB_HOST,
  port: parseInt(process.env.DB_PORT || '5432'),
  database: process.env.DB_NAME,
  ssl: { rejectUnauthorized: false }
});

async function runMigration() {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    console.log('1. Altering fees table constraints...');
    await client.query(`ALTER TABLE fees ALTER COLUMN total_fee DROP NOT NULL`);
    await client.query(`ALTER TABLE fees ALTER COLUMN total_fee DROP DEFAULT`);
    await client.query(`ALTER TABLE fees ALTER COLUMN remaining_amount DROP NOT NULL`);
    await client.query(`ALTER TABLE fees ALTER COLUMN remaining_amount DROP DEFAULT`);
    await client.query(`ALTER TABLE fees ALTER COLUMN status TYPE VARCHAR(50)`);

    console.log('2. Fetching all students...');
    const studentsRes = await client.query('SELECT id, program FROM students');
    
    for (const student of studentsRes.rows) {
      const { id: studentId, program } = student;

      // Check if fee record already exists
      const feeRes = await client.query('SELECT id FROM fees WHERE student_id = $1', [studentId]);
      if (feeRes.rows.length === 0) {
        let courseId = null;
        let coursePrice = null;

        if (program) {
          // Find matching course
          const courseRes = await client.query('SELECT id, price FROM courses WHERE title = $1 LIMIT 1', [program]);
          if (courseRes.rows.length > 0) {
            courseId = courseRes.rows[0].id;
            coursePrice = courseRes.rows[0].price; // can be numeric or null
          }
        }

        let totalFee = null;
        let remainingAmount = null;
        let status = '';

        if (!program || !courseId) {
          status = 'course_not_assigned';
        } else if (coursePrice === null || coursePrice === undefined) {
          status = 'fee_not_configured';
          totalFee = null;
          remainingAmount = null;
        } else {
          totalFee = coursePrice;
          remainingAmount = coursePrice;
          status = 'unpaid';
        }

        await client.query(
          `INSERT INTO fees (student_id, course_id, total_fee, paid_amount, remaining_amount, status)
           VALUES ($1, $2, $3, 0, $4, $5)`,
          [studentId, courseId, totalFee, remainingAmount, status]
        );
        console.log(`Created fee record for student ${studentId}: status=${status}, total=${totalFee}`);
      } else {
         // Update existing fee records that might have total_fee = 0 due to previous bug
         const feeId = feeRes.rows[0].id;
         // We will just leave them alone unless requested, or maybe update if they are 0.
         // Actually, let's update them to follow new logic if paid_amount is 0.
         const currentFee = await client.query('SELECT total_fee, paid_amount FROM fees WHERE id = $1', [feeId]);
         if (parseFloat(currentFee.rows[0].paid_amount) === 0 && parseFloat(currentFee.rows[0].total_fee) === 0) {
            let courseId = null;
            let coursePrice = null;
            if (program) {
              const courseRes = await client.query('SELECT id, price FROM courses WHERE title = $1 LIMIT 1', [program]);
              if (courseRes.rows.length > 0) {
                courseId = courseRes.rows[0].id;
                coursePrice = courseRes.rows[0].price;
              }
            }
            let totalFee = null;
            let remainingAmount = null;
            let status = '';

            if (!program || !courseId) {
              status = 'course_not_assigned';
            } else if (coursePrice === null || coursePrice === undefined) {
              status = 'fee_not_configured';
            } else {
              totalFee = coursePrice;
              remainingAmount = coursePrice;
              status = 'unpaid';
            }
            await client.query(
              `UPDATE fees SET course_id = $1, total_fee = $2, remaining_amount = $3, status = $4 WHERE id = $5`,
              [courseId, totalFee, remainingAmount, status, feeId]
            );
            console.log(`Updated existing fee record for student ${studentId}: status=${status}, total=${totalFee}`);
         }
      }
    }

    await client.query('COMMIT');
    console.log('Migration completed successfully.');
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('Migration failed:', err);
  } finally {
    client.release();
    pool.end();
  }
}

runMigration();
