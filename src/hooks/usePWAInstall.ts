import { useState, useEffect } from 'react'

interface BeforeInstallPromptEvent extends Event {
  readonly platforms: string[]
  readonly userChoice: Promise<{
    outcome: 'accepted' | 'dismissed'
    platform: string
  }>
  prompt(): Promise<void>
}

export const usePWAInstall = () => {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null)
  const [isInstallable, setIsInstallable] = useState(false)
  const [isInstalled, setIsInstalled] = useState(false)

  useEffect(() => {
    // PWA가 이미 설치되어 있는지 확인
    const checkIfInstalled = () => {
      if (window.matchMedia && window.matchMedia('(display-mode: standalone)').matches) {
        setIsInstalled(true)
      } else if (window.navigator && 'standalone' in window.navigator) {
        setIsInstalled((window.navigator as { standalone?: boolean }).standalone === true)
      }
    }

    // beforeinstallprompt 이벤트 리스너
    const handleBeforeInstallPrompt = (e: Event) => {
      console.log('beforeinstallprompt 이벤트 발생')
      // 기본 설치 프롬프트 방지
      e.preventDefault()
      // 나중에 사용하기 위해 이벤트 저장
      setDeferredPrompt(e as BeforeInstallPromptEvent)
      setIsInstallable(true)
    }

    // 앱이 성공적으로 설치되었을 때
    const handleAppInstalled = () => {
      console.log('PWA 설치 완료')
      setIsInstalled(true)
      setIsInstallable(false)
      setDeferredPrompt(null)
    }

    // 이벤트 리스너 등록
    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt)
    window.addEventListener('appinstalled', handleAppInstalled)

    // 초기 설치 상태 확인
    checkIfInstalled()

    // 클린업
    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt)
      window.removeEventListener('appinstalled', handleAppInstalled)
    }
  }, [])

  // 설치 프롬프트 표시
  const promptInstall = async () => {
    if (!deferredPrompt) {
      console.log('설치 프롬프트를 사용할 수 없습니다.')
      return false
    }

    try {
      // 설치 프롬프트 표시
      await deferredPrompt.prompt()
      
      // 사용자 선택 대기
      const choiceResult = await deferredPrompt.userChoice
      
      if (choiceResult.outcome === 'accepted') {
        console.log('사용자가 PWA 설치를 허용했습니다.')
        setIsInstallable(false)
        setDeferredPrompt(null)
        return true
      } else {
        console.log('사용자가 PWA 설치를 거부했습니다.')
        return false
      }
    } catch (error) {
      console.error('PWA 설치 중 오류 발생:', error)
      return false
    }
  }

  return {
    isInstallable,
    isInstalled,
    promptInstall
  }
} 