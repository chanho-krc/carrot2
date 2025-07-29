'use client'

import React, { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { getAuthFromStorage } from '@/lib/auth'
import { FiBell, FiBellOff } from 'react-icons/fi'

const VAPID_PUBLIC_KEY = 'BJn_KnE8qZe9P8w5o8_m8V9XHt7Qr0CmJ2N3K4L5M6N7O8P9Q0R1S2T3U4V5W6X7Y8Z9' // 실제 VAPID 키로 교체 필요

interface PushNotificationSetupProps {
  className?: string
}

export default function PushNotificationSetup({ className = '' }: PushNotificationSetupProps) {
  const [isSupported, setIsSupported] = useState(false)
  const [isSubscribed, setIsSubscribed] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [permission, setPermission] = useState<NotificationPermission>('default')

  useEffect(() => {
    // 푸시 알림 지원 여부 확인
    if ('serviceWorker' in navigator && 'PushManager' in window) {
      setIsSupported(true)
      setPermission(Notification.permission)
      checkSubscription()
    }
  }, [])

  const checkSubscription = async () => {
    try {
      const registration = await navigator.serviceWorker.ready
      const subscription = await registration.pushManager.getSubscription()
      setIsSubscribed(!!subscription)
    } catch (error) {
      console.error('구독 상태 확인 오류:', error)
    }
  }

  const urlBase64ToUint8Array = (base64String: string) => {
    const padding = '='.repeat((4 - base64String.length % 4) % 4)
    const base64 = (base64String + padding)
      .replace(/-/g, '+')
      .replace(/_/g, '/')

    const rawData = window.atob(base64)
    const outputArray = new Uint8Array(rawData.length)

    for (let i = 0; i < rawData.length; ++i) {
      outputArray[i] = rawData.charCodeAt(i)
    }
    return outputArray
  }

  const subscribeToPush = async () => {
    try {
      setIsLoading(true)
      
      // 권한 요청
      const permission = await Notification.requestPermission()
      setPermission(permission)

      if (permission !== 'granted') {
        alert('알림 권한이 거부되었습니다. 브라우저 설정에서 알림을 허용해주세요.')
        return
      }

      // Service Worker 등록
      const registration = await navigator.serviceWorker.ready
      
      // 푸시 구독 (VAPID 키가 없어도 브라우저 알림은 가능)
      let subscription = null
      try {
        subscription = await registration.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY)
        })
      } catch (vapidError) {
        console.log('VAPID 푸시 구독 실패, 기본 알림으로 대체:', vapidError)
        // VAPID 키가 없어도 브라우저 알림은 설정 가능
      }

      // Supabase에 구독 정보 저장
      const auth = getAuthFromStorage()
      if (auth.user) {
        const { error } = await supabase
          .from('users')
          .update({
            push_subscription: subscription ? subscription.toJSON() : null,
            notification_enabled: true
          })
          .eq('id', auth.user.id)

        if (error) {
          console.error('구독 정보 저장 오류:', error)
          throw error
        }

        console.log('✅ 푸시 알림 구독 완료:', subscription)
        setIsSubscribed(true)
        alert('🔔 예약 알림이 활성화되었습니다!\n이제 상품 예약 알림을 받을 수 있습니다.')
      }
    } catch (error) {
      console.error('푸시 구독 오류:', error)
      alert('알림 설정 중 오류가 발생했습니다.')
    } finally {
      setIsLoading(false)
    }
  }

  const unsubscribeFromPush = async () => {
    try {
      setIsLoading(true)
      
      const registration = await navigator.serviceWorker.ready
      const subscription = await registration.pushManager.getSubscription()
      
      if (subscription) {
        await subscription.unsubscribe()
      }

      // Supabase에서 구독 정보 제거
      const auth = getAuthFromStorage()
      if (auth.user) {
        const { error } = await supabase
          .from('users')
          .update({
            push_subscription: null,
            notification_enabled: false
          })
          .eq('id', auth.user.id)

        if (error) {
          console.error('구독 해제 오류:', error)
          throw error
        }

        console.log('✅ 푸시 알림 구독 해제 완료')
        setIsSubscribed(false)
        alert('🔕 예약 알림이 비활성화되었습니다.')
      }
    } catch (error) {
      console.error('푸시 구독 해제 오류:', error)
      alert('알림 해제 중 오류가 발생했습니다.')
    } finally {
      setIsLoading(false)
    }
  }

  if (!isSupported) {
    return null
  }

  return (
    <div className={className}>
      {permission === 'granted' ? (
        <div className="flex items-center gap-2">
          {isSubscribed ? (
            <button
              onClick={unsubscribeFromPush}
              disabled={isLoading}
              className="flex items-center gap-2 px-3 py-2 text-sm bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors disabled:opacity-50 whitespace-nowrap"
              title="푸시 알림 끄기"
            >
              <FiBellOff size={16} />
              {isLoading ? '처리중...' : '알림 끄기'}
            </button>
          ) : (
            <button
              onClick={subscribeToPush}
              disabled={isLoading}
              className="flex items-center gap-2 px-3 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 whitespace-nowrap"
              title="푸시 알림 켜기"
            >
              <FiBell size={16} />
              {isLoading ? '처리중...' : '알림 켜기'}
            </button>
          )}
        </div>
      ) : (
        <button
          onClick={subscribeToPush}
          disabled={isLoading}
          className="flex items-center gap-1 px-2 py-1 text-xs bg-orange-600 text-white rounded-md hover:bg-orange-700 transition-colors disabled:opacity-50 whitespace-nowrap"
          title="예약 알림 받기"
        >
          <FiBell size={14} />
          {isLoading ? '설정중...' : '예약알림받기'}
        </button>
      )}
    </div>
  )
} 