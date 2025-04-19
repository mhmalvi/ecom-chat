/**
 * Supabase client for database interactions
 */

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const fetch = require('node-fetch');
globalThis.fetch = fetch;

// Environment variables
const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

// Validate environment variables
if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error('Error: Supabase environment variables are missing.');
  console.error('Please make sure SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are set in your .env file.');
  
  // In production, we might want to exit the process
  if (process.env.NODE_ENV === 'production') {
    process.exit(1);
  }
}

// Create Supabase client with the service role key
// This gives the server full access to the database
// IMPORTANT: This key should never be exposed to the client
const supabase = createClient(
  SUPABASE_URL,
  SUPABASE_SERVICE_ROLE_KEY,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  }
);

// Direct database access for raw SQL queries
// WARNING: Use with caution to prevent SQL injection
const pgql = async (sql, params = {}) => {
  try {
    const { data, error } = await supabase.rpc('pgql', { query: sql, params });
    if (error) throw error;
    return data;
  } catch (error) {
    console.error('PostgreSQL query error:', error);
    throw error;
  }
};

// Expose a custom function for health check
const checkHealth = async () => {
  try {
    const { data, error } = await supabase.from('stores').select('id').limit(1);
    return { 
      healthy: !error, 
      error: error ? error.message : null 
    };
  } catch (error) {
    return { 
      healthy: false, 
      error: error.message 
    };
  }
};

module.exports = supabase;
module.exports.pgql = pgql;
module.exports.checkHealth = checkHealth;
