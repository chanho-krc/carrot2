const CACHE_NAME = 'carrot2-v1';
const urlsToCache = [
  '/',
  '/login',
  '/upload',
  '/my',
  '/admin',
  '/manifest.json',
  '/icons/icon-192x192.png',
  '/icons/icon-512x512.png',
  // 정적 파일들
  '/_next/static/css/app/globals.css',
  '/_next/static/chunks/webpack.js',
  '/_next/static/chunks/main.js',
  '/_next/static/chunks/app/layout.js',
  '/_next/static/chunks/app/page.js',
];

// 설치 이벤트 - 캐시 생성
self.addEventListener('install', (event) => {
  console.log('Service Worker installing...');
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('Cache opened');
        return cache.addAll(urlsToCache);
      })
      .catch((err) => {
        console.log('Cache failed: ', err);
      })
  );
});

// 활성화 이벤트 - 이전 캐시 삭제
self.addEventListener('activate', (event) => {
  console.log('Service Worker activating...');
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            console.log('Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
});

// 페치 이벤트 - 네트워크 우선, 캐시 백업 전략
self.addEventListener('fetch', (event) => {
  // API 요청은 캐시하지 않음
  if (event.request.url.includes('/api/') || 
      event.request.url.includes('supabase.co')) {
    return;
  }

  event.respondWith(
    // 네트워크 우선 전략
    fetch(event.request)
      .then((response) => {
        // 성공적인 응답을 받으면 캐시에 저장
        if (response.status === 200) {
          const responseClone = response.clone();
          caches.open(CACHE_NAME)
            .then((cache) => {
              cache.put(event.request, responseClone);
            });
        }
        return response;
      })
      .catch(() => {
        // 네트워크 실패 시 캐시에서 반환
        return caches.match(event.request)
          .then((response) => {
            if (response) {
              return response;
            }
            // 캐시에도 없으면 오프라인 페이지 반환
            return caches.match('/')
              .then((fallbackResponse) => {
                return fallbackResponse || new Response(
                  '오프라인 상태입니다. 인터넷 연결을 확인해주세요.',
                  {
                    status: 503,
                    statusText: 'Service Unavailable',
                    headers: {
                      'Content-Type': 'text/html; charset=utf-8'
                    }
                  }
                );
              });
          });
      })
  );
});

// 백그라운드 동기화 (선택사항)
self.addEventListener('sync', (event) => {
  if (event.tag === 'background-sync') {
    console.log('Background sync event received');
    // 백그라운드에서 실행할 작업 구현
  }
});

// 푸시 알림 수신 및 처리
self.addEventListener('push', (event) => {
  console.log('📱 푸시 알림 수신:', event);
  
  let notificationData = {
    title: 'KRC 당근',
    body: '새로운 소식이 있습니다!',
    data: {}
  };

  // 푸시 데이터 파싱
  if (event.data) {
    try {
      notificationData = event.data.json();
      console.log('📱 푸시 데이터:', notificationData);
    } catch (error) {
      console.log('📱 텍스트 푸시 데이터:', event.data.text());
      notificationData.body = event.data.text();
    }
  }
  
  const options = {
    body: notificationData.message || notificationData.body,
    icon: '/icons/icon-192x192.png',
    badge: '/icons/icon-72x72.png',
    tag: notificationData.data?.type || 'general',
    data: notificationData.data || {},
    actions: [
      {
        action: 'view',
        title: '상품 보기',
        icon: '/icons/icon-72x72.png'
      },
      {
        action: 'close',
        title: '닫기'
      }
    ],
    requireInteraction: true,
    vibrate: [200, 100, 200],
    silent: false
  };

  event.waitUntil(
    self.registration.showNotification(
      notificationData.title || 'KRC 당근',
      options
    )
  );
});

// 알림 클릭 이벤트 처리
self.addEventListener('notificationclick', (event) => {
  console.log('📱 알림 클릭:', event);
  
  event.notification.close();
  
  const notificationData = event.notification.data || {};
  
  if (event.action === 'view') {
    // 상품 상세 페이지로 이동
    const productId = notificationData.productId;
    const targetUrl = productId ? `/detail/${productId}` : '/';
    
    event.waitUntil(
      clients.matchAll({ type: 'window' }).then((clientList) => {
        // 기존 창이 있으면 포커스하고 해당 페이지로 이동
        for (let client of clientList) {
          if (client.url === self.registration.scope) {
            client.navigate(targetUrl);
            return client.focus();
          }
        }
        // 새 창 열기
        return clients.openWindow(targetUrl);
      })
    );
  } else if (event.action === 'close') {
    // 알림 닫기만
    console.log('알림 닫기');
  } else {
    // 기본 클릭 동작 (앱 열기)
    event.waitUntil(
      clients.matchAll({ type: 'window' }).then((clientList) => {
        if (clientList.length > 0) {
          // 기존 창이 있으면 포커스
          return clientList[0].focus();
        }
        // 새 창 열기
        return clients.openWindow('/');
      })
    );
  }
}); 