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
  images: string[]
  view_count: number
  created_at: string
  updated_at: string
}

export interface AuthState {
  user: User | null
  isAdmin: boolean
  isLoading: boolean
}

export type ProductStatus = 'selling' | 'reserved' | 'sold' 