import React, { useState, useCallback, useMemo } from 'react';
import { 
  Plus, Search, MessageSquare, Settings, Pencil, Trash2, 
  Check, X, Sparkles 
} from 'lucide-react';

export default function Sidebar({
  conversations,
  activeId,
  onSelectConversation,
  onNewChat,
  onRename,
  onDelete,
  onSettingsOpen,
  searchQuery,
  onSearchChange,
  isOpen,
  onClose,
}) {
  const [renamingId, setRenamingId] = useState(null);
  const [renameValue, setRenameValue] = useState('');

  // Group conversations by date
  const grouped = useMemo(() => {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const yesterday = new Date(today); yesterday.setDate(today.getDate() - 1);
    const lastWeek = new Date(today); lastWeek.setDate(today.getDate() - 7);
    const lastMonth = new Date(today); lastMonth.setDate(today.getDate() - 30);

    const groups = {
      'Hari Ini': [],
      'Kemarin': [],
      '7 Hari Terakhir': [],
      '30 Hari Terakhir': [],
      'Lebih Lama': [],
    };

    for (const conv of conversations) {
      const date = new Date(conv.updated_at || conv.created_at);
      if (date >= today) {
        groups['Hari Ini'].push(conv);
      } else if (date >= yesterday) {
        groups['Kemarin'].push(conv);
      } else if (date >= lastWeek) {
        groups['7 Hari Terakhir'].push(conv);
      } else if (date >= lastMonth) {
        groups['30 Hari Terakhir'].push(conv);
      } else {
        groups['Lebih Lama'].push(conv);
      }
    }

    return Object.entries(groups).filter(([, items]) => items.length > 0);
  }, [conversations]);

  const handleStartRename = useCallback((e, conv) => {
    e.stopPropagation();
    setRenamingId(conv.id);
    setRenameValue(conv.title);
  }, []);

  const handleFinishRename = useCallback(() => {
    if (renamingId && renameValue.trim()) {
      onRename(renamingId, renameValue.trim());
    }
    setRenamingId(null);
    setRenameValue('');
  }, [renamingId, renameValue, onRename]);

  const handleRenameKeyDown = useCallback((e) => {
    if (e.key === 'Enter') handleFinishRename();
    if (e.key === 'Escape') { setRenamingId(null); setRenameValue(''); }
  }, [handleFinishRename]);

  const handleItemClick = useCallback((convId) => {
    onSelectConversation(convId);
    if (isOpen) onClose();
  }, [onSelectConversation, isOpen, onClose]);

  const handleNewChat = useCallback(() => {
    onNewChat();
    if (isOpen) onClose();
  }, [onNewChat, isOpen, onClose]);

  return (
    <>
      {/* Mobile overlay */}
      <div
        className={`sidebar-overlay ${isOpen ? 'visible' : ''}`}
        onClick={onClose}
        aria-hidden={!isOpen}
      />

      <aside className={`sidebar ${isOpen ? 'open' : ''}`} role="navigation" aria-label="Sidebar navigasi">
        {/* Header */}
        <div className="sidebar-header">
          <div className="sidebar-logo">
            <div className="sidebar-logo-icon" aria-hidden="true">
              <Sparkles size={18} />
            </div>
            <span className="sidebar-logo-text">Aryx AI</span>
          </div>

          <button className="new-chat-btn" onClick={handleNewChat} aria-label="Chat baru" id="new-chat-btn">
            <Plus size={18} />
            Chat Baru
          </button>

          <div className="sidebar-search">
            <Search size={14} className="sidebar-search-icon" aria-hidden="true" />
            <input
              type="text"
              placeholder="Cari percakapan..."
              value={searchQuery}
              onChange={e => onSearchChange(e.target.value)}
              aria-label="Cari percakapan"
              id="search-conversations"
            />
          </div>
        </div>

        {/* Conversation list */}
        <div className="conversation-list" role="list" aria-label="Daftar percakapan">
          {conversations.length === 0 && (
            <div className="conversation-list-empty">
              {searchQuery 
                ? 'Tidak ada percakapan ditemukan.' 
                : 'Belum ada percakapan. Mulai chat baru!'}
            </div>
          )}
          {grouped.map(([label, items]) => (
            <div key={label}>
              <div className="conversation-group-label">{label}</div>
              {items.map(conv => (
                <div key={conv.id} role="listitem">
                  <button
                    className={`conversation-item ${activeId === conv.id ? 'active' : ''}`}
                    onClick={() => handleItemClick(conv.id)}
                    aria-label={`Percakapan: ${conv.title}`}
                    aria-current={activeId === conv.id ? 'true' : undefined}
                  >
                    <MessageSquare size={16} className="conversation-item-icon" />
                    {renamingId === conv.id ? (
                      <input
                        className="rename-input"
                        value={renameValue}
                        onChange={e => setRenameValue(e.target.value)}
                        onBlur={handleFinishRename}
                        onKeyDown={handleRenameKeyDown}
                        autoFocus
                        onClick={e => e.stopPropagation()}
                        aria-label="Ubah nama percakapan"
                      />
                    ) : (
                      <span className="conversation-item-title">{conv.title}</span>
                    )}
                    {renamingId !== conv.id && (
                      <div className="conversation-item-actions">
                        <button
                          className="conversation-action-btn"
                          onClick={(e) => handleStartRename(e, conv)}
                          aria-label="Ubah nama"
                          title="Ubah nama"
                        >
                          <Pencil size={13} />
                        </button>
                        <button
                          className="conversation-action-btn delete"
                          onClick={(e) => { e.stopPropagation(); onDelete(conv.id); }}
                          aria-label="Hapus percakapan"
                          title="Hapus"
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>
                    )}
                  </button>
                </div>
              ))}
            </div>
          ))}
        </div>

        {/* Footer */}
        <div className="sidebar-footer">
          <button className="settings-btn" onClick={onSettingsOpen} aria-label="Buka pengaturan" id="settings-btn">
            <Settings size={18} />
            Pengaturan
          </button>
        </div>
      </aside>
    </>
  );
}
