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
    // 가장 강력한 텍스트 색상 강제 적용 함수
    const forceBlackText = () => {
      const selectors = [
        'input[type="text"]',
        'input[type="tel"]', 
        'input[type="password"]',
        '#user-name',
        '#user-phone', 
        '#admin-id',
        '#admin-password',
        'input',
        'form input',
        'div input'
      ]
      
      selectors.forEach(selector => {
        const inputs = document.querySelectorAll(selector)
        inputs.forEach((input) => {
          const element = input as HTMLInputElement
          
          // 스타일 완전 재설정
          const forceStyle = 'color: #000000 !important; -webkit-text-fill-color: #000000 !important; -moz-text-fill-color: #000000 !important; background-color: #ffffff !important; caret-color: #000000 !important;'
          
          // 모든 가능한 방법으로 강제 적용
          element.style.cssText = forceStyle
          element.setAttribute('style', forceStyle)
          
          // 개별 속성 강제 설정
          const properties = [
            'color', 
            '-webkit-text-fill-color', 
            '-moz-text-fill-color',
            '-ms-text-fill-color',
            'background-color',
            'caret-color'
          ]
          
          properties.forEach(prop => {
            const value = prop.includes('background') ? '#ffffff' : '#000000'
            element.style.setProperty(prop, value, 'important')
          })
          
          // 클래스 강제 추가
          element.classList.add('force-black-text')
          
          // 데이터 속성으로 마킹
          element.setAttribute('data-force-black', 'true')
        })
      })
    }
    
    // 강제 CSS 스타일 추가
    const addForceCSS = () => {
      const styleId = 'force-black-text-style'
      let styleElement = document.getElementById(styleId)
      
      if (!styleElement) {
        styleElement = document.createElement('style')
        styleElement.id = styleId
        document.head.appendChild(styleElement)
      }
      
      styleElement.textContent = \`
        .force-black-text,
        input[data-force-black="true"],
        #user-name,
        #user-phone,
        #admin-id,
        #admin-password {
          color: #000000 !important;
          -webkit-text-fill-color: #000000 !important;
          -moz-text-fill-color: #000000 !important;
          background-color: #ffffff !important;
          caret-color: #000000 !important;
        }
      \`
    }
    
    // 즉시 실행
    addForceCSS()
    forceBlackText()
    
    // 다양한 타이밍에 실행
    const timers = []
    for (let i = 0; i < 20; i++) {
      timers.push(setTimeout(() => {
        addForceCSS()
        forceBlackText()
      }, i * 100))
    }
    
    // requestAnimationFrame으로 지속적 실행
    let animationId: number
    const animate = () => {
      forceBlackText()
      animationId = requestAnimationFrame(animate)
    }
    animationId = requestAnimationFrame(animate)
    
    // 모든 가능한 이벤트에 리스너 추가
    const allEvents = [
      'input', 'focus', 'blur', 'change', 'keyup', 'keydown', 'paste',
      'click', 'mousedown', 'mouseup', 'touchstart', 'touchend',
      'DOMContentLoaded', 'load', 'resize', 'scroll'
    ]
    
    allEvents.forEach(event => {
      document.addEventListener(event, forceBlackText)
    })
    
    // MutationObserver
    const observer = new MutationObserver(forceBlackText)
    observer.observe(document.body, {
      childList: true,
      subtree: true,
      attributes: true,
      attributeFilter: ['style', 'class', 'value']
    })
    
    // 주기적 강제 실행
    const interval = setInterval(() => {
      addForceCSS()
      forceBlackText()
    }, 100)
    
    return () => {
      timers.forEach(timer => clearTimeout(timer))
      clearInterval(interval)
      cancelAnimationFrame(animationId)
      observer.disconnect()
      allEvents.forEach(event => {
        document.removeEventListener(event, forceBlackText)
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
            경기지역본부 아.나.바.다.
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