export interface User {
  id: string
  name: string
  phone: string
  created_at: string
  updated_at: string
}

export interface Product {
  id: string
  title: string
  description: string
  price: number
  original_price?: number
  usage_period: string
  contact: string
  seller_name: string
  seller_id: string
  status: 'selling' | 'reserved' | 'sold'
  type: 'sale' | 'share' | 'wanted' // 판매/나눔/구하기 구분
  category: string // 카테고리
  images: string[]
  videos?: string[] // 동영상 URL 배열
  view_count: number
  // 예약자 정보
  reserved_by_id?: string
  reserved_by_name?: string
  reserved_by_phone?: string
  reserved_at?: string
  created_at: string
  updated_at: string
}

// 나눔 신청을 위한 인터페이스
export interface ShareRequest {
  id: string
  product_id: string
  requester_name: string
  requester_id: string
  reason: string // 신청 사연
  created_at: string
}

export interface AuthState {
  user: User | null
  isAdmin: boolean
  isLoading: boolean
}

export type ProductStatus = 'selling' | 'reserved' | 'sold'
export type ProductType = 'sale' | 'share' | 'wanted' 