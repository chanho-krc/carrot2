'use client'

import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { loginUser, loginAdmin, getAuthFromStorage } from '@/lib/auth'

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
    // 이미 로그인된 경우 홈으로 리다이렉트
    const auth = getAuthFromStorage()
    if (auth.user || auth.isAdmin) {
      router.push('/')
    }
  }, [router])

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
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            사용자 로그인
          </button>
          <button
            onClick={() => setActiveTab('admin')}
            className={`flex-1 py-2 px-4 text-sm font-medium rounded-md transition-colors ${
              activeTab === 'admin'
                ? 'bg-white text-gray-900 shadow-sm'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            관리자 로그인
          </button>
        </div>

        {/* 에러 메시지 */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-md p-4">
            <div className="text-sm text-red-600">{error}</div>
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
                name="name"
                type="text"
                value={userName}
                onChange={(e) => setUserName(e.target.value)}
                required
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                placeholder="이름을 입력하세요"
                disabled={isLoading}
                style={{ color: '#000000' }}
              />
            </div>

            <div>
              <label htmlFor="user-phone" className="block text-sm font-medium text-gray-700">
                전화번호
              </label>
              <input
                id="user-phone"
                name="phone"
                type="tel"
                value={userPhone}
                onChange={(e) => setUserPhone(e.target.value)}
                required
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                placeholder="010-1234-5678"
                disabled={isLoading}
                style={{ color: '#000000' }}
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
                관리자 ID
              </label>
              <input
                id="admin-id"
                name="id"
                type="text"
                value={adminId}
                onChange={(e) => setAdminId(e.target.value)}
                required
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                placeholder="관리자 ID를 입력하세요"
                disabled={isLoading}
                style={{ color: '#000000' }}
              />
            </div>

            <div>
              <label htmlFor="admin-password" className="block text-sm font-medium text-gray-700">
                비밀번호
              </label>
              <input
                id="admin-password"
                name="password"
                type="password"
                value={adminPassword}
                onChange={(e) => setAdminPassword(e.target.value)}
                required
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                placeholder="비밀번호를 입력하세요"
                disabled={isLoading}
                style={{ color: '#000000' }}
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

        {/* 사용법 안내 */}
        <div className="text-center text-sm text-gray-500">
          <p>
            {activeTab === 'user' 
              ? '처음 사용하시는 분은 이름과 전화번호를 입력하면 자동으로 가입됩니다.'
              : '관리자 계정은 별도로 부여받은 정보를 사용하세요.'
            }
          </p>
        </div>
      </div>
    </div>
  )
} 