import { createClient } from '@supabase/supabase-js';
import { Pool } from 'pg';
import dotenv from 'dotenv';
import WebSocket from 'ws';

dotenv.config();

// 1. Direct PostgreSQL Connection
export const pool = new Pool({
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  host: process.env.DB_HOST,
  port: parseInt(process.env.DB_PORT || '5432'),
  database: process.env.DB_NAME,
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
const supabaseUrl = process.env.SUPABASE_URL ? process.env.SUPABASE_URL.trim() : '';
const supabaseKey = process.env.SUPABASE_ANON_KEY ? process.env.SUPABASE_ANON_KEY.trim() : '';

export const supabase = supabaseUrl.startsWith('http') 
  ? createClient(supabaseUrl, supabaseKey, {
      auth: { persistSession: false },
      realtime: {
        transport: WebSocket,
      },
      global: {
        WebSocket,
      },
    }) 
  : null;


