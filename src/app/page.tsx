'use client'

import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { FiSearch, FiFilter, FiEye } from 'react-icons/fi'
import { getAuthFromStorage } from '@/lib/auth'
import { Product, AuthState } from '@/types'
import { supabase } from '@/lib/supabase'

export default function HomePage() {
  const [auth, setAuth] = useState<AuthState>({ user: null, isAdmin: false, isLoading: true })
  const [products, setProducts] = useState<Product[]>([])
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([])
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState<'all' | 'selling' | 'reserved' | 'sold'>('all')
  const [typeFilter, setTypeFilter] = useState<'all' | 'sale' | 'share' | 'wanted'>('all')
  const [categoryFilter, setCategoryFilter] = useState<string>('all')
  const [isLoading, setIsLoading] = useState(true)
  const [showQR, setShowQR] = useState(false)
  const router = useRouter()

  useEffect(() => {
    const authState = getAuthFromStorage()
    setAuth(authState)
    
    // 로그인되지 않은 경우 로그인 페이지로 리다이렉트
    if (!authState.user && !authState.isAdmin) {
      router.push('/login')
      return
    }
    
    fetchProducts()
  }, [router])

  useEffect(() => {
    // 검색 및 필터 적용
    let filtered = products

    if (searchTerm) {
      filtered = filtered.filter(product => 
        product.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        product.description.toLowerCase().includes(searchTerm.toLowerCase())
      )
    }

    if (statusFilter !== 'all') {
      filtered = filtered.filter(product => product.status === statusFilter)
    }

    if (typeFilter !== 'all') {
      filtered = filtered.filter(product => product.type === typeFilter)
    }

    if (categoryFilter !== 'all') {
      filtered = filtered.filter(product => product.category === categoryFilter)
    }

    setFilteredProducts(filtered)
  }, [products, searchTerm, statusFilter, typeFilter, categoryFilter])

  // 카테고리 목록 추출
  const categories = ['all', ...Array.from(new Set(products.map(p => p.category)))]

  const fetchProducts = async () => {
    try {
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .order('created_at', { ascending: false })

      if (error) {
        console.error('Error fetching products:', error)
      } else {
        setProducts(data || [])
      }
    } catch (error) {
      console.error('Error fetching products:', error)
    } finally {
      setIsLoading(false)
    }
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

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('ko-KR').format(price)
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

  return (
    <div className="px-4 py-6">
      {/* QR 코드 섹션 */}
      <div className="mb-6 p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg border border-blue-200">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold text-blue-800 mb-1">📱 모바일로 접속하기</h3>
            <p className="text-sm text-blue-600">QR 코드를 스캔하여 핸드폰에서 쉽게 접속하세요</p>
          </div>
          <button
            onClick={() => setShowQR(!showQR)}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
          >
            {showQR ? 'QR 닫기' : 'QR 보기'}
          </button>
        </div>
        {showQR && (
          <div className="mt-4 text-center">
            <img 
              src="/carrot2_qrcode.png" 
              alt="QR 코드"
              className="mx-auto w-32 h-32 border-2 border-white rounded-lg shadow-md"
            />
            <p className="text-xs text-blue-600 mt-2">QR 코드를 스캔하면 바로 접속됩니다</p>
          </div>
        )}
      </div>

      {/* 검색 및 필터 */}
      <div className="space-y-4 mb-6">
        {/* 검색바 */}
        <div className="relative">
          <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
          <input
            type="text"
            placeholder="상품명, 설명 검색..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>

        {/* 상태 필터 */}
        <div className="flex items-center gap-2 overflow-x-auto">
          <FiFilter className="text-gray-400 flex-shrink-0" size={18} />
          <div className="flex gap-2">
            <button
              onClick={() => setStatusFilter('all')}
              className={`px-3 py-1 rounded-full text-sm font-medium whitespace-nowrap ${
                statusFilter === 'all' 
                  ? 'bg-blue-600 text-white' 
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              전체
            </button>
            <button
              onClick={() => setStatusFilter('selling')}
              className={`px-3 py-1 rounded-full text-sm font-medium whitespace-nowrap ${
                statusFilter === 'selling' 
                  ? 'bg-green-600 text-white' 
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              판매중
            </button>
            <button
              onClick={() => setStatusFilter('reserved')}
              className={`px-3 py-1 rounded-full text-sm font-medium whitespace-nowrap ${
                statusFilter === 'reserved' 
                  ? 'bg-yellow-600 text-white' 
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              예약됨
            </button>
            <button
              onClick={() => setStatusFilter('sold')}
              className={`px-3 py-1 rounded-full text-sm font-medium whitespace-nowrap ${
                statusFilter === 'sold' 
                  ? 'bg-gray-600 text-white' 
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              거래완료
            </button>
          </div>
        </div>

        {/* 판매/나눔/구하기 타입 필터 */}
        <div className="flex items-center gap-2 overflow-x-auto">
          <span className="text-gray-600 text-sm flex-shrink-0">타입:</span>
          <div className="flex gap-2">
            <button
              onClick={() => setTypeFilter('all')}
              className={`px-3 py-1 rounded-full text-sm font-medium whitespace-nowrap ${
                typeFilter === 'all' 
                  ? 'bg-purple-600 text-white' 
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              전체
            </button>
            <button
              onClick={() => setTypeFilter('sale')}
              className={`px-3 py-1 rounded-full text-sm font-medium whitespace-nowrap ${
                typeFilter === 'sale' 
                  ? 'bg-blue-600 text-white' 
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              💰 판매
            </button>
            <button
              onClick={() => setTypeFilter('share')}
              className={`px-3 py-1 rounded-full text-sm font-medium whitespace-nowrap ${
                typeFilter === 'share' 
                  ? 'bg-green-600 text-white' 
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              💝 나눔
            </button>
            <button
              onClick={() => setTypeFilter('wanted')}
              className={`px-3 py-1 rounded-full text-sm font-medium whitespace-nowrap ${
                typeFilter === 'wanted' 
                  ? 'bg-orange-600 text-white' 
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              🔍 구하기
            </button>
          </div>
        </div>

        {/* 카테고리 필터 */}
        <div className="flex items-center gap-2">
          <span className="text-gray-600 text-sm flex-shrink-0">카테고리:</span>
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500 bg-white min-w-32"
          >
            {categories.map(category => (
              <option key={category} value={category}>
                {category === 'all' ? '전체 카테고리' : category}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* 상품 목록 */}
      {filteredProducts.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-gray-500 mb-4">
            {searchTerm || statusFilter !== 'all' ? '검색 결과가 없습니다.' : '등록된 상품이 없습니다.'}
          </p>
          <Link
            href="/upload"
            className="inline-block bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors"
          >
            첫 상품 등록하기
          </Link>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredProducts.map((product) => (
            <Link
              key={product.id}
              href={`/detail/${product.id}`}
              className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden hover:shadow-md transition-shadow block"
            >
              <div className="flex">
                {/* 상품 이미지 */}
                <div className="w-32 h-24 bg-gray-100 relative flex-shrink-0 rounded-l-lg overflow-hidden">
                  {product.images && product.images.length > 0 ? (
                    <img
                      src={product.images[0]}
                      alt={product.title}
                      className="w-full h-full object-contain"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-gray-400">
                      <span className="text-2xl">📦</span>
                    </div>
                  )}
                  {/* 상태 배지 */}
                  <div className="absolute top-1 right-1">
                    <span className={`px-1.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(product.status)}`}>
                      {getStatusText(product.status, product.type)}
                    </span>
                  </div>
                </div>

                {/* 상품 정보 */}
                <div className="flex-1 p-4 flex flex-col justify-between">
                  <div>
                    <div className="flex items-start justify-between mb-1">
                      <h3 className="font-semibold text-gray-900 line-clamp-1 flex-1">{product.title}</h3>
                      <div className="flex gap-1 ml-2">
                        {/* 판매/나눔/구하기 타입 배지 */}
                        <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                          product.type === 'share' 
                            ? 'bg-green-100 text-green-700' 
                            : product.type === 'wanted'
                            ? 'bg-orange-100 text-orange-700'
                            : 'bg-blue-100 text-blue-700'
                        }`}>
                          {product.type === 'share' ? '💝 나눔' : product.type === 'wanted' ? '🔍 구하기' : '💰 판매'}
                        </span>
                      </div>
                    </div>
                    
                    {/* 가격 표시 */}
                    <p className={`text-lg font-bold mb-1 ${
                      product.type === 'share' ? 'text-green-600' : product.type === 'wanted' ? 'text-orange-600' : 'text-blue-600'
                    }`}>
                      {product.type === 'share' ? '나눔' : product.type === 'wanted' ? `희망 ${formatPrice(product.price)}원` : `${formatPrice(product.price)}원`}
                    </p>

                    {/* 카테고리 표시 */}
                    <p className="text-xs text-gray-500 mb-2">📂 {product.category}</p>
                    
                    <p className="text-sm text-gray-600 line-clamp-2">{product.description}</p>
                  </div>
                  <div className="flex items-center justify-between text-xs text-gray-500 mt-2">
                    <div className="flex items-center gap-2">
                      <span>{product.seller_name}</span>
                      <span className="flex items-center gap-1 bg-gray-100 px-2 py-1 rounded-full">
                        <FiEye size={12} />
                        <span className="font-medium">{product.view_count || 0}</span>
                      </span>
                    </div>
                    <span>{new Date(product.created_at).toLocaleDateString()}</span>
                  </div>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
