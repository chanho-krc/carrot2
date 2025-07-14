'use client'

import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { FiUsers, FiPackage, FiBarChart, FiEye, FiEdit3, FiTrash2, FiUser, FiCalendar } from 'react-icons/fi'
import { getAuthFromStorage } from '@/lib/auth'
import { Product, User, AuthState, ProductStatus } from '@/types'
import { supabase } from '@/lib/supabase'

export default function AdminDashboard() {
  const [auth, setAuth] = useState<AuthState>({ user: null, isAdmin: false, isLoading: true })
  const [products, setProducts] = useState<Product[]>([])
  const [users, setUsers] = useState<User[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')
  const [showStatusModal, setShowStatusModal] = useState(false)
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null)
  const [selectedStatus, setSelectedStatus] = useState<ProductStatus>('selling')
  const [activeTab, setActiveTab] = useState<'overview' | 'products' | 'users'>('overview')
  const router = useRouter()

  useEffect(() => {
    const authState = getAuthFromStorage()
    setAuth(authState)
    
    // 관리자가 아닌 경우 홈으로 리다이렉트
    if (!authState.isAdmin) {
      router.push('/')
      return
    }
    
    fetchData()
  }, [router])

  const fetchData = async () => {
    try {
      // 상품 데이터 가져오기
      const { data: productsData, error: productsError } = await supabase
        .from('products')
        .select('*')
        .order('created_at', { ascending: false })
      
      if (productsError) {
        throw productsError
      }

      // 사용자 데이터 가져오기
      const { data: usersData, error: usersError } = await supabase
        .from('users')
        .select('*')
        .order('created_at', { ascending: false })

      if (usersError) {
        throw usersError
      }

      setProducts(productsData || [])
      setUsers(usersData || [])
    } catch (error) {
      setError('데이터를 불러오는 중 오류가 발생했습니다.')
      console.error('Error fetching data:', error)
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
      alert(`"${product.title}" 상품 상태가 "${getStatusText(newStatus)}"로 변경되었습니다.`)
    } catch (error) {
      setError('상태 변경 중 오류가 발생했습니다.')
      console.error('Error updating product status:', error)
    }
  }

  const handleDeleteProduct = async (product: Product) => {
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

      // 상품 목록에서 해당 상품 제거
      setProducts(prevProducts =>
        prevProducts.filter(p => p.id !== product.id)
      )
      
      alert(`"${product.title}" 상품이 성공적으로 삭제되었습니다.`)
    } catch (error) {
      setError('상품 삭제 중 오류가 발생했습니다.')
      console.error('Error deleting product:', error)
    } finally {
      setIsLoading(false)
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

  const getStats = () => {
    const productStats = {
      total: products.length,
      selling: products.filter(p => p.status === 'selling').length,
      reserved: products.filter(p => p.status === 'reserved').length,
      sold: products.filter(p => p.status === 'sold').length
    }

    const userStats = {
      total: users.length,
      thisMonth: users.filter(u => {
        const created = new Date(u.created_at)
        const now = new Date()
        return created.getMonth() === now.getMonth() && created.getFullYear() === now.getFullYear()
      }).length
    }

    return { productStats, userStats }
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

  const { productStats, userStats } = getStats()

  return (
    <div className="px-4 py-6">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-2xl font-bold text-gray-900 mb-6">관리자 대시보드</h1>

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-md p-4 mb-6">
            <div className="text-sm text-red-700">{error}</div>
          </div>
        )}

        {/* 탭 메뉴 */}
        <div className="flex space-x-1 mb-6 bg-gray-100 rounded-lg p-1">
          <button
            onClick={() => setActiveTab('overview')}
            className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-colors ${
              activeTab === 'overview'
                ? 'bg-white text-blue-600 shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            <FiBarChart size={16} />
            개요
          </button>
          <button
            onClick={() => setActiveTab('products')}
            className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-colors ${
              activeTab === 'products'
                ? 'bg-white text-blue-600 shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            <FiPackage size={16} />
            상품 관리
          </button>
          <button
            onClick={() => setActiveTab('users')}
            className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-colors ${
              activeTab === 'users'
                ? 'bg-white text-blue-600 shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            <FiUsers size={16} />
            사용자 관리
          </button>
        </div>

        {/* 개요 탭 */}
        {activeTab === 'overview' && (
          <div className="space-y-6">
            {/* 상품 통계 */}
            <div>
              <h2 className="text-lg font-semibold text-gray-900 mb-4">상품 통계</h2>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 text-center">
                  <div className="text-2xl font-bold text-gray-900">{productStats.total}</div>
                  <div className="text-sm text-gray-600">전체 상품</div>
                </div>
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 text-center">
                  <div className="text-2xl font-bold text-green-600">{productStats.selling}</div>
                  <div className="text-sm text-gray-600">판매중</div>
                </div>
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 text-center">
                  <div className="text-2xl font-bold text-yellow-600">{productStats.reserved}</div>
                  <div className="text-sm text-gray-600">예약됨</div>
                </div>
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 text-center">
                  <div className="text-2xl font-bold text-gray-600">{productStats.sold}</div>
                  <div className="text-sm text-gray-600">거래완료</div>
                </div>
              </div>
            </div>

            {/* 사용자 통계 */}
            <div>
              <h2 className="text-lg font-semibold text-gray-900 mb-4">사용자 통계</h2>
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 text-center">
                  <div className="text-2xl font-bold text-blue-600">{userStats.total}</div>
                  <div className="text-sm text-gray-600">전체 사용자</div>
                </div>
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 text-center">
                  <div className="text-2xl font-bold text-purple-600">{userStats.thisMonth}</div>
                  <div className="text-sm text-gray-600">이번 달 신규</div>
                </div>
              </div>
            </div>

            {/* 최근 상품 */}
            <div>
              <h2 className="text-lg font-semibold text-gray-900 mb-4">최근 등록된 상품</h2>
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
                {products.slice(0, 5).map((product, index) => (
                  <div key={product.id} className={`p-4 flex items-center justify-between ${index !== 4 ? 'border-b' : ''}`}>
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 bg-gray-100 rounded-lg overflow-hidden">
                        {product.images && product.images.length > 0 ? (
                          <img
                            src={product.images[0]}
                            alt={product.title}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-gray-400">
                            <span className="text-lg">📦</span>
                          </div>
                        )}
                      </div>
                      <div>
                        <h3 className="font-medium text-gray-900">{product.title}</h3>
                        <p className="text-sm text-gray-600">{product.seller_name}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold text-gray-900">{formatPrice(product.price)}원</p>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(product.status)}`}>
                        {getStatusText(product.status)}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* 상품 관리 탭 */}
        {activeTab === 'products' && (
          <div>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-semibold text-gray-900">상품 관리</h2>
              <Link
                href="/upload"
                className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
              >
                상품 등록
              </Link>
            </div>
            
            <div className="space-y-4">
              {products.map((product) => (
                <div key={product.id} className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
                  <div className="flex items-start gap-4">
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
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-2">
                        <h3 className="text-lg font-semibold text-gray-900">{product.title}</h3>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(product.status)}`}>
                          {getStatusText(product.status)}
                        </span>
                      </div>
                      <p className="text-lg font-bold text-blue-600 mb-2">{formatPrice(product.price)}원</p>
                      <p className="text-sm text-gray-600 mb-2">{product.description}</p>
                      <div className="flex items-center justify-between text-xs text-gray-500 mb-3">
                        <div className="flex items-center gap-2">
                          <FiUser size={12} />
                          <span>판매자: {product.seller_name}</span>
                        </div>
                        <div className="flex items-center gap-3">
                          <span className="flex items-center gap-1">
                            <FiEye size={12} />
                            조회수 {product.view_count || 0}
                          </span>
                          <span className="flex items-center gap-1">
                            <FiCalendar size={12} />
                            {new Date(product.created_at).toLocaleDateString()}
                          </span>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Link
                          href={`/detail/${product.id}`}
                          className="flex items-center gap-1 bg-gray-100 text-gray-700 px-3 py-1 rounded-md hover:bg-gray-200 text-sm"
                        >
                          <FiEye size={14} />
                          보기
                        </Link>
                        <Link
                          href={`/edit/${product.id}`}
                          className="flex items-center gap-1 bg-green-600 text-white px-3 py-1 rounded-md hover:bg-green-700 text-sm"
                        >
                          <FiEdit3 size={14} />
                          수정
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
          </div>
        )}

        {/* 사용자 관리 탭 */}
        {activeTab === 'users' && (
          <div>
            <h2 className="text-lg font-semibold text-gray-900 mb-6">사용자 관리</h2>
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        이름
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        전화번호
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        가입일
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        등록 상품 수
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {users.map((user) => {
                      const userProductCount = products.filter(p => p.seller_id === user.id).length
                      return (
                        <tr key={user.id}>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                            {user.name}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {user.phone}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {new Date(user.created_at).toLocaleDateString()}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {userProductCount}개
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            </div>
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