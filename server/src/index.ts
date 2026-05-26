import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { supabase, pool } from './db.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

// Root route so it doesn't show "Cannot GET /"
app.get('/', (req, res) => {
  res.send('OmniLearn LMS Backend API is running perfectly!');
});

app.get('/api/health', async (req, res) => {
  try {
    // Testing the direct database connection
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

