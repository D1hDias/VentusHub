import { createClient } from '@supabase/supabase-js';

// Try server-specific variables first, fallback to VITE_ variables
const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.warn('⚠️ Supabase not configured. Document upload will be disabled.');
  console.warn('To enable: Set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY environment variables.');
}

// Create client only if configuration exists
export const supabaseAdmin = supabaseUrl && supabaseKey ? createClient(supabaseUrl, supabaseKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
}) : null;