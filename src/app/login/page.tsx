'use client'

import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { loginUser, loginAdmin, getAuthFromStorage } from '@/lib/auth'
import { isSupabaseConfigured } from '@/lib/supabase'
import SupabaseSetup from '@/components/SupabaseSetup'

export default function LoginPage() {
  const [activeTab, setActiveTab] = useState<'user' | 'admin'>('user')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const router = useRouter()

  // 사용자 로그인 폼 상태
  const [userName, setUserName] = useState('')
  const [userPhone, setUserPhone] = useState('')

  // 관리자 로그인 폼 상태
  const [adminId, setAdminId] = useState('')
  const [adminPassword, setAdminPassword] = useState('')

  useEffect(() => {
    // Supabase 설정 확인
    if (!isSupabaseConfigured()) {
      return
    }

    // 이미 로그인된 경우 홈으로 리다이렉트
    const auth = getAuthFromStorage()
    if (auth.user || auth.isAdmin) {
      router.push('/')
    }
  }, [router])

  useEffect(() => {
    // 페이지 로드 후 모든 input 필드의 텍스트 색상을 강제로 검은색으로 설정
    const forceBlackText = () => {
      const inputs = document.querySelectorAll('input[type="text"], input[type="tel"], input[type="password"], #user-name, #user-phone, #admin-id, #admin-password')
      inputs.forEach((input) => {
        const element = input as HTMLInputElement
        // 모든 가능한 방법으로 검은색 적용
        element.style.cssText += 'color: #000000 !important; -webkit-text-fill-color: #000000 !important;'
        element.style.setProperty('color', '#000000', 'important')
        element.style.setProperty('-webkit-text-fill-color', '#000000', 'important')
        element.style.setProperty('-moz-text-fill-color', '#000000', 'important')
        element.setAttribute('style', element.getAttribute('style') + '; color: #000000 !important; -webkit-text-fill-color: #000000 !important;')
      })
    }
    
    // 페이지 로드시 즉시 실행
    forceBlackText()
    
    // 여러 타이밍에 실행
    const timers = [
      setTimeout(forceBlackText, 50),
      setTimeout(forceBlackText, 100),
      setTimeout(forceBlackText, 200),
      setTimeout(forceBlackText, 500),
      setTimeout(forceBlackText, 1000)
    ]
    
    // input에 모든 가능한 이벤트 리스너 추가
    const inputs = document.querySelectorAll('input[type="text"], input[type="tel"], input[type="password"], #user-name, #user-phone, #admin-id, #admin-password')
    inputs.forEach((input) => {
      const events = ['input', 'focus', 'blur', 'change', 'keyup', 'keydown', 'paste']
      events.forEach(event => {
        input.addEventListener(event, forceBlackText)
      })
    })
    
    // MutationObserver로 DOM 변경 감지
    const observer = new MutationObserver(() => {
      forceBlackText()
    })
    
    observer.observe(document.body, {
      childList: true,
      subtree: true,
      attributes: true,
      attributeFilter: ['style', 'class']
    })
    
    // 주기적으로 강제 실행
    const interval = setInterval(forceBlackText, 500)
    
    return () => {
      timers.forEach(timer => clearTimeout(timer))
      clearInterval(interval)
      observer.disconnect()
      inputs.forEach((input) => {
        const events = ['input', 'focus', 'blur', 'change', 'keyup', 'keydown', 'paste']
        events.forEach(event => {
          input.removeEventListener(event, forceBlackText)
        })
      })
    }
  }, [])

  const handleUserLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError('')

    if (!userName.trim() || !userPhone.trim()) {
      setError('이름과 전화번호를 입력해주세요.')
      setIsLoading(false)
      return
    }

    // 전화번호 형식 검증 (간단한 검증)
    const phoneRegex = /^01[0-9]-?[0-9]{3,4}-?[0-9]{4}$/
    if (!phoneRegex.test(userPhone)) {
      setError('올바른 전화번호 형식을 입력해주세요. (예: 010-1234-5678)')
      setIsLoading(false)
      return
    }

    try {
      const user = await loginUser(userName, userPhone)
      if (user) {
        // 페이지 새로고침으로 상태 업데이트
        window.location.href = '/'
      } else {
        setError('로그인에 실패했습니다. 다시 시도해주세요.')
      }
    } catch {
      setError('로그인 중 오류가 발생했습니다.')
    } finally {
      setIsLoading(false)
    }
  }

  const handleAdminLogin = (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError('')

    if (!adminId.trim() || !adminPassword.trim()) {
      setError('아이디와 비밀번호를 입력해주세요.')
      setIsLoading(false)
      return
    }

    const success = loginAdmin(adminId, adminPassword)
    if (success) {
      // 페이지 새로고침으로 상태 업데이트
      window.location.href = '/admin'
    } else {
      setError('아이디 또는 비밀번호가 잘못되었습니다.')
    }
    setIsLoading(false)
  }

  // Supabase가 설정되지 않은 경우
  if (!isSupabaseConfigured()) {
    return <SupabaseSetup />
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <div className="max-w-md w-full space-y-8">
        <div>
          <h2 className="mt-6 text-center text-3xl font-bold text-gray-900">
            사내 중고마켓
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            로그인하여 중고거래를 시작하세요
          </p>
        </div>

        {/* 탭 메뉴 */}
        <div className="flex rounded-lg bg-gray-100 p-1">
          <button
            onClick={() => setActiveTab('user')}
            className={`flex-1 py-2 px-4 text-sm font-medium rounded-md transition-colors ${
              activeTab === 'user'
                ? 'bg-white text-gray-900 shadow-sm'
                : 'text-gray-500 hover:text-gray-900'
            }`}
          >
            사용자 로그인
          </button>
          <button
            onClick={() => setActiveTab('admin')}
            className={`flex-1 py-2 px-4 text-sm font-medium rounded-md transition-colors ${
              activeTab === 'admin'
                ? 'bg-white text-gray-900 shadow-sm'
                : 'text-gray-500 hover:text-gray-900'
            }`}
          >
            관리자 로그인
          </button>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-md p-4">
            <div className="text-sm text-red-700">{error}</div>
          </div>
        )}

        {/* 사용자 로그인 폼 */}
        {activeTab === 'user' && (
          <form onSubmit={handleUserLogin} className="space-y-6">
            <div>
              <label htmlFor="user-name" className="block text-sm font-medium text-gray-700">
                이름
              </label>
              <input
                id="user-name"
                type="text"
                value={userName}
                onChange={(e) => setUserName(e.target.value)}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 bg-white placeholder:text-gray-500"
                style={{ color: '#000000' }}
                placeholder="홍길동"
                disabled={isLoading}
              />
            </div>

            <div>
              <label htmlFor="user-phone" className="block text-sm font-medium text-gray-700">
                전화번호
              </label>
              <input
                id="user-phone"
                type="tel"
                value={userPhone}
                onChange={(e) => setUserPhone(e.target.value)}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 bg-white placeholder:text-gray-500"
                style={{ color: '#000000' }}
                placeholder="010-1234-5678"
                disabled={isLoading}
              />
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? '로그인 중...' : '로그인'}
            </button>
          </form>
        )}

        {/* 관리자 로그인 폼 */}
        {activeTab === 'admin' && (
          <form onSubmit={handleAdminLogin} className="space-y-6">
            <div>
              <label htmlFor="admin-id" className="block text-sm font-medium text-gray-700">
                아이디
              </label>
              <input
                id="admin-id"
                type="text"
                value={adminId}
                onChange={(e) => setAdminId(e.target.value)}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 bg-white placeholder:text-gray-500"
                style={{ color: '#000000' }}
                placeholder="admin"
                disabled={isLoading}
              />
            </div>

            <div>
              <label htmlFor="admin-password" className="block text-sm font-medium text-gray-700">
                비밀번호
              </label>
              <input
                id="admin-password"
                type="password"
                value={adminPassword}
                onChange={(e) => setAdminPassword(e.target.value)}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 bg-white placeholder:text-gray-500"
                style={{ color: '#000000' }}
                placeholder="비밀번호 입력"
                disabled={isLoading}
              />
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? '로그인 중...' : '관리자 로그인'}
            </button>
          </form>
        )}

        <div className="text-center">
          <p className="text-xs text-gray-500">
            사내 직원만 이용 가능합니다
          </p>
        </div>
      </div>
    </div>
  )
} 