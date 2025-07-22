'use client'

import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { FiArrowLeft, FiX, FiCamera, FiUser } from 'react-icons/fi'
import { getAuthFromStorage } from '@/lib/auth'
import { supabase } from '@/lib/supabase'
import { AuthState, ProductType, User } from '@/types'

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
  const [videos, setVideos] = useState<File[]>([])
  const [videoPreviews, setVideoPreviews] = useState<string[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  
  // 관리자용 사용자 선택 기능
  const [users, setUsers] = useState<User[]>([])
  const [selectedUserId, setSelectedUserId] = useState<string>('')
  const [selectedUserName, setSelectedUserName] = useState<string>('')
  const [selectedUserPhone, setSelectedUserPhone] = useState<string>('')
  
  const router = useRouter()

  useEffect(() => {
    const authState = getAuthFromStorage()
    setAuth(authState)
    
    if (!authState.user && !authState.isAdmin) {
      router.push('/login')
    }

    // 관리자인 경우 사용자 목록 불러오기
    if (authState.isAdmin) {
      fetchUsers()
    }
  }, [router])

  // 사용자 목록 가져오기 (관리자 전용)
  const fetchUsers = async () => {
    try {
      const { data: usersData, error } = await supabase
        .from('users')
        .select('*')
        .order('name')

      if (error) {
        console.error('Error fetching users:', error)
        return
      }

      setUsers(usersData || [])
    } catch (error) {
      console.error('Error fetching users:', error)
    }
  }

  // 사용자 선택 핸들러
  const handleUserSelect = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const userId = e.target.value
    setSelectedUserId(userId)

    if (userId) {
      const selectedUser = users.find(user => user.id === userId)
      if (selectedUser) {
        setSelectedUserName(selectedUser.name)
        setSelectedUserPhone(selectedUser.phone)
      }
    } else {
      setSelectedUserName('')
      setSelectedUserPhone('')
    }
  }

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

  const handleMediaChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || [])
    if (files.length === 0) return

    // 이미지와 동영상 파일 분리
    const imageFiles: File[] = []
    const videoFiles: File[] = []

    files.forEach(file => {
      if (file.type.startsWith('image/')) {
        imageFiles.push(file)
      } else if (file.type.startsWith('video/')) {
        videoFiles.push(file)
      }
    })

    // 전체 파일 개수 제한 (이미지 + 동영상 총 10개)
    const totalFiles = images.length + videos.length + imageFiles.length + videoFiles.length
    if (totalFiles > 10) {
      setError('이미지와 동영상을 합쳐 최대 10개까지 업로드 가능합니다.')
      return
    }

    // 이미지 파일 크기 체크 (5MB)
    for (const file of imageFiles) {
      if (file.size > 5 * 1024 * 1024) {
        setError('이미지 크기는 5MB 이하로 업로드해주세요.')
        return
      }
    }

    // 동영상 파일 크기 체크 (50MB)
    for (const file of videoFiles) {
      if (file.size > 50 * 1024 * 1024) {
        setError('동영상 크기는 50MB 이하로 업로드해주세요.')
        return
      }
    }

    // 이미지 파일 추가
    if (imageFiles.length > 0) {
      setImages(prev => [...prev, ...imageFiles])
      
      // 이미지 미리보기 생성
      imageFiles.forEach(file => {
        const reader = new FileReader()
        reader.onload = (e) => {
          setImagePreviews(prev => [...prev, e.target?.result as string])
        }
        reader.readAsDataURL(file)
      })
    }

    // 동영상 파일 추가
    if (videoFiles.length > 0) {
      setVideos(prev => [...prev, ...videoFiles])
      
      // 동영상 미리보기 생성
      videoFiles.forEach(file => {
        const reader = new FileReader()
        reader.onload = (e) => {
          setVideoPreviews(prev => [...prev, e.target?.result as string])
        }
        reader.readAsDataURL(file)
      })
    }
  }

  const removeImage = (index: number) => {
    setImages(prev => prev.filter((_, i) => i !== index))
    setImagePreviews(prev => prev.filter((_, i) => i !== index))
  }

  const removeVideo = (index: number) => {
    setVideos(prev => prev.filter((_, i) => i !== index))
    setVideoPreviews(prev => prev.filter((_, i) => i !== index))
  }

  const uploadMediaFiles = async () => {
    const uploadedImageUrls: string[] = []
    const uploadedVideoUrls: string[] = []
    
    // 이미지 업로드
    for (const image of images) {
      try {
        const fileName = `${Date.now()}_${Math.random().toString(36).substr(2, 9)}.${image.name.split('.').pop()}`
        const filePath = `products/images/${fileName}`
        
        const { error: uploadError } = await supabase.storage
          .from('product-images')
          .upload(filePath, image)

        if (uploadError) {
          console.error('Image upload error:', uploadError)
          continue
        }

        const { data: { publicUrl } } = supabase.storage
          .from('product-images')
          .getPublicUrl(filePath)

        uploadedImageUrls.push(publicUrl)
      } catch (error) {
        console.error('Image upload error:', error)
        continue
      }
    }

    // 동영상 업로드
    for (const video of videos) {
      try {
        const fileName = `${Date.now()}_${Math.random().toString(36).substr(2, 9)}.${video.name.split('.').pop()}`
        const filePath = `products/videos/${fileName}`
        
        const { error: uploadError } = await supabase.storage
          .from('product-images')
          .upload(filePath, video)

        if (uploadError) {
          console.error('Video upload error:', uploadError)
          continue
        }

        const { data: { publicUrl } } = supabase.storage
          .from('product-images')
          .getPublicUrl(filePath)

        uploadedVideoUrls.push(publicUrl)
      } catch (error) {
        console.error('Video upload error:', error)
        continue
      }
    }

    return { images: uploadedImageUrls, videos: uploadedVideoUrls }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError('')

    try {
      // 필수 필드 검증
      if (!formData.title.trim()) {
        throw new Error('상품명을 입력해주세요.')
      }
      if (!formData.description.trim()) {
        throw new Error('상품 설명을 입력해주세요.')
      }
      if (!formData.category) {
        throw new Error('카테고리를 선택해주세요.')
      }

      // 가격 검증 (나눔은 제외)
      if (formData.type !== 'share') {
        if (!formData.price || parseFloat(formData.price) < 0) {
          throw new Error('가격을 올바르게 입력해주세요.')
        }
      }

      // 관리자가 사용자를 선택했는지 확인
      if (auth.isAdmin && !selectedUserId) {
        throw new Error('판매자를 선택해주세요.')
      }

      // 미디어 권장 메시지 (필수에서 권장으로 완화)
      if (formData.type === 'sale' && images.length === 0 && videos.length === 0) {
        const confirm = window.confirm('판매 상품은 이미지나 동영상이 있으면 더 좋습니다.\n미디어 없이 등록하시겠습니까?')
        if (!confirm) {
          setIsLoading(false)
          return
        }
      }

      // 로그인 상태 재확인
      const currentAuth = getAuthFromStorage()
      if (!currentAuth.user && !currentAuth.isAdmin) {
        throw new Error('로그인이 필요합니다.')
      }

      let imageUrls: string[] = []
      let videoUrls: string[] = []
      let mediaUploadWarning = ''
      
      if (images.length > 0 || videos.length > 0) {
        try {
          const uploadResult = await uploadMediaFiles()
          imageUrls = uploadResult.images
          videoUrls = uploadResult.videos
          
          // 미디어 업로드가 부분적으로 실패한 경우
          const totalExpected = images.length + videos.length
          const totalUploaded = imageUrls.length + videoUrls.length
          if (totalUploaded < totalExpected) {
            mediaUploadWarning = `${totalExpected}개 중 ${totalUploaded}개의 미디어만 업로드되었습니다.`
          }
        } catch (error) {
          console.error('미디어 업로드 실패:', error)
          mediaUploadWarning = '미디어 업로드에 실패했지만 상품은 등록됩니다.'
        }
      }

      // 가격 설정 (나눔은 0, 나머지는 입력값)
      const finalPrice = formData.type === 'share' ? 0 : parseFloat(formData.price)

      // 판매자 정보 결정 (관리자가 선택한 사용자 또는 현재 사용자)
      const sellerInfo = auth.isAdmin && selectedUserId ? {
        contact: selectedUserPhone,
        seller_name: selectedUserName,
        seller_id: selectedUserId
      } : {
        contact: currentAuth.user?.phone || 'admin',
        seller_name: currentAuth.user?.name || '관리자',
        seller_id: currentAuth.user?.id || null
      }

      // Supabase에 상품 데이터 삽입
      const { error: insertError } = await supabase
        .from('products')
        .insert({
          title: formData.title.trim(),
          description: formData.description.trim(),
          price: finalPrice,
          original_price: formData.originalPrice ? parseFloat(formData.originalPrice) : null,
          usage_period: formData.usagePeriod.trim() || null,
          category: formData.category,
          type: formData.type,
          images: imageUrls,
          videos: videoUrls,
          contact: sellerInfo.contact,
          seller_name: sellerInfo.seller_name,
          seller_id: sellerInfo.seller_id,
          status: 'selling',
          view_count: 0
        })

      if (insertError) {
        throw new Error(`등록 실패: ${insertError.message}`)
      }

      // 성공 메시지
      const actionText = formData.type === 'sale' ? '판매' : formData.type === 'share' ? '나눔' : '구하기'
      const sellerText = auth.isAdmin && selectedUserName ? ` (판매자: ${selectedUserName})` : ''
      const successMessage = mediaUploadWarning 
        ? `${actionText} 상품이 등록되었습니다!${sellerText}\n${mediaUploadWarning}`
        : `${actionText} 상품이 성공적으로 등록되었습니다!${sellerText}`
      
      alert(successMessage)
      router.push('/')

    } catch (error) {
      setError(error instanceof Error ? error.message : '상품 등록 중 오류가 발생했습니다.')
      console.error('Upload error:', error)
    } finally {
      setIsLoading(false)
    }
  }

  if (auth.isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-orange-500"></div>
      </div>
    )
  }

  if (!auth.user && !auth.isAdmin) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">로그인이 필요합니다</h1>
          <button 
            onClick={() => router.push('/login')}
            className="bg-orange-500 text-white px-6 py-2 rounded-lg"
          >
            로그인하러 가기
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* 헤더 */}
      <div className="bg-white shadow-sm">
        <div className="max-w-md mx-auto px-4 py-4 flex items-center">
          <button 
            onClick={() => router.back()}
            className="p-2 hover:bg-gray-100 rounded-full"
          >
            <FiArrowLeft size={24} />
          </button>
          <h1 className="ml-4 text-xl font-semibold">
            {auth.isAdmin ? '관리자 상품 등록' : '상품 등록'}
          </h1>
        </div>
      </div>

      {/* 메인 컨텐츠 */}
      <div className="max-w-md mx-auto p-4">
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* 에러 메시지 */}
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md">
              {error}
            </div>
          )}

          {/* 관리자 전용: 판매자 선택 */}
          {auth.isAdmin && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <label className="block text-sm font-medium text-blue-800 mb-2">
                👑 관리자 모드: 판매자 선택 *
              </label>
              <select
                value={selectedUserId}
                onChange={handleUserSelect}
                className="w-full px-3 py-2 border border-blue-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white"
                required
              >
                <option value="">판매자를 선택하세요</option>
                {users.map(user => (
                  <option key={user.id} value={user.id}>
                    {user.name} ({user.phone})
                  </option>
                ))}
              </select>
              
              {selectedUserName && (
                <div className="mt-2 text-sm text-blue-600 bg-blue-100 px-3 py-2 rounded">
                  <FiUser className="inline mr-1" />
                  선택된 판매자: <strong>{selectedUserName}</strong> ({selectedUserPhone})
                </div>
              )}
            </div>
          )}

          {/* 미디어 업로드 (이미지 + 동영상) */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              📷🎥 상품 미디어 {formData.type === 'sale' ? '(권장 - 최대 10개)' : '(선택사항 - 최대 10개)'}
            </label>
            
            <div className="space-y-4">
              {/* 업로드 버튼 */}
              {(images.length + videos.length) < 10 && (
                <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-gray-300 border-dashed rounded-lg cursor-pointer bg-gray-50 hover:bg-gray-100">
                  <FiCamera size={24} className="text-gray-400 mb-2" />
                  <span className="text-sm text-gray-500">사진 또는 동영상 추가하기</span>
                  <span className="text-xs text-gray-400 mt-1">
                    {formData.type === 'sale' ? '판매 상품은 미디어 권장' : '미디어는 선택사항입니다'}
                  </span>
                  <span className="text-xs text-gray-400">
                    이미지: 5MB 이하, 동영상: 50MB 이하
                  </span>
                  <input
                    type="file"
                    multiple
                    accept="image/*,video/*"
                    onChange={handleMediaChange}
                    className="hidden"
                  />
                </label>
              )}

              {/* 이미지 미리보기 */}
              {imagePreviews.length > 0 && (
                <div>
                  <h4 className="text-sm font-medium text-gray-600 mb-2">📷 이미지</h4>
                  <div className="grid grid-cols-3 gap-2">
                    {imagePreviews.map((preview, index) => (
                      <div key={index} className="relative">
                        <img
                          src={preview}
                          alt={`이미지 미리보기 ${index + 1}`}
                          className="w-full h-24 object-cover rounded-lg"
                        />
                        <button
                          type="button"
                          onClick={() => removeImage(index)}
                          className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600"
                        >
                          <FiX size={12} />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* 동영상 미리보기 */}
              {videoPreviews.length > 0 && (
                <div>
                  <h4 className="text-sm font-medium text-gray-600 mb-2">🎥 동영상</h4>
                  <div className="grid grid-cols-2 gap-2">
                    {videoPreviews.map((preview, index) => (
                      <div key={index} className="relative">
                        <video
                          src={preview}
                          className="w-full h-24 object-cover rounded-lg"
                          controls
                          muted
                        />
                        <button
                          type="button"
                          onClick={() => removeVideo(index)}
                          className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600"
                        >
                          <FiX size={12} />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* 상품 타입 선택 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">상품 타입</label>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => handleTypeChange('sale')}
                className={`p-3 rounded-lg border text-center transition-all ${
                  formData.type === 'sale'
                    ? 'border-green-500 bg-green-50 text-green-700'
                    : 'border-gray-300 hover:border-gray-400'
                }`}
              >
                <div className="text-xl mb-1">💰</div>
                <div className="text-sm font-medium">판매</div>
              </button>
              <button
                type="button"
                onClick={() => handleTypeChange('share')}
                className={`p-3 rounded-lg border text-center transition-all ${
                  formData.type === 'share'
                    ? 'border-blue-500 bg-blue-50 text-blue-700'
                    : 'border-gray-300 hover:border-gray-400'
                }`}
              >
                <div className="text-xl mb-1">💝</div>
                <div className="text-sm font-medium">나눔</div>
              </button>
              <button
                type="button"
                onClick={() => handleTypeChange('wanted')}
                className={`p-3 rounded-lg border text-center transition-all ${
                  formData.type === 'wanted'
                    ? 'border-orange-500 bg-orange-50 text-orange-700'
                    : 'border-gray-300 hover:border-gray-400'
                }`}
              >
                <div className="text-xl mb-1">🔍</div>
                <div className="text-sm font-medium">구하기</div>
              </button>
            </div>
          </div>

          {/* 상품명 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              {formData.type === 'wanted' ? '구하고 싶은 상품명' : '상품명'} *
            </label>
            <input
              type="text"
              name="title"
              value={formData.title}
              onChange={handleInputChange}
              placeholder={formData.type === 'wanted' ? '구하고 싶은 상품을 입력하세요' : '상품명을 입력하세요'}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
              required
            />
          </div>

          {/* 카테고리 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">카테고리 *</label>
            <select
              name="category"
              value={formData.category}
              onChange={handleInputChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
              required
            >
              <option value="">카테고리를 선택하세요</option>
              <option value="휴대폰/태블릿">휴대폰/태블릿</option>
              <option value="노트북/PC">노트북/PC</option>
              <option value="모니터/주변기기">모니터/주변기기</option>
              <option value="가구/인테리어">가구/인테리어</option>
              <option value="유아용품">유아용품</option>
              <option value="의류/잡화">의류/잡화</option>
              <option value="생활용품">생활용품</option>
              <option value="스포츠/레저">스포츠/레저</option>
              <option value="도서/문구">도서/문구</option>
              <option value="기타">기타</option>
            </select>
          </div>

          {/* 가격 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              {formData.type === 'share' ? '가격 (나눔 - 무료)' : 
               formData.type === 'wanted' ? '희망 가격' : '판매 가격'} 
              {formData.type !== 'share' ? ' *' : ''}
            </label>
            <div className="relative">
              <input
                type="number"
                name="price"
                value={formData.type === 'share' ? '0' : formData.price}
                onChange={handleInputChange}
                placeholder={formData.type === 'wanted' ? '희망 가격을 입력하세요' : formData.type === 'share' ? '무료 나눔' : '가격을 입력하세요'}
                className="w-full px-3 py-2 pr-8 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                disabled={formData.type === 'share'}
                required={formData.type !== 'share'}
                readOnly={formData.type === 'share'}
              />
              <span className="absolute right-3 top-2 text-gray-500">원</span>
            </div>
          </div>

          {/* 원가 (판매만) */}
          {formData.type === 'sale' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">원가 (선택사항)</label>
              <div className="relative">
                <input
                  type="number"
                  name="originalPrice"
                  value={formData.originalPrice}
                  onChange={handleInputChange}
                  placeholder="구매했을 때 가격"
                  className="w-full px-3 py-2 pr-8 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                />
                <span className="absolute right-3 top-2 text-gray-500">원</span>
              </div>
            </div>
          )}

          {/* 사용 기간 (판매만) */}
          {formData.type === 'sale' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">사용 기간 (선택사항)</label>
              <input
                type="text"
                name="usagePeriod"
                value={formData.usagePeriod}
                onChange={handleInputChange}
                placeholder="예: 6개월, 1년 등"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
              />
            </div>
          )}

          {/* 상품 설명 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              {formData.type === 'wanted' ? '상세 요구사항' : '상품 설명'} *
            </label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleInputChange}
              rows={4}
              placeholder={
                formData.type === 'wanted' 
                  ? '원하는 상품의 조건, 상태 등을 자세히 적어주세요'
                  : '상품의 상태, 구매 시기, 사용감 등을 자세히 적어주세요'
              }
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500 resize-none"
              required
            />
          </div>

          {/* 등록 버튼 */}
          <button
            type="submit"
            disabled={isLoading}
            className={`w-full py-3 px-4 rounded-lg font-medium text-white transition-colors ${
              isLoading
                ? 'bg-gray-400 cursor-not-allowed'
                : formData.type === 'wanted'
                ? 'bg-orange-500 hover:bg-orange-600'
                : formData.type === 'share'
                ? 'bg-blue-500 hover:bg-blue-600'
                : 'bg-green-500 hover:bg-green-600'
            }`}
          >
            {isLoading ? '등록 중...' : 
             formData.type === 'wanted' ? '🔍 구하기 등록' :
             formData.type === 'share' ? '💝 나눔 등록' : '💰 판매 등록'}
          </button>
        </form>
      </div>
    </div>
  )
} 