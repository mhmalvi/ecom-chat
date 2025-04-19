const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const fetch = require('node-fetch');
globalThis.fetch = fetch;

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

module.exports = supabase;
