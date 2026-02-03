'use client'

import { useEffect } from 'react'
import { useAppStore, Theme } from '@/lib/store'

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const { theme } = useAppStore()
  
  useEffect(() => {
    // Apply theme to document
    const root = document.documentElement
    
    // Set data-theme attribute for CSS variables
    root.setAttribute('data-theme', theme)
    
    // Handle Tailwind dark mode class
    if (theme === 'light') {
      root.classList.remove('dark')
    } else {
      // All other themes are dark variants
      root.classList.add('dark')
    }
    
    // Update meta theme-color for mobile browsers
    const metaThemeColor = document.querySelector('meta[name="theme-color"]')
    if (metaThemeColor) {
      const colors: Record<Theme, string> = {
        'light': '#ffffff',
        'dark': '#0a0a0a',
        'dark-blue': '#0f172a',
        'pink': '#1a0a14'
      }
      metaThemeColor.setAttribute('content', colors[theme])
    }
  }, [theme])
  
  return <>{children}</>
}
