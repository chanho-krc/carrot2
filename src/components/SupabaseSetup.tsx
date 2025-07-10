import React from 'react'
import { FiAlertCircle, FiExternalLink } from 'react-icons/fi'

export default function SupabaseSetup() {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-6">
        <div className="flex items-center gap-3 mb-4">
          <FiAlertCircle className="text-yellow-500" size={24} />
          <h2 className="text-xl font-bold text-gray-900">Supabase 설정 필요</h2>
        </div>
        
        <div className="space-y-4 text-sm text-gray-600">
          <p>
            웹앱을 사용하기 위해서는 Supabase 프로젝트 설정이 필요합니다.
          </p>
          
          <div className="bg-gray-50 rounded-lg p-4">
            <h3 className="font-semibold text-gray-900 mb-2">설정 단계:</h3>
            <ol className="list-decimal list-inside space-y-1">
              <li>
                <a 
                  href="https://supabase.com" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-blue-600 hover:text-blue-800 inline-flex items-center gap-1"
                >
                  Supabase 가입 및 프로젝트 생성
                  <FiExternalLink size={12} />
                </a>
              </li>
              <li>프로젝트 루트에 <code className="bg-gray-200 px-1 rounded">.env.local</code> 파일 생성</li>
              <li>환경 변수 설정</li>
              <li>데이터베이스 테이블 생성</li>
              <li>이미지 저장소 설정</li>
            </ol>
          </div>
          
          <div className="bg-blue-50 rounded-lg p-4">
            <h3 className="font-semibold text-gray-900 mb-2">.env.local 파일 내용:</h3>
            <pre className="text-xs bg-gray-800 text-green-400 p-2 rounded overflow-x-auto">
{`NEXT_PUBLIC_SUPABASE_URL=your-supabase-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key`}
            </pre>
          </div>
          
          <div className="bg-amber-50 rounded-lg p-4">
            <h3 className="font-semibold text-gray-900 mb-2">📋 SQL 테이블 생성 쿼리:</h3>
            <pre className="text-xs bg-gray-800 text-green-400 p-2 rounded overflow-x-auto">
{`-- 사용자 테이블
CREATE TABLE users (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  phone VARCHAR(20) NOT NULL UNIQUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 상품 테이블
CREATE TABLE products (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title VARCHAR(200) NOT NULL,
  description TEXT NOT NULL,
  price DECIMAL(10,2) NOT NULL,
  usage_period VARCHAR(100),
  contact VARCHAR(50) NOT NULL,
  seller_name VARCHAR(100) NOT NULL,
  seller_id UUID REFERENCES users(id),
  status VARCHAR(20) DEFAULT 'selling' CHECK (status IN ('selling', 'reserved', 'sold')),
  images TEXT[],
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 인덱스 생성
CREATE INDEX idx_products_status ON products(status);
CREATE INDEX idx_products_seller_id ON products(seller_id);
CREATE INDEX idx_products_created_at ON products(created_at);`}
            </pre>
          </div>
          
          <p className="text-xs text-gray-500">
            설정이 완료되면 페이지를 새로고침하세요.
          </p>
        </div>
      </div>
    </div>
  )
} 