'use client'

import React, { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { FiArrowLeft, FiCamera, FiX, FiUpload } from 'react-icons/fi'
import { getAuthFromStorage } from '@/lib/auth'
import { supabase } from '@/lib/supabase'
import { AuthState, Product } from '@/types'
import { v4 as uuidv4 } from 'uuid'

// 카테고리 목록
const CATEGORIES = [
  '휴대폰/태블릿',
  '노트북/PC',
  '모니터/주변기기',
  '가구/인테리어',
  '유아용품',
  '의류/잡화',
  '생활용품',
  '스포츠/레저',
  '도서/문구',
  '기타'
]

export default function EditProductPage() {
  const [auth, setAuth] = useState<AuthState>({ user: null, isAdmin: false, isLoading: true })
  const [product, setProduct] = useState<Product | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const router = useRouter()
  const params = useParams()

  // 폼 상태
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    price: '',
    originalPrice: '',
    usagePeriod: '',
    contact: '',
    sellerName: '',
    type: 'sale' as 'sale' | 'share',
    category: ''
  })

  // 이미지 상태
  const [selectedImages, setSelectedImages] = useState<File[]>([])
  const [previewUrls, setPreviewUrls] = useState<string[]>([])
  const [existingImages, setExistingImages] = useState<string[]>([])

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

      if (error || !data) {
        setError('상품을 찾을 수 없습니다.')
        return
      }

      setProduct(data)
      setExistingImages(data.images || [])
      
      // 폼 데이터 설정
      setFormData({
        title: data.title || '',
        description: data.description || '',
        price: data.price?.toString() || '',
        originalPrice: data.original_price?.toString() || '',
        usagePeriod: data.usage_period || '',
        contact: data.contact || '',
        sellerName: data.seller_name || '',
        type: data.type || 'sale',
        category: data.category || ''
      })

      // 수정 권한 확인
      const authState = getAuthFromStorage()
      if (!authState.isAdmin && (!authState.user || authState.user.id !== data.seller_id)) {
        setError('이 상품을 수정할 권한이 없습니다.')
        return
      }

    } catch (error) {
      setError('상품을 불러오는 중 오류가 발생했습니다.')
      console.error('Error fetching product:', error)
    }
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
  }

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || [])
    
    if (files.length + selectedImages.length + existingImages.length > 10) {
      setError('이미지는 최대 10개까지 업로드할 수 있습니다.')
      return
    }

    setSelectedImages(prev => [...prev, ...files])
    
    // 미리보기 URL 생성
    const newPreviewUrls = files.map(file => URL.createObjectURL(file))
    setPreviewUrls(prev => [...prev, ...newPreviewUrls])
  }

  const removeNewImage = (index: number) => {
    setSelectedImages(prev => prev.filter((_, i) => i !== index))
    
    // 미리보기 URL 해제
    if (previewUrls[index]) {
      URL.revokeObjectURL(previewUrls[index])
    }
    setPreviewUrls(prev => prev.filter((_, i) => i !== index))
  }

  const removeExistingImage = (index: number) => {
    setExistingImages(prev => prev.filter((_, i) => i !== index))
  }

  const uploadImages = async (): Promise<string[]> => {
    if (selectedImages.length === 0) return []

    const uploadPromises = selectedImages.map(async (file) => {
      const fileExt = file.name.split('.').pop()
      const fileName = `${uuidv4()}.${fileExt}`
      const filePath = `product-images/${fileName}`

      const { error } = await supabase.storage
        .from('images')
        .upload(filePath, file)

      if (error) {
        throw error
      }

      // 공개 URL 가져오기
      const { data: publicUrlData } = supabase.storage
        .from('images')
        .getPublicUrl(filePath)

      return publicUrlData.publicUrl
    })

    return Promise.all(uploadPromises)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError('')
    setSuccess('')

    if (!product) {
      setError('상품 정보를 불러올 수 없습니다.')
      setIsLoading(false)
      return
    }

    // 유효성 검사
    if (!formData.title.trim()) {
      setError('제목을 입력해주세요.')
      setIsLoading(false)
      return
    }

    if (!formData.description.trim()) {
      setError('설명을 입력해주세요.')
      setIsLoading(false)
      return
    }

    if (!formData.category) {
      setError('카테고리를 선택해주세요.')
      setIsLoading(false)
      return
    }

    // 판매의 경우에만 가격 유효성 검사
    if (formData.type === 'sale' && (!formData.price || parseFloat(formData.price) <= 0)) {
      setError('올바른 판매 가격을 입력해주세요.')
      setIsLoading(false)
      return
    }

    if (!formData.contact.trim()) {
      setError('연락처를 입력해주세요.')
      setIsLoading(false)
      return
    }

    if (!formData.sellerName.trim()) {
      setError('판매자 이름을 입력해주세요.')
      setIsLoading(false)
      return
    }

    try {
      // 새로운 이미지 업로드
      const newImageUrls = await uploadImages()
      
      // 기존 이미지와 새 이미지 합치기
      const allImages = [...existingImages, ...newImageUrls]

      // 상품 데이터 업데이트
      const { error } = await supabase
        .from('products')
        .update({
          title: formData.title,
          description: formData.description,
          price: formData.type === 'share' ? 0 : parseFloat(formData.price),
          original_price: formData.originalPrice ? parseFloat(formData.originalPrice) : undefined,
          usage_period: formData.usagePeriod,
          contact: formData.contact,
          seller_name: formData.sellerName,
          type: formData.type,
          category: formData.category,
          images: allImages,
          updated_at: new Date().toISOString()
        })
        .eq('id', product.id)

      if (error) {
        throw error
      }

      setSuccess('상품이 성공적으로 수정되었습니다!')
      
      // 2초 후 상품 상세 페이지로 리다이렉트
      setTimeout(() => {
        router.push(`/detail/${product.id}`)
      }, 2000)

    } catch (error) {
      console.error('Error updating product:', error)
      setError('상품 수정 중 오류가 발생했습니다.')
    } finally {
      setIsLoading(false)
    }
  }

  if (auth.isLoading) {
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
          <h1 className="text-2xl font-bold text-gray-900">상품 수정</h1>
        </div>

        {/* 에러 메시지 */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-md p-4 mb-6">
            <div className="text-sm text-red-700">{error}</div>
          </div>
        )}

        {/* 성공 메시지 */}
        {success && (
          <div className="bg-green-50 border border-green-200 rounded-md p-4 mb-6">
            <div className="text-sm text-green-700">{success}</div>
          </div>
        )}

        {/* 상품 수정 폼 */}
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* 제목 */}
          <div>
            <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-2">
              제목 *
            </label>
            <input
              type="text"
              id="title"
              name="title"
              value={formData.title}
              onChange={handleInputChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="상품 제목을 입력하세요"
              disabled={isLoading}
              required
            />
          </div>

          {/* 판매/나눔 선택 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              거래 유형 *
            </label>
            <div className="flex gap-4">
              <label className="flex items-center">
                <input
                  type="radio"
                  name="type"
                  value="sale"
                  checked={formData.type === 'sale'}
                  onChange={handleInputChange}
                  className="mr-2"
                  disabled={isLoading}
                />
                <span className="text-sm">💰 판매</span>
              </label>
              <label className="flex items-center">
                <input
                  type="radio"
                  name="type"
                  value="share"
                  checked={formData.type === 'share'}
                  onChange={handleInputChange}
                  className="mr-2"
                  disabled={isLoading}
                />
                <span className="text-sm">💝 나눔</span>
              </label>
            </div>
          </div>

          {/* 카테고리 선택 */}
          <div>
            <label htmlFor="category" className="block text-sm font-medium text-gray-700 mb-2">
              카테고리 *
            </label>
            <select
              id="category"
              name="category"
              value={formData.category}
              onChange={handleInputChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              disabled={isLoading}
              required
            >
              <option value="">카테고리를 선택하세요</option>
              {CATEGORIES.map(category => (
                <option key={category} value={category}>
                  {category}
                </option>
              ))}
            </select>
          </div>

          {/* 설명 */}
          <div>
            <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-2">
              설명 *
            </label>
            <textarea
              id="description"
              name="description"
              value={formData.description}
              onChange={handleInputChange}
              rows={4}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="상품에 대한 자세한 설명을 입력하세요"
              disabled={isLoading}
              required
            />
          </div>

          {/* 가격 - 판매일 때만 표시 */}
          {formData.type === 'sale' && (
            <>
              <div>
                <label htmlFor="price" className="block text-sm font-medium text-gray-700 mb-2">
                  판매 가격 (원) *
                </label>
                <input
                  type="number"
                  id="price"
                  name="price"
                  value={formData.price}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="0"
                  min="0"
                  disabled={isLoading}
                  required
                />
              </div>

              <div>
                <label htmlFor="originalPrice" className="block text-sm font-medium text-gray-700 mb-2">
                  구매시 가격 (원)
                </label>
                <input
                  type="number"
                  id="originalPrice"
                  name="originalPrice"
                  value={formData.originalPrice}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="원래 구매했던 가격"
                  min="0"
                  disabled={isLoading}
                />
              </div>
            </>
          )}

          {/* 나눔 안내 메시지 */}
          {formData.type === 'share' && (
            <div className="bg-green-50 border border-green-200 rounded-md p-4">
              <div className="flex">
                <div className="flex-shrink-0">
                  <span className="text-green-400 text-xl">💝</span>
                </div>
                <div className="ml-3">
                  <h3 className="text-sm font-medium text-green-800">
                    나눔 물건입니다
                  </h3>
                  <p className="mt-1 text-sm text-green-700">
                    다른 사람들이 이 물건이 필요한 이유를 작성할 수 있습니다. 
                    가장 적절한 사연을 보고 나눔 받을 사람을 선택해주세요.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* 사용 기간 */}
          <div>
            <label htmlFor="usagePeriod" className="block text-sm font-medium text-gray-700 mb-2">
              사용 기간
            </label>
            <input
              type="text"
              id="usagePeriod"
              name="usagePeriod"
              value={formData.usagePeriod}
              onChange={handleInputChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="예: 1년 사용, 거의 새것"
              disabled={isLoading}
            />
          </div>

          {/* 연락처 */}
          <div>
            <label htmlFor="contact" className="block text-sm font-medium text-gray-700 mb-2">
              연락처 *
            </label>
            <input
              type="text"
              id="contact"
              name="contact"
              value={formData.contact}
              onChange={handleInputChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="010-1234-5678"
              disabled={isLoading}
              required
            />
          </div>

          {/* 판매자 이름 */}
          <div>
            <label htmlFor="sellerName" className="block text-sm font-medium text-gray-700 mb-2">
              판매자 이름 *
            </label>
            <input
              type="text"
              id="sellerName"
              name="sellerName"
              value={formData.sellerName}
              onChange={handleInputChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="판매자 이름을 입력하세요"
              disabled={isLoading}
              required
            />
          </div>

          {/* 이미지 업로드 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              상품 이미지 (최대 3개)
            </label>
            
            {/* 기존 이미지 표시 */}
            {existingImages.length > 0 && (
              <div className="mb-4">
                <p className="text-sm text-gray-600 mb-2">기존 이미지</p>
                <div className="flex flex-wrap gap-2">
                  {existingImages.map((imageUrl, index) => (
                    <div key={index} className="relative">
                      <img
                        src={imageUrl}
                        alt={`기존 이미지 ${index + 1}`}
                        className="w-20 h-20 object-cover rounded-md border"
                      />
                      <button
                        type="button"
                        onClick={() => removeExistingImage(index)}
                        className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs hover:bg-red-600"
                      >
                        <FiX size={12} />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* 새 이미지 미리보기 */}
            {previewUrls.length > 0 && (
              <div className="mb-4">
                <p className="text-sm text-gray-600 mb-2">새 이미지</p>
                <div className="flex flex-wrap gap-2">
                  {previewUrls.map((url, index) => (
                    <div key={index} className="relative">
                      <img
                        src={url}
                        alt={`미리보기 ${index + 1}`}
                        className="w-20 h-20 object-cover rounded-md border"
                      />
                      <button
                        type="button"
                        onClick={() => removeNewImage(index)}
                        className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs hover:bg-red-600"
                      >
                        <FiX size={12} />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* 이미지 업로드 버튼 */}
            {existingImages.length + selectedImages.length < 3 && (
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                <FiCamera className="mx-auto h-12 w-12 text-gray-400" />
                <div className="mt-4">
                  <label htmlFor="images" className="cursor-pointer">
                    <span className="mt-2 block text-sm font-medium text-gray-900">
                      이미지 선택
                    </span>
                    <input
                      id="images"
                      type="file"
                      accept="image/*"
                      multiple
                      onChange={handleImageSelect}
                      className="hidden"
                      disabled={isLoading}
                    />
                  </label>
                </div>
                <p className="mt-2 text-xs text-gray-500">
                  PNG, JPG, GIF 파일 지원 (최대 {3 - existingImages.length - selectedImages.length}개)
                </p>
              </div>
            )}
          </div>

          {/* 제출 버튼 */}
          <div className="pt-6">
            <button
              type="submit"
              disabled={isLoading}
              className="w-full flex justify-center items-center py-3 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  수정 중...
                </>
              ) : (
                <>
                  <FiUpload className="mr-2" size={16} />
                  상품 수정
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
} 