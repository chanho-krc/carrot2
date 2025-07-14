import { User, Product } from '@/types'
import { v4 as uuidv4 } from 'uuid'

// 로컬 스토리지 키
const USERS_KEY = 'carrot2-users'
const PRODUCTS_KEY = 'carrot2-products'

// 초기 더미 데이터
const INITIAL_PRODUCTS: Product[] = [
  {
    id: '1',
    title: '아이폰 14 Pro',
    description: '1년 사용한 아이폰 14 Pro입니다. 상태 매우 좋습니다. 케이스와 함께 드립니다.',
    price: 800000,
    usage_period: '1년 사용',
    contact: '010-1234-5678',
    seller_name: '김철수',
    seller_id: 'demo-user-1',
    status: 'selling',
    images: [],
    view_count: 0,
    created_at: '2024-01-15T10:00:00Z',
    updated_at: '2024-01-15T10:00:00Z'
  },
  {
    id: '2', 
    title: '맥북 에어 M2',
    description: '사무용으로 가볍게 사용했습니다. 거의 새것 상태입니다.',
    price: 1200000,
    usage_period: '6개월 사용',
    contact: '010-9876-5432',
    seller_name: '박영희',
    seller_id: 'demo-user-2',
    status: 'reserved',
    images: [],
    view_count: 0,
    created_at: '2024-01-14T15:30:00Z',
    updated_at: '2024-01-14T15:30:00Z'
  },
  {
    id: '3',
    title: '삼성 모니터 27인치',
    description: '재택근무용으로 사용하던 모니터입니다. 화질 선명하고 색감 좋습니다.',
    price: 300000,
    usage_period: '2년 사용',
    contact: '010-5555-7777',
    seller_name: '이민수',
    seller_id: 'demo-user-3',
    status: 'sold',
    images: [],
    view_count: 0,
    created_at: '2024-01-13T09:15:00Z',
    updated_at: '2024-01-13T09:15:00Z'
  }
]

// 사용자 데이터 관리
export const getUsers = (): User[] => {
  if (typeof window === 'undefined') return []
  
  try {
    const stored = localStorage.getItem(USERS_KEY)
    return stored ? JSON.parse(stored) : []
  } catch (error) {
    console.error('Error loading users:', error)
    return []
  }
}

export const saveUsers = (users: User[]): void => {
  if (typeof window === 'undefined') return
  
  try {
    localStorage.setItem(USERS_KEY, JSON.stringify(users))
  } catch (error) {
    console.error('Error saving users:', error)
  }
}

export const addOrUpdateUser = (name: string, phone: string): User => {
  const users = getUsers()
  const existingUser = users.find(u => u.phone === phone)
  
  if (existingUser) {
    // 기존 사용자 업데이트
    if (existingUser.name !== name) {
      existingUser.name = name
      existingUser.updated_at = new Date().toISOString()
      saveUsers(users)
    }
    return existingUser
  } else {
    // 신규 사용자 추가
    const newUser: User = {
      id: uuidv4(),
      name,
      phone,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }
    users.push(newUser)
    saveUsers(users)
    return newUser
  }
}

// 상품 데이터 관리
export const getProducts = (): Product[] => {
  if (typeof window === 'undefined') return INITIAL_PRODUCTS
  
  try {
    const stored = localStorage.getItem(PRODUCTS_KEY)
    if (stored) {
      return JSON.parse(stored)
    } else {
      // 초기 데이터 설정
      saveProducts(INITIAL_PRODUCTS)
      return INITIAL_PRODUCTS
    }
  } catch (error) {
    console.error('Error loading products:', error)
    return INITIAL_PRODUCTS
  }
}

export const saveProducts = (products: Product[]): void => {
  if (typeof window === 'undefined') return
  
  try {
    localStorage.setItem(PRODUCTS_KEY, JSON.stringify(products))
  } catch (error) {
    console.error('Error saving products:', error)
  }
}

export const addProduct = (productData: Omit<Product, 'id' | 'created_at' | 'updated_at'>): Product => {
  const products = getProducts()
  const newProduct: Product = {
    ...productData,
    id: uuidv4(),
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  }
  
  products.unshift(newProduct) // 최신 상품을 맨 앞에 추가
  saveProducts(products)
  return newProduct
}

export const updateProduct = (productId: string, updates: Partial<Product>): Product | null => {
  const products = getProducts()
  const index = products.findIndex(p => p.id === productId)
  
  if (index === -1) return null
  
  products[index] = {
    ...products[index],
    ...updates,
    updated_at: new Date().toISOString()
  }
  
  saveProducts(products)
  return products[index]
}

export const deleteProduct = (productId: string): boolean => {
  const products = getProducts()
  const filteredProducts = products.filter(p => p.id !== productId)
  
  if (filteredProducts.length === products.length) return false
  
  saveProducts(filteredProducts)
  return true
}

export const getProductById = (productId: string): Product | null => {
  const products = getProducts()
  return products.find(p => p.id === productId) || null
}

export const getProductsBySeller = (sellerId: string): Product[] => {
  const products = getProducts()
  return products.filter(p => p.seller_id === sellerId)
}

// 이미지 업로드 시뮬레이션 (Base64로 저장)
export const uploadImages = async (files: File[]): Promise<string[]> => {
  const uploadPromises = files.map(file => {
    return new Promise<string>((resolve, reject) => {
      const reader = new FileReader()
      reader.onload = () => {
        if (reader.result) {
          resolve(reader.result as string)
        } else {
          reject(new Error('파일 읽기 실패'))
        }
      }
      reader.onerror = () => reject(new Error('파일 읽기 오류'))
      reader.readAsDataURL(file)
    })
  })
  
  return Promise.all(uploadPromises)
} 