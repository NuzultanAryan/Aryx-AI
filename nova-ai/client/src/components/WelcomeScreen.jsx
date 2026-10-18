import React from 'react';
import { Sparkles, Lightbulb, Pencil, Code, BookOpen } from 'lucide-react';

const suggestions = [
  {
    icon: Lightbulb,
    text: 'Jelaskan konsep yang sulit dengan sederhana.',
  },
  {
    icon: Pencil,
    text: 'Bantu saya menulis sesuatu yang menarik.',
  },
  {
    icon: Code,
    text: 'Bantu saya memahami dan memperbaiki kode.',
  },
  {
    icon: BookOpen,
    text: 'Buatkan rencana belajar yang terstruktur.',
  },
];

export default function WelcomeScreen({ onSuggestionClick }) {
  return (
    <div className="welcome-screen">
      <div className="welcome-icon" aria-hidden="true">
        <Sparkles size={28} />
      </div>
      <h1 className="welcome-title">Halo! Apa yang ingin kamu ketahui hari ini?</h1>
      <p className="welcome-subtitle">
        Tanyakan apa saja, cari ide, pelajari hal baru, atau selesaikan masalah bersama Aryx AI.
      </p>
      <div className="suggestion-cards" role="list" aria-label="Saran prompt">
        {suggestions.map((s, i) => {
          const Icon = s.icon;
          return (
            <button
              key={i}
              className="suggestion-card"
              onClick={() => onSuggestionClick(s.text)}
              role="listitem"
              aria-label={s.text}
            >
              <Icon size={18} className="suggestion-card-icon" />
              <span className="suggestion-card-text">{s.text}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
