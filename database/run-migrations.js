/**
 * Database migration script
 * Run this script to apply SQL migrations to your Supabase database
 */

require('dotenv').config();
const fs = require('fs');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');
const { log } = require('../src/utils/logger');

// Create Supabase client
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// Migration directory
const MIGRATIONS_DIR = path.join(__dirname, 'migrations');

// Function to get migration files in order
function getMigrationFiles() {
  const files = fs.readdirSync(MIGRATIONS_DIR)
    .filter(file => file.endsWith('.sql'))
    .sort(); // This will sort alphabetically, so naming is important (001_, 002_, etc.)
    
  return files;
}

// Function to check if migration has been applied
async function hasMigrationBeenApplied(migrationName) {
  try {
    // First check if the migrations table exists
    const { data: tables, error: tablesError } = await supabase
      .from('information_schema.tables')
      .select('table_name')
      .eq('table_name', 'migrations')
      .single();
      
    if (tablesError || !tables) {
      // Table doesn't exist, create it
      const createTableSQL = `
        CREATE TABLE IF NOT EXISTS migrations (
          id SERIAL PRIMARY KEY,
          name VARCHAR(255) NOT NULL UNIQUE,
          applied_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );
      `;
      
      const { error: createError } = await supabase.rpc('pgql', { query: createTableSQL });
      if (createError) {
        throw new Error(`Failed to create migrations table: ${createError.message}`);
      }
      
      return false;
    }
    
    // Check if this migration is recorded
    const { data, error } = await supabase
      .from('migrations')
      .select('id')
      .eq('name', migrationName)
      .single();
      
    return !error && data;
  } catch (error) {
    console.error('Error checking migration status:', error.message);
    return false;
  }
}

// Function to record migration
async function recordMigration(migrationName) {
  try {
    const { error } = await supabase
      .from('migrations')
      .insert([{ name: migrationName }]);
      
    if (error) {
      throw new Error(`Failed to record migration: ${error.message}`);
    }
  } catch (error) {
    console.error('Error recording migration:', error.message);
    throw error;
  }
}

// Function to run a migration
async function runMigration(file) {
  const filePath = path.join(MIGRATIONS_DIR, file);
  const sql = fs.readFileSync(filePath, 'utf8');
  
  try {
    const { error } = await supabase.rpc('pgql', { query: sql });
    
    if (error) {
      throw new Error(`Migration failed: ${error.message}`);
    }
    
    await recordMigration(file);
    console.log(`✅ Applied migration: ${file}`);
  } catch (error) {
    console.error(`❌ Failed to apply migration ${file}:`, error.message);
    throw error;
  }
}

// Main function to run migrations
async function runMigrations() {
  try {
    const files = getMigrationFiles();
    
    if (files.length === 0) {
      console.log('No migration files found.');
      return;
    }
    
    console.log(`Found ${files.length} migration file(s).`);
    
    for (const file of files) {
      const applied = await hasMigrationBeenApplied(file);
      
      if (applied) {
        console.log(`⏭️ Skipping already applied migration: ${file}`);
      } else {
        console.log(`🔄 Running migration: ${file}`);
        await runMigration(file);
      }
    }
    
    console.log('✅ All migrations applied successfully.');
  } catch (error) {
    console.error('❌ Migration process failed:', error.message);
    process.exit(1);
  }
}

// Run migrations
runMigrations(); 