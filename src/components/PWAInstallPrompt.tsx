'use client'

import React, { useState, useEffect } from 'react'
import { usePWAInstall } from '@/hooks/usePWAInstall'
import { FiX, FiDownload, FiSmartphone } from 'react-icons/fi'

export default function PWAInstallPrompt() {
  const { isInstallable, isInstalled, promptInstall } = usePWAInstall()
  const [showPrompt, setShowPrompt] = useState(false)
  const [hasPrompted, setHasPrompted] = useState(false)

  useEffect(() => {
    // 이미 설치되어 있거나 이미 프롬프트를 보여준 경우 표시하지 않음
    if (isInstalled || hasPrompted) {
      return
    }

    // 설치 가능한 상태가 되면 잠시 후 프롬프트 표시
    if (isInstallable) {
      const timer = setTimeout(() => {
        setShowPrompt(true)
      }, 2000) // 2초 후 표시

      return () => clearTimeout(timer)
    }
  }, [isInstallable, isInstalled, hasPrompted])

  const handleInstall = async () => {
    const success = await promptInstall()
    if (success) {
      setShowPrompt(false)
      setHasPrompted(true)
    }
  }

  const handleDismiss = () => {
    setShowPrompt(false)
    setHasPrompted(true)
    // 로컬 스토리지에 저장하여 다음에 다시 묻지 않도록 설정
    localStorage.setItem('pwa-install-dismissed', 'true')
  }

  // 이미 설치되었거나 설치 불가능한 경우 표시하지 않음
  if (isInstalled || !isInstallable || !showPrompt) {
    return null
  }

  // 이전에 거부한 경우 표시하지 않음
  if (localStorage.getItem('pwa-install-dismissed') === 'true') {
    return null
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4 overflow-hidden">
        {/* 헤더 */}
        <div className="bg-gradient-to-r from-orange-400 to-orange-600 px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center">
                <span className="text-2xl">🥕</span>
              </div>
              <div>
                <h2 className="text-white font-bold text-lg">KRC 당근</h2>
                <p className="text-orange-100 text-sm">앱으로 더 편리하게</p>
              </div>
            </div>
            <button
              onClick={handleDismiss}
              className="text-white hover:text-orange-200 transition-colors"
            >
              <FiX size={24} />
            </button>
          </div>
        </div>

        {/* 내용 */}
        <div className="px-6 py-6">
          <div className="text-center mb-6">
            <div className="w-16 h-16 bg-gradient-to-br from-orange-400 to-orange-600 rounded-full flex items-center justify-center mx-auto mb-4">
              <FiSmartphone size={28} className="text-white" />
            </div>
            
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              홈 화면에 바로가기 추가
            </h3>
            
            <p className="text-gray-600 text-sm leading-relaxed">
              KRC 당근을 홈 화면에 추가하면 앱처럼 빠르고 편리하게 사용할 수 있습니다.
            </p>
          </div>

          {/* 기능 설명 */}
          <div className="space-y-3 mb-6">
            <div className="flex items-start gap-3">
              <div className="w-6 h-6 bg-green-100 rounded-full flex items-center justify-center mt-0.5">
                <span className="text-green-600 text-sm">✓</span>
              </div>
              <div>
                <p className="text-sm text-gray-700">
                  <strong>빠른 접근:</strong> 홈 화면에서 바로 실행
                </p>
              </div>
            </div>
            
            <div className="flex items-start gap-3">
              <div className="w-6 h-6 bg-green-100 rounded-full flex items-center justify-center mt-0.5">
                <span className="text-green-600 text-sm">✓</span>
              </div>
              <div>
                <p className="text-sm text-gray-700">
                  <strong>오프라인 지원:</strong> 인터넷 없이도 일부 기능 사용 가능
                </p>
              </div>
            </div>
            
            <div className="flex items-start gap-3">
              <div className="w-6 h-6 bg-green-100 rounded-full flex items-center justify-center mt-0.5">
                <span className="text-green-600 text-sm">✓</span>
              </div>
              <div>
                <p className="text-sm text-gray-700">
                  <strong>전체 화면:</strong> 네이티브 앱과 같은 경험
                </p>
              </div>
            </div>
          </div>

          {/* 버튼 */}
          <div className="flex gap-3">
            <button
              onClick={handleDismiss}
              className="flex-1 px-4 py-3 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
            >
              나중에
            </button>
            <button
              onClick={handleInstall}
              className="flex-1 px-4 py-3 bg-gradient-to-r from-orange-500 to-orange-600 text-white rounded-lg hover:from-orange-600 hover:to-orange-700 transition-all flex items-center justify-center gap-2 font-medium"
            >
              <FiDownload size={18} />
              설치하기
            </button>
          </div>
        </div>
      </div>
    </div>
  )
} 