'use client'

import { useAppStore, Theme } from '@/lib/store'
import { Sun, Moon, Waves, Heart } from 'lucide-react'

const themes: { id: Theme; nameAr: string; nameEn: string; icon: any; colors: string[] }[] = [
  { 
    id: 'light', 
    nameAr: 'فاتح', 
    nameEn: 'Light',
    icon: Sun,
    colors: ['#ffffff', '#f3f4f6', '#8b5cf6']
  },
  { 
    id: 'dark', 
    nameAr: 'أسود', 
    nameEn: 'Black',
    icon: Moon,
    colors: ['#0a0a0a', '#171717', '#a78bfa']
  },
  { 
    id: 'dark-blue', 
    nameAr: 'أزرق', 
    nameEn: 'Blue',
    icon: Waves,
    colors: ['#0f172a', '#1e293b', '#3b82f6']
  },
  { 
    id: 'pink', 
    nameAr: 'وردي', 
    nameEn: 'Pink',
    icon: Heart,
    colors: ['#1a0a14', '#2d1522', '#ec4899']
  },
]

export function ThemeSelector() {
  const { theme, setTheme, language } = useAppStore()
  const isArabic = language === 'ar'
  
  return (
    <div className="grid grid-cols-2 gap-3">
      {themes.map((t) => {
        const Icon = t.icon
        const isActive = theme === t.id
        
        return (
          <button
            key={t.id}
            onClick={() => setTheme(t.id)}
            className={`
              relative flex flex-col items-center gap-2 p-4 rounded-xl
              border-2 transition-all duration-200
              ${isActive 
                ? 'border-purple-500 ring-2 ring-purple-500/30' 
                : 'border-gray-600 hover:border-gray-500'
              }
            `}
            style={{
              background: `linear-gradient(135deg, ${t.colors[0]} 0%, ${t.colors[1]} 100%)`
            }}
          >
            {/* Theme preview circles */}
            <div className="flex gap-1.5 mb-1">
              {t.colors.map((color, i) => (
                <div 
                  key={i}
                  className="w-4 h-4 rounded-full border border-white/20"
                  style={{ backgroundColor: color }}
                />
              ))}
            </div>
            
            {/* Icon */}
            <Icon 
              className="w-6 h-6" 
              style={{ color: t.colors[2] }}
            />
            
            {/* Name */}
            <span 
              className="text-sm font-medium"
              style={{ color: t.id === 'light' ? '#111827' : '#fafafa' }}
            >
              {isArabic ? t.nameAr : t.nameEn}
            </span>
            
            {/* Active indicator */}
            {isActive && (
              <div 
                className="absolute top-2 right-2 w-3 h-3 rounded-full"
                style={{ backgroundColor: t.colors[2] }}
              />
            )}
          </button>
        )
      })}
    </div>
  )
}
