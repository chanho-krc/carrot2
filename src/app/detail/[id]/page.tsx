'use client'

import React, { useState, useEffect, useCallback } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { FiArrowLeft, FiPhone, FiUser, FiCalendar, FiEdit3, FiTrash2, FiEye, FiChevronLeft, FiChevronRight } from 'react-icons/fi'
import { getAuthFromStorage } from '@/lib/auth'
import { supabase } from '@/lib/supabase'
import { Product, AuthState, ProductStatus } from '@/types'

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
    setAuth(authState)
    
    // 로그인되지 않은 경우 로그인 페이지로 리다이렉트
    if (!authState.user && !authState.isAdmin) {
      router.push('/login')
      return
    }

    if (params.id) {
      fetchProduct(params.id as string)
    }
  }, [router, params.id]) // eslint-disable-line react-hooks/exhaustive-deps

  const fetchProduct = useCallback(async (productId: string) => {
    try {
      const { data: productData, error } = await supabase
        .from('products')
        .select('*')
        .eq('id', productId)
        .single()
      
      if (error || !productData) {
        setError('상품을 찾을 수 없습니다.')
      } else {
        setProduct(productData)
        setSelectedStatus(productData.status)
        
        // 조회수 증가 (비동기로 실행하여 페이지 로딩 속도에 영향 주지 않음)
        incrementViewCount(productId)
      }
    } catch (error) {
      setError('상품을 불러오는 중 오류가 발생했습니다.')
      console.error('Error fetching product:', error)
    } finally {
      setIsLoading(false)
    }
  }, [])

  const incrementViewCount = async (productId: string) => {
    try {
      // 현재 상품 정보 가져오기
      const { data: currentProduct, error: fetchError } = await supabase
        .from('products')
        .select('view_count')
        .eq('id', productId)
        .single()

      if (fetchError) {
        console.error('Error fetching product for view count:', fetchError)
        return
      }

      // 조회수 1 증가
      const { error } = await supabase
        .from('products')
        .update({ 
          view_count: (currentProduct.view_count || 0) + 1,
          updated_at: new Date().toISOString()
        })
        .eq('id', productId)

      if (error) {
        console.error('Error incrementing view count:', error)
      }
    } catch (error) {
      console.error('Error incrementing view count:', error)
    }
  }

  const handleStatusChange = async (newStatus: ProductStatus) => {
    if (!product) return

    try {
      const { error } = await supabase
        .from('products')
        .update({ 
          status: newStatus,
          updated_at: new Date().toISOString()
        })
        .eq('id', product.id)

      if (error) {
        throw error
      }

      setProduct({ ...product, status: newStatus })
      setShowStatusModal(false)
      alert(`상품 상태가 "${getStatusText(newStatus, product.type)}"로 변경되었습니다.`)
    } catch (error) {
      setError('상태 변경 중 오류가 발생했습니다.')
      console.error('Error updating product status:', error)
    }
  }



  const handleDeleteProduct = async () => {
    if (!product) return

    const confirmed = window.confirm(`정말로 "${product.title}" 상품을 삭제하시겠습니까?\n삭제된 상품은 복구할 수 없습니다.`)
    if (!confirmed) return

    try {
      setIsLoading(true)
      const { error } = await supabase
        .from('products')
        .delete()
        .eq('id', product.id)

      if (error) {
        throw error
      }

      alert('상품이 성공적으로 삭제되었습니다.')
      router.push('/')
    } catch (error) {
      setError('상품 삭제 중 오류가 발생했습니다.')
      console.error('Error deleting product:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('ko-KR').format(price)
  }

  const getStatusText = (status: string, type?: string) => {
    switch (status) {
      case 'selling':
        return type === 'wanted' ? '구하는 중' : '판매중'
      case 'reserved':
        return type === 'wanted' ? '매칭됨' : '예약됨'
      case 'sold':
        return '거래완료'
      default:
        return status
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'selling':
        return 'bg-green-100 text-green-800'
      case 'reserved':
        return 'bg-yellow-100 text-yellow-800'
      case 'sold':
        return 'bg-gray-100 text-gray-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const canManageProduct = () => {
    return auth.isAdmin || (auth.user && product && auth.user.id === product.seller_id)
  }

  const handleReserveProduct = async () => {
    if (!product || product.status !== 'selling' || !auth.user) return

    const confirmed = window.confirm('이 상품을 예약하시겠습니까?')
    if (!confirmed) return

    try {
      // 예약자 정보와 함께 상태 변경
      const { error } = await supabase
        .from('products')
        .update({
          status: 'reserved',
          reserved_by_id: auth.user.id,
          reserved_by_name: auth.user.name,
          reserved_by_phone: auth.user.phone,
          reserved_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
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
      alert('예약이 완료되었습니다!')
    } catch (error) {
      console.error('Error reserving product:', error)
      alert('예약 처리 중 오류가 발생했습니다.')
    }
  }

  const handleShareRequest = () => {
    if (!shareRequestReason.trim()) {
      const fieldName = product?.type === 'wanted' ? '판매 제안 내용' : '신청 사연'
      alert(`${fieldName}을 작성해주세요.`)
      return
    }

    // 여기서 실제로는 서버에 신청/제안을 저장해야 하지만, 
    // 현재는 간단히 알림으로 처리
    if (product?.type === 'wanted') {
      alert(`판매 제안이 완료되었습니다!\n\n제안 내용: ${shareRequestReason}\n\n구매자가 확인 후 연락드릴 예정입니다.`)
    } else {
      alert(`나눔 신청이 완료되었습니다!\n\n사연: ${shareRequestReason}\n\n판매자가 확인 후 연락드릴 예정입니다.`)
    }
    setShowShareRequestModal(false)
    setShareRequestReason('')
  }

  // 이미지 슬라이드 함수들
  const goToPreviousImage = () => {
    if (!product?.images || product.images.length <= 1) return
    setCurrentImageIndex(prev => prev === 0 ? product.images.length - 1 : prev - 1)
  }

  const goToNextImage = () => {
    if (!product?.images || product.images.length <= 1) return
    setCurrentImageIndex(prev => prev === product.images.length - 1 ? 0 : prev + 1)
  }

  if (auth.isLoading || isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">로딩 중...</p>
        </div>
      </div>
    )
  }

  if (error && !product) {
    return (
      <div className="px-4 py-6">
        <div className="max-w-2xl mx-auto text-center">
          <p className="text-red-600 mb-4">{error}</p>
          <button
            onClick={() => router.push('/')}
            className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
          >
            홈으로 돌아가기
          </button>
        </div>
      </div>
    )
  }

  if (!product) {
    return null
  }

  return (
    <div className="px-4 py-6">
      <div className="max-w-2xl mx-auto">
        {/* 헤더 */}
        <div className="flex items-center justify-between mb-6">
          <button
            onClick={() => router.back()}
            className="flex items-center gap-2 text-gray-600 hover:text-gray-800"
          >
            <FiArrowLeft size={20} />
            뒤로가기
          </button>
          
          {canManageProduct() && (
            <div className="flex items-center gap-2">
              <button
                onClick={() => router.push(`/edit/${product.id}`)}
                className="flex items-center gap-1 bg-green-600 text-white px-3 py-1 rounded-md hover:bg-green-700 text-sm"
              >
                <FiEdit3 size={14} />
                수정
              </button>
              <button
                onClick={() => setShowStatusModal(true)}
                className="flex items-center gap-1 bg-blue-600 text-white px-3 py-1 rounded-md hover:bg-blue-700 text-sm"
              >
                <FiEdit3 size={14} />
                상태변경
              </button>
              <button
                onClick={handleDeleteProduct}
                className="flex items-center gap-1 bg-red-600 text-white px-3 py-1 rounded-md hover:bg-red-700 text-sm"
              >
                <FiTrash2 size={14} />
                삭제
              </button>
            </div>
          )}
        </div>

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
                  <h3 className="text-lg font-semibold text-gray-800 mb-3 flex items-center gap-2">
                    📷 이미지 ({product.images.length}장)
                  </h3>
                  <div className="space-y-4">
                    {/* 메인 이미지 */}
                    <div 
                      className="relative w-full h-80 bg-gray-100 rounded-lg overflow-hidden select-none cursor-grab active:cursor-grabbing"
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
                      
                      {/* 스와이프 힌트 */}
                      {product.images.length > 1 && (
                        <>
                          <div className="absolute top-4 right-4 bg-black bg-opacity-60 text-white px-3 py-1 rounded-full text-sm">
                            {currentImageIndex + 1}/{product.images.length}
                          </div>
                          <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 bg-black bg-opacity-60 text-white px-3 py-1 rounded-full text-xs animate-pulse">
                            👈 스와이프하여 넘기기 👉
                          </div>
                        </>
                      )}
                      
                      {/* 좌우 슬라이드 버튼 */}
                      {product.images.length > 1 && (
                        <>
                          <button
                            onClick={goToPreviousImage}
                            className="absolute left-2 top-1/2 transform -translate-y-1/2 bg-black bg-opacity-50 text-white p-2 rounded-full hover:bg-opacity-70 transition-all"
                          >
                            <FiChevronLeft size={20} />
                          </button>
                          <button
                            onClick={goToNextImage}
                            className="absolute right-2 top-1/2 transform -translate-y-1/2 bg-black bg-opacity-50 text-white p-2 rounded-full hover:bg-opacity-70 transition-all"
                          >
                            <FiChevronRight size={20} />
                          </button>
                          
                          {/* 이미지 인디케이터 */}
                          <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex gap-2">
                            {product.images.map((_, index) => (
                              <button
                                key={index}
                                onClick={() => setCurrentImageIndex(index)}
                                className={`w-2 h-2 rounded-full transition-all ${
                                  index === currentImageIndex 
                                    ? 'bg-white' 
                                    : 'bg-white bg-opacity-50'
                                }`}
                              />
                            ))}
                          </div>
                        </>
                      )}
                    </div>
                    
                    {/* 썸네일 이미지 */}
                    {product.images.length > 1 && (
                      <div className="flex gap-3 overflow-x-auto">
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
                  <h3 className="text-lg font-semibold text-gray-800 mb-3 flex items-center gap-2">
                    🎥 동영상 ({product.videos.length}개)
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
            <div className="w-full h-80 bg-gray-100 rounded-lg flex items-center justify-center">
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
                  {product.type === 'share' ? '💝 나눔' : product.type === 'wanted' ? '🔍 구하기' : '💰 판매'}
                </span>
                {/* 카테고리 배지 */}
                <span className="px-2 py-1 rounded-full text-sm bg-gray-100 text-gray-700">
                  📂 {product.category}
                </span>
              </div>
            </div>
            <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(product.status)}`}>
              {getStatusText(product.status, product.type)}
            </span>
          </div>
          
          <p className={`text-3xl font-bold mb-4 ${
            product.type === 'share' ? 'text-green-600' : product.type === 'wanted' ? 'text-orange-600' : 'text-blue-600'
          }`}>
            {product.type === 'share' ? '나눔' : product.type === 'wanted' ? `희망 ${formatPrice(product.price)}원` : `${formatPrice(product.price)}원`}
          </p>
          
          <div className="space-y-4">
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">상품 설명</h3>
              <p className="text-gray-700 whitespace-pre-wrap">{product.description}</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {product.usage_period && (
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">사용 기간</h3>
                  <p className="text-gray-700">{product.usage_period}</p>
                </div>
              )}

              {product.original_price && (
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">구매시 가격</h3>
                  <p className="text-gray-700">{formatPrice(product.original_price)}원</p>
                </div>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4 border-t">
              <div className="flex items-center gap-2">
                <FiUser className="text-gray-400" size={18} />
                <span className="text-gray-700">{product.seller_name}</span>
              </div>
              <div className="flex items-center gap-2">
                <FiPhone className="text-gray-400" size={18} />
                <span className="text-gray-700">{product.contact}</span>
              </div>
              <div className="flex items-center gap-2">
                <FiCalendar className="text-gray-400" size={18} />
                <span className="text-gray-700">{new Date(product.created_at).toLocaleDateString()}</span>
              </div>
              <div className="flex items-center gap-2">
                <FiEye className="text-gray-400" size={18} />
                <span className="text-gray-700">조회수 {product.view_count || 0}</span>
              </div>
            </div>
          </div>
        </div>

        {/* 예약자 정보 표시 (판매자만 볼 수 있음) */}
        {canManageProduct() && product.status === 'reserved' && product.reserved_by_name && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
            <h3 className="text-lg font-semibold text-yellow-800 mb-3">📋 예약자 정보</h3>
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <FiUser className="text-yellow-600" size={16} />
                <span className="text-gray-700">
                  <strong>이름:</strong> {product.reserved_by_name}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <FiPhone className="text-yellow-600" size={16} />
                <span className="text-gray-700">
                  <strong>연락처:</strong> {product.reserved_by_phone}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <FiCalendar className="text-yellow-600" size={16} />
                <span className="text-gray-700">
                  <strong>예약 시간:</strong> {product.reserved_at ? new Date(product.reserved_at).toLocaleString() : '정보 없음'}
                </span>
              </div>
            </div>
            <div className="mt-3 p-3 bg-yellow-100 rounded-md">
              <p className="text-sm text-yellow-800">
                💡 예약자와 직접 연락하여 거래를 진행하세요. 거래 완료 후 상태를 &quot;거래완료&quot;로 변경해주세요.
              </p>
            </div>
          </div>
        )}

        {/* 구매/나눔 신청 버튼 또는 판매 제안 버튼 */}
        {!canManageProduct() && product.status === 'selling' && (
          <div className="space-y-3">
            {product.type === 'sale' ? (
              <button
                onClick={handleReserveProduct}
                className="w-full bg-blue-600 text-white py-3 px-4 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
              >
                💰 예약하기
              </button>
            ) : product.type === 'share' ? (
              <button
                onClick={() => setShowShareRequestModal(true)}
                className="w-full bg-green-600 text-white py-3 px-4 rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2"
              >
                💝 나눔 신청하기
              </button>
            ) : (
              <button
                onClick={() => setShowShareRequestModal(true)}
                className="w-full bg-orange-600 text-white py-3 px-4 rounded-md hover:bg-orange-700 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:ring-offset-2"
              >
                💼 판매 제안하기
              </button>
            )}
            
            {/* 안내 메시지 */}
            {product.type === 'share' && (
              <div className="bg-green-50 border border-green-200 rounded-md p-3">
                <p className="text-sm text-green-700">
                  💡 나눔 신청 시 필요한 이유를 작성해주세요. 판매자가 가장 적절한 신청자를 선택합니다.
                </p>
              </div>
            )}
            
            {product.type === 'wanted' && (
              <div className="bg-orange-50 border border-orange-200 rounded-md p-3">
                <p className="text-sm text-orange-700">
                  💡 이 상품을 가지고 계신가요? 판매 제안을 통해 구매자와 직접 연락하세요.
                </p>
              </div>
            )}
          </div>
        )}

        {/* 상태 변경 모달 */}
        {showStatusModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
              <h3 className="text-lg font-semibold mb-4">상품 상태 변경</h3>
              <div className="space-y-2 mb-6">
                <label className={`flex items-center p-3 rounded-lg border-2 cursor-pointer transition-colors ${
                  selectedStatus === 'selling' 
                    ? 'bg-blue-50 border-blue-300' 
                    : 'bg-gray-50 border-gray-200 hover:bg-gray-100'
                }`}>
                  <input
                    type="radio"
                    name="status"
                    value="selling"
                    checked={selectedStatus === 'selling'}
                    onChange={(e) => setSelectedStatus(e.target.value as ProductStatus)}
                    className="mr-3"
                  />
                  <span className={`font-medium ${selectedStatus === 'selling' ? 'text-blue-600' : 'text-gray-700'}`}>
                    판매중
                  </span>
                </label>
                <label className={`flex items-center p-3 rounded-lg border-2 cursor-pointer transition-colors ${
                  selectedStatus === 'reserved' 
                    ? 'bg-yellow-50 border-yellow-300' 
                    : 'bg-gray-50 border-gray-200 hover:bg-gray-100'
                }`}>
                  <input
                    type="radio"
                    name="status"
                    value="reserved"
                    checked={selectedStatus === 'reserved'}
                    onChange={(e) => setSelectedStatus(e.target.value as ProductStatus)}
                    className="mr-3"
                  />
                  <span className={`font-medium ${selectedStatus === 'reserved' ? 'text-yellow-600' : 'text-gray-700'}`}>
                    예약됨
                  </span>
                </label>
                <label className={`flex items-center p-3 rounded-lg border-2 cursor-pointer transition-colors ${
                  selectedStatus === 'sold' 
                    ? 'bg-green-50 border-green-300' 
                    : 'bg-gray-50 border-gray-200 hover:bg-gray-100'
                }`}>
                  <input
                    type="radio"
                    name="status"
                    value="sold"
                    checked={selectedStatus === 'sold'}
                    onChange={(e) => setSelectedStatus(e.target.value as ProductStatus)}
                    className="mr-3"
                  />
                  <span className={`font-medium ${selectedStatus === 'sold' ? 'text-green-600' : 'text-gray-700'}`}>
                    거래완료
                  </span>
                </label>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => setShowStatusModal(false)}
                  className="flex-1 bg-gray-300 text-gray-700 py-2 px-4 rounded-md hover:bg-gray-400"
                >
                  취소
                </button>
                <button
                  onClick={() => handleStatusChange(selectedStatus)}
                  className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700"
                >
                  변경
                </button>
              </div>
            </div>
          </div>
        )}

        {/* 이미지 전체 화면 모달 */}
        {showImageModal && product.images && product.images.length > 0 && (
          <div className="fixed inset-0 bg-black bg-opacity-90 flex items-center justify-center z-50" onClick={() => setShowImageModal(false)}>
            <div 
              className="relative w-full h-full max-w-4xl max-h-4xl m-4 flex items-center justify-center select-none cursor-grab active:cursor-grabbing"
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
                className="max-w-full max-h-full object-contain transition-all duration-300 ease-in-out"
                onClick={(e) => e.stopPropagation()}
                draggable={false}
              />
              
              {/* 이미지 네비게이션 */}
              {product.images.length > 1 && (
                <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex gap-2">
                  {product.images.map((_, index) => (
                    <button
                      key={index}
                      onClick={(e) => {
                        e.stopPropagation()
                        setCurrentImageIndex(index)
                      }}
                      className={`w-3 h-3 rounded-full ${
                        index === currentImageIndex ? 'bg-white' : 'bg-white bg-opacity-50'
                      }`}
                    />
                  ))}
                </div>
              )}
              
              {/* 닫기 버튼 */}
              <button
                onClick={() => setShowImageModal(false)}
                className="absolute top-4 right-4 text-white text-2xl hover:text-gray-300"
              >
                ✕
              </button>
            </div>
          </div>
        )}

        {/* 나눔 신청 / 판매 제안 모달 */}
        {showShareRequestModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
              <h3 className={`text-lg font-semibold mb-4 ${
                product.type === 'wanted' ? 'text-orange-700' : 'text-green-700'
              }`}>
                {product.type === 'wanted' ? '💼 판매 제안하기' : '💝 나눔 신청하기'}
              </h3>
              
              <div className="mb-4">
                <p className="text-sm text-gray-600 mb-2">
                  <strong>상품명:</strong> {product.title}
                </p>
                <p className="text-sm text-gray-600 mb-4">
                  {product.type === 'wanted' 
                    ? '이 상품을 판매하고 싶으시다면 연락처와 판매 조건을 작성해주세요. 구매자가 검토 후 연락드릴 예정입니다.'
                    : '이 물건이 필요한 이유를 구체적으로 작성해주세요. 판매자가 신청 사연을 보고 나눔 받을 분을 선택합니다.'
                  }
                </p>
              </div>

              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {product.type === 'wanted' ? '판매 제안 내용 *' : '신청 사연 *'}
                </label>
                <textarea
                  value={shareRequestReason}
                  onChange={(e) => setShareRequestReason(e.target.value)}
                  rows={4}
                  className={`w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 ${
                    product.type === 'wanted' 
                      ? 'focus:ring-orange-500 focus:border-orange-500'
                      : 'focus:ring-green-500 focus:border-green-500'
                  }`}
                  placeholder={product.type === 'wanted' 
                    ? "예: 동일한 제품을 가지고 있습니다. 상태 양호하며 희망가격 대로 판매 가능합니다. 010-xxxx-xxxx로 연락주세요."
                    : "예: 새로 이사를 와서 조명이 없어 공부할 때 불편합니다. 정말 필요해서 신청합니다..."
                  }
                />
              </div>

              <div className="flex gap-2">
                <button
                  onClick={() => {
                    setShowShareRequestModal(false)
                    setShareRequestReason('')
                  }}
                  className="flex-1 bg-gray-300 text-gray-700 py-2 px-4 rounded-md hover:bg-gray-400"
                >
                  취소
                </button>
                <button
                  onClick={handleShareRequest}
                  className={`flex-1 text-white py-2 px-4 rounded-md ${
                    product.type === 'wanted'
                      ? 'bg-orange-600 hover:bg-orange-700'
                      : 'bg-green-600 hover:bg-green-700'
                  }`}
                >
                  {product.type === 'wanted' ? '제안하기' : '신청하기'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
} 