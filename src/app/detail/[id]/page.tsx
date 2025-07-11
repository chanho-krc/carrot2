'use client'

import React, { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { FiArrowLeft, FiPhone, FiUser, FiCalendar, FiEdit3, FiTrash2, FiEye } from 'react-icons/fi'
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
  const router = useRouter()
  const params = useParams()

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
  }, [router, params.id])

  const fetchProduct = async (productId: string) => {
    try {
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .eq('id', productId)
        .single()

      if (error) {
        setError('상품을 찾을 수 없습니다.')
        console.error('Error fetching product:', error)
      } else {
        setProduct(data)
        setSelectedStatus(data.status)
        
        // 조회수 증가 (비동기로 실행하여 페이지 로딩 속도에 영향 주지 않음)
        incrementViewCount(productId)
      }
    } catch (error) {
      setError('상품을 불러오는 중 오류가 발생했습니다.')
      console.error('Error fetching product:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const incrementViewCount = async (productId: string) => {
    try {
      const { error } = await supabase.rpc('increment_view_count', {
        product_id: productId
      })

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
    } catch (error) {
      setError('상태 변경 중 오류가 발생했습니다.')
      console.error('Error updating product status:', error)
    }
  }

  const handleDeleteProduct = async () => {
    if (!product) return

    const confirmed = window.confirm('정말로 이 상품을 삭제하시겠습니까?')
    if (!confirmed) return

    try {
      const { error } = await supabase
        .from('products')
        .delete()
        .eq('id', product.id)

      if (error) {
        throw error
      }

      router.push('/')
    } catch (error) {
      setError('상품 삭제 중 오류가 발생했습니다.')
      console.error('Error deleting product:', error)
    }
  }

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('ko-KR').format(price)
  }

  const getStatusText = (status: string) => {
    switch (status) {
      case 'selling':
        return '판매중'
      case 'reserved':
        return '예약됨'
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
    if (!product || product.status !== 'selling') return

    const confirmed = window.confirm('이 상품을 예약하시겠습니까?')
    if (!confirmed) return

    await handleStatusChange('reserved')
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

        {/* 이미지 갤러리 */}
        <div className="mb-6">
          {product.images && product.images.length > 0 ? (
            <div className="space-y-4">
              {/* 메인 이미지 */}
              <div className="w-full h-80 bg-gray-100 rounded-lg overflow-hidden cursor-pointer" onClick={() => setShowImageModal(true)}>
                <img
                  src={product.images[currentImageIndex]}
                  alt={product.title}
                  className="w-full h-full object-contain hover:scale-105 transition-transform"
                />
              </div>
              
              {/* 썸네일 이미지 */}
              {product.images.length > 1 && (
                <div className="flex gap-3 overflow-x-auto">
                  {product.images.map((image, index) => (
                    <button
                      key={index}
                      onClick={() => setCurrentImageIndex(index)}
                      className={`flex-shrink-0 w-24 h-16 rounded-lg overflow-hidden border-2 ${
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
          ) : (
            <div className="w-full h-80 bg-gray-100 rounded-lg flex items-center justify-center">
              <span className="text-8xl text-gray-400">📦</span>
            </div>
          )}
        </div>

        {/* 상품 정보 */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-2xl font-bold text-gray-900">{product.title}</h1>
            <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(product.status)}`}>
              {getStatusText(product.status)}
            </span>
          </div>
          
          <p className="text-3xl font-bold text-blue-600 mb-4">{formatPrice(product.price)}원</p>
          
          <div className="space-y-4">
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">상품 설명</h3>
              <p className="text-gray-700 whitespace-pre-wrap">{product.description}</p>
            </div>

            {product.usage_period && (
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">사용 기간</h3>
                <p className="text-gray-700">{product.usage_period}</p>
              </div>
            )}

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

        {/* 구매 버튼 */}
        {!canManageProduct() && product.status === 'selling' && (
          <button
            onClick={handleReserveProduct}
            className="w-full bg-blue-600 text-white py-3 px-4 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
          >
            예약하기
          </button>
        )}

        {/* 상태 변경 모달 */}
        {showStatusModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
              <h3 className="text-lg font-semibold mb-4">상품 상태 변경</h3>
              <div className="space-y-2 mb-6">
                <label className="flex items-center">
                  <input
                    type="radio"
                    name="status"
                    value="selling"
                    checked={selectedStatus === 'selling'}
                    onChange={(e) => setSelectedStatus(e.target.value as ProductStatus)}
                    className="mr-2"
                  />
                  판매중
                </label>
                <label className="flex items-center">
                  <input
                    type="radio"
                    name="status"
                    value="reserved"
                    checked={selectedStatus === 'reserved'}
                    onChange={(e) => setSelectedStatus(e.target.value as ProductStatus)}
                    className="mr-2"
                  />
                  예약됨
                </label>
                <label className="flex items-center">
                  <input
                    type="radio"
                    name="status"
                    value="sold"
                    checked={selectedStatus === 'sold'}
                    onChange={(e) => setSelectedStatus(e.target.value as ProductStatus)}
                    className="mr-2"
                  />
                  거래완료
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
            <div className="relative w-full h-full max-w-4xl max-h-4xl m-4 flex items-center justify-center">
              <img
                src={product.images[currentImageIndex]}
                alt={product.title}
                className="max-w-full max-h-full object-contain"
                onClick={(e) => e.stopPropagation()}
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
      </div>
    </div>
  )
} 