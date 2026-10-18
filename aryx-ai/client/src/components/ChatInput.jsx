import React, { useRef, useCallback, useEffect } from 'react';
import { Send, Square } from 'lucide-react';

export default function ChatInput({ onSend, isLoading, onStop, disabled }) {
  const textareaRef = useRef(null);

  // Auto-resize textarea
  const autoResize = useCallback(() => {
    const ta = textareaRef.current;
    if (!ta) return;
    ta.style.height = '24px';
    ta.style.height = Math.min(ta.scrollHeight, 200) + 'px';
  }, []);

  useEffect(() => {
    autoResize();
  }, [autoResize]);

  const handleSubmit = useCallback(() => {
    const ta = textareaRef.current;
    if (!ta) return;
    const value = ta.value.trim();
    if (!value || isLoading) return;
    onSend(value);
    ta.value = '';
    autoResize();
  }, [onSend, isLoading, autoResize]);

  const handleKeyDown = useCallback((e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  }, [handleSubmit]);

  return (
    <div className="chat-input-area">
      <div className="chat-input-container">
        <div className="chat-input-wrapper">
          <textarea
            ref={textareaRef}
            placeholder="Ketik pesan Anda..."
            onKeyDown={handleKeyDown}
            onInput={autoResize}
            rows={1}
            disabled={disabled}
            aria-label="Ketik pesan"
            id="chat-input"
          />
          {isLoading ? (
            <button
              className="stop-btn"
              onClick={onStop}
              aria-label="Hentikan generasi"
              title="Hentikan"
            >
              <Square size={16} />
            </button>
          ) : (
            <button
              className="send-btn"
              onClick={handleSubmit}
              disabled={disabled}
              aria-label="Kirim pesan"
              title="Kirim"
            >
              <Send size={16} />
            </button>
          )}
        </div>
        <p className="chat-disclaimer">
          Aryx AI dapat membuat kesalahan. Periksa informasi penting secara mandiri.
        </p>
      </div>
    </div>
  );
}
