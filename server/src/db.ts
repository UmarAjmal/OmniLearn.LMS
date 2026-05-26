import { createClient } from '@supabase/supabase-js';
import { Pool } from 'pg';
import dotenv from 'dotenv';

dotenv.config();

// 1. Direct PostgreSQL Connection (using credentials from text.txt)
const dbUrl = process.env.DATABASE_URL;
export const pool = new Pool({
  connectionString: dbUrl,
  ssl: {
    rejectUnauthorized: false
  }
});

pool.on('connect', () => {
  console.log('✅ Successfully connected to Supabase PostgreSQL database!');
});

pool.on('error', (err) => {
  console.error('❌ Unexpected error on idle database client', err);
  process.exit(-1);
});

// 2. Supabase Data API Client (For Auth and simplified fetches if needed)
const supabaseUrl = process.env.SUPABASE_URL || '';
const supabaseKey = process.env.SUPABASE_ANON_KEY || '';

export const supabase = supabaseUrl.startsWith('http') 
  ? createClient(supabaseUrl, supabaseKey) 
  : null;


