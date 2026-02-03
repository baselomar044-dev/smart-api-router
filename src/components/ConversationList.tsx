import React from 'react';

interface Conversation {
  id: string;
  title: string;
  createdAt?: Date;
  updatedAt?: Date;
  messageCount?: number;
}

interface ConversationListProps {
  conversations: Conversation[];
  currentId: string | null;
  onSelect: (id: string) => void;
  onDelete: (id: string) => void;
  isDark?: boolean;
}

export const ConversationList: React.FC<ConversationListProps> = ({
  conversations,
  currentId,
  onSelect,
  onDelete,
  isDark = true,
}) => {
  if (conversations.length === 0) {
    return (
      <div className={`text-center py-8 ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
        <span className="text-3xl mb-2 block">💬</span>
        <p className="text-sm">لا توجد محادثات</p>
        <p className="text-xs mt-1">ابدأ محادثة جديدة!</p>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto space-y-1">
      {conversations.map((conv) => (
        <div
          key={conv.id}
          className={`group p-3 rounded-xl cursor-pointer transition-all ${
            currentId === conv.id
              ? isDark 
                ? 'bg-neutral-600/20 border border-neutral-500/30' 
                : 'bg-neutral-100 border border-neutral-300'
              : isDark 
                ? 'hover:bg-slate-700' 
                : 'hover:bg-gray-100'
          }`}
          onClick={() => onSelect(conv.id)}
        >
          <div className="flex items-center justify-between">
            <span className={`text-sm truncate flex-1 ${
              isDark ? 'text-gray-200' : 'text-gray-700'
            }`}>
              💬 {conv.title}
            </span>
            <button
              onClick={(e) => {
                e.stopPropagation();
                onDelete(conv.id);
              }}
              className={`opacity-0 group-hover:opacity-100 p-1 rounded transition ${
                isDark 
                  ? 'hover:bg-red-500/20 text-red-400' 
                  : 'hover:bg-red-100 text-red-500'
              }`}
              title="حذف"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
            </button>
          </div>
          {conv.messageCount !== undefined && (
            <span className={`text-xs ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
              {conv.messageCount} رسائل
            </span>
          )}
        </div>
      ))}
    </div>
  );
};

export default ConversationList;
