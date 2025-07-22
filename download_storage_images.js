/**
 * Supabase Storage 이미지 다운로드 스크립트
 * 사용법: node download_storage_images.js
 */

const { createClient } = require('@supabase/supabase-js')
const fs = require('fs')
const path = require('path')
const https = require('https')

// Supabase 설정 (환경변수에서 가져오거나 직접 입력)
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || 'YOUR_SUPABASE_URL'
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'YOUR_SUPABASE_ANON_KEY'

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY)

// 다운로드 폴더 생성
const downloadDir = './downloaded_images'
if (!fs.existsSync(downloadDir)) {
  fs.mkdirSync(downloadDir)
}

/**
 * 파일 다운로드 함수
 */
function downloadFile(url, filename) {
  return new Promise((resolve, reject) => {
    const filePath = path.join(downloadDir, filename)
    const file = fs.createWriteStream(filePath)
    
    https.get(url, (response) => {
      response.pipe(file)
      
      file.on('finish', () => {
        file.close()
        console.log(`✅ 다운로드 완료: ${filename}`)
        resolve(filePath)
      })
      
      file.on('error', (err) => {
        fs.unlink(filePath, () => {}) // 실패시 파일 삭제
        reject(err)
      })
    }).on('error', (err) => {
      reject(err)
    })
  })
}

/**
 * Storage에서 이미지 목록 가져오기
 */
async function getStorageImages() {
  try {
    console.log('📂 Storage에서 이미지 목록을 가져오는 중...')
    
    const { data, error } = await supabase.storage
      .from('product-images')
      .list('products/images', {
        limit: 100,
        sortBy: { column: 'created_at', order: 'desc' }
      })

    if (error) {
      throw error
    }

    console.log(`📊 총 ${data.length}개의 이미지를 찾았습니다.`)
    return data
  } catch (error) {
    console.error('❌ 이미지 목록 가져오기 실패:', error.message)
    return []
  }
}

/**
 * 이미지들을 다운로드
 */
async function downloadAllImages() {
  try {
    const images = await getStorageImages()
    
    if (images.length === 0) {
      console.log('📷 다운로드할 이미지가 없습니다.')
      return
    }

    console.log('🚀 이미지 다운로드를 시작합니다...\n')

    const downloadPromises = images.map(async (image) => {
      try {
        const { data } = supabase.storage
          .from('product-images')
          .getPublicUrl(`products/images/${image.name}`)
        
        const filename = `${Date.now()}_${image.name}`
        await downloadFile(data.publicUrl, filename)
        
        return {
          original: image.name,
          downloaded: filename,
          url: data.publicUrl,
          size: image.metadata?.size || 'unknown',
          created: image.created_at
        }
      } catch (error) {
        console.error(`❌ ${image.name} 다운로드 실패:`, error.message)
        return null
      }
    })

    const results = await Promise.all(downloadPromises)
    const successful = results.filter(r => r !== null)

    console.log('\n📋 다운로드 결과:')
    console.log(`✅ 성공: ${successful.length}개`)
    console.log(`❌ 실패: ${results.length - successful.length}개`)
    
    // 결과를 JSON 파일로 저장
    const reportFile = path.join(downloadDir, 'download_report.json')
    fs.writeFileSync(reportFile, JSON.stringify({
      timestamp: new Date().toISOString(),
      total: images.length,
      successful: successful.length,
      failed: results.length - successful.length,
      images: successful
    }, null, 2))

    console.log(`📄 상세 리포트가 저장되었습니다: ${reportFile}`)
    console.log(`📁 이미지들이 저장된 폴더: ${downloadDir}`)

  } catch (error) {
    console.error('❌ 다운로드 중 오류 발생:', error.message)
  }
}

/**
 * Storage 연결 테스트
 */
async function testConnection() {
  try {
    console.log('🔗 Supabase 연결을 테스트하는 중...')
    
    const { data, error } = await supabase.storage.listBuckets()
    
    if (error) {
      throw error
    }

    console.log('✅ Supabase 연결 성공!')
    console.log('📦 사용 가능한 버킷:', data.map(b => b.name).join(', '))
    return true
  } catch (error) {
    console.error('❌ Supabase 연결 실패:', error.message)
    console.log('\n🔧 해결 방법:')
    console.log('1. .env.local 파일에서 SUPABASE_URL과 SUPABASE_ANON_KEY 확인')
    console.log('2. 또는 이 파일의 상단에서 직접 수정')
    return false
  }
}

/**
 * 메인 실행 함수
 */
async function main() {
  console.log('🎯 Supabase Storage 이미지 다운로더\n')
  
  // 연결 테스트
  const connected = await testConnection()
  if (!connected) {
    return
  }

  console.log('') // 빈 줄

  // 이미지 다운로드
  await downloadAllImages()
  
  console.log('\n🎉 모든 작업이 완료되었습니다!')
}

// 스크립트 실행
if (require.main === module) {
  main()
} 