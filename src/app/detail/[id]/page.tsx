'use client'

import React, { useState, useEffect, useCallback } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { FiArrowLeft, FiPhone, FiUser, FiCalendar, FiEdit3, FiTrash2, FiEye, FiChevronLeft, FiChevronRight, FiX } from 'react-icons/fi'
import { getAuthFromStorage } from '@/lib/auth'
import { supabase } from '@/lib/supabase'
import { Product, AuthState, ProductStatus, ShareRequest } from '@/types'

export default function ProductDetailPage() {
  const [auth, setAuth] = useState<AuthState>({ user: null, isAdmin: false, isLoading: true })
  const [product, setProduct] = useState<Product | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')
  const [showStatusModal, setShowStatusModal] = useState(false)
  const [selectedStatus, setSelectedStatus] = useState<ProductStatus>('selling')
  const [currentImageIndex, setCurrentImageIndex] = useState(0)
  const [showImageModal, setShowImageModal] = useState(false)
  const [showShareRequestModal, setShowShareRequestModal] = useState(false)
  const [shareRequestReason, setShareRequestReason] = useState('')
  const [shareRequests, setShareRequests] = useState<ShareRequest[]>([])
  const [isLoadingShareRequests, setIsLoadingShareRequests] = useState(false)
  const [showEditShareRequestModal, setShowEditShareRequestModal] = useState(false)
  const [editingShareRequest, setEditingShareRequest] = useState<ShareRequest | null>(null)
  const [editShareRequestReason, setEditShareRequestReason] = useState('')
  const [isSelectingApplicant, setIsSelectingApplicant] = useState(false)
  const [touchStart, setTouchStart] = useState<number | null>(null)
  const [touchEnd, setTouchEnd] = useState<number | null>(null)
  const [mouseStart, setMouseStart] = useState<number | null>(null)
  const [mouseEnd, setMouseEnd] = useState<number | null>(null)
  const [isDragging, setIsDragging] = useState(false)
  const router = useRouter()
  const params = useParams()

  // 최소 스와이프 거리 (픽셀)
  const minSwipeDistance = 50

  const onTouchStart = (e: React.TouchEvent) => {
    setTouchEnd(null) // 초기화
    setTouchStart(e.targetTouches[0].clientX)
  }

  const onTouchMove = (e: React.TouchEvent) => {
    setTouchEnd(e.targetTouches[0].clientX)
  }

  const onTouchEnd = () => {
    if (!touchStart || !touchEnd) return
    
    const distance = touchStart - touchEnd
    const isLeftSwipe = distance > minSwipeDistance
    const isRightSwipe = distance < -minSwipeDistance

    if (product?.images && product.images.length > 1) {
      if (isLeftSwipe && currentImageIndex < product.images.length - 1) {
        setCurrentImageIndex(currentImageIndex + 1)
      }
      if (isRightSwipe && currentImageIndex > 0) {
        setCurrentImageIndex(currentImageIndex - 1)
      }
    }
  }

  const onMouseDown = (e: React.MouseEvent) => {
    setMouseEnd(null)
    setMouseStart(e.clientX)
    setIsDragging(true)
  }

  const onMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return
    setMouseEnd(e.clientX)
  }

  const onMouseUp = () => {
    setIsDragging(false)
    if (!mouseStart || !mouseEnd) return
    
    const distance = mouseStart - mouseEnd
    const isLeftSwipe = distance > minSwipeDistance
    const isRightSwipe = distance < -minSwipeDistance

    if (product?.images && product.images.length > 1) {
      if (isLeftSwipe && currentImageIndex < product.images.length - 1) {
        setCurrentImageIndex(currentImageIndex + 1)
      }
      if (isRightSwipe && currentImageIndex > 0) {
        setCurrentImageIndex(currentImageIndex - 1)
      }
    }
  }

  useEffect(() => {
    const authState = getAuthFromStorage()
    console.log('🔍 Auth state from storage:', authState)
    setAuth(authState)
    
    // 로그인되지 않은 경우 로그인 페이지로 리다이렉트
    if (!authState.user && !authState.isAdmin) {
      console.log('🔍 No auth found, redirecting to login')
      router.push('/login')
      return
    }

    if (params.id) {
      fetchProduct(params.id as string)
    }
  }, [router, params.id]) // eslint-disable-line react-hooks/exhaustive-deps

  // 브라우저 뒤로가기 이벤트 처리 (이미지 모달용)
  useEffect(() => {
    const handlePopState = (_event: PopStateEvent) => {
      if (showImageModal) {
        // 모달이 열려있으면 모달만 닫고 페이지 이동 방지
        setShowImageModal(false)
        // 히스토리를 다시 추가해서 뒤로가기 방지
        window.history.pushState({ modalOpen: false }, '', window.location.href)
      }
    }

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && showImageModal) {
        setShowImageModal(false)
      }
    }

    // 이미지 모달이 열릴 때 히스토리 상태 추가
    if (showImageModal) {
      window.history.pushState({ modalOpen: true }, '', window.location.href)
    }

    window.addEventListener('popstate', handlePopState)
    window.addEventListener('keydown', handleKeyDown)
    
    return () => {
      window.removeEventListener('popstate', handlePopState)
      window.removeEventListener('keydown', handleKeyDown)
    }
  }, [showImageModal])



  const fetchProduct = useCallback(async (id: string) => {
    try {
      setIsLoading(true)
      
      // 조회수 증가
      await supabase.rpc('increment_view_count', { product_id: id })
      
      // 상품 정보 가져오기
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .eq('id', id)
        .single()

      if (error) {
        throw error
      }

      if (!data) {
        throw new Error('상품을 찾을 수 없습니다.')
      }

      console.log('🔍 Product data fetched:', data)
      setProduct(data)
      
      // 나눔 상품인 경우 나눔 신청 목록도 가져오기
      if (data.type === 'share') {
        fetchShareRequests(id)
      }
    } catch (error) {
      console.error('Error fetching product:', error)
      setError('상품을 불러오는 중 오류가 발생했습니다.')
    } finally {
      setIsLoading(false)
    }
  }, [])

  const fetchShareRequests = useCallback(async (productId: string) => {
    try {
      setIsLoadingShareRequests(true)
      
      const { data, error } = await supabase
        .from('share_requests')
        .select('*')
        .eq('product_id', productId)
        .order('created_at', { ascending: false })

      if (error) {
        throw error
      }

      setShareRequests(data || [])
    } catch (error) {
      console.error('Error fetching share requests:', error)
    } finally {
      setIsLoadingShareRequests(false)
    }
  }, [])

  const handleDeleteShareRequest = async (requestId: string, requesterName: string) => {
    const confirmed = window.confirm(`"${requesterName}"님의 나눔 신청을 삭제하시겠습니까?`)
    if (!confirmed) return

    try {
      console.log('🗑️ 강력 삭제 시작:', requestId)
      
      // 방법 1: 일반 삭제 시도
      let { data, error } = await supabase
        .from('share_requests')
        .delete()
        .eq('id', requestId)
        .select()

      // 방법 1이 실패하면 방법 2: RPC 함수 사용 (만능 삭제)
      if (error) {
        console.log('🔄 일반 삭제 실패, RPC 삭제 시도:', error)
        
        const { data: rpcData, error: rpcError } = await supabase.rpc('delete_share_request', {
          request_id: requestId
        })
        
        if (rpcError) {
          console.error('❌ RPC 삭제도 실패:', rpcError)
          throw rpcError
        }
        
        console.log('✅ RPC 삭제 성공:', rpcData)
        data = rpcData
      } else {
        console.log('✅ 일반 삭제 성공:', data)
      }

      // 로컬 상태에서 즉시 제거
      setShareRequests(prevRequests => {
        const filtered = prevRequests.filter(r => r.id !== requestId)
        console.log('📋 로컬 상태 업데이트 완료, 남은 개수:', filtered.length)
        return filtered
      })
      
      alert('✅ 나눔 신청이 완전히 삭제되었습니다!')
      
      // 2초 후 서버에서 다시 확인
      setTimeout(async () => {
        if (product?.id) {
          console.log('🔄 서버 동기화 확인 중...')
          await fetchShareRequests(product.id)
        }
      }, 2000)
      
    } catch (error) {
      console.error('❌ 모든 삭제 방법 실패:', error)
      alert('❌ 삭제 실패! 관리자에게 문의하세요.')
    }
  }

  const sendReservationNotification = async (productId: string, productTitle: string, buyerName: string, sellerId: string) => {
    try {
      console.log('📱 예약 알림 발송 시작:', { productId, productTitle, buyerName, sellerId })
      
      // 판매자의 푸시 구독 정보 조회
      const { data: sellerData, error: sellerError } = await supabase
        .from('users')
        .select('id, name, push_subscription, notification_enabled')
        .eq('id', sellerId)
        .single()

      if (sellerError || !sellerData) {
        console.log('⚠️ 판매자 정보 조회 실패:', sellerError)
        return
      }

      if (!sellerData.notification_enabled) {
        console.log('⚠️ 판매자가 푸시 알림을 비활성화함')
        return
      }

      // 알림 내용 구성
      const notificationData = {
        title: '🎉 새로운 예약이 들어왔습니다!',
        message: `${buyerName}님이 "${productTitle}" 상품을 예약했습니다.`,
        data: {
          type: 'reservation',
          productId: productId,
          productTitle: productTitle,
          buyerName: buyerName,
          timestamp: new Date().toISOString()
        }
      }

      // 우선 브라우저 알림으로 시도
      let notificationSent = false
      
      // 1. 브라우저 알림 시도 (즉시 표시)
      if ('Notification' in window && Notification.permission === 'granted') {
        try {
          new Notification(notificationData.title, {
            body: notificationData.message,
            icon: '/icons/icon-192x192.png',
            badge: '/icons/icon-72x72.png',
            tag: `reservation-${productId}`,
            data: notificationData.data,
            requireInteraction: true
          })
          console.log('✅ 브라우저 알림 발송 성공')
          notificationSent = true
        } catch (browserError) {
          console.error('❌ 브라우저 알림 발송 실패:', browserError)
        }
      }

      // 2. Edge Function을 통한 푸시 알림 시도 (백그라운드)
      if (sellerData.push_subscription) {
        try {
          const { data, error } = await supabase.functions.invoke('send-push-notification', {
            body: {
              subscription: sellerData.push_subscription,
              notification: notificationData
            }
          })

          if (error) {
            console.log('⚠️ Edge Function 푸시 알림 실패 (정상적임):', error.message)
          } else {
            console.log('✅ Edge Function 푸시 알림 발송 성공:', data)
            notificationSent = true
          }
        } catch (edgeError) {
          console.log('⚠️ Edge Function 호출 실패 (정상적임):', edgeError)
        }
      }

      // 3. Service Worker를 통한 로컬 알림 시도
      if (!notificationSent && 'serviceWorker' in navigator) {
        try {
          const registration = await navigator.serviceWorker.ready
          await registration.showNotification(notificationData.title, {
            body: notificationData.message,
            icon: '/icons/icon-192x192.png',
            badge: '/icons/icon-72x72.png',
            tag: `reservation-${productId}`,
            data: notificationData.data,
            actions: [
              { action: 'view', title: '상품 보기' },
              { action: 'close', title: '닫기' }
            ],
            requireInteraction: true,
            vibrate: [200, 100, 200]
          })
          console.log('✅ Service Worker 알림 발송 성공')
          notificationSent = true
        } catch (swError) {
          console.error('❌ Service Worker 알림 발송 실패:', swError)
        }
      }

      // 알림 로그 저장 (선택사항)
      try {
        await supabase
          .from('notifications')
          .insert({
            user_id: sellerId,
            type: 'reservation',
            title: notificationData.title,
            message: notificationData.message,
            data: notificationData.data,
            sent_at: new Date().toISOString()
          })
      } catch (logError) {
        console.log('알림 로그 저장 실패 (무시 가능):', logError)
      }

      if (notificationSent) {
        console.log('✅ 예약 알림 발송 완료')
      } else {
        console.log('⚠️ 모든 알림 방법 실패, 판매자가 알림을 확인하지 못할 수 있음')
      }

    } catch (error) {
      console.error('❌ 알림 발송 중 오류:', error)
    }
  }



  const handleEditShareRequest = (request: ShareRequest) => {
    setEditingShareRequest(request)
    setEditShareRequestReason(request.reason)
    setShowEditShareRequestModal(true)
  }

  const handleUpdateShareRequest = async () => {
    if (!editingShareRequest || !editShareRequestReason.trim()) {
      alert('수정할 내용을 입력해주세요.')
      return
    }

    const newReason = editShareRequestReason.trim()

    try {
      console.log('✏️ 강력 수정 시작:', editingShareRequest.id, '새 내용:', newReason)
      
      // 방법 1: 일반 업데이트 시도
      let { data, error } = await supabase
        .from('share_requests')
        .update({ 
          reason: newReason,
          updated_at: new Date().toISOString()
        })
        .eq('id', editingShareRequest.id)
        .select()

      // 방법 1이 실패하면 방법 2: RPC 함수 사용 (만능 수정)
      if (error) {
        console.log('🔄 일반 수정 실패, RPC 수정 시도:', error)
        
        const { data: rpcData, error: rpcError } = await supabase.rpc('update_share_request', {
          request_id: editingShareRequest.id,
          new_reason: newReason
        })
        
        if (rpcError) {
          console.error('❌ RPC 수정도 실패:', rpcError)
          throw rpcError
        }
        
        console.log('✅ RPC 수정 성공:', rpcData)
        data = rpcData
      } else {
        console.log('✅ 일반 수정 성공:', data)
      }

      // 로컬 상태 즉시 업데이트
      setShareRequests(prevRequests => {
        const updated = prevRequests.map(r =>
          r.id === editingShareRequest.id
            ? { ...r, reason: newReason, updated_at: new Date().toISOString() }
            : r
        )
        console.log('📋 로컬 상태 수정 완료')
        return updated
      })

      // 모달 닫기
      setShowEditShareRequestModal(false)
      setEditingShareRequest(null)
      setEditShareRequestReason('')
      
      alert('✅ 나눔 신청이 완전히 수정되었습니다!')
      
      // 2초 후 서버에서 다시 확인
      setTimeout(async () => {
        if (product?.id) {
          console.log('🔄 수정 서버 동기화 확인 중...')
          await fetchShareRequests(product.id)
        }
      }, 2000)
      
    } catch (error) {
      console.error('❌ 모든 수정 방법 실패:', error)
      alert('❌ 수정 실패! 관리자에게 문의하세요.')
    }
  }

  // 나눔 신청자 선택 함수
  const handleSelectApplicant = async (shareRequestId: string, requesterName: string) => {
    if (!product?.id) return

    const confirmed = window.confirm(
      `${requesterName}님을 나눔 받을 분으로 선택하시겠습니까?\n\n선택하시면 거래가 완료되고, 다른 신청자들에게는 안내가 됩니다.`
    )
    
    if (!confirmed) return

    try {
      setIsSelectingApplicant(true)
      console.log('🎯 나눔 신청자 선택 시작:', shareRequestId, requesterName)

      const { data, error } = await supabase.rpc('select_share_applicant', {
        product_id_param: product.id,
        share_request_id_param: shareRequestId
      })

      if (error) {
        console.error('❌ 신청자 선택 실패:', error)
        throw error
      }

      console.log('✅ 신청자 선택 성공:', data)

      // 상품 상태 업데이트
      setProduct(prev => prev ? {
        ...prev,
        status: 'completed',
        selected_share_request_id: shareRequestId,
        completed_at: new Date().toISOString()
      } : null)

      alert(`✅ ${requesterName}님이 선택되어 거래가 완료되었습니다!`)

      // 신청서 목록 새로고침
      if (product?.id) {
        await fetchShareRequests(product.id)
        await fetchProduct(product.id)
      }

    } catch (error) {
      console.error('❌ 신청자 선택 중 오류:', error)
      alert('❌ 신청자 선택 중 오류가 발생했습니다. 다시 시도해주세요.')
    } finally {
      setIsSelectingApplicant(false)
    }
  }

  // 나눔 신청자 선택 취소 함수
  const handleUnselectApplicant = async () => {
    if (!product?.id) return

    const confirmed = window.confirm(
      '선택을 취소하고 다시 나눔을 진행하시겠습니까?\n\n다른 신청자들이 다시 신청할 수 있게 됩니다.'
    )
    
    if (!confirmed) return

    try {
      setIsSelectingApplicant(true)
      console.log('🔄 나눔 선택 취소 시작:', product.id)

      const { data, error } = await supabase.rpc('unselect_share_applicant', {
        product_id_param: product.id
      })

      if (error) {
        console.error('❌ 선택 취소 실패:', error)
        throw error
      }

      console.log('✅ 선택 취소 성공:', data)

      // 상품 상태 업데이트
      setProduct(prev => prev ? {
        ...prev,
        status: 'share',
        selected_share_request_id: undefined,
        completed_at: undefined
      } : null)

      alert('✅ 선택이 취소되어 다시 나눔 중으로 변경되었습니다!')

      // 신청서 목록 새로고침
      if (product?.id) {
        await fetchShareRequests(product.id)
        await fetchProduct(product.id)
      }

    } catch (error) {
      console.error('❌ 선택 취소 중 오류:', error)
      alert('❌ 선택 취소 중 오류가 발생했습니다. 다시 시도해주세요.')
    } finally {
      setIsSelectingApplicant(false)
    }
  }

  // 페이지 포커스 시 나눔 신청 목록 새로고침 (실시간 동기화)
  useEffect(() => {
    const handleFocus = () => {
      if (product?.type === 'share' && product?.id) {
        fetchShareRequests(product.id)
      }
    }

    const handleVisibilityChange = () => {
      if (!document.hidden && product?.type === 'share' && product?.id) {
        fetchShareRequests(product.id)
      }
    }

    window.addEventListener('focus', handleFocus)
    document.addEventListener('visibilitychange', handleVisibilityChange)
    
    return () => {
      window.removeEventListener('focus', handleFocus)
      document.removeEventListener('visibilitychange', handleVisibilityChange)
    }
  }, [product?.id, product?.type, fetchShareRequests])

  const goToPreviousImage = () => {
    if (product?.images && currentImageIndex > 0) {
      setCurrentImageIndex(currentImageIndex - 1)
    }
  }

  const goToNextImage = () => {
    if (product?.images && currentImageIndex < product.images.length - 1) {
      setCurrentImageIndex(currentImageIndex + 1)
    }
  }

  const canEditProduct = () => {
    if (!auth.user && !auth.isAdmin) return false
    if (auth.isAdmin) return true
    return auth.user?.id === product?.seller_id
  }

  const handleStatusChange = async () => {
    if (!product) return

    try {
      const { error } = await supabase
        .from('products')
        .update({ status: selectedStatus })
        .eq('id', product.id)

      if (error) {
        throw error
      }

      setProduct({ ...product, status: selectedStatus })
      setShowStatusModal(false)
      
      const statusText = selectedStatus === 'selling' ? '판매중' : 
                        selectedStatus === 'reserved' ? '예약중' : '판매완료'
      alert(`상품 상태가 "${statusText}"으로 변경되었습니다.`)
    } catch (error) {
      console.error('Error updating status:', error)
      alert('상태 변경 중 오류가 발생했습니다.')
    }
  }

  const handleDelete = async () => {
    if (!product) return

    const confirmMessage = `정말로 "${product.title}" 상품을 삭제하시겠습니까?\n\n이 작업은 되돌릴 수 없습니다.`
    
    if (!confirm(confirmMessage)) return

    try {
      const { error } = await supabase
        .from('products')
        .delete()
        .eq('id', product.id)

      if (error) {
        throw error
      }

      alert('상품이 삭제되었습니다.')
      router.push('/')
    } catch (error) {
      console.error('Error deleting product:', error)
      alert('상품 삭제 중 오류가 발생했습니다.')
    }
  }

  const handleShareRequest = async () => {
    if (!product || !auth.user) return

    if (!shareRequestReason.trim()) {
      alert('신청 사연을 입력해주세요.')
      return
    }

    try {
      const { error } = await supabase
        .from('share_requests')
        .insert({
          product_id: product.id,
          requester_name: auth.user.name,
          requester_id: auth.user.id,
          reason: shareRequestReason.trim()
        })

      if (error) {
        throw error
      }

      alert('나눔 신청이 완료되었습니다!')
      setShowShareRequestModal(false)
      setShareRequestReason('')
      
      // 나눔 신청 목록 새로고침
      if (product?.id) {
        fetchShareRequests(product.id)
      }
    } catch (error) {
      console.error('Error submitting share request:', error)
      alert('나눔 신청 중 오류가 발생했습니다.')
    }
  }

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('ko-KR').format(price)
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffTime = Math.abs(now.getTime() - date.getTime())
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))

    if (diffDays === 1) {
      return '오늘'
    } else if (diffDays === 2) {
      return '어제'
    } else if (diffDays <= 7) {
      return `${diffDays - 1}일 전`
    } else {
      return date.toLocaleDateString('ko-KR', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      })
    }
  }

  const handleReserveProduct = async () => {
    if (!product || !auth.user) return

    if (confirm('이 상품을 예약하시겠습니까?')) {
      try {
        const { error } = await supabase
          .from('products')
          .update({ 
            status: 'reserved',
            reserved_by_id: auth.user.id,
            reserved_by_name: auth.user.name,
            reserved_by_phone: auth.user.phone,
            reserved_at: new Date().toISOString()
          })
          .eq('id', product.id)

        if (error) {
          throw error
        }

        setProduct({ 
          ...product, 
          status: 'reserved',
          reserved_by_id: auth.user.id,
          reserved_by_name: auth.user.name,
          reserved_by_phone: auth.user.phone,
          reserved_at: new Date().toISOString()
        })
        
        // 판매자에게 푸시 알림 발송
        await sendReservationNotification(product.id, product.title, auth.user.name, product.seller_id)
        
        alert('✅ 상품이 예약되었습니다!\n판매자에게 알림이 전송되었습니다.')
      } catch (error) {
        console.error('Error reserving product:', error)
        alert('❌ 예약 중 오류가 발생했습니다. 다시 시도해주세요.')
      }
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-orange-500"></div>
      </div>
    )
  }

  if (!product) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">상품을 찾을 수 없습니다</h1>
          <button 
            onClick={() => router.push('/')}
            className="bg-orange-500 text-white px-6 py-2 rounded-lg"
          >
            홈으로 돌아가기
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* 헤더 */}
      <div className="bg-white shadow-sm sticky top-0 z-10">
        <div className="max-w-md mx-auto px-4 py-4 flex items-center justify-between">
          <button 
            onClick={() => router.back()}
            className="p-2 hover:bg-gray-100 rounded-full"
          >
            <FiArrowLeft size={24} />
          </button>
          <h1 className="text-lg font-semibold">상품 상세</h1>
          <div className="w-10"></div>
        </div>
      </div>

      {/* 메인 컨텐츠 */}
      <div className="max-w-md mx-auto bg-white">
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-md p-4 mb-6">
            <div className="text-sm text-red-700">{error}</div>
          </div>
        )}

        {/* 미디어 갤러리 (이미지 + 동영상) */}
        <div className="mb-6">
          {(product.images && product.images.length > 0) || (product.videos && product.videos.length > 0) ? (
            <div className="space-y-4">
              {/* 이미지 갤러리 */}
              {product.images && product.images.length > 0 && (
                <div>
                  <h3 className="text-lg font-semibold text-gray-800 mb-3 flex items-center gap-2 px-6">
                    📷 이미지 ({product.images.length}장)
                  </h3>
                  <div className="space-y-4">
                    {/* 메인 이미지 */}
                    <div 
                      className="group relative w-full h-80 bg-gray-100 overflow-hidden select-none cursor-grab active:cursor-grabbing"
                      onTouchStart={onTouchStart}
                      onTouchMove={onTouchMove}
                      onTouchEnd={onTouchEnd}
                      onMouseDown={onMouseDown}
                      onMouseMove={onMouseMove}
                      onMouseUp={onMouseUp}
                      onMouseLeave={onMouseUp}
                    >
                      <img
                        src={product.images[currentImageIndex]}
                        alt={product.title}
                        className="w-full h-full object-contain cursor-pointer hover:scale-105 transition-all duration-300 ease-in-out"
                        onClick={() => setShowImageModal(true)}
                        draggable={false}
                      />
                      
                      {/* 깔끔한 이미지 카운터 (우상단만) */}
                      {product.images.length > 1 && (
                        <div className="absolute top-4 right-4 bg-white bg-opacity-90 text-gray-800 px-3 py-1 rounded-full text-sm font-medium shadow-sm">
                          {currentImageIndex + 1}/{product.images.length}
                        </div>
                      )}
                      
                      {/* 좌우 슬라이드 버튼 (호버 시에만 표시) */}
                      {product.images.length > 1 && (
                        <>
                          <button
                            onClick={goToPreviousImage}
                            className="absolute left-2 top-1/2 transform -translate-y-1/2 bg-white bg-opacity-80 text-gray-800 p-2 rounded-full hover:bg-opacity-100 transition-all opacity-0 group-hover:opacity-100 shadow-sm"
                          >
                            <FiChevronLeft size={20} />
                          </button>
                          <button
                            onClick={goToNextImage}
                            className="absolute right-2 top-1/2 transform -translate-y-1/2 bg-white bg-opacity-80 text-gray-800 p-2 rounded-full hover:bg-opacity-100 transition-all opacity-0 group-hover:opacity-100 shadow-sm"
                          >
                            <FiChevronRight size={20} />
                          </button>
                        </>
                      )}
                    </div>
                    
                    {/* 썸네일 이미지 */}
                    {product.images.length > 1 && (
                      <div className="flex gap-3 overflow-x-auto px-6">
                        {product.images.map((image, index) => (
                          <button
                            key={index}
                            onClick={() => setCurrentImageIndex(index)}
                            className={`flex-shrink-0 w-24 h-16 rounded-lg overflow-hidden border-2 transition-all ${
                              index === currentImageIndex ? 'border-blue-600' : 'border-gray-200'
                            }`}
                          >
                            <img
                              src={image}
                              alt={`${product.title} ${index + 1}`}
                              className="w-full h-full object-contain"
                            />
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* 동영상 갤러리 */}
              {product.videos && product.videos.length > 0 && (
                <div>
                  <h3 className="text-lg font-semibold text-gray-800 mb-3 flex items-center gap-2 px-6">
                    🎥 동영상 ({product.videos.length}개)
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 px-6">
                    {product.videos.map((video, index) => (
                      <div key={index} className="relative w-full h-64 bg-gray-100 rounded-lg overflow-hidden">
                        <video
                          src={video}
                          className="w-full h-full object-contain"
                          controls
                          preload="metadata"
                          style={{ backgroundColor: '#f3f4f6' }}
                        >
                          <p className="text-center text-gray-500 p-4">
                            브라우저에서 동영상을 지원하지 않습니다.
                          </p>
                        </video>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="w-full h-80 bg-gray-100 flex items-center justify-center">
              <span className="text-8xl text-gray-400">📦</span>
            </div>
          )}
        </div>

        {/* 상품 정보 */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex-1">
              <h1 className="text-2xl font-bold text-gray-900 mb-2">{product.title}</h1>
              <div className="flex items-center gap-2">
                {/* 판매/나눔/구하기 타입 배지 */}
                <span className={`px-2 py-1 rounded-full text-sm font-medium ${
                  product.type === 'share' 
                    ? 'bg-green-100 text-green-700' 
                    : product.type === 'wanted'
                    ? 'bg-orange-100 text-orange-700'
                    : 'bg-blue-100 text-blue-700'
                }`}>
                  {product.type === 'share' ? '💝 나눔' : 
                   product.type === 'wanted' ? '🔍 구하기' : '💰 판매'}
                </span>
                
                {/* 상태 배지 */}
                <span className={`px-2 py-1 rounded-full text-sm font-medium ${
                  product.status === 'selling' ? 'bg-green-100 text-green-700' :
                  product.status === 'reserved' ? 'bg-yellow-100 text-yellow-700' :
                  product.status === 'share' ? 'bg-blue-100 text-blue-700' :
                  product.status === 'completed' ? 'bg-purple-100 text-purple-700' :
                  'bg-gray-100 text-gray-700'
                }`}>
                  {product.status === 'selling' ? '판매중' :
                   product.status === 'reserved' ? '예약중' :
                   product.status === 'share' ? '나눔중' :
                   product.status === 'completed' ? '거래완료' : '판매완료'}
                </span>
              </div>
            </div>
            
            {/* 편집/삭제 버튼 */}
            {canEditProduct() && (
              <div className="flex gap-2">
                <button
                  onClick={() => router.push(`/edit/${product.id}`)}
                  className="p-2 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-full transition-colors"
                  title="편집"
                >
                  <FiEdit3 size={18} />
                </button>
                <button
                  onClick={handleDelete}
                  className="p-2 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-full transition-colors"
                  title="삭제"
                >
                  <FiTrash2 size={18} />
                </button>
              </div>
            )}
          </div>

          {/* 가격 정보 */}
          <div className="mb-4">
            {product.type === 'share' ? (
              <p className="text-2xl font-bold text-green-600">무료 나눔</p>
            ) : (
              <div>
                <p className="text-2xl font-bold text-gray-900">
                  {product.type === 'wanted' ? '희망가격 ' : ''}
                  {formatPrice(product.price)}원
                </p>
                {product.original_price && product.type === 'sale' && (
                  <p className="text-sm text-gray-500">
                    원가: {formatPrice(product.original_price)}원
                  </p>
                )}
              </div>
            )}
          </div>

          {/* 기본 정보 */}
          <div className="space-y-2 text-sm text-gray-600 mb-4">
            <div className="flex items-center gap-2">
              <span className="w-16 font-medium">카테고리</span>
              <span>{product.category}</span>
            </div>
            {product.usage_period && product.type === 'sale' && (
              <div className="flex items-center gap-2">
                <span className="w-16 font-medium">사용기간</span>
                <span>{product.usage_period}</span>
              </div>
            )}
            <div className="flex items-center gap-2">
              <FiEye size={16} />
              <span>조회 {product.view_count}회</span>
              <span>•</span>
              <FiCalendar size={16} />
              <span>{formatDate(product.created_at)}</span>
            </div>
          </div>

          {/* 상품 설명 */}
          <div className="border-t pt-4">
            <h3 className="font-semibold text-gray-900 mb-2">
              {product.type === 'wanted' ? '상세 요구사항' : '상품 설명'}
            </h3>
            <p className="text-gray-700 whitespace-pre-wrap leading-relaxed">
              {product.description}
            </p>
          </div>
        </div>

        {/* 판매자 정보 */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
          <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
            <FiUser size={18} />
            {product.type === 'wanted' ? '구하는 사람' : '판매자'} 정보
          </h3>
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <span className="w-16 font-medium text-gray-600">이름</span>
              <span>{product.seller_name}</span>
            </div>
            <div className="flex items-center gap-2">
              <FiPhone size={16} className="text-gray-400" />
              <span className="w-16 font-medium text-gray-600">연락처</span>
              <a 
                href={`tel:${product.contact}`}
                className="text-blue-600 hover:underline"
              >
                {product.contact}
              </a>
            </div>
          </div>
        </div>

        {/* 예약자 정보 (판매자에게만 표시, 예약된 상품인 경우) */}
        {canEditProduct() && product.status === 'reserved' && product.reserved_by_name && (
          <div className="bg-orange-50 rounded-lg shadow-sm border border-orange-200 p-6 mb-6">
            <h3 className="font-semibold text-orange-900 mb-3 flex items-center gap-2">
              <FiCalendar size={18} />
              예약자 정보
            </h3>
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <span className="w-16 font-medium text-orange-700">예약자</span>
                <span className="text-orange-900 font-medium">{product.reserved_by_name}</span>
              </div>
              <div className="flex items-center gap-2">
                <FiPhone size={16} className="text-orange-600" />
                <span className="w-16 font-medium text-orange-700">연락처</span>
                <a 
                  href={`tel:${product.reserved_by_phone}`}
                  className="text-orange-800 hover:underline font-medium"
                >
                  {product.reserved_by_phone}
                </a>
              </div>
              {product.reserved_at && (
                <div className="flex items-center gap-2">
                  <FiCalendar size={16} className="text-orange-600" />
                  <span className="w-16 font-medium text-orange-700">예약일</span>
                  <span className="text-orange-900">
                    {new Date(product.reserved_at).toLocaleDateString('ko-KR', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </span>
                </div>
              )}
            </div>
            <div className="mt-4 p-3 bg-orange-100 rounded-lg">
              <p className="text-sm text-orange-800">
                💡 예약자에게 직접 연락하여 거래를 진행하세요.
              </p>
            </div>
          </div>
        )}

        {/* 나눔 신청 목록 (판매자는 모든 신청, 신청자는 본인 신청만 볼 수 있음) */}
        {product.type === 'share' && (canEditProduct() || shareRequests.some(r => r.requester_id === auth.user?.id)) && (
          <div className="bg-green-50 rounded-lg shadow-sm border border-green-200 p-6 mb-6">
            <h3 className="font-semibold text-green-900 mb-4 flex items-center gap-2">
              <FiUser size={18} />
              {canEditProduct() 
                ? `나눔 신청 목록 (${shareRequests.length}건)` 
                : `내 나눔 신청 (${shareRequests.filter(r => r.requester_id === auth.user?.id).length}건)`
              }
            </h3>
            
            {isLoadingShareRequests ? (
              <div className="flex items-center justify-center py-8">
                <div className="text-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600 mx-auto mb-2"></div>
                  <p className="text-sm text-green-600">신청 목록을 불러오는 중...</p>
                </div>
              </div>
            ) : (canEditProduct() ? shareRequests : shareRequests.filter(r => r.requester_id === auth.user?.id)).length === 0 ? (
              <div className="text-center py-8">
                <div className="text-green-400 mb-2">
                  💝
                </div>
                <p className="text-green-700">
                  {canEditProduct() ? '아직 나눔 신청이 없습니다.' : '나눔 신청 내역이 없습니다.'}
                </p>
                <p className="text-sm text-green-600 mt-1">
                  {canEditProduct() ? '신청을 기다려보세요!' : '나눔 신청을 해보세요!'}
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {(canEditProduct() ? shareRequests : shareRequests.filter(r => r.requester_id === auth.user?.id)).map((request, index) => (
                  <div key={request.id} className="bg-white rounded-lg border border-green-200 p-4">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <span className="bg-green-100 text-green-800 text-xs font-medium px-2 py-1 rounded-full">
                          #{index + 1}
                        </span>
                        <span className="font-medium text-gray-900">{request.requester_name}</span>
                      </div>
                      <div className="text-sm text-gray-500">
                        {new Date(request.created_at).toLocaleDateString('ko-KR', {
                          month: 'short',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </div>
                    </div>
                    
                    <div className="bg-gray-50 rounded-lg p-3">
                      <p className="text-sm text-gray-600 font-medium mb-1">신청 사연:</p>
                      <p className="text-sm text-gray-800 whitespace-pre-wrap leading-relaxed">
                        {request.reason}
                      </p>
                    </div>
                    
                    {/* 선택된 신청자 표시 */}
                    {product.selected_share_request_id === request.id && (
                      <div className="mt-3 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                        <div className="flex items-center gap-2">
                          <div className="text-yellow-600">
                            🎉
                          </div>
                          <div>
                            <p className="text-sm font-medium text-yellow-800">선택된 신청자</p>
                            <p className="text-xs text-yellow-700">이분이 나눔을 받기로 선택되었습니다!</p>
                          </div>
                        </div>
                      </div>
                    )}

                    <div className="mt-3 pt-3 border-t border-gray-100">
                      <div className="flex items-center justify-between">
                        {/* 판매자용 안내 메시지와 선택 버튼 */}
                        {canEditProduct() ? (
                          <div className="flex items-center justify-between w-full">
                            <div className="flex-1">
                              {product.status === 'completed' ? (
                                <p className="text-xs text-green-600">
                                  ✅ 거래가 완료되었습니다. 선택을 변경하려면 아래 버튼을 눌러주세요.
                                </p>
                              ) : (
                                <p className="text-xs text-gray-500">
                                  💡 마음에 드는 신청자를 선택하여 거래를 완료하세요.
                                </p>
                              )}
                            </div>
                            <div className="flex items-center gap-1 ml-2">
                              {/* 선택/선택 취소 버튼 */}
                              {product.selected_share_request_id === request.id ? (
                                <button
                                  onClick={handleUnselectApplicant}
                                  disabled={isSelectingApplicant}
                                  className="text-orange-600 hover:text-orange-700 text-xs px-3 py-1 border border-orange-300 rounded hover:bg-orange-50 transition-colors disabled:opacity-50"
                                  title="선택 취소"
                                >
                                  {isSelectingApplicant ? '처리중...' : '선택 취소'}
                                </button>
                              ) : (
                                product.status !== 'completed' && (
                                  <button
                                    onClick={() => handleSelectApplicant(request.id, request.requester_name)}
                                    disabled={isSelectingApplicant}
                                    className="text-green-600 hover:text-green-700 text-xs px-3 py-1 border border-green-300 rounded hover:bg-green-50 transition-colors disabled:opacity-50"
                                    title="이 신청자 선택"
                                  >
                                    {isSelectingApplicant ? '처리중...' : '선택하기'}
                                  </button>
                                )
                              )}
                            </div>
                          </div>
                        ) : (
                          <p className="text-xs text-gray-500">
                            💡 판매자가 신청을 검토 중입니다.
                          </p>
                        )}
                        
                        <div className="flex items-center gap-1">
                          {/* 수정 버튼: 신청자는 본인 신청만 수정 가능 */}
                          {auth.user?.id === request.requester_id && (
                            <button
                              onClick={() => handleEditShareRequest(request)}
                              className="text-blue-500 hover:text-blue-700 text-xs px-2 py-1 rounded hover:bg-blue-50 transition-colors"
                              title="신청 수정"
                            >
                              <FiEdit3 size={12} />
                            </button>
                          )}
                          {/* 삭제 버튼: 판매자는 모든 신청 삭제 가능, 신청자는 본인 신청만 삭제 가능 */}
                          {(canEditProduct() || auth.user?.id === request.requester_id) && (
                            <button
                              onClick={() => handleDeleteShareRequest(request.id, request.requester_name)}
                              className="text-red-500 hover:text-red-700 text-xs px-2 py-1 rounded hover:bg-red-50 transition-colors"
                              title="신청 삭제"
                            >
                              <FiTrash2 size={12} />
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* 액션 버튼들 */}
        <div className="bg-white border-t p-6 sticky bottom-0">
          <div className="flex gap-3">
            {/* 나눔 신청 버튼 (나눔 상품만) */}
            {product.type === 'share' && (product.status === 'selling' || product.status === 'share') && !canEditProduct() && (
              <button
                onClick={() => setShowShareRequestModal(true)}
                className="flex-1 bg-green-600 text-white py-3 px-4 rounded-lg font-medium hover:bg-green-700 transition-colors"
              >
                💝 나눔 신청하기
              </button>
            )}

            {/* 거래 완료된 나눔 상품 안내 */}
            {product.type === 'share' && product.status === 'completed' && !canEditProduct() && (
              <div className="flex-1 bg-purple-50 border border-purple-200 py-3 px-4 rounded-lg text-center">
                <p className="text-purple-700 font-medium">🎉 나눔이 완료되었습니다</p>
                <p className="text-purple-600 text-sm mt-1">다른 분이 나눔을 받으셨습니다</p>
              </div>
            )}
            
            {/* 예약하기 버튼 - 판매 상품을 구매자가 예약할 때 (판매자 본인 제외) */}
            {product.type === 'sale' && 
             product.status === 'selling' && 
             auth.user && 
             auth.user.id !== product.seller_id && 
             !auth.isAdmin && (
              <button
                onClick={handleReserveProduct}
                className="flex-1 bg-orange-600 text-white py-3 px-4 rounded-lg font-medium hover:bg-orange-700 transition-colors flex items-center justify-center gap-2"
              >
                📝 예약하기
              </button>
            )}

            {/* 예약 취소 버튼 (예약한 구매자 또는 판매자가 볼 수 있음) */}
            {product.status === 'reserved' && auth.user && 
             (auth.user.id === product.reserved_by_id || canEditProduct()) && (
              <button
                onClick={async () => {
                  const isOwner = canEditProduct();
                  const confirmMessage = isOwner 
                    ? '예약을 취소하시겠습니까? 상품이 다시 판매중 상태가 됩니다.'
                    : '예약을 취소하시겠습니까?';
                    
                  if (confirm(confirmMessage)) {
                    try {
                      const { error } = await supabase
                        .from('products')
                        .update({ 
                          status: 'selling',
                          reserved_by_id: undefined,
                          reserved_by_name: undefined,
                          reserved_by_phone: undefined,
                          reserved_at: undefined
                        })
                        .eq('id', product.id)

                      if (error) {
                        throw error
                      }

                      setProduct({ 
                        ...product, 
                        status: 'selling',
                        reserved_by_id: undefined,
                        reserved_by_name: undefined,
                        reserved_by_phone: undefined,
                        reserved_at: undefined
                      })
                      alert('예약이 취소되었습니다.')
                    } catch (error) {
                      console.error('Error canceling reservation:', error)
                      alert('예약 취소 중 오류가 발생했습니다.')
                    }
                  }
                }}
                className="flex-1 bg-red-600 text-white py-3 px-4 rounded-lg font-medium hover:bg-red-700 transition-colors"
              >
                ❌ 예약 취소
              </button>
            )}
            
            {/* 상태 변경 버튼 (판매자/관리자만) */}
            {canEditProduct() && (
              <button
                onClick={() => setShowStatusModal(true)}
                className="flex-1 bg-gray-600 text-white py-3 px-4 rounded-lg font-medium hover:bg-gray-700 transition-colors"
              >
                상태 변경
              </button>
            )}
          </div>
        </div>
      </div>

             {/* 상태 변경 모달 */}
       {showStatusModal && (
         <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
           <div className="bg-white rounded-lg p-6 w-full max-w-sm">
             <h3 className="text-lg font-semibold mb-4">상품 상태 변경</h3>
             <div className="space-y-3 mb-6">
               {(['selling', 'reserved', 'sold'] as ProductStatus[]).map((status) => (
                 <label 
                   key={status} 
                   className={`flex items-center p-4 rounded-lg border-2 cursor-pointer transition-all ${
                     selectedStatus === status
                       ? status === 'selling' 
                         ? 'bg-green-50 border-green-300 ring-2 ring-green-200' 
                         : status === 'reserved'
                         ? 'bg-yellow-50 border-yellow-300 ring-2 ring-yellow-200'
                         : 'bg-gray-50 border-gray-300 ring-2 ring-gray-200'
                       : 'bg-white border-gray-200 hover:bg-gray-50 hover:border-gray-300'
                   }`}
                 >
                   <input
                     type="radio"
                     name="status"
                     value={status}
                     checked={selectedStatus === status}
                     onChange={(e) => setSelectedStatus(e.target.value as ProductStatus)}
                     className="mr-4 text-blue-600 focus:ring-blue-500"
                   />
                   <div className="flex items-center space-x-2">
                     <span className="text-xl">
                       {status === 'selling' ? '🟢' :
                        status === 'reserved' ? '🟡' : '⚫'}
                     </span>
                     <span className={`font-medium ${
                       selectedStatus === status
                         ? status === 'selling' ? 'text-green-700' :
                           status === 'reserved' ? 'text-yellow-700' : 'text-gray-700'
                         : status === 'selling' ? 'text-green-600' :
                           status === 'reserved' ? 'text-yellow-600' : 'text-gray-600'
                     }`}>
                       {status === 'selling' ? '판매중' :
                        status === 'reserved' ? '예약중' : '판매완료'}
                     </span>
                   </div>
                 </label>
               ))}
             </div>
            <div className="flex gap-3">
              <button
                onClick={() => setShowStatusModal(false)}
                className="flex-1 px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                취소
              </button>
              <button
                onClick={handleStatusChange}
                className="flex-1 px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700"
              >
                변경
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 나눔 신청 모달 */}
      {showShareRequestModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg p-6 w-full max-w-sm">
            <h3 className="text-lg font-semibold mb-4">나눔 신청</h3>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                신청 사연을 적어주세요
              </label>
              <textarea
                value={shareRequestReason}
                onChange={(e) => setShareRequestReason(e.target.value)}
                rows={4}
                placeholder="나눔을 받고 싶은 이유나 사연을 적어주세요..."
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 resize-none"
              />
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => {
                  setShowShareRequestModal(false)
                  setShareRequestReason('')
                }}
                className="flex-1 px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                취소
              </button>
              <button
                onClick={handleShareRequest}
                className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
              >
                신청하기
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 나눔 신청 수정 모달 */}
      {showEditShareRequestModal && editingShareRequest && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg p-6 w-full max-w-sm">
            <h3 className="text-lg font-semibold mb-4">나눔 신청 수정</h3>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                신청 사연 수정
              </label>
              <textarea
                value={editShareRequestReason}
                onChange={(e) => setEditShareRequestReason(e.target.value)}
                rows={4}
                placeholder="나눔을 받고 싶은 이유나 사연을 적어주세요..."
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none"
              />
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => {
                  setShowEditShareRequestModal(false)
                  setEditingShareRequest(null)
                  setEditShareRequestReason('')
                }}
                className="flex-1 px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                취소
              </button>
              <button
                onClick={handleUpdateShareRequest}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                수정완료
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 이미지 전체화면 모달 */}
      {showImageModal && product.images && (
        <div className="fixed inset-0 bg-black bg-opacity-90 flex items-center justify-center z-50">
          <div className="relative w-full h-full flex items-center justify-center">
            <button
              onClick={() => setShowImageModal(false)}
              className="absolute top-4 right-4 text-white p-2 hover:bg-white hover:bg-opacity-20 rounded-full z-10"
            >
              <FiX size={24} />
            </button>
            
            <div 
              className="relative w-full h-full flex items-center justify-center px-4"
              onTouchStart={onTouchStart}
              onTouchMove={onTouchMove}
              onTouchEnd={onTouchEnd}
              onMouseDown={onMouseDown}
              onMouseMove={onMouseMove}
              onMouseUp={onMouseUp}
              onMouseLeave={onMouseUp}
            >
              <img
                src={product.images[currentImageIndex]}
                alt={product.title}
                className="max-w-full max-h-full object-contain"
                draggable={false}
              />
              
                             {product.images.length > 1 && (
                 <>
                   {/* 이미지 카운터 (전체화면) */}
                   <div className="absolute top-4 left-1/2 transform -translate-x-1/2 bg-black bg-opacity-60 text-white px-4 py-2 rounded-full text-sm font-medium">
                     {currentImageIndex + 1} / {product.images.length}
                   </div>
                   
                   <button
                     onClick={goToPreviousImage}
                     className="absolute left-4 top-1/2 transform -translate-y-1/2 bg-white bg-opacity-90 text-gray-800 p-3 rounded-full hover:bg-opacity-100 transition-all shadow-lg"
                   >
                     <FiChevronLeft size={24} />
                   </button>
                   <button
                     onClick={goToNextImage}
                     className="absolute right-4 top-1/2 transform -translate-y-1/2 bg-white bg-opacity-90 text-gray-800 p-3 rounded-full hover:bg-opacity-100 transition-all shadow-lg"
                   >
                     <FiChevronRight size={24} />
                   </button>
                 </>
               )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
} 