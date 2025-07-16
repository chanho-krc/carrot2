'use client'

import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { FiArrowLeft, FiUpload, FiX, FiCamera } from 'react-icons/fi'
import { getAuthFromStorage } from '@/lib/auth'
import { supabase } from '@/lib/supabase'
import { AuthState, ProductType } from '@/types'

export default function UploadPage() {
  const [auth, setAuth] = useState<AuthState>({ user: null, isAdmin: false, isLoading: true })
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    price: '',
    originalPrice: '',
    usagePeriod: '',
    category: '',
    type: 'sale' as ProductType
  })
  const [images, setImages] = useState<File[]>([])
  const [imagePreviews, setImagePreviews] = useState<string[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const router = useRouter()

  useEffect(() => {
    const authState = getAuthFromStorage()
    setAuth(authState)
    
    if (!authState.user && !authState.isAdmin) {
      router.push('/login')
    }
  }, [router])

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
  }

  const handleTypeChange = (type: ProductType) => {
    setFormData(prev => ({
      ...prev,
      type,
      price: type === 'share' ? '0' : prev.price
    }))
  }

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || [])
    
    if (images.length + files.length > 5) {
      setError('이미지는 최대 5개까지 업로드할 수 있습니다.')
      return
    }

    setImages(prev => [...prev, ...files])
    
    files.forEach(file => {
      const reader = new FileReader()
      reader.onload = (e) => {
        setImagePreviews(prev => [...prev, e.target?.result as string])
      }
      reader.readAsDataURL(file)
    })
  }

  const removeImage = (index: number) => {
    setImages(prev => prev.filter((_, i) => i !== index))
    setImagePreviews(prev => prev.filter((_, i) => i !== index))
  }

  const uploadImage = async (file: File): Promise<string> => {
    const fileExt = file.name.split('.').pop()
    const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`
    const filePath = `products/${fileName}`

    const { data, error } = await supabase.storage
      .from('product-images')
      .upload(filePath, file)

    if (error) {
      throw error
    }

    const { data: { publicUrl } } = supabase.storage
      .from('product-images')
      .getPublicUrl(data.path)

    return publicUrl
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setIsLoading(true)

    try {
      if (!formData.title.trim()) {
        throw new Error('제목을 입력해주세요.')
      }

      if (!formData.description.trim()) {
        throw new Error('설명을 입력해주세요.')
      }

      if (formData.type === 'sale' && (!formData.price || parseFloat(formData.price) < 0)) {
        throw new Error('올바른 가격을 입력해주세요.')
      }

      if (formData.type === 'wanted' && (!formData.price || parseFloat(formData.price) < 0)) {
        throw new Error('희망 가격을 입력해주세요.')
      }

      if (!formData.category) {
        throw new Error('카테고리를 선택해주세요.')
      }

      // 이미지 업로드
      const imageUrls: string[] = []
      for (const image of images) {
        try {
          const url = await uploadImage(image)
          imageUrls.push(url)
        } catch (uploadError) {
          console.error('Image upload error:', uploadError)
          // 이미지 업로드 실패 시에도 계속 진행
        }
      }

      // 상품 데이터 생성
      const productData = {
        title: formData.title.trim(),
        description: formData.description.trim(),
        price: formData.type === 'share' ? 0 : parseFloat(formData.price),
        original_price: formData.originalPrice ? parseFloat(formData.originalPrice) : null,
        usage_period: formData.usagePeriod.trim(),
        category: formData.category,
        type: formData.type,
        contact: auth.user?.phone || '',
        seller_name: auth.user?.name || '',
        seller_id: auth.user?.id || '',
        status: 'selling',
        images: imageUrls,
        view_count: 0
      }

      const { error } = await supabase
        .from('products')
        .insert([productData])

      if (error) {
        throw error
      }

      const actionText = formData.type === 'sale' ? '판매' : formData.type === 'share' ? '나눔' : '구하기'
      alert(`${actionText} 상품이 성공적으로 등록되었습니다!`)
      router.push('/')

    } catch (error: any) {
      setError(error.message || '상품 등록 중 오류가 발생했습니다.')
      console.error('Upload error:', error)
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

  const getPriceLabel = () => {
    switch (formData.type) {
      case 'sale':
        return '판매 가격'
      case 'wanted':
        return '희망 가격'
      default:
        return '가격'
    }
  }

  const getSubmitButtonText = () => {
    switch (formData.type) {
      case 'sale':
        return '판매 상품 등록'
      case 'share':
        return '나눔 상품 등록'
      case 'wanted':
        return '구하기 등록'
      default:
        return '등록하기'
    }
  }

  const getDescriptionPlaceholder = () => {
    switch (formData.type) {
      case 'sale':
        return '판매하실 상품에 대해 자세히 설명해주세요...'
      case 'share':
        return '나눔하실 상품에 대해 자세히 설명해주세요...'
      case 'wanted':
        return '구하고 싶은 상품에 대해 자세히 설명해주세요. (브랜드, 모델, 상태 등)'
      default:
        return '상품에 대해 설명해주세요...'
    }
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
          <h1 className="text-xl font-bold text-gray-900">상품 등록</h1>
          <div></div>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-md p-4 mb-6">
            <div className="text-sm text-red-700">{error}</div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* 타입 선택 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">거래 유형</label>
            <div className="grid grid-cols-3 gap-3">
              <button
                type="button"
                onClick={() => handleTypeChange('sale')}
                className={`p-4 rounded-lg border-2 transition-all ${
                  formData.type === 'sale'
                    ? 'bg-blue-50 border-blue-300 text-blue-700'
                    : 'bg-gray-50 border-gray-200 text-gray-700 hover:bg-gray-100'
                }`}
              >
                <div className="text-center">
                  <div className="text-2xl mb-2">💰</div>
                  <div className="font-medium">판매</div>
                  <div className="text-xs text-gray-500">유료 거래</div>
                </div>
              </button>
              
              <button
                type="button"
                onClick={() => handleTypeChange('share')}
                className={`p-4 rounded-lg border-2 transition-all ${
                  formData.type === 'share'
                    ? 'bg-green-50 border-green-300 text-green-700'
                    : 'bg-gray-50 border-gray-200 text-gray-700 hover:bg-gray-100'
                }`}
              >
                <div className="text-center">
                  <div className="text-2xl mb-2">💝</div>
                  <div className="font-medium">나눔</div>
                  <div className="text-xs text-gray-500">무료 나눔</div>
                </div>
              </button>

              <button
                type="button"
                onClick={() => handleTypeChange('wanted')}
                className={`p-4 rounded-lg border-2 transition-all ${
                  formData.type === 'wanted'
                    ? 'bg-purple-50 border-purple-300 text-purple-700'
                    : 'bg-gray-50 border-gray-200 text-gray-700 hover:bg-gray-100'
                }`}
              >
                <div className="text-center">
                  <div className="text-2xl mb-2">🔍</div>
                  <div className="font-medium">구하기</div>
                  <div className="text-xs text-gray-500">구매 희망</div>
                </div>
              </button>
            </div>
          </div>

          {/* 제목 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              {formData.type === 'wanted' ? '구하고 싶은 상품명' : '상품명'}
            </label>
            <input
              type="text"
              name="title"
              value={formData.title}
              onChange={handleInputChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder={formData.type === 'wanted' ? '예: 아이폰 14 Pro 256GB' : '상품명을 입력하세요'}
            />
          </div>

          {/* 설명 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">상세 설명</label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleInputChange}
              rows={5}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder={getDescriptionPlaceholder()}
            />
          </div>

          {/* 가격 */}
          {formData.type !== 'share' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">{getPriceLabel()}</label>
              <input
                type="number"
                name="price"
                value={formData.price}
                onChange={handleInputChange}
                min="0"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder={formData.type === 'wanted' ? '희망하는 가격을 입력하세요' : '가격을 입력하세요'}
              />
            </div>
          )}

          {/* 구매시 가격 (판매일 때만) */}
          {formData.type === 'sale' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">구매시 가격 (선택사항)</label>
              <input
                type="number"
                name="originalPrice"
                value={formData.originalPrice}
                onChange={handleInputChange}
                min="0"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="원래 구매했던 가격을 입력하세요"
              />
            </div>
          )}

          {/* 사용 기간 */}
          {formData.type !== 'wanted' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">사용 기간</label>
              <input
                type="text"
                name="usagePeriod"
                value={formData.usagePeriod}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="예: 6개월, 1년, 거의 새것"
              />
            </div>
          )}

          {/* 카테고리 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">카테고리</label>
            <select
              name="category"
              value={formData.category}
              onChange={handleInputChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="">카테고리를 선택하세요</option>
              <option value="전자제품">전자제품</option>
              <option value="의류">의류</option>
              <option value="도서">도서</option>
              <option value="가구">가구</option>
              <option value="생활용품">생활용품</option>
              <option value="스포츠">스포츠</option>
              <option value="기타">기타</option>
            </select>
          </div>

          {/* 이미지 업로드 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              이미지 {formData.type === 'wanted' ? '(선택사항 - 참고용)' : '(최대 5장)'}
            </label>
            
            <div className="space-y-4">
              {/* 업로드 버튼 */}
              {images.length < 5 && (
                <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-gray-300 border-dashed rounded-lg cursor-pointer bg-gray-50 hover:bg-gray-100">
                  <div className="flex flex-col items-center justify-center pt-5 pb-6">
                    <FiCamera className="w-8 h-8 mb-4 text-gray-500" />
                    <p className="mb-2 text-sm text-gray-500">
                      <span className="font-semibold">클릭하여 이미지 업로드</span>
                    </p>
                    <p className="text-xs text-gray-500">PNG, JPG (최대 10MB)</p>
                  </div>
                  <input
                    type="file"
                    multiple
                    accept="image/*"
                    onChange={handleImageChange}
                    className="hidden"
                  />
                </label>
              )}

              {/* 이미지 미리보기 */}
              {imagePreviews.length > 0 && (
                <div className="grid grid-cols-3 gap-4">
                  {imagePreviews.map((preview, index) => (
                    <div key={index} className="relative">
                      <img
                        src={preview}
                        alt={`Preview ${index + 1}`}
                        className="w-full h-24 object-cover rounded-lg"
                      />
                      <button
                        type="button"
                        onClick={() => removeImage(index)}
                        className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600"
                      >
                        <FiX size={16} />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* 제출 버튼 */}
          <button
            type="submit"
            disabled={isLoading}
            className={`w-full py-3 px-4 rounded-md font-medium transition-colors ${
              isLoading
                ? 'bg-gray-400 text-gray-600 cursor-not-allowed'
                : formData.type === 'sale'
                ? 'bg-blue-600 text-white hover:bg-blue-700'
                : formData.type === 'share'
                ? 'bg-green-600 text-white hover:bg-green-700'
                : 'bg-purple-600 text-white hover:bg-purple-700'
            }`}
          >
            {isLoading ? '등록 중...' : getSubmitButtonText()}
          </button>
        </form>
      </div>
    </div>
  )
} 