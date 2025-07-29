'use client'

import React, { useState, useEffect } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import Link from 'next/link'
import { FiHome, FiPlus, FiUser, FiSettings, FiLogOut } from 'react-icons/fi'
import { getAuthFromStorage, logout } from '@/lib/auth'
import { AuthState } from '@/types'
import PWAInstallPrompt from './PWAInstallPrompt'
import PushNotificationSetup from './PushNotificationSetup'

interface LayoutProps {
  children: React.ReactNode
}

export default function Layout({ children }: LayoutProps) {
  const [auth, setAuth] = useState<AuthState>({ user: null, isAdmin: false, isLoading: true })
  const router = useRouter()
  const pathname = usePathname()

  useEffect(() => {
    const authState = getAuthFromStorage()
    setAuth(authState)
  }, [])

  const handleLogout = () => {
    logout()
    setAuth({ user: null, isAdmin: false, isLoading: false })
    router.push('/login')
  }

  const isAuthenticated = auth.user || auth.isAdmin

  return (
    <div className="w-full h-full min-h-screen min-h-[100vh] min-h-[100dvh] bg-gray-50 safe-area-container">
      {/* 모바일 스크롤 컨테이너 */}
      <div className="mobile-scroll-container md:contents">
        {/* Header */}
        <header className="bg-white shadow-sm border-b sticky top-0 z-10 safe-area-top">
          <div className="max-w-lg mx-auto px-4 py-3">
            <div className="flex items-center justify-between">
              <Link href="/" className="text-xl font-bold text-gray-800">
                🥕 KRC 당근
              </Link>
              {isAuthenticated && (
                <div className="flex items-center gap-2">
                  <PushNotificationSetup />
                  <span className="text-sm text-gray-600">
                    {auth.isAdmin ? '관리자' : auth.user?.name}
                  </span>
                  <button
                    onClick={handleLogout}
                    className="flex items-center gap-1 px-3 py-1 text-sm text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-md transition-colors"
                  >
                    <FiLogOut size={16} />
                    로그아웃
                  </button>
                </div>
              )}
            </div>
          </div>
        </header>

        {/* Main Content */}
        <main className="max-w-lg mx-auto min-h-[calc(100vh-160px)] min-h-[calc(100dvh-160px)] pb-20 px-4 md:px-0 bg-gray-50">
          {children}
        </main>

        {/* Bottom Navigation */}
        {isAuthenticated && (
          <nav className="fixed bottom-0 left-0 right-0 bg-white border-t z-20 safe-area-bottom safe-area-left safe-area-right">
            <div className="max-w-lg mx-auto px-4 py-2">
              <div className="flex justify-around">
                <Link
                  href="/"
                  className={`flex flex-col items-center py-2 px-3 rounded-lg transition-colors ${
                    pathname === '/' 
                      ? 'text-blue-600 bg-blue-50' 
                      : 'text-gray-500 hover:text-gray-700'
                  }`}
                >
                  <FiHome size={20} />
                  <span className="text-xs mt-1">홈</span>
                </Link>
                
                <Link
                  href="/upload"
                  className={`flex flex-col items-center py-2 px-3 rounded-lg transition-colors ${
                    pathname === '/upload' 
                      ? 'text-blue-600 bg-blue-50' 
                      : 'text-gray-500 hover:text-gray-700'
                  }`}
                >
                  <FiPlus size={20} />
                  <span className="text-xs mt-1">등록</span>
                </Link>
                
                <Link
                  href="/my"
                  className={`flex flex-col items-center py-2 px-3 rounded-lg transition-colors ${
                    pathname === '/my' 
                      ? 'text-blue-600 bg-blue-50' 
                      : 'text-gray-500 hover:text-gray-700'
                  }`}
                >
                  <FiUser size={20} />
                  <span className="text-xs mt-1">내 상품</span>
                </Link>
                
                {auth.isAdmin && (
                  <Link
                    href="/admin"
                    className={`flex flex-col items-center py-2 px-3 rounded-lg transition-colors ${
                      pathname === '/admin' 
                        ? 'text-blue-600 bg-blue-50' 
                        : 'text-gray-500 hover:text-gray-700'
                    }`}
                  >
                    <FiSettings size={20} />
                    <span className="text-xs mt-1">관리</span>
                  </Link>
                )}
              </div>
            </div>
          </nav>
        )}
      </div>

      {/* PWA 설치 프롬프트 - 인증된 사용자에게만 표시 */}
      {isAuthenticated && <PWAInstallPrompt />}
    </div>
  )
} 