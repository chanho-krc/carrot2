import { createClient } from '@supabase/supabase-js'

// 환경 변수가 없을 때를 위한 더미 URL (실제 기능은 동작하지 않음)
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://dummy.supabase.co'
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'dummy-key'

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// 환경 변수가 올바르게 설정되었는지 확인하는 함수
export const isSupabaseConfigured = () => {
  return process.env.NEXT_PUBLIC_SUPABASE_URL && 
         process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY &&
         !process.env.NEXT_PUBLIC_SUPABASE_URL.includes('dummy') &&
         !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY.includes('dummy')
} 