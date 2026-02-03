import type { Metadata, Viewport } from 'next'
import { ThemeProvider } from '@/components/ThemeProvider'
import './globals.css'

export const metadata: Metadata = {
  title: 'SolveIt - AI Development Platform',
  description: 'منصة تطوير ذكية بالذكاء الاصطناعي - AI-Powered Development Platform',
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'SolveIt',
  },
  formatDetection: {
    telephone: false,
  },
  icons: {
    icon: [
      { url: '/icons/icon-72x72.png', sizes: '72x72', type: 'image/png' },
      { url: '/icons/icon-96x96.png', sizes: '96x96', type: 'image/png' },
      { url: '/icons/icon-128x128.png', sizes: '128x128', type: 'image/png' },
      { url: '/icons/icon-192x192.png', sizes: '192x192', type: 'image/png' },
      { url: '/icons/icon-512x512.png', sizes: '512x512', type: 'image/png' },
    ],
    apple: [
      { url: '/icons/icon-152x152.png', sizes: '152x152', type: 'image/png' },
      { url: '/icons/icon-192x192.png', sizes: '192x192', type: 'image/png' },
    ],
  },
}

export const viewport: Viewport = {
  themeColor: '#8b5cf6',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="ar" dir="rtl" suppressHydrationWarning>
      <head>
        {/* PWA Meta Tags */}
        <meta name="application-name" content="SolveIt" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <meta name="apple-mobile-web-app-title" content="SolveIt" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="msapplication-TileColor" content="#8b5cf6" />
        <meta name="msapplication-tap-highlight" content="no" />
        
        {/* Apple Touch Icons */}
        <link rel="apple-touch-icon" href="/icons/icon-152x152.png" />
        <link rel="apple-touch-icon" sizes="152x152" href="/icons/icon-152x152.png" />
        <link rel="apple-touch-icon" sizes="192x192" href="/icons/icon-192x192.png" />
        
        {/* Splash Screens for iOS */}
        <meta name="apple-mobile-web-app-capable" content="yes" />
      </head>
      <body>
        <ThemeProvider
          attribute="class"
          defaultTheme="dark"
          enableSystem
          disableTransitionOnChange={false}
        >
          {children}
        </ThemeProvider>
        
        {/* Service Worker Registration */}
        <script
          dangerouslySetInnerHTML={{
            __html: `
              if ('serviceWorker' in navigator) {
                window.addEventListener('load', function() {
                  navigator.serviceWorker.register('/sw.js')
                    .then(function(registration) {
                      console.log('✅ PWA Service Worker registered:', registration.scope);
                    })
                    .catch(function(error) {
                      console.log('❌ PWA Service Worker registration failed:', error);
                    });
                });
              }
            `,
          }}
        />
      </body>
    </html>
  )
}
