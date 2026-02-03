// ============================================
// MEMORY PAGE - Themed Properly
// ============================================

import React, { useState, useEffect } from 'react';
import { useStore } from '../store/useStore';
import { getTheme } from '../lib/themes';
import { Brain, Search, Trash2, Calendar, Plus, Save, X } from 'lucide-react';
import toast from 'react-hot-toast';

interface Memory {
  id: string;
  type: 'fact' | 'preference' | 'context' | 'important';
  content: string;
  timestamp: string;
  source: string;
}

const MemoryPage: React.FC = () => {
  const { theme, language } = useStore();
  const c = getTheme(theme);
  const isAr = language === 'ar';

  const [memories, setMemories] = useState<Memory[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<string>('all');
  const [showAddModal, setShowAddModal] = useState(false);
  const [newMemory, setNewMemory] = useState({ content: '', type: 'fact' as const });

  // Load memories from localStorage
  useEffect(() => {
    const saved = localStorage.getItem('tryit-memories');
    if (saved) {
      setMemories(JSON.parse(saved));
    } else {
      // Sample memories for demo
      const sampleMemories: Memory[] = [
        { id: '1', type: 'preference', content: isAr ? 'يفضل الردود باللغة العربية' : 'Prefers responses in Arabic', timestamp: new Date().toISOString(), source: 'chat' },
        { id: '2', type: 'fact', content: isAr ? 'يعمل كمطور برامج' : 'Works as a software developer', timestamp: new Date().toISOString(), source: 'chat' },
      ];
      setMemories(sampleMemories);
    }
  }, [isAr]);

  const deleteMemory = (id: string) => {
    const updated = memories.filter(m => m.id !== id);
    localStorage.setItem('tryit-memories', JSON.stringify(updated));
    setMemories(updated);
    toast.success(isAr ? 'تم الحذف' : 'Deleted');
  };

  const clearAllMemories = () => {
    if (confirm(isAr ? 'هل أنت متأكد من حذف كل الذكريات؟' : 'Are you sure you want to clear all memories?')) {
      localStorage.removeItem('tryit-memories');
      setMemories([]);
      toast.success(isAr ? 'تم مسح الكل' : 'All cleared');
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'fact': return 'bg-neutral-500/20 text-neutral-300 border-neutral-500/30';
      case 'preference': return 'bg-purple-500/20 text-purple-400 border-purple-500/30';
      case 'context': return 'bg-green-500/20 text-green-400 border-green-500/30';
      case 'important': return 'bg-red-500/20 text-red-400 border-red-500/30';
      default: return `${c.bgTertiary} ${c.textSecondary}`;
    }
  };

  const getTypeLabel = (type: string) => {
    const labels: Record<string, { ar: string; en: string }> = {
      fact: { ar: 'حقيقة', en: 'Fact' },
      preference: { ar: 'تفضيل', en: 'Preference' },
      context: { ar: 'سياق', en: 'Context' },
      important: { ar: 'مهم', en: 'Important' },
    };
    return isAr ? labels[type]?.ar || type : labels[type]?.en || type;
  };

  const filteredMemories = memories.filter(m => {
    const matchesSearch = m.content.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesType = filterType === 'all' || m.type === filterType;
    return matchesSearch && matchesType;
  });

  return (
    <div className={`h-full flex flex-col ${c.bg} p-6`}>
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className={`p-3 rounded-xl ${c.gradient}`}>
              <Brain size={24} className="text-white" />
            </div>
            <div>
              <h1 className={`text-2xl font-bold ${c.text}`}>
                {isAr ? 'ذاكرة Try-It!' : 'Try-It! Memory'}
              </h1>
              <p className={c.textSecondary}>
                {isAr ? 'ما يتذكره عنك' : 'What I remember about you'}
              </p>
            </div>
          </div>
          
          <button
            onClick={clearAllMemories}
            className={`px-4 py-2 rounded-lg text-red-400 hover:bg-red-500/10 transition flex items-center gap-2`}
          >
            <Trash2 size={18} />
            {isAr ? 'مسح الكل' : 'Clear All'}
          </button>
        </div>

        {/* Search & Filters */}
        <div className="flex gap-3">
          <div className="relative flex-1">
            <Search size={18} className={`absolute left-3 top-1/2 -translate-y-1/2 ${c.textMuted}`} />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={isAr ? 'بحث في الذاكرة...' : 'Search memories...'}
              className={`w-full pl-10 pr-4 py-3 rounded-xl ${c.bgSecondary} ${c.text} border ${c.border} focus:outline-none focus:ring-2 focus:ring-neutral-500`}
            />
          </div>
          
          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            className={`px-4 py-3 rounded-xl ${c.bgSecondary} ${c.text} border ${c.border} focus:outline-none`}
          >
            <option value="all">{isAr ? 'الكل' : 'All Types'}</option>
            <option value="fact">{isAr ? 'حقائق' : 'Facts'}</option>
            <option value="preference">{isAr ? 'تفضيلات' : 'Preferences'}</option>
            <option value="context">{isAr ? 'سياق' : 'Context'}</option>
            <option value="important">{isAr ? 'مهم' : 'Important'}</option>
          </select>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-4 mb-6">
        {['fact', 'preference', 'context', 'important'].map(type => (
          <div key={type} className={`p-4 rounded-xl ${c.bgSecondary} border ${c.border}`}>
            <div className={`text-2xl font-bold ${c.text}`}>
              {memories.filter(m => m.type === type).length}
            </div>
            <div className={c.textSecondary}>{getTypeLabel(type)}</div>
          </div>
        ))}
      </div>

      {/* Memories List */}
      <div className="flex-1 overflow-y-auto space-y-3">
        {filteredMemories.length === 0 ? (
          <div className={`text-center py-12 ${c.textMuted}`}>
            <Brain size={60} className="mx-auto mb-4 opacity-30" />
            <p className="text-lg">{isAr ? 'لا توجد ذكريات بعد' : 'No memories yet'}</p>
            <p className="text-sm mt-2">
              {isAr ? 'سيتم تخزين المعلومات من محادثاتك هنا' : 'Information from your chats will be stored here'}
            </p>
          </div>
        ) : (
          filteredMemories.map(memory => (
            <div
              key={memory.id}
              className={`group p-4 rounded-xl ${c.bgSecondary} border ${c.border} hover:opacity-90 transition`}
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <span className={`px-2 py-1 rounded-lg text-xs font-medium border ${getTypeColor(memory.type)}`}>
                      {getTypeLabel(memory.type)}
                    </span>
                    <span className={`text-xs ${c.textMuted} flex items-center gap-1`}>
                      <Calendar size={12} />
                      {new Date(memory.timestamp).toLocaleDateString(isAr ? 'ar-EG' : 'en-US')}
                    </span>
                    {memory.source === 'manual' && (
                       <span className={`text-xs bg-gray-500/20 text-gray-400 px-1 rounded`}>Manual</span>
                    )}
                  </div>
                  <p className={c.text}>{memory.content}</p>
                </div>
                
                <button
                  onClick={() => deleteMemory(memory.id)}
                  className="opacity-0 group-hover:opacity-100 p-2 text-red-400 hover:bg-red-500/10 rounded-lg transition"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Add Memory Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className={`w-full max-w-md ${c.bgSecondary} rounded-2xl border ${c.border} shadow-2xl overflow-hidden`}>
            <div className={`p-4 border-b ${c.border} flex items-center justify-between`}>
              <h3 className={`font-bold ${c.text}`}>{isAr ? 'إضافة ذاكرة جديدة' : 'Add New Memory'}</h3>
              <button onClick={() => setShowAddModal(false)} className={`p-1 rounded hover:bg-gray-500/10 ${c.text}`}>
                <X size={20} />
              </button>
            </div>
            
            <div className="p-4 space-y-4">
              <div>
                <label className={`block text-sm font-medium ${c.textSecondary} mb-1`}>
                  {isAr ? 'النوع' : 'Type'}
                </label>
                <select
                  value={newMemory.type}
                  onChange={(e) => setNewMemory({ ...newMemory, type: e.target.value as any })}
                  className={`w-full px-3 py-2 rounded-lg ${c.bgTertiary} ${c.text} border ${c.border}`}
                >
                  <option value="fact">{isAr ? 'حقيقة' : 'Fact'}</option>
                  <option value="preference">{isAr ? 'تفضيل' : 'Preference'}</option>
                  <option value="context">{isAr ? 'سياق' : 'Context'}</option>
                  <option value="important">{isAr ? 'مهم' : 'Important'}</option>
                </select>
              </div>
              
              <div>
                <label className={`block text-sm font-medium ${c.textSecondary} mb-1`}>
                  {isAr ? 'المحتوى' : 'Content'}
                </label>
                <textarea
                  value={newMemory.content}
                  onChange={(e) => setNewMemory({ ...newMemory, content: e.target.value })}
                  rows={4}
                  className={`w-full px-3 py-2 rounded-lg ${c.bgTertiary} ${c.text} border ${c.border} resize-none`}
                  placeholder={isAr ? 'اكتب شيئاً لتتذكره...' : 'Write something to remember...'}
                />
              </div>
            </div>
            
            <div className={`p-4 border-t ${c.border} flex justify-end gap-2`}>
              <button
                onClick={() => setShowAddModal(false)}
                className={`px-4 py-2 rounded-lg ${c.bgTertiary} ${c.text} hover:opacity-80`}
              >
                {isAr ? 'إلغاء' : 'Cancel'}
              </button>
              <button
                onClick={addMemory}
                disabled={!newMemory.content.trim()}
                className={`px-4 py-2 rounded-lg ${c.gradient} text-white hover:opacity-90 flex items-center gap-2`}
              >
                <Save size={18} />
                {isAr ? 'حفظ' : 'Save'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MemoryPage;
