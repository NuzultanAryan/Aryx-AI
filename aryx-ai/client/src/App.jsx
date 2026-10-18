import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Menu, AlertTriangle, Zap } from 'lucide-react';
import Sidebar from './components/Sidebar';
import WelcomeScreen from './components/WelcomeScreen';
import ChatInput from './components/ChatInput';
import MessageBubble from './components/MessageBubble';
import SettingsModal from './components/SettingsModal';
import { useTheme } from './hooks/useTheme';
import * as api from './services/api';

export default function App() {
  const { theme, setTheme } = useTheme();

  // State
  const [conversations, setConversations] = useState([]);
  const [activeConversationId, setActiveConversationId] = useState(null);
  const [messages, setMessages] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [streamingContent, setStreamingContent] = useState('');
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [health, setHealth] = useState(null);
  const [selectedModel, setSelectedModel] = useState('');
  const [serverError, setServerError] = useState(false);

  const abortRef = useRef(null);
  const messagesEndRef = useRef(null);
  const chatMessagesRef = useRef(null);
  const shouldAutoScroll = useRef(true);

  // Check health on mount
  useEffect(() => {
    async function checkServer() {
      try {
        const data = await api.checkHealth();
        setHealth(data);
        setSelectedModel(data.ai?.model || '');
        setServerError(false);
      } catch {
        setServerError(true);
      }
    }
    checkServer();
  }, []);

  // Load conversations
  const loadConversations = useCallback(async () => {
    try {
      const data = await api.getConversations(searchQuery);
      setConversations(data.conversations || []);
    } catch {
      // Silently fail — will show empty list
    }
  }, [searchQuery]);

  useEffect(() => {
    if (!serverError) {
      loadConversations();
    }
  }, [loadConversations, serverError]);

  // Load conversation messages
  const loadMessages = useCallback(async (convId) => {
    if (!convId) {
      setMessages([]);
      return;
    }
    try {
      const data = await api.getConversation(convId);
      setMessages(data.messages || []);
    } catch (err) {
      setError('Gagal memuat pesan. Coba lagi.');
    }
  }, []);

  useEffect(() => {
    if (activeConversationId) {
      loadMessages(activeConversationId);
    } else {
      setMessages([]);
    }
  }, [activeConversationId, loadMessages]);

  // Auto-scroll handling
  const handleScroll = useCallback(() => {
    const el = chatMessagesRef.current;
    if (!el) return;
    const threshold = 100;
    shouldAutoScroll.current = 
      el.scrollHeight - el.scrollTop - el.clientHeight < threshold;
  }, []);

  useEffect(() => {
    if (shouldAutoScroll.current && messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, streamingContent]);

  // Send message
  const sendMessage = useCallback(async (text) => {
    if (isLoading || !text.trim()) return;
    setError(null);

    let convId = activeConversationId;

    // Create new conversation if needed
    if (!convId) {
      try {
        const data = await api.createConversation();
        convId = data.conversation.id;
        setActiveConversationId(convId);
        setConversations(prev => [data.conversation, ...prev]);
      } catch {
        setError('Gagal membuat percakapan baru. Pastikan server berjalan.');
        return;
      }
    }

    // Optimistically show user message
    const tempUserMsg = {
      id: 'temp-user-' + Date.now(),
      role: 'user',
      content: text.trim(),
      created_at: new Date().toISOString(),
    };
    setMessages(prev => [...prev, tempUserMsg]);
    setIsLoading(true);
    setStreamingContent('');
    shouldAutoScroll.current = true;

    try {
      const { stream, abort } = api.sendChatMessage(convId, text.trim(), selectedModel);
      abortRef.current = abort;

      let fullContent = '';

      for await (const event of stream) {
        switch (event.type) {
          case 'user_message':
            // Replace temp user message with real one
            setMessages(prev =>
              prev.map(m => m.id === tempUserMsg.id ? event.data : m)
            );
            break;

          case 'chunk':
            fullContent += event.data;
            setStreamingContent(fullContent);
            break;

          case 'done':
            // Replace streaming with final message
            setStreamingContent('');
            setMessages(prev => [...prev, event.data]);
            break;

          case 'title_update':
            // Update conversation title in sidebar
            setConversations(prev =>
              prev.map(c => c.id === convId ? { ...c, title: event.data } : c)
            );
            break;

          case 'error':
            setError(event.data);
            break;

          case 'end':
            break;
        }
      }
    } catch (err) {
      if (err.name !== 'AbortError') {
        setError(err.message || 'Terjadi kesalahan. Coba lagi.');
      }
    } finally {
      setIsLoading(false);
      setStreamingContent('');
      abortRef.current = null;
      loadConversations();
    }
  }, [activeConversationId, isLoading, selectedModel, loadConversations]);

  // Stop generation
  const stopGeneration = useCallback(() => {
    if (abortRef.current) {
      abortRef.current();
      abortRef.current = null;
      setIsLoading(false);
      // Save whatever was streamed so far as a message
      if (streamingContent) {
        setMessages(prev => [...prev, {
          id: 'partial-' + Date.now(),
          role: 'assistant',
          content: streamingContent + '\n\n*(Generasi dihentikan)*',
          created_at: new Date().toISOString(),
        }]);
        setStreamingContent('');
      }
    }
  }, [streamingContent]);

  // New chat
  const handleNewChat = useCallback(() => {
    if (isLoading) stopGeneration();
    setActiveConversationId(null);
    setMessages([]);
    setError(null);
    setStreamingContent('');
  }, [isLoading, stopGeneration]);

  // Select conversation
  const handleSelectConversation = useCallback((id) => {
    if (isLoading) stopGeneration();
    setActiveConversationId(id);
    setError(null);
    setStreamingContent('');
  }, [isLoading, stopGeneration]);

  // Rename conversation
  const handleRename = useCallback(async (id, title) => {
    try {
      await api.updateConversation(id, title);
      setConversations(prev =>
        prev.map(c => c.id === id ? { ...c, title } : c)
      );
    } catch {
      // Silently fail
    }
  }, []);

  // Delete conversation
  const handleDelete = useCallback(async (id) => {
    try {
      await api.deleteConversation(id);
      setConversations(prev => prev.filter(c => c.id !== id));
      if (activeConversationId === id) {
        setActiveConversationId(null);
        setMessages([]);
      }
    } catch {
      setError('Gagal menghapus percakapan.');
    }
  }, [activeConversationId]);

  // Delete all conversations
  const handleDeleteAll = useCallback(async () => {
    try {
      await api.deleteAllConversations();
      setConversations([]);
      setActiveConversationId(null);
      setMessages([]);
      setSettingsOpen(false);
    } catch {
      setError('Gagal menghapus semua percakapan.');
    }
  }, []);

  // Regenerate last response
  const handleRegenerate = useCallback(() => {
    // Find the last user message
    const lastUserMsg = [...messages].reverse().find(m => m.role === 'user');
    if (lastUserMsg) {
      // Remove the last assistant message
      setMessages(prev => {
        const lastAssistantIdx = prev.length - 1;
        if (prev[lastAssistantIdx]?.role === 'assistant') {
          return prev.slice(0, lastAssistantIdx);
        }
        return prev;
      });
      sendMessage(lastUserMsg.content);
    }
  }, [messages, sendMessage]);

  // Suggestion click
  const handleSuggestionClick = useCallback((text) => {
    sendMessage(text);
  }, [sendMessage]);

  const hasMessages = messages.length > 0 || streamingContent;

  // Combine messages with streaming for display
  const displayMessages = [...messages];
  if (streamingContent) {
    displayMessages.push({
      id: 'streaming',
      role: 'assistant',
      content: streamingContent,
      created_at: new Date().toISOString(),
    });
  }

  // Find last assistant message index
  const lastAssistantIdx = displayMessages.length - 1;

  return (
    <div className="app-layout">
      <Sidebar
        conversations={conversations}
        activeId={activeConversationId}
        onSelectConversation={handleSelectConversation}
        onNewChat={handleNewChat}
        onRename={handleRename}
        onDelete={handleDelete}
        onSettingsOpen={() => setSettingsOpen(true)}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
      />

      <main className="chat-area" role="main">
        {/* Header */}
        <header className="chat-header">
          <div className="chat-header-left">
            <button
              className="mobile-menu-btn"
              onClick={() => setSidebarOpen(true)}
              aria-label="Buka menu"
            >
              <Menu size={20} />
            </button>
            <h1 className="chat-header-title">Aryx AI</h1>
          </div>
          {health?.models && health.models.length > 0 && (
            <div className="model-selector">
              <Zap size={12} />
              <select
                value={selectedModel}
                onChange={e => setSelectedModel(e.target.value)}
                aria-label="Pilih model"
              >
                {health.models.map(m => (
                  <option key={m.id} value={m.id}>{m.name}</option>
                ))}
              </select>
            </div>
          )}
        </header>

        {/* Server error */}
        {serverError && (
          <div style={{ padding: '24px', textAlign: 'center' }}>
            <div className="error-banner" style={{ maxWidth: 500, margin: '0 auto', flexDirection: 'column', alignItems: 'center', textAlign: 'center' }}>
              <AlertTriangle size={24} style={{ color: 'var(--warning)', marginBottom: 8 }} />
              <div className="error-banner-text">
                <strong>Server belum aktif</strong><br />
                Pastikan backend Aryx AI sedang berjalan di port yang benar.<br />
                Jalankan <code>npm run dev:server</code> terlebih dahulu.
              </div>
              <button className="error-retry-btn" style={{ marginTop: 12 }} onClick={() => window.location.reload()}>
                Coba Lagi
              </button>
            </div>
          </div>
        )}

        {/* Chat content */}
        {!serverError && (
          <>
            {hasMessages ? (
              <div className="chat-messages" ref={chatMessagesRef} onScroll={handleScroll}>
                <div className="chat-messages-inner">
                  {displayMessages.map((msg, i) => (
                    <MessageBubble
                      key={msg.id}
                      message={msg}
                      onRegenerate={
                        msg.role === 'assistant' && i === lastAssistantIdx && !isLoading
                          ? handleRegenerate
                          : null
                      }
                      isLastAssistant={msg.role === 'assistant' && i === lastAssistantIdx}
                      isStreaming={msg.id === 'streaming'}
                    />
                  ))}

                  {isLoading && !streamingContent && (
                    <div className="message" role="status" aria-label="Aryx AI sedang berpikir">
                      <div className="message-avatar assistant" aria-hidden="true">
                        <span style={{ fontSize: 14 }}>✦</span>
                      </div>
                      <div className="message-content">
                        <div className="message-role">Aryx AI</div>
                        <div className="typing-indicator">
                          <div className="typing-dot" />
                          <div className="typing-dot" />
                          <div className="typing-dot" />
                        </div>
                      </div>
                    </div>
                  )}

                  {error && (
                    <div className="error-banner" role="alert">
                      <AlertTriangle size={16} className="error-banner-icon" />
                      <div className="error-banner-content">
                        <div className="error-banner-text">{error}</div>
                        <button className="error-retry-btn" onClick={() => {
                          setError(null);
                          const lastUserMsg = [...messages].reverse().find(m => m.role === 'user');
                          if (lastUserMsg) sendMessage(lastUserMsg.content);
                        }}>
                          Coba Lagi
                        </button>
                      </div>
                    </div>
                  )}

                  <div ref={messagesEndRef} />
                </div>
              </div>
            ) : (
              <WelcomeScreen onSuggestionClick={handleSuggestionClick} />
            )}

            <ChatInput
              onSend={sendMessage}
              isLoading={isLoading}
              onStop={stopGeneration}
              disabled={serverError}
            />
          </>
        )}
      </main>

      <SettingsModal
        isOpen={settingsOpen}
        onClose={() => setSettingsOpen(false)}
        theme={theme}
        onThemeChange={setTheme}
        onDeleteAll={handleDeleteAll}
        health={health}
      />
    </div>
  );
}
