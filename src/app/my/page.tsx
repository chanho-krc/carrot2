'use client'

import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { FiEdit3, FiTrash2, FiEye, FiUser, FiCalendar } from 'react-icons/fi'
import { getAuthFromStorage } from '@/lib/auth'
import { supabase } from '@/lib/supabase'
import { Product, AuthState, ProductStatus } from '@/types'

export default function MyProductsPage() {
  const [auth, setAuth] = useState<AuthState>({ user: null, isAdmin: false, isLoading: true })
  const [products, setProducts] = useState<Product[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')
  const [showStatusModal, setShowStatusModal] = useState(false)
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null)
  const [selectedStatus, setSelectedStatus] = useState<ProductStatus>('selling')
  const router = useRouter()

  useEffect(() => {
    const authState = getAuthFromStorage()
    setAuth(authState)
    
    // 로그인되지 않은 경우 로그인 페이지로 리다이렉트
    if (!authState.user && !authState.isAdmin) {
      router.push('/login')
      return
    }
    
    fetchMyProducts(authState)
  }, [router])

  const fetchMyProducts = async (authState: AuthState) => {
    try {
      let query = supabase
        .from('products')
        .select('*')
        .order('created_at', { ascending: false })

      // 관리자가 아닌 경우 본인의 상품만 조회
      if (!authState.isAdmin && authState.user) {
        query = query.eq('seller_id', authState.user.id)
      }

      const { data, error } = await query

      if (error) {
        setError('상품을 불러오는 중 오류가 발생했습니다.')
        console.error('Error fetching products:', error)
      } else {
        setProducts(data || [])
      }
    } catch (error) {
      setError('상품을 불러오는 중 오류가 발생했습니다.')
      console.error('Error fetching products:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleStatusChange = async (product: Product, newStatus: ProductStatus) => {
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

      // 상품 목록에서 해당 상품 상태 업데이트
      setProducts(prevProducts =>
        prevProducts.map(p =>
          p.id === product.id ? { ...p, status: newStatus } : p
        )
      )
      
      setShowStatusModal(false)
      setSelectedProduct(null)
    } catch (error) {
      setError('상태 변경 중 오류가 발생했습니다.')
      console.error('Error updating product status:', error)
    }
  }

  const handleDeleteProduct = async (product: Product) => {
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

      // 상품 목록에서 해당 상품 제거
      setProducts(prevProducts =>
        prevProducts.filter(p => p.id !== product.id)
      )
    } catch (error) {
      setError('상품 삭제 중 오류가 발생했습니다.')
      console.error('Error deleting product:', error)
    }
  }

  const openStatusModal = (product: Product) => {
    setSelectedProduct(product)
    setSelectedStatus(product.status)
    setShowStatusModal(true)
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

  const getStatusStats = () => {
    const stats = {
      total: products.length,
      selling: products.filter(p => p.status === 'selling').length,
      reserved: products.filter(p => p.status === 'reserved').length,
      sold: products.filter(p => p.status === 'sold').length
    }
    return stats
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

  const stats = getStatusStats()

  return (
    <div className="px-4 py-6">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-2xl font-bold text-gray-900 mb-6">
          {auth.isAdmin ? '전체 상품 관리' : '내 상품 관리'}
        </h1>

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-md p-4 mb-6">
            <div className="text-sm text-red-700">{error}</div>
          </div>
        )}

        {/* 통계 카드 */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 text-center">
            <div className="text-2xl font-bold text-gray-900">{stats.total}</div>
            <div className="text-sm text-gray-600">전체</div>
          </div>
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 text-center">
            <div className="text-2xl font-bold text-green-600">{stats.selling}</div>
            <div className="text-sm text-gray-600">판매중</div>
          </div>
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 text-center">
            <div className="text-2xl font-bold text-yellow-600">{stats.reserved}</div>
            <div className="text-sm text-gray-600">예약됨</div>
          </div>
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 text-center">
            <div className="text-2xl font-bold text-gray-600">{stats.sold}</div>
            <div className="text-sm text-gray-600">거래완료</div>
          </div>
        </div>

        {/* 상품 목록 */}
        {products.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-500 mb-4">등록된 상품이 없습니다.</p>
            <Link
              href="/upload"
              className="inline-block bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors"
            >
              첫 상품 등록하기
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {products.map((product) => (
              <div key={product.id} className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
                <div className="flex items-start gap-4">
                  {/* 상품 이미지 */}
                  <div className="flex-shrink-0">
                    <div className="w-20 h-20 bg-gray-100 rounded-lg overflow-hidden">
                      {product.images && product.images.length > 0 ? (
                        <img
                          src={product.images[0]}
                          alt={product.title}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-gray-400">
                          <span className="text-2xl">📦</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* 상품 정보 */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="text-lg font-semibold text-gray-900 truncate">
                        {product.title}
                      </h3>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(product.status)}`}>
                        {getStatusText(product.status)}
                      </span>
                    </div>
                    <p className="text-lg font-bold text-blue-600 mb-2">
                      {formatPrice(product.price)}원
                    </p>
                    <p className="text-sm text-gray-600 mb-2 line-clamp-2">
                      {product.description}
                    </p>
                    <div className="flex items-center justify-between text-xs text-gray-500 mb-3">
                      <div className="flex items-center gap-2">
                        <FiUser size={12} />
                        <span>{product.seller_name}</span>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="flex items-center gap-1">
                          <FiEye size={12} />
                          {product.view_count || 0}
                        </span>
                        <span className="flex items-center gap-1">
                          <FiCalendar size={12} />
                          {new Date(product.created_at).toLocaleDateString()}
                        </span>
                      </div>
                    </div>

                    {/* 액션 버튼 */}
                    <div className="flex items-center gap-2">
                      <Link
                        href={`/detail/${product.id}`}
                        className="flex items-center gap-1 bg-gray-100 text-gray-700 px-3 py-1 rounded-md hover:bg-gray-200 text-sm"
                      >
                        <FiEye size={14} />
                        보기
                      </Link>
                      <button
                        onClick={() => openStatusModal(product)}
                        className="flex items-center gap-1 bg-blue-600 text-white px-3 py-1 rounded-md hover:bg-blue-700 text-sm"
                      >
                        <FiEdit3 size={14} />
                        상태변경
                      </button>
                      <button
                        onClick={() => handleDeleteProduct(product)}
                        className="flex items-center gap-1 bg-red-600 text-white px-3 py-1 rounded-md hover:bg-red-700 text-sm"
                      >
                        <FiTrash2 size={14} />
                        삭제
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* 상태 변경 모달 */}
        {showStatusModal && selectedProduct && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
              <h3 className="text-lg font-semibold mb-4">상품 상태 변경</h3>
              <div className="mb-4">
                <p className="text-sm text-gray-600 mb-2">상품: {selectedProduct.title}</p>
                <p className="text-sm text-gray-600">현재 상태: {getStatusText(selectedProduct.status)}</p>
              </div>
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
                  onClick={() => handleStatusChange(selectedProduct, selectedStatus)}
                  className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700"
                >
                  변경
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
} 