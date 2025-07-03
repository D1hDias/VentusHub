// client/src/lib/supabase.ts
import { createClient } from '@supabase/supabase-js'

// Usar as variáveis diretamente com fallback
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL ||
'https://hocaexectpwpapnrmhxp.supabase.co'
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY ||
'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhvY2FleGVjdHB3cGFwbnJtaHhwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTA3MDg4NjksImV4cCI6MjA2NjI4NDg2OX0.ereGpycsNRxhhK1Pq4a6x5E0VAIzKSjQfTMfWU_Y-iU'

if (!supabaseUrl || !supabaseKey) {
  throw new Error('Supabase URL and ANON KEY are required')
}

export const supabase = createClient(supabaseUrl, supabaseKey)