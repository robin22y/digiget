import { useState, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';

const languages = [
  { code: 'en', name: 'English', nativeName: 'English', flag: '🇬🇧' },
  { code: 'hi', name: 'Hindi', nativeName: 'हिंदी', flag: '🇮🇳' },
  // Additional languages can be added incrementally
];

export function LanguageSelector() {
  const { i18n, t } = useTranslation();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const currentLanguage = languages.find(lang => lang.code === i18n.language) || languages[0];

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  async function changeLanguage(code: string) {
    await i18n.changeLanguage(code);
    localStorage.setItem('language', code);
    setIsOpen(false);
  }

  return (
    <div className="language-selector" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-3 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors text-sm font-medium"
        aria-label="Change language"
      >
        <span className="text-lg">🌐</span>
        <span className="hidden sm:inline">{currentLanguage.nativeName}</span>
        <span className="text-xs opacity-60">▼</span>
      </button>

      {isOpen && (
        <>
          <div 
            className="fixed inset-0 z-40" 
            onClick={() => setIsOpen(false)}
          />
          <div className="absolute top-full right-0 mt-2 bg-white border border-gray-300 rounded-lg shadow-xl min-w-[260px] max-w-[320px] z-50 max-h-[400px] overflow-y-auto">
            <div className="px-4 py-3 border-b border-gray-200 font-semibold text-sm text-gray-600">
              {t('language.select_multilang')}
            </div>
            <div className="py-1">
              {languages.map(lang => (
                <button
                  key={lang.code}
                  onClick={() => changeLanguage(lang.code)}
                  className={`w-full flex items-center gap-3 px-4 py-3 hover:bg-blue-50 transition-colors text-left ${
                    lang.code === i18n.language ? 'bg-blue-50' : ''
                  }`}
                >
                  <span className="text-2xl">{lang.flag}</span>
                  <div className="flex-1 flex flex-col gap-0.5">
                    <span className="text-sm font-medium text-gray-900">{lang.nativeName}</span>
                    <span className="text-xs text-gray-500">{lang.name}</span>
                  </div>
                  {lang.code === i18n.language && (
                    <span className="text-blue-600 font-bold">✓</span>
                  )}
                </button>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
}

