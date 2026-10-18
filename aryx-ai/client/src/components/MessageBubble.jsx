import React, { useState, useCallback } from 'react';
import { Copy, Check, RotateCcw, ThumbsUp, ThumbsDown, User, Sparkles } from 'lucide-react';
import MarkdownRenderer from './MarkdownRenderer';

export default function MessageBubble({ message, onRegenerate, isLastAssistant, isStreaming }) {
  const [copied, setCopied] = useState(false);
  const [liked, setLiked] = useState(null); // null | 'up' | 'down'

  const isUser = message.role === 'user';

  const handleCopy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(message.content);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback copy
      const textArea = document.createElement('textarea');
      textArea.value = message.content;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand('copy');
      document.body.removeChild(textArea);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  }, [message.content]);

  return (
    <div className="message" role="article" aria-label={isUser ? 'Pesan pengguna' : 'Respons Aryx AI'}>
      <div className={`message-avatar ${message.role}`} aria-hidden="true">
        {isUser ? <User size={16} /> : <Sparkles size={16} />}
      </div>
      <div className="message-content">
        <div className="message-role">
          {isUser ? 'Anda' : 'Aryx AI'}
        </div>
        <div className="message-text">
          {isUser ? (
            <p>{message.content}</p>
          ) : (
            <>
              <MarkdownRenderer content={message.content} />
              {isStreaming && (
                <span className="typing-cursor" aria-label="Sedang mengetik">▍</span>
              )}
            </>
          )}
        </div>
        {!isUser && !isStreaming && message.content && (
          <div className={`message-actions ${isLastAssistant ? 'visible' : ''}`}>
            <button
              className={`message-action-btn ${copied ? 'active' : ''}`}
              onClick={handleCopy}
              aria-label="Salin jawaban"
              title="Salin"
            >
              {copied ? <Check size={14} /> : <Copy size={14} />}
            </button>
            {onRegenerate && (
              <button
                className="message-action-btn"
                onClick={onRegenerate}
                aria-label="Buat ulang jawaban"
                title="Buat ulang"
              >
                <RotateCcw size={14} />
              </button>
            )}
            <button
              className={`message-action-btn ${liked === 'up' ? 'active' : ''}`}
              onClick={() => setLiked(prev => prev === 'up' ? null : 'up')}
              aria-label="Suka"
              title="Suka"
            >
              <ThumbsUp size={14} />
            </button>
            <button
              className={`message-action-btn ${liked === 'down' ? 'active' : ''}`}
              onClick={() => setLiked(prev => prev === 'down' ? null : 'down')}
              aria-label="Tidak suka"
              title="Tidak suka"
            >
              <ThumbsDown size={14} />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
