'use client';

// ============================================
// SOLVE IT! - Library (5 Records)
// ============================================

import { useState } from 'react';
import { useAppStore } from '@/lib/store';
import { translations } from '@/lib/i18n';
import { Note, NoteCategory } from '@/lib/types';

type TabType = 'projects' | 'conversations' | 'agents' | 'tools' | 'workflows' | 'notes';

export default function Library() {
  const { 
    language, 
    projects, 
    conversations, 
    agents, 
    tools, 
    workflows, 
    notes,
    deleteProject,
    deleteConversation,
    deleteAgent,
    deleteTool,
    deleteWorkflow,
    addNote,
    updateNote,
    deleteNote,
    setCurrentService,
    toggleFavorite,
    isFavorite,
    favorites
  } = useAppStore();
  
  const t = translations[language];
  const isRTL = language === 'ar';
  
  const [activeTab, setActiveTab] = useState<TabType>('projects');
  const [searchQuery, setSearchQuery] = useState('');
  const [showFavoritesOnly, setShowFavoritesOnly] = useState(false);
  const [showNoteModal, setShowNoteModal] = useState(false);
  const [editingNote, setEditingNote] = useState<Note | null>(null);
  const [noteForm, setNoteForm] = useState({
    title: '',
    content: '',
    category: 'general' as NoteCategory,
    tags: ''
  });

  const tabs: { id: TabType; label: string; icon: string; count: number }[] = [
    { id: 'projects', label: isRTL ? 'المشاريع' : 'Projects', icon: '📁', count: projects.length },
    { id: 'conversations', label: isRTL ? 'المحادثات' : 'Conversations', icon: '💬', count: conversations.length },
    { id: 'agents', label: isRTL ? 'الوكلاء' : 'Agents', icon: '🤖', count: agents.length },
    { id: 'tools', label: isRTL ? 'الأدوات' : 'Tools', icon: '🔧', count: tools.length },
    { id: 'workflows', label: isRTL ? 'سير العمل' : 'Workflows', icon: '⚡', count: workflows.length },
    { id: 'notes', label: isRTL ? 'الملاحظات' : 'Notes', icon: '📝', count: notes.length },
  ];

  const categoryLabels: Record<NoteCategory, { ar: string; en: string }> = {
    general: { ar: 'عام', en: 'General' },
    idea: { ar: 'فكرة', en: 'Idea' },
    todo: { ar: 'مهمة', en: 'Todo' },
    reference: { ar: 'مرجع', en: 'Reference' },
    bug: { ar: 'خطأ', en: 'Bug' },
    feature: { ar: 'ميزة', en: 'Feature' },
  };

  const categoryColors: Record<NoteCategory, string> = {
    general: 'bg-gray-500',
    idea: 'bg-yellow-500',
    todo: 'bg-blue-500',
    reference: 'bg-purple-500',
    bug: 'bg-red-500',
    feature: 'bg-green-500',
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString(isRTL ? 'ar-EG' : 'en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const handleSaveNote = () => {
    const now = new Date().toISOString();
    const tags = noteForm.tags.split(',').map(t => t.trim()).filter(t => t);
    
    if (editingNote) {
      updateNote(editingNote.id, {
        title: noteForm.title,
        content: noteForm.content,
        category: noteForm.category,
        tags
      });
    } else {
      const newNote: Note = {
        id: `note_${Date.now()}`,
        title: noteForm.title,
        content: noteForm.content,
        category: noteForm.category,
        tags,
        createdAt: now,
        updatedAt: now
      };
      addNote(newNote);
    }
    
    setShowNoteModal(false);
    setEditingNote(null);
    setNoteForm({ title: '', content: '', category: 'general', tags: '' });
  };

  const openEditNote = (note: Note) => {
    setEditingNote(note);
    setNoteForm({
      title: note.title,
      content: note.content,
      category: note.category,
      tags: note.tags.join(', ')
    });
    setShowNoteModal(true);
  };

  const filterItems = <T extends { id: string; name?: string; title?: string; description?: string }>(items: T[], type: string): T[] => {
    let filtered = items;
    
    // Filter by favorites
    if (showFavoritesOnly) {
      filtered = filtered.filter(item => isFavorite(type, item.id));
    }
    
    // Filter by search
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(item => 
        (item.name?.toLowerCase().includes(query)) ||
        (item.title?.toLowerCase().includes(query)) ||
        (item.description?.toLowerCase().includes(query))
      );
    }
    
    return filtered;
  };
  
  // Star button component
  const StarButton = ({ type, id }: { type: string; id: string }) => (
    <button
      onClick={(e) => { e.stopPropagation(); toggleFavorite(type, id); }}
      className={`p-1 transition ${isFavorite(type, id) ? 'text-yellow-500' : 'text-gray-400 hover:text-yellow-500'}`}
      title={isFavorite(type, id) ? (isRTL ? 'إزالة من المفضلة' : 'Remove from favorites') : (isRTL ? 'أضف للمفضلة' : 'Add to favorites')}
    >
      {isFavorite(type, id) ? '⭐' : '☆'}
    </button>
  );

  const renderEmptyState = (message: string) => (
    <div className="flex flex-col items-center justify-center py-16 text-gray-500">
      <div className="text-6xl mb-4">📭</div>
      <p className="text-lg">{message}</p>
    </div>
  );

  const renderProjects = () => {
    const filtered = filterItems(projects, 'project');
    if (filtered.length === 0) return renderEmptyState(isRTL ? 'لا توجد مشاريع' : 'No projects yet');
    
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filtered.map(project => (
          <div key={project.id} className="bg-white dark:bg-gray-800 rounded-xl p-5 border border-gray-200 dark:border-gray-700 hover:shadow-lg transition-shadow">
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-center gap-3">
                <span className="text-3xl">📁</span>
                <div>
                  <h3 className="font-semibold text-lg">{project.name}</h3>
                  <p className="text-sm text-gray-500">{project.pages?.length || 0} {isRTL ? 'صفحات' : 'pages'}</p>
                </div>
              </div>
              <div className="flex items-center gap-1">
                <StarButton type="project" id={project.id} />
                <button
                  onClick={() => deleteProject(project.id)}
                  className="text-red-500 hover:text-red-700 p-1"
                >
                  🗑️
                </button>
              </div>
            </div>
            <p className="text-gray-600 dark:text-gray-400 text-sm mb-3 line-clamp-2">{project.description || (isRTL ? 'بدون وصف' : 'No description')}</p>
            <div className="text-xs text-gray-400">{formatDate(project.updatedAt)}</div>
          </div>
        ))}
      </div>
    );
  };

  const renderConversations = () => {
    const filtered = filterItems(conversations, 'conversation');
    if (filtered.length === 0) return renderEmptyState(isRTL ? 'لا توجد محادثات' : 'No conversations yet');
    
    return (
      <div className="space-y-3">
        {filtered.map(conv => (
          <div key={conv.id} className="bg-white dark:bg-gray-800 rounded-xl p-4 border border-gray-200 dark:border-gray-700 hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span className="text-2xl">💬</span>
                <div>
                  <h3 className="font-semibold">{conv.title}</h3>
                  <p className="text-sm text-gray-500">
                    {conv.messages.length} {isRTL ? 'رسائل' : 'messages'}
                    {conv.projectName && ` • ${conv.projectName}`}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs text-gray-400">{formatDate(conv.updatedAt)}</span>
                <StarButton type="conversation" id={conv.id} />
                <button
                  onClick={() => deleteConversation(conv.id)}
                  className="text-red-500 hover:text-red-700 p-1"
                >
                  🗑️
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  };

  const renderAgents = () => {
    const filtered = filterItems(agents, 'agent');
    if (filtered.length === 0) return renderEmptyState(isRTL ? 'لا يوجد وكلاء' : 'No agents yet');
    
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filtered.map(agent => (
          <div key={agent.id} className="bg-white dark:bg-gray-800 rounded-xl p-5 border border-gray-200 dark:border-gray-700 hover:shadow-lg transition-shadow">
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-center gap-3">
                <span className="text-3xl">🤖</span>
                <div>
                  <h3 className="font-semibold text-lg">{agent.name}</h3>
                  <p className="text-sm text-gray-500">{agent.memory.length} {isRTL ? 'رسائل في الذاكرة' : 'messages in memory'}</p>
                </div>
              </div>
              <div className="flex items-center gap-1">
                <StarButton type="agent" id={agent.id} />
                <button
                  onClick={() => deleteAgent(agent.id)}
                  className="text-red-500 hover:text-red-700 p-1"
                >
                  🗑️
                </button>
              </div>
            </div>
            <p className="text-gray-600 dark:text-gray-400 text-sm mb-3 line-clamp-2">{agent.description}</p>
            <div className="text-xs text-gray-400">{formatDate(agent.updatedAt)}</div>
          </div>
        ))}
      </div>
    );
  };

  const renderTools = () => {
    const filtered = filterItems(tools, 'tool');
    if (filtered.length === 0) return renderEmptyState(isRTL ? 'لا توجد أدوات' : 'No tools yet');
    
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filtered.map(tool => (
          <div key={tool.id} className="bg-white dark:bg-gray-800 rounded-xl p-5 border border-gray-200 dark:border-gray-700 hover:shadow-lg transition-shadow">
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-center gap-3">
                <span className="text-3xl">{tool.type === 'http' ? '🌐' : '⚙️'}</span>
                <div>
                  <h3 className="font-semibold">{tool.name}</h3>
                  <span className={`text-xs px-2 py-0.5 rounded ${tool.type === 'http' ? 'bg-blue-100 text-blue-700' : 'bg-purple-100 text-purple-700'}`}>
                    {tool.type.toUpperCase()}
                  </span>
                </div>
              </div>
              <div className="flex items-center gap-1">
                <StarButton type="tool" id={tool.id} />
                <button
                  onClick={() => deleteTool(tool.id)}
                  className="text-red-500 hover:text-red-700 p-1"
                >
                  🗑️
                </button>
              </div>
            </div>
            <p className="text-gray-600 dark:text-gray-400 text-sm mb-3 line-clamp-2">{tool.description}</p>
            <div className="text-xs text-gray-400">{formatDate(tool.updatedAt)}</div>
          </div>
        ))}
      </div>
    );
  };

  const renderWorkflows = () => {
    const filtered = filterItems(workflows, 'workflow');
    if (filtered.length === 0) return renderEmptyState(isRTL ? 'لا يوجد سير عمل' : 'No workflows yet');
    
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filtered.map(workflow => (
          <div key={workflow.id} className="bg-white dark:bg-gray-800 rounded-xl p-5 border border-gray-200 dark:border-gray-700 hover:shadow-lg transition-shadow">
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-center gap-3">
                <span className="text-3xl">⚡</span>
                <div>
                  <h3 className="font-semibold text-lg">{workflow.name}</h3>
                  <p className="text-sm text-gray-500">{workflow.steps.length} {isRTL ? 'خطوات' : 'steps'}</p>
                </div>
              </div>
              <div className="flex items-center gap-1">
                <StarButton type="workflow" id={workflow.id} />
                <button
                  onClick={() => deleteWorkflow(workflow.id)}
                  className="text-red-500 hover:text-red-700 p-1"
                >
                  🗑️
                </button>
              </div>
            </div>
            <p className="text-gray-600 dark:text-gray-400 text-sm mb-3 line-clamp-2">{workflow.description}</p>
            <div className="text-xs text-gray-400">{formatDate(workflow.updatedAt)}</div>
          </div>
        ))}
      </div>
    );
  };

  const renderNotes = () => {
    const filtered = filterItems(notes.map(n => ({ ...n, name: n.title })), 'note');
    if (filtered.length === 0 && !searchQuery && !showFavoritesOnly) {
      return (
        <div className="flex flex-col items-center justify-center py-16 text-gray-500">
          <div className="text-6xl mb-4">📝</div>
          <p className="text-lg mb-4">{isRTL ? 'لا توجد ملاحظات' : 'No notes yet'}</p>
          <button
            onClick={() => setShowNoteModal(true)}
            className="px-6 py-3 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-xl hover:opacity-90 transition-opacity"
          >
            {isRTL ? '➕ إضافة ملاحظة' : '➕ Add Note'}
          </button>
        </div>
      );
    }
    
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filtered.map(note => (
          <div 
            key={note.id} 
            className="bg-white dark:bg-gray-800 rounded-xl p-5 border border-gray-200 dark:border-gray-700 hover:shadow-lg transition-shadow cursor-pointer"
            onClick={() => openEditNote(note)}
          >
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-center gap-2">
                <span className={`w-3 h-3 rounded-full ${categoryColors[note.category]}`}></span>
                <span className="text-xs text-gray-500">{categoryLabels[note.category][language]}</span>
              </div>
              <div className="flex items-center gap-1">
                <StarButton type="note" id={note.id} />
                <button
                  onClick={(e) => { e.stopPropagation(); deleteNote(note.id); }}
                  className="text-red-500 hover:text-red-700 p-1"
                >
                  🗑️
                </button>
              </div>
            </div>
            <h3 className="font-semibold text-lg mb-2">{note.title}</h3>
            <p className="text-gray-600 dark:text-gray-400 text-sm mb-3 line-clamp-3">{note.content}</p>
            {note.tags.length > 0 && (
              <div className="flex flex-wrap gap-1 mb-2">
                {note.tags.map((tag, i) => (
                  <span key={i} className="text-xs px-2 py-0.5 bg-gray-100 dark:bg-gray-700 rounded-full">#{tag}</span>
                ))}
              </div>
            )}
            <div className="text-xs text-gray-400">{formatDate(note.updatedAt)}</div>
          </div>
        ))}
      </div>
    );
  };

  const renderContent = () => {
    switch (activeTab) {
      case 'projects': return renderProjects();
      case 'conversations': return renderConversations();
      case 'agents': return renderAgents();
      case 'tools': return renderTools();
      case 'workflows': return renderWorkflows();
      case 'notes': return renderNotes();
    }
  };

  return (
    <div className={`h-full flex flex-col ${isRTL ? 'rtl' : 'ltr'}`}>
      {/* Header */}
      <div className="p-6 border-b border-gray-200 dark:border-gray-700 bg-gradient-to-r from-blue-500/10 to-purple-500/10">
        <h1 className="text-3xl font-bold mb-2">
          📚 {isRTL ? 'المكتبة' : 'Library'}
        </h1>
        <p className="text-gray-600 dark:text-gray-400">
          {isRTL ? 'جميع سجلاتك في مكان واحد' : 'All your records in one place'}
        </p>
      </div>

      {/* Tabs */}
      <div className="p-4 border-b border-gray-200 dark:border-gray-700 overflow-x-auto">
        <div className="flex gap-2 min-w-max">
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl transition-all ${
                activeTab === tab.id
                  ? 'bg-gradient-to-r from-blue-500 to-purple-600 text-white shadow-lg'
                  : 'bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700'
              }`}
            >
              <span>{tab.icon}</span>
              <span>{tab.label}</span>
              <span className={`px-2 py-0.5 rounded-full text-xs ${
                activeTab === tab.id 
                  ? 'bg-white/20' 
                  : 'bg-gray-200 dark:bg-gray-700'
              }`}>
                {tab.count}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Search & Actions */}
      <div className="p-4 flex items-center gap-4">
        <div className="flex-1 relative">
          <input
            type="text"
            placeholder={isRTL ? '🔍 بحث...' : '🔍 Search...'}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full px-4 py-3 bg-gray-100 dark:bg-gray-800 rounded-xl border-none focus:ring-2 focus:ring-blue-500 outline-none"
          />
        </div>
        
        {/* ⭐ Favorites Filter */}
        <button
          onClick={() => setShowFavoritesOnly(!showFavoritesOnly)}
          className={`px-4 py-3 rounded-xl transition-all whitespace-nowrap flex items-center gap-2 ${
            showFavoritesOnly 
              ? 'bg-yellow-500 text-white' 
              : 'bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700'
          }`}
        >
          <span>{showFavoritesOnly ? '⭐' : '☆'}</span>
          <span>{isRTL ? 'المفضلة' : 'Favorites'}</span>
          {favorites.length > 0 && (
            <span className={`px-2 py-0.5 rounded-full text-xs ${showFavoritesOnly ? 'bg-white/20' : 'bg-gray-200 dark:bg-gray-700'}`}>
              {favorites.length}
            </span>
          )}
        </button>
        
        {activeTab === 'notes' && (
          <button
            onClick={() => {
              setEditingNote(null);
              setNoteForm({ title: '', content: '', category: 'general', tags: '' });
              setShowNoteModal(true);
            }}
            className="px-4 py-3 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-xl hover:opacity-90 transition-opacity whitespace-nowrap"
          >
            ➕ {isRTL ? 'ملاحظة جديدة' : 'New Note'}
          </button>
        )}
      </div>

      {/* Content */}
      <div className="flex-1 overflow-auto p-4">
        {renderContent()}
      </div>

      {/* Note Modal */}
      {showNoteModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-2xl w-full max-w-lg max-h-[90vh] overflow-auto">
            <div className="p-6 border-b border-gray-200 dark:border-gray-700">
              <h2 className="text-xl font-bold">
                {editingNote 
                  ? (isRTL ? '✏️ تعديل الملاحظة' : '✏️ Edit Note')
                  : (isRTL ? '📝 ملاحظة جديدة' : '📝 New Note')
                }
              </h2>
            </div>
            
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">
                  {isRTL ? 'العنوان' : 'Title'}
                </label>
                <input
                  type="text"
                  value={noteForm.title}
                  onChange={(e) => setNoteForm({ ...noteForm, title: e.target.value })}
                  className="w-full px-4 py-3 bg-gray-100 dark:bg-gray-700 rounded-xl border-none focus:ring-2 focus:ring-blue-500 outline-none"
                  placeholder={isRTL ? 'عنوان الملاحظة...' : 'Note title...'}
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-2">
                  {isRTL ? 'التصنيف' : 'Category'}
                </label>
                <div className="flex flex-wrap gap-2">
                  {(Object.keys(categoryLabels) as NoteCategory[]).map(cat => (
                    <button
                      key={cat}
                      onClick={() => setNoteForm({ ...noteForm, category: cat })}
                      className={`flex items-center gap-2 px-3 py-2 rounded-lg transition-all ${
                        noteForm.category === cat
                          ? 'bg-blue-500 text-white'
                          : 'bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600'
                      }`}
                    >
                      <span className={`w-2 h-2 rounded-full ${categoryColors[cat]}`}></span>
                      {categoryLabels[cat][language]}
                    </button>
                  ))}
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-2">
                  {isRTL ? 'المحتوى' : 'Content'}
                </label>
                <textarea
                  value={noteForm.content}
                  onChange={(e) => setNoteForm({ ...noteForm, content: e.target.value })}
                  className="w-full px-4 py-3 bg-gray-100 dark:bg-gray-700 rounded-xl border-none focus:ring-2 focus:ring-blue-500 outline-none resize-none"
                  rows={6}
                  placeholder={isRTL ? 'اكتب ملاحظتك هنا...' : 'Write your note here...'}
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-2">
                  {isRTL ? 'الوسوم (مفصولة بفاصلة)' : 'Tags (comma separated)'}
                </label>
                <input
                  type="text"
                  value={noteForm.tags}
                  onChange={(e) => setNoteForm({ ...noteForm, tags: e.target.value })}
                  className="w-full px-4 py-3 bg-gray-100 dark:bg-gray-700 rounded-xl border-none focus:ring-2 focus:ring-blue-500 outline-none"
                  placeholder={isRTL ? 'مثال: عمل, فكرة, مهم' : 'e.g: work, idea, important'}
                />
              </div>
            </div>
            
            <div className="p-6 border-t border-gray-200 dark:border-gray-700 flex gap-3 justify-end">
              <button
                onClick={() => setShowNoteModal(false)}
                className="px-6 py-3 bg-gray-100 dark:bg-gray-700 rounded-xl hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
              >
                {isRTL ? 'إلغاء' : 'Cancel'}
              </button>
              <button
                onClick={handleSaveNote}
                disabled={!noteForm.title.trim()}
                className="px-6 py-3 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-xl hover:opacity-90 transition-opacity disabled:opacity-50"
              >
                {isRTL ? '💾 حفظ' : '💾 Save'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
