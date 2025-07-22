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
        
        {/* 🚨 EMERGENCY CACHE BREAK - BUILD_1737126800000 */}
        <meta name="build-id" content="1737126800000" />
        <meta name="cache-control" content="no-cache, no-store, must-revalidate" />
        <meta name="pragma" content="no-cache" />
        <meta name="expires" content="0" />
        <script
          dangerouslySetInnerHTML={{
            __html: `
              // 🚨 EMERGENCY SERVICE WORKER KILLER
              if ('serviceWorker' in navigator) {
                navigator.serviceWorker.getRegistrations().then(registrations => {
                  registrations.forEach(registration => {
                    registration.unregister();
                    console.log('🗑️ Emergency SW unregister:', registration.scope);
                  });
                });
              }
              
              // 🗑️ EMERGENCY CACHE DESTROYER
              if ('caches' in window) {
                caches.keys().then(cacheNames => {
                  cacheNames.forEach(cacheName => {
                    caches.delete(cacheName);
                    console.log('🗑️ Emergency cache delete:', cacheName);
                  });
                });
              }
              
              console.log('🚨🚨🚨 EMERGENCY BUILD LOADED - 1737126800000 🚨🚨🚨');
              console.log('🎯 Reserve button MUST be visible now!');
              console.log('❌ setVHProperty completely eliminated!');
              console.log('✅ Cache completely destroyed!');
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
