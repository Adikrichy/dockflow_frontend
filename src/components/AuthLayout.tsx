import React from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useTheme } from '../context/ThemeContext';
import './AuthLayout.css';

interface AuthLayoutProps {
  children: React.ReactNode;
  title: string;
  subtitle: string;
}

const AuthLayout: React.FC<AuthLayoutProps> = ({ children, title, subtitle }) => {
  const { t, i18n } = useTranslation();
  const { theme, toggleTheme } = useTheme();

  const changeLanguage = (lng: string) => {
    i18n.changeLanguage(lng);
  };

  return (
    <div className="auth-wrapper">
      <div className="auth-glow"></div>
      
      <header className="auth-header">
        <Link to="/" className="auth-logo">Dock<span>flow</span></Link>
        
        <div className="auth-nav-right">
          <Link to="/" className="auth-btn-back">
            <span>←</span> {t('auth.backToHome')}
          </Link>
          
          <div className="auth-theme-switch">
            <button
              className={`auth-btn-toggle ${theme === 'light' ? 'active' : ''}`}
              onClick={() => toggleTheme('light')}
            >
              ☀️
            </button>
            <button
              className={`auth-btn-toggle ${theme === 'dark' ? 'active' : ''}`}
              onClick={() => toggleTheme('dark')}
            >
              🌙
            </button>
          </div>
          
          <div className="auth-lang-switch">
            <button
              className={`auth-btn-toggle ${i18n.language.startsWith('ru') ? 'active' : ''}`}
              onClick={() => changeLanguage('ru')}
            >
              RU
            </button>
            <button
              className={`auth-btn-toggle ${i18n.language.startsWith('en') ? 'active' : ''}`}
              onClick={() => changeLanguage('en')}
            >
              EN
            </button>
            <button
              className={`auth-btn-toggle ${i18n.language.startsWith('kz') ? 'active' : ''}`}
              onClick={() => changeLanguage('kz')}
            >
              KZ
            </button>
          </div>
        </div>
      </header>

      <main className="auth-content">
        <div className="auth-card">
          <h1 className="auth-title">{title}</h1>
          <p className="auth-sub">{subtitle}</p>
          {children}
        </div>
      </main>
    </div>
  );
};

export default AuthLayout;
