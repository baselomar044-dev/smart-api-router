// ============================================
// SIDEBAR - With Sliding Conversations Panel
// ============================================

import React, { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useStore } from '../store/useStore';
import { getTheme, isDarkTheme } from '../lib/themes';
import { ChevronLeft, ChevronRight, Plus, MessageSquare, Trash2, LogOut, X, History } from 'lucide-react';

const Sidebar: React.FC = () => {
  const { 
    user, 
    theme, 
    language,
    sidebarCollapsed, 
    setSidebarCollapsed, 
    setUser,
    conversations,
    activeConversationId,
    setActiveConversation,
    createConversation,
    deleteConversation,
  } = useStore();
  
  const navigate = useNavigate();
  const c = getTheme(theme);
  const isAr = language === 'ar';
  const isDark = isDarkTheme(theme);
  
  // Conversations panel state
  const [showConversations, setShowConversations] = useState(false);

  const menuItems = [
    { icon: '💬', label: isAr ? 'المحادثات' : 'Chat', path: '/chat' },
    { icon: '📝', label: isAr ? 'ملاحظاتي' : 'Notes', path: '/notes' },
    { icon: '🎙️', label: isAr ? 'مكالمة صوتية' : 'Voice Call', path: '/voice' },
    { icon: '🤖', label: isAr ? 'الوكلاء' : 'Agents', path: '/agents' },
    { icon: '🔗', label: isAr ? 'التكاملات' : 'Integrations', path: '/integrations' },
    { icon: '🧠', label: isAr ? 'الذاكرة' : 'Memory', path: '/memory' },
    { icon: '🖥️', label: isAr ? 'التحكم بالحاسوب' : 'Computer Use', path: '/computer' },
    { icon: '📊', label: isAr ? 'التحليلات' : 'Analytics', path: '/analytics' },
    { icon: '👑', label: isAr ? 'لوحة التحكم' : 'Admin', path: '/admin', isAdmin: true },
    { icon: '⚙️', label: isAr ? 'الإعدادات' : 'Settings', path: '/settings' },
  ];

  const handleLogout = () => {
    setUser(null);
    navigate('/login');
  };

  const handleNewChat = async () => {
    await createConversation(isAr ? 'محادثة جديدة' : 'New Chat');
    navigate('/chat');
    setShowConversations(false);
  };

  const handleSelectConversation = (id: string) => {
    setActiveConversation(id);
    navigate('/chat');
    setShowConversations(false);
  };

  const sidebarWidth = sidebarCollapsed ? 80 : 288; // 80px = w-20, 288px = w-72

  return (
    <>
      {/* Main Sidebar */}
      <aside 
        className={`
          ${sidebarCollapsed ? 'w-20' : 'w-72'} 
          transition-all duration-300 
          ${c.bgSecondary} ${c.border} border-r
          flex flex-col h-full relative z-50
        `}
      >
        {/* Logo */}
        <div className={`p-4 border-b ${c.border}`}>
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 ${c.gradient} rounded-xl flex items-center justify-center shadow-lg flex-shrink-0`}>
              <span className="text-xl font-bold text-white">T</span>
            </div>
            {!sidebarCollapsed && (
              <div>
                <h1 className={`font-bold text-lg ${c.text}`}>Try-It!</h1>
                <p className={c.textSecondary + ' text-xs'}>
                  {isAr ? 'AI مجاني 100%' : '100% Free AI'}
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Collapse Button */}
        <button
          onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
          className={`
            absolute top-4 -right-3
            w-6 h-6 rounded-full shadow-lg 
            flex items-center justify-center 
            ${c.bgTertiary} ${c.text} 
            hover:opacity-80 z-50 border ${c.border}
          `}
        >
          {sidebarCollapsed ? <ChevronRight size={14} /> : <ChevronLeft size={14} />}
        </button>

        {/* New Chat & Conversations Buttons */}
        <div className="p-3 space-y-2">
          {/* New Chat Button */}
          <button
            onClick={handleNewChat}
            className={`
              w-full ${c.gradient} text-white py-3 px-4 rounded-xl 
              font-medium flex items-center justify-center gap-2 
              hover:opacity-90 transition shadow-lg
            `}
            title={sidebarCollapsed ? (isAr ? 'محادثة جديدة' : 'New Chat') : undefined}
          >
            <Plus size={18} />
            {!sidebarCollapsed && <span>{isAr ? 'محادثة جديدة' : 'New Chat'}</span>}
          </button>
          
          {/* Conversations Toggle Button - Always Visible */}
          <button
            onClick={() => setShowConversations(true)}
            className={`
              w-full ${c.bgTertiary} ${c.text} py-2 px-4 rounded-xl 
              font-medium flex items-center justify-center gap-2 
              hover:opacity-80 transition border ${c.border}
            `}
            title={sidebarCollapsed ? (isAr ? 'المحادثات السابقة' : 'Past Conversations') : undefined}
          >
            <History size={16} />
            {!sidebarCollapsed && (
              <span>
                {isAr ? 'المحادثات السابقة' : 'History'} 
                {conversations.length > 0 && ` (${conversations.length})`}
              </span>
            )}
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
          {menuItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) => `
                flex items-center gap-3 px-3 py-3 rounded-xl transition-all
                ${sidebarCollapsed ? 'justify-center' : ''}
                ${isActive 
                  ? `${c.sidebarActive} border ${c.border}` 
                  : `${c.textSecondary} ${c.sidebarHover} hover:${c.text}`
                }
              `}
              title={sidebarCollapsed ? item.label : undefined}
            >
              <span className="text-xl flex-shrink-0">{item.icon}</span>
              {!sidebarCollapsed && (
                <span className="font-medium text-sm">{item.label}</span>
              )}
            </NavLink>
          ))}
        </nav>

        {/* User Info */}
        <div className={`p-3 border-t ${c.border}`}>
          <div className={`flex items-center gap-3 p-3 rounded-xl ${c.bgTertiary}`}>
            <div className={`w-10 h-10 ${c.gradient} rounded-full flex items-center justify-center text-white font-bold flex-shrink-0`}>
              {user?.name?.[0]?.toUpperCase() || '👤'}
            </div>
            {!sidebarCollapsed && (
              <div className="flex-1 min-w-0">
                <p className={`font-medium text-sm truncate ${c.text}`}>
                  {user?.name || (isAr ? 'المستخدم' : 'User')}
                </p>
                <p className={`text-xs truncate ${c.textSecondary}`}>
                  {user?.email}
                </p>
              </div>
            )}
          </div>
          
          {/* Logout Button */}
          <button
            onClick={handleLogout}
            className={`
              w-full mt-2 flex items-center gap-3 px-3 py-2 rounded-xl 
              transition ${sidebarCollapsed ? 'justify-center' : ''} 
              text-red-400 hover:bg-red-500/10
            `}
            title={sidebarCollapsed ? (isAr ? 'تسجيل الخروج' : 'Logout') : undefined}
          >
            <LogOut size={18} />
            {!sidebarCollapsed && <span className="text-sm">{isAr ? 'تسجيل الخروج' : 'Logout'}</span>}
          </button>
        </div>
      </aside>

      {/* Sliding Conversations Panel - Slides from left edge */}
      <div 
        className={`
          fixed inset-y-0 left-0 w-80 
          ${c.bgSecondary} ${c.border} border-r
          transform transition-transform duration-300 ease-in-out z-[60]
          ${showConversations ? 'translate-x-0' : '-translate-x-full'}
          shadow-2xl
        `}
      >
        {/* Panel Header */}
        <div className={`p-4 border-b ${c.border} flex items-center justify-between`}>
          <h2 className={`font-bold text-lg ${c.text}`}>
            {isAr ? 'المحادثات السابقة' : 'Conversation History'}
          </h2>
          <button
            onClick={() => setShowConversations(false)}
            className={`p-2 rounded-lg ${c.bgTertiary} ${c.text} hover:opacity-80 transition`}
          >
            <X size={18} />
          </button>
        </div>

        {/* New Chat Button in Panel */}
        <div className={`p-3 border-b ${c.border}`}>
          <button
            onClick={handleNewChat}
            className={`
              w-full ${c.gradient} text-white py-3 px-4 rounded-xl 
              font-medium flex items-center justify-center gap-2 
              hover:opacity-90 transition shadow-lg
            `}
          >
            <Plus size={18} />
            <span>{isAr ? 'محادثة جديدة' : 'New Chat'}</span>
          </button>
        </div>

        {/* Conversations List */}
        <div className="overflow-y-auto h-[calc(100%-140px)] p-3">
          {conversations.length === 0 ? (
            <div className={`text-center py-8 ${c.textMuted}`}>
              <MessageSquare size={40} className="mx-auto mb-3 opacity-50" />
              <p>{isAr ? 'لا توجد محادثات بعد' : 'No conversations yet'}</p>
            </div>
          ) : (
            <div className="space-y-2">
              {conversations.map((conv) => (
                <div
                  key={conv.id}
                  className={`
                    group flex items-center gap-3 p-3 rounded-xl cursor-pointer transition
                    ${activeConversationId === conv.id
                      ? `${c.sidebarActive} border ${c.border}`
                      : `${c.bgTertiary} ${c.text} hover:opacity-80`
                    }
                  `}
                  onClick={() => handleSelectConversation(conv.id)}
                >
                  <MessageSquare size={18} className={c.textSecondary} />
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm truncate">{conv.title}</p>
                    <p className={`text-xs ${c.textMuted} truncate`}>
                      {new Date(conv.updatedAt).toLocaleDateString(isAr ? 'ar-EG' : 'en-US')}
                    </p>
                  </div>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      deleteConversation(conv.id);
                    }}
                    className="opacity-0 group-hover:opacity-100 p-1.5 text-red-400 hover:text-red-500 hover:bg-red-500/10 rounded-lg transition"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Overlay when conversations panel is open */}
      {showConversations && (
        <div 
          className="fixed inset-0 bg-black/50 z-[55] backdrop-blur-sm"
          onClick={() => setShowConversations(false)}
        />
      )}
    </>
  );
};

export default Sidebar;
