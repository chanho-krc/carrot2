import { User, AuthState } from '@/types'
import { supabase } from './supabase'

// 로컬 스토리지 키
const AUTH_STORAGE_KEY = 'carrot2-auth'

// 관리자 계정 정보 (사용 편의성을 위해 간단하게 설정)
// 주의: 실제 운영 환경에서는 백엔드 API를 통한 인증을 권장
const ADMIN_CREDENTIALS = {
  id: 'admin',
  password: 'admin123'
}

// 로컬 스토리지에서 인증 정보 가져오기
export const getAuthFromStorage = (): AuthState => {
  if (typeof window === 'undefined') {
    return { user: null, isAdmin: false, isLoading: false }
  }
  
  try {
    const stored = localStorage.getItem(AUTH_STORAGE_KEY)
    if (stored) {
      return JSON.parse(stored)
    }
  } catch (error) {
    console.error('Error parsing auth from storage:', error)
  }
  
  return { user: null, isAdmin: false, isLoading: false }
}

// 로컬 스토리지에 인증 정보 저장
export const setAuthToStorage = (authState: AuthState) => {
  if (typeof window === 'undefined') return
  
  try {
    localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(authState))
  } catch (error) {
    console.error('Error saving auth to storage:', error)
  }
}

// 인증 정보 삭제
export const clearAuthFromStorage = () => {
  if (typeof window === 'undefined') return
  
  try {
    localStorage.removeItem(AUTH_STORAGE_KEY)
  } catch (error) {
    console.error('Error clearing auth from storage:', error)
  }
}

// 관리자 로그인
export const loginAdmin = (id: string, password: string): boolean => {
  if (id === ADMIN_CREDENTIALS.id && password === ADMIN_CREDENTIALS.password) {
    const authState: AuthState = {
      user: null,
      isAdmin: true,
      isLoading: false
    }
    setAuthToStorage(authState)
    return true
  }
  return false
}

// 사용자 로그인/등록
export const loginUser = async (name: string, phone: string): Promise<User | null> => {
  try {
    // 먼저 해당 전화번호로 사용자 검색
    const { data: existingUser, error: searchError } = await supabase
      .from('users')
      .select('*')
      .eq('phone', phone)
      .single()

    if (searchError && searchError.code !== 'PGRST116') {
      // PGRST116은 "not found" 에러
      throw searchError
    }

    let user: User

    if (existingUser) {
      // 기존 사용자 - 이름이 다르면 업데이트
      if (existingUser.name !== name) {
        const { data: updatedUser, error: updateError } = await supabase
          .from('users')
          .update({ name, updated_at: new Date().toISOString() })
          .eq('id', existingUser.id)
          .select()
          .single()

        if (updateError) throw updateError
        user = updatedUser
      } else {
        user = existingUser
      }
    } else {
      // 신규 사용자 등록
      const { data: newUser, error: insertError } = await supabase
        .from('users')
        .insert([{
          name,
          phone,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }])
        .select()
        .single()

      if (insertError) throw insertError
      user = newUser
    }

    // 인증 정보 저장
    const authState: AuthState = {
      user,
      isAdmin: false,
      isLoading: false
    }
    setAuthToStorage(authState)

    return user
  } catch (error) {
    console.error('Error in loginUser:', error)
    return null
  }
}

// 로그아웃
export const logout = () => {
  clearAuthFromStorage()
} 