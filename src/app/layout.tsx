import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import Layout from "@/components/Layout";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "KRC 당근",
  description: "KRC 내부 중고거래 마켓플레이스",
  manifest: '/manifest.json',
  themeColor: '#f9fafb',
  viewport: 'width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no, viewport-fit=cover, shrink-to-fit=no',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'KRC 당근',
  },
  icons: {
    icon: [
      { url: '/icons/icon-192x192.png', sizes: '192x192', type: 'image/png' },
      { url: '/icons/icon-512x512.png', sizes: '512x512', type: 'image/png' }
    ],
    apple: [
      { url: '/icons/icon-152x152.png', sizes: '152x152', type: 'image/png' },
      { url: '/icons/icon-192x192.png', sizes: '192x192', type: 'image/png' }
    ]
  }
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko">
      <head>
        <link rel="manifest" href="/manifest.json" />
        <meta name="theme-color" content="#f9fafb" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="apple-mobile-web-app-title" content="KRC 당근" />
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no, viewport-fit=cover, shrink-to-fit=no" />
        
        {/* iOS Safari 추가 최적화 */}
        <meta name="format-detection" content="telephone=no" />
        <meta name="msapplication-tap-highlight" content="no" />
        <meta name="apple-touch-fullscreen" content="yes" />
        
        <link rel="apple-touch-icon" href="/icons/icon-152x152.png" />
        <link rel="apple-touch-icon" sizes="152x152" href="/icons/icon-152x152.png" />
        <link rel="apple-touch-icon" sizes="192x192" href="/icons/icon-192x192.png" />
        
        {/* 동적 Viewport Height 계산 스크립트 */}
        <script
          dangerouslySetInnerHTML={{
            __html: `
              // 동적 viewport height 계산 및 CSS 변수 설정
              function setVHProperty() {
                const vh = window.innerHeight * 0.01;
                const vw = window.innerWidth * 0.01;
                document.documentElement.style.setProperty('--vh', vh + 'px');
                document.documentElement.style.setProperty('--vw', vw + 'px');
                document.documentElement.style.setProperty('--app-height', window.innerHeight + 'px');
                
                // 배경색 강제 설정
                document.documentElement.style.backgroundColor = '#f9fafb';
                document.body.style.backgroundColor = '#f9fafb';
              }
              
              // 초기 설정
              setVHProperty();
              
              // 리사이즈 이벤트 리스너
              window.addEventListener('resize', setVHProperty);
              window.addEventListener('orientationchange', function() {
                setTimeout(setVHProperty, 100);
              });
              
              // 페이지 로드 완료 시 재설정
              window.addEventListener('load', setVHProperty);
              
              // DOM이 준비되면 실행
              if (document.readyState === 'loading') {
                document.addEventListener('DOMContentLoaded', setVHProperty);
              } else {
                setVHProperty();
              }
            `,
          }}
        />
        
        {/* Service Worker 등록 */}
        <script
          dangerouslySetInnerHTML={{
            __html: `
              if ('serviceWorker' in navigator) {
                window.addEventListener('load', function() {
                  navigator.serviceWorker.register('/sw.js')
                    .then(function(registration) {
                      console.log('SW registered: ', registration);
                    })
                    .catch(function(registrationError) {
                      console.log('SW registration failed: ', registrationError);
                    });
                });
              }
            `,
          }}
        />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <Layout>{children}</Layout>
      </body>
    </html>
  );
}
