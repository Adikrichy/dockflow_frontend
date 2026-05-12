import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useTheme } from '../context/ThemeContext';
import './LandingPage.css';

const LandingPage: React.FC = () => {
  const { t, i18n } = useTranslation();
  const { theme, toggleTheme } = useTheme();
  const [openFaq, setOpenFaq] = useState<number | null>(null);
  const observerRef = useRef<IntersectionObserver | null>(null);

  useEffect(() => {
    // Scroll animations
    observerRef.current = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('visible');
          }
        });
      },
      { threshold: 0.12 }
    );

    document.querySelectorAll('.lp-fade-up').forEach((el) => {
      observerRef.current?.observe(el);
    });

    return () => observerRef.current?.disconnect();
  }, []);

  const changeLanguage = (lng: string) => {
    i18n.changeLanguage(lng);
  };

  const toggleFaq = (index: number) => {
    setOpenFaq(openFaq === index ? null : index);
  };

  return (
    <div className="lp-wrapper">
      {/* NAV */}
      <nav className="lp-nav">
        <Link to="/" className="lp-logo">Dock<span>flow</span></Link>
        <ul className="lp-nav-links">
          <li><a href="#lp-features">{t('landing.howItWorks')}</a></li>
          <li><a href="#lp-pricing">{t('landing.pricing.label')}</a></li>
          <li><a href="#lp-faq">{t('landing.faq.label')}</a></li>
        </ul>
        <div className="lp-nav-right">
          <div className="lp-theme-switch">
            <button
              className={`lp-btn-toggle ${theme === 'light' ? 'active' : ''}`}
              onClick={() => toggleTheme('light')}
            >
              ☀️
            </button>
            <button
              className={`lp-btn-toggle ${theme === 'dark' ? 'active' : ''}`}
              onClick={() => toggleTheme('dark')}
            >
              🌙
            </button>
          </div>
          <div className="lp-lang-switch">
            <button
              className={`lp-btn-toggle ${i18n.language === 'ru' ? 'active' : ''}`}
              onClick={() => changeLanguage('ru')}
            >
              RU
            </button>
            <button
              className={`lp-btn-toggle ${i18n.language === 'en' ? 'active' : ''}`}
              onClick={() => changeLanguage('en')}
            >
              EN
            </button>
            <button
              className={`lp-btn-toggle ${i18n.language === 'kz' ? 'active' : ''}`}
              onClick={() => changeLanguage('kz')}
            >
              KZ
            </button>
          </div>
          <Link to="/login" className="lp-btn-ghost">{t('auth.signIn')}</Link>
          <Link to="/register" className="lp-btn-primary">{t('landing.startFree')}</Link>
        </div>
      </nav>

      {/* HERO */}
      <section className="lp-hero">
        <div className="lp-hero-glow"></div>
        <div className="lp-hero-glow2"></div>
        <div className="lp-badge">
          <span className="lp-badge-dot"></span>
          <span>{t('landing.badge')}</span>
        </div>
        <h1>
          {t('landing.title')}<br />
          <span className="accent">{t('landing.accent')}</span>
        </h1>
        <p className="lp-hero-sub">
          {t('landing.sub')}
        </p>
        <div className="lp-hero-cta">
          <Link to="/register" className="lp-btn-primary lp-btn-large">{t('landing.startFree')}</Link>
          <a href="#lp-features" className="lp-btn-ghost lp-btn-large">{t('landing.howItWorks')}</a>
        </div>
        <div className="lp-hero-stats lp-fade-up">
          <div className="lp-stat">
            <div className="lp-stat-num">3×</div>
            <div className="lp-stat-label">{t('landing.stats.faster')}</div>
          </div>
          <div className="lp-stat">
            <div className="lp-stat-num">80%</div>
            <div className="lp-stat-label">{t('landing.stats.lessManual')}</div>
          </div>
          <div className="lp-stat">
            <div className="lp-stat-num">100%</div>
            <div className="lp-stat-label">{t('landing.stats.audit')}</div>
          </div>
          <div className="lp-stat">
            <div className="lp-stat-num">KZ</div>
            <div className="lp-stat-label">{t('landing.stats.support')}</div>
          </div>
        </div>
      </section>

      {/* MOCKUP */}
      <div className="lp-mockup-section lp-fade-up">
        <div className="lp-mockup-wrap">
          <div className="lp-mockup-bar">
            <div className="lp-mockup-dots">
              <div className="lp-mockup-dot r"></div>
              <div className="lp-mockup-dot y"></div>
              <div className="lp-mockup-dot g"></div>
            </div>
            <div className="lp-mockup-url">app.dockflow.kz/documents</div>
          </div>
          <div className="lp-mockup-inner">
            <div className="lp-mock-sidebar">
              <div className="lp-mock-sidebar-logo">Dock<span>flow</span></div>
              <div className="lp-mock-nav-item active">📄 <span>{t('landing.mockup.documents')}</span></div>
              <div className="lp-mock-nav-item">🔄 <span>{t('landing.mockup.workflows')}</span></div>
              <div className="lp-mock-nav-item">🏢 <span>{t('landing.mockup.company')}</span></div>
              <div className="lp-mock-nav-item">📊 <span>{t('landing.mockup.reports')}</span></div>
            </div>
            <div className="lp-mock-main">
              <div className="lp-mock-header-row">
                <div className="lp-mock-title">{t('landing.mockup.documents')}</div>
                <div className="lp-mock-btn-sm">{t('landing.mockup.upload')}</div>
              </div>
              <div className="lp-mock-cards">
                <div className="lp-mock-card">
                  <div className="lp-mock-card-label">{t('landing.mockup.total')}</div>
                  <div className="lp-mock-card-val">247</div>
                  <div className="lp-mock-card-sub">↑ 12 <span>{t('landing.mockup.thisWeek')}</span></div>
                </div>
                <div className="lp-mock-card">
                  <div className="lp-mock-card-label">{t('landing.mockup.pending')}</div>
                  <div className="lp-mock-card-val">18</div>
                  <div className="lp-mock-card-sub" style={{ color: '#ffb400' }}>↑ 3 <span>{t('landing.mockup.awaiting')}</span></div>
                </div>
                <div className="lp-mock-card">
                  <div className="lp-mock-card-label">{t('landing.mockup.approved')}</div>
                  <div className="lp-mock-card-val">204</div>
                  <div className="lp-mock-card-sub">✓ 95%</div>
                </div>
              </div>
              <div className="lp-mock-table">
                <div className="lp-mock-table-header">
                  <span>{t('landing.mockup.documents')}</span>
                  <span>{t('landing.mockup.type')}</span>
                  <span>{t('landing.mockup.date')}</span>
                  <span>{t('landing.mockup.status')}</span>
                </div>
                <div className="lp-mock-table-row">
                  <span>Договор №2024-117</span>
                  <span>PDF</span>
                  <span>21 мар</span>
                  <span><span className="lp-status-pill approved">{t('landing.mockup.statuses.approved')}</span></span>
                </div>
                <div className="lp-mock-table-row">
                  <span>Акт выполненных работ</span>
                  <span>DOCX</span>
                  <span>22 мар</span>
                  <span><span className="lp-status-pill review">{t('landing.mockup.statuses.review')}</span></span>
                </div>
                <div className="lp-mock-table-row">
                  <span>Счёт-фактура Q1</span>
                  <span>XLSX</span>
                  <span>23 мар</span>
                  <span><span className="lp-status-pill pending">{t('landing.mockup.statuses.pending')}</span></span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* FEATURES */}
      <section id="lp-features" className="lp-section">
        <div className="lp-container">
          <div className="lp-section-label">{t('landing.features.label')}</div>
          <div className="lp-section-title lp-fade-up">{t('landing.features.title')}</div>
          <p className="lp-section-sub lp-fade-up">{t('landing.features.sub')}</p>
          <div className="lp-features-grid lp-fade-up">
            {(t('landing.features.items', { returnObjects: true }) as any[]).map((item, idx) => {
              const icons = ['📄', '🔄', '🤖', '🔐', '✏️', '📊'];
              return (
                <div className="lp-feature-card" key={idx}>
                  <div className="lp-feature-icon">{icons[idx]}</div>
                  <div className="lp-feature-title">{item.title}</div>
                  <div className="lp-feature-desc">{item.desc}</div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* PRICING */}
      <section id="lp-pricing" className="lp-section">
        <div className="lp-container">
          <div className="lp-section-label">{t('landing.pricing.label')}</div>
          <div className="lp-section-title lp-fade-up">{t('landing.pricing.title')}</div>
          <p className="lp-section-sub lp-fade-up">{t('landing.pricing.sub')}</p>
          <div className="lp-pricing-grid lp-fade-up">
            {/* FREE */}
            <div className="lp-pricing-card">
              <div className="lp-plan-name">{t('landing.pricing.starter')}</div>
              <div className="lp-plan-price">0 ₸</div>
              <div className="lp-plan-price-label">{t('landing.pricing.foreverFree')}</div>
              <div className="lp-plan-divider"></div>
              <div className="lp-plan-feature"><span className="lp-plan-feature-check">✓</span><span>{t('landing.pricing.features.users3')}</span></div>
              <div className="lp-plan-feature"><span className="lp-plan-feature-check">✓</span><span>{t('landing.pricing.features.docs50')}</span></div>
              <div className="lp-plan-feature"><span className="lp-plan-feature-check">✓</span><span>{t('landing.pricing.features.basicWorkflows')}</span></div>
              <div className="lp-plan-feature"><span className="lp-plan-feature-x">✗</span><span style={{ color: 'var(--lp-text3)' }}>{t('landing.pricing.features.aiFeatures')}</span></div>
              <div className="lp-plan-feature"><span className="lp-plan-feature-x">✗</span><span style={{ color: 'var(--lp-text3)' }}>{t('landing.pricing.features.prioritySupport')}</span></div>
              <button className="lp-plan-btn">{t('landing.pricing.getStartedFree')}</button>
            </div>

            {/* BUSINESS */}
            <div className="lp-pricing-card popular">
              <div className="lp-popular-badge">{t('landing.pricing.mostPopular')}</div>
              <div className="lp-plan-name">{t('landing.pricing.business')}</div>
              <div className="lp-plan-price"><sup>от </sup>29 900 ₸</div>
              <div className="lp-plan-price-label">{t('landing.pricing.perMonth')}</div>
              <div className="lp-plan-divider"></div>
              <div className="lp-plan-feature"><span className="lp-plan-feature-check">✓</span><span>{t('landing.pricing.features.unlimitedDocs')}</span></div>
              <div className="lp-plan-feature"><span className="lp-plan-feature-check">✓</span><span>{t('landing.pricing.features.advancedWorkflows')}</span></div>
              <div className="lp-plan-feature"><span className="lp-plan-feature-check">✓</span><span>{t('landing.pricing.features.aiAdvanced')}</span></div>
              <div className="lp-plan-feature"><span className="lp-plan-feature-check">✓</span><span>{t('landing.pricing.features.auditTrail')}</span></div>
              <div className="lp-plan-feature"><span className="lp-plan-feature-check">✓</span><span>{t('landing.pricing.features.prioritySupport')}</span></div>
              <button className="lp-plan-btn primary">{t('landing.pricing.startTrial')}</button>
            </div>

            {/* ENTERPRISE */}
            <div className="lp-pricing-card">
              <div className="lp-plan-name">{t('landing.pricing.enterprise')}</div>
              <div className="lp-plan-price" style={{ fontSize: '2rem', paddingTop: '8px' }}>{t('landing.pricing.custom')}</div>
              <div className="lp-plan-price-label">{t('landing.pricing.tailored')}</div>
              <div className="lp-plan-divider"></div>
              <div className="lp-plan-feature"><span className="lp-plan-feature-check">✓</span><span>{t('landing.pricing.features.unlimitedUsers')}</span></div>
              <div className="lp-plan-feature"><span className="lp-plan-feature-check">✓</span><span>{t('landing.pricing.features.onPremise')}</span></div>
              <div className="lp-plan-feature"><span className="lp-plan-feature-check">✓</span><span>{t('landing.pricing.features.customIntegrations')}</span></div>
              <div className="lp-plan-feature"><span className="lp-plan-feature-check">✓</span><span>{t('landing.pricing.features.sla')}</span></div>
              <div className="lp-plan-feature"><span className="lp-plan-feature-check">✓</span><span>{t('landing.pricing.features.dedicatedManager')}</span></div>
              <button className="lp-plan-btn">{t('landing.pricing.contactUs')}</button>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section id="lp-faq" className="lp-section">
        <div className="lp-container">
          <div className="lp-section-label">{t('landing.faq.label')}</div>
          <div className="lp-section-title lp-fade-up">{t('landing.faq.title')}</div>
          <div className="lp-faq-grid lp-fade-up">
            {(t('landing.faq.items', { returnObjects: true }) as any[]).map((item, idx) => (
              <div
                className={`lp-faq-item ${openFaq === idx ? 'open' : ''}`}
                key={idx}
                onClick={() => toggleFaq(idx)}
              >
                <div className="lp-faq-question">
                  <span>{item.q}</span>
                  <span className="lp-faq-chevron">+</span>
                </div>
                <div className="lp-faq-answer">
                  {item.a}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <div className="lp-cta-section">
        <div className="lp-section-label">{t('landing.cta.label')}</div>
        <h2 className="lp-section-title">{t('landing.cta.title')}</h2>
        <p className="lp-section-sub" style={{ margin: '0 auto 36px' }}>{t('landing.cta.sub')}</p>
        <div style={{ display: 'flex', gap: '12px', justifyContent: 'center', flexWrap: 'wrap' }}>
          <Link to="/register" className="lp-btn-primary lp-btn-large">{t('landing.startFree')}</Link>
          <a href="mailto:hello@dockflow.kz" className="lp-btn-ghost lp-btn-large">{t('landing.cta.demo')}</a>
        </div>
      </div>

      {/* FOOTER */}
      <footer className="lp-footer">
        <div className="lp-footer-container">
          <Link to="/" className="lp-logo" style={{ fontSize: '1.1rem' }}>Dock<span>flow</span></Link>
          <div className="lp-footer-copy">© 2026 Dockflow. <span>{t('landing.footer.madeInKz')}</span></div>
          <div className="lp-footer-links">
            <a href="#">{t('landing.footer.privacy')}</a>
            <a href="#">{t('landing.footer.terms')}</a>
            <a href="mailto:hello@dockflow.kz">hello@dockflow.kz</a>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;
