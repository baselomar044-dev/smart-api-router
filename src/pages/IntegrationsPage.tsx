// ============================================
// INTEGRATIONS PAGE - Themed Properly
// ============================================

import React, { useState } from 'react';
import { useStore } from '../store/useStore';
import { getTheme } from '../lib/themes';
import { Link2, Check, X, Search } from 'lucide-react';
import toast from 'react-hot-toast';

interface Integration {
  id: string;
  name: string;
  nameAr: string;
  description: string;
  descriptionAr: string;
  icon: string;
  connected: boolean;
  category: string;
}

const IntegrationsPage: React.FC = () => {
  const { theme, language } = useStore();
  const c = getTheme(theme);
  const isAr = language === 'ar';

  const [searchQuery, setSearchQuery] = useState('');
  const [filterCategory, setFilterCategory] = useState('all');

  const [integrations, setIntegrations] = useState<Integration[]>([
    { id: '1', name: 'Google Calendar', nameAr: 'تقويم جوجل', description: 'Sync your calendar events', descriptionAr: 'مزامنة أحداث التقويم', icon: '📅', connected: false, category: 'productivity' },
    { id: '2', name: 'Notion', nameAr: 'نوشن', description: 'Connect your Notion workspace', descriptionAr: 'ربط مساحة عمل نوشن', icon: '📓', connected: false, category: 'productivity' },
    { id: '3', name: 'Slack', nameAr: 'سلاك', description: 'Send messages to Slack', descriptionAr: 'إرسال رسائل إلى سلاك', icon: '💬', connected: false, category: 'communication' },
    { id: '4', name: 'Gmail', nameAr: 'جيميل', description: 'Read and send emails', descriptionAr: 'قراءة وإرسال البريد', icon: '📧', connected: false, category: 'communication' },
    { id: '5', name: 'GitHub', nameAr: 'جيت هب', description: 'Manage repositories', descriptionAr: 'إدارة المستودعات', icon: '💻', connected: false, category: 'development' },
    { id: '6', name: 'Trello', nameAr: 'تريلو', description: 'Manage your boards', descriptionAr: 'إدارة لوحاتك', icon: '📋', connected: false, category: 'productivity' },
    { id: '7', name: 'Discord', nameAr: 'ديسكورد', description: 'Send Discord messages', descriptionAr: 'إرسال رسائل ديسكورد', icon: '🎮', connected: false, category: 'communication' },
    { id: '8', name: 'Spotify', nameAr: 'سبوتيفاي', description: 'Control your music', descriptionAr: 'التحكم بالموسيقى', icon: '🎵', connected: false, category: 'entertainment' },
    { id: 'whatsapp', name: 'WhatsApp', nameAr: 'واتساب', description: 'Send messages via WhatsApp', descriptionAr: 'إرسال رسائل عبر واتساب', icon: '📱', connected: false, category: 'communication' },
    { id: 'telegram', name: 'Telegram', nameAr: 'تيليجرام', description: 'Telegram Bot integration', descriptionAr: 'تكامل بوت تيليجرام', icon: '✈️', connected: false, category: 'communication' },
  ]);

  const categories = [
    { id: 'all', name: 'All', nameAr: 'الكل' },
    { id: 'productivity', name: 'Productivity', nameAr: 'الإنتاجية' },
    { id: 'communication', name: 'Communication', nameAr: 'التواصل' },
    { id: 'development', name: 'Development', nameAr: 'التطوير' },
    { id: 'entertainment', name: 'Entertainment', nameAr: 'الترفيه' },
  ];

  const toggleConnection = (id: string) => {
    setIntegrations(prev => prev.map(i => {
      if (i.id === id) {
        const newStatus = !i.connected;
        toast.success(newStatus 
          ? (isAr ? `تم ربط ${i.nameAr}` : `Connected to ${i.name}`)
          : (isAr ? `تم فصل ${i.nameAr}` : `Disconnected from ${i.name}`)
        );
        return { ...i, connected: newStatus };
      }
      return i;
    }));
  };

  const filteredIntegrations = integrations.filter(i => {
    const matchesSearch = (isAr ? i.nameAr : i.name).toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = filterCategory === 'all' || i.category === filterCategory;
    return matchesSearch && matchesCategory;
  });

  const connectedCount = integrations.filter(i => i.connected).length;

  return (
    <div className={`h-full flex flex-col ${c.bg} p-6`}>
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className={`p-3 rounded-xl ${c.gradient}`}>
              <Link2 size={24} className="text-white" />
            </div>
            <div>
              <h1 className={`text-2xl font-bold ${c.text}`}>
                {isAr ? 'التكاملات' : 'Integrations'}
              </h1>
              <p className={c.textSecondary}>
                {isAr ? `${connectedCount} متصل` : `${connectedCount} connected`}
              </p>
            </div>
          </div>
        </div>

        {/* Search & Filters */}
        <div className="flex gap-3">
          <div className="relative flex-1">
            <Search size={18} className={`absolute left-3 top-1/2 -translate-y-1/2 ${c.textMuted}`} />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={isAr ? 'بحث...' : 'Search integrations...'}
              className={`w-full pl-10 pr-4 py-3 rounded-xl ${c.bgSecondary} ${c.text} border ${c.border} focus:outline-none focus:ring-2 focus:ring-neutral-500`}
            />
          </div>
        </div>

        {/* Category Tabs */}
        <div className="flex gap-2 mt-4 overflow-x-auto pb-2">
          {categories.map(cat => (
            <button
              key={cat.id}
              onClick={() => setFilterCategory(cat.id)}
              className={`
                px-4 py-2 rounded-xl whitespace-nowrap transition
                ${filterCategory === cat.id 
                  ? `${c.gradient} text-white` 
                  : `${c.bgSecondary} ${c.textSecondary} hover:opacity-80`
                }
              `}
            >
              {isAr ? cat.nameAr : cat.name}
            </button>
          ))}
        </div>
      </div>

      {/* Integrations Grid */}
      <div className="flex-1 overflow-y-auto">
        {filteredIntegrations.length === 0 ? (
          <div className={`text-center py-12 ${c.textMuted}`}>
            <Link2 size={60} className="mx-auto mb-4 opacity-30" />
            <p className="text-lg">{isAr ? 'لا توجد تكاملات' : 'No integrations found'}</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {filteredIntegrations.map(integration => (
              <div
                key={integration.id}
                className={`p-4 rounded-xl ${c.bgSecondary} border ${c.border} hover:opacity-90 transition`}
              >
                <div className="flex items-start justify-between mb-3">
                  <span className="text-3xl">{integration.icon}</span>
                  <span className={`
                    px-2 py-1 rounded-full text-xs font-medium
                    ${integration.connected 
                      ? 'bg-green-500/20 text-green-400 border border-green-500/30' 
                      : `${c.bgTertiary} ${c.textMuted}`
                    }
                  `}>
                    {integration.connected 
                      ? (isAr ? 'متصل' : 'Connected')
                      : (isAr ? 'غير متصل' : 'Not connected')
                    }
                  </span>
                </div>
                
                <h3 className={`font-bold ${c.text} mb-1`}>
                  {isAr ? integration.nameAr : integration.name}
                </h3>
                <p className={`text-sm ${c.textSecondary} mb-4`}>
                  {isAr ? integration.descriptionAr : integration.description}
                </p>
                
                <button
                  onClick={() => toggleConnection(integration.id)}
                  className={`
                    w-full py-2 rounded-xl font-medium flex items-center justify-center gap-2 transition
                    ${integration.connected 
                      ? 'bg-red-500/20 text-red-400 hover:bg-red-500/30' 
                      : `${c.gradient} text-white hover:opacity-90`
                    }
                  `}
                >
                  {integration.connected ? (
                    <>
                      <X size={16} />
                      {isAr ? 'فصل' : 'Disconnect'}
                    </>
                  ) : (
                    <>
                      <Check size={16} />
                      {isAr ? 'ربط' : 'Connect'}
                    </>
                  )}
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default IntegrationsPage;
