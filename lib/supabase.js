import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''

// ตรวจสอบว่ามี Environment Variables หรือไม่
if (!supabaseUrl || !supabaseKey) {
  console.warn('Supabase environment variables are missing')
}

export const supabase = createClient(supabaseUrl, supabaseKey)