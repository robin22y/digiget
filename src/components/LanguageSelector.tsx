import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';

const languages = [
  { code: 'en', name: 'English', flag: '🇬🇧' },
  { code: 'hi', name: 'हिंदी', flag: '🇮🇳' },
  { code: 'pa', name: 'ਪੰਜਾਬੀ', flag: '🇮🇳' },
  { code: 'ur', name: 'اردو', flag: '🇵🇰' },
  { code: 'bn', name: 'বাংলা', flag: '🇧🇩' },
  { code: 'ta', name: 'தமிழ்', flag: '🇮🇳' },
  { code: 'pl', name: 'Polski', flag: '🇵🇱' },
  { code: 'ro', name: 'Română', flag: '🇷🇴' },
  { code: 'ar', name: 'العربية', flag: '🇸🇦' },
  { code: 'tr', name: 'Türkçe', flag: '🇹🇷' }
];

export function LanguageSelector() {
  const { i18n } = useTranslation();
  const [isOpen, setIsOpen] = useState(false);

  const currentLanguage = languages.find(lang => lang.code === i18n.language) || languages[0];

  async function changeLanguage(code: string) {
    await i18n.changeLanguage(code);
    localStorage.setItem('language', code);
    setIsOpen(false);
  }

  return (
    <div className="language-selector">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="language-button"
      >
        <span className="language-icon">🌐</span>
        <span className="language-name">{currentLanguage.name}</span>
        <span className="dropdown-arrow">▼</span>
      </button>

      {isOpen && (
        <div className="language-dropdown">
          <div className="language-dropdown-header">
            Select Language / भाषा चुनें
          </div>
          <div className="language-list">
            {languages.map(lang => (
              <button
                key={lang.code}
                onClick={() => changeLanguage(lang.code)}
                className={`language-option ${lang.code === i18n.language ? 'active' : ''}`}
              >
                <span className="language-flag">{lang.flag}</span>
                <span className="language-label">{lang.name}</span>
                {lang.code === i18n.language && <span className="check-mark">✓</span>}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

