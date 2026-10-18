import React, { useState, useEffect } from 'react';
import { X, Sun, Moon, Trash2, Info } from 'lucide-react';

export default function SettingsModal({ isOpen, onClose, theme, onThemeChange, onDeleteAll, health }) {
  const [showConfirm, setShowConfirm] = useState(false);
  
  useEffect(() => {
    if (!isOpen) setShowConfirm(false);
  }, [isOpen]);

  // Close on Escape
  useEffect(() => {
    function handleEsc(e) {
      if (e.key === 'Escape' && isOpen) onClose();
    }
    window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleDeleteAll = () => {
    onDeleteAll();
    setShowConfirm(false);
  };

  return (
    <div className="modal-overlay" onClick={onClose} role="dialog" aria-modal="true" aria-label="Pengaturan">
      <div className="modal" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h2 className="modal-title">Pengaturan</h2>
          <button className="modal-close-btn" onClick={onClose} aria-label="Tutup pengaturan">
            <X size={18} />
          </button>
        </div>
        <div className="modal-body">
          {/* Theme */}
          <div className="settings-section">
            <label className="settings-label" htmlFor="theme-select">Tampilan</label>
            <select
              id="theme-select"
              className="settings-select"
              value={theme}
              onChange={e => onThemeChange(e.target.value)}
            >
              <option value="dark">Mode Gelap</option>
              <option value="light">Mode Terang</option>
            </select>
          </div>

          {/* Model info */}
          <div className="settings-section">
            <label className="settings-label">Informasi Model AI</label>
            <div className="settings-info">
              <div className="settings-info-row">
                <span className="settings-info-label">Provider</span>
                <span className="settings-info-value">
                  {health?.ai?.provider || '-'}
                </span>
              </div>
              <div className="settings-info-row">
                <span className="settings-info-label">Model</span>
                <span className="settings-info-value">
                  {health?.ai?.model || '-'}
                </span>
              </div>
              <div className="settings-info-row">
                <span className="settings-info-label">Status</span>
                <span className="settings-info-value" style={{ 
                  color: health?.ai?.ready ? 'var(--success)' : 'var(--warning)' 
                }}>
                  {health?.ai?.ready ? 'Terhubung' : 'Belum dikonfigurasi'}
                </span>
              </div>
              {health?.ai?.error && (
                <div className="settings-info-row" style={{ marginTop: 4 }}>
                  <span className="settings-info-label" style={{ color: 'var(--warning)', fontSize: 12 }}>
                    {health.ai.error}
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* App info */}
          <div className="settings-section">
            <label className="settings-label">Tentang</label>
            <div className="settings-info">
              <div className="settings-info-row">
                <span className="settings-info-label">Aplikasi</span>
                <span className="settings-info-value">Aryx AI v1.0.0</span>
              </div>
              <div className="settings-info-row">
                <span className="settings-info-label">Database</span>
                <span className="settings-info-value" style={{ 
                  color: health?.database === 'ok' ? 'var(--success)' : 'var(--error)' 
                }}>
                  {health?.database === 'ok' ? 'Terhubung' : 'Error'}
                </span>
              </div>
            </div>
          </div>

          {/* Delete all */}
          <div className="settings-section">
            <label className="settings-label">Data</label>
            {showConfirm ? (
              <div className="confirm-dialog">
                <p>Yakin ingin menghapus semua percakapan? Tindakan ini tidak dapat dibatalkan.</p>
                <div className="confirm-dialog-actions">
                  <button className="confirm-cancel-btn" onClick={() => setShowConfirm(false)}>
                    Batal
                  </button>
                  <button className="confirm-delete-btn" onClick={handleDeleteAll}>
                    Hapus Semua
                  </button>
                </div>
              </div>
            ) : (
              <button className="danger-btn" onClick={() => setShowConfirm(true)}>
                <Trash2 size={16} />
                Hapus Semua Percakapan
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
