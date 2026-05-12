import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../hooks/useAuth';
import { useTheme } from '../context/ThemeContext';
import { useSidebar } from '../context/SidebarContext';
import './Sidebar.css';

const Sidebar: React.FC = () => {
  const { t, i18n } = useTranslation();
  const { user, currentCompany, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const { isCollapsed, toggleSidebar } = useSidebar();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const changeLanguage = (lng: string) => {
    i18n.changeLanguage(lng);
  };

  interface NavItem {
    name: string;
    path: string;
    icon: string;
    requireCompany: boolean;
    permission?: string;
  }

  const navItems: NavItem[] = [
    { name: t('navigation.dashboard'), path: '/dashboard', icon: '📊', requireCompany: true },
    { name: t('navigation.documents'), path: '/documents', icon: '📄', requireCompany: true },
    { name: t('navigation.workflow'), path: '/workflow', icon: '🔄', requireCompany: true },
    { name: t('navigation.company'), path: '/company', icon: '🏢', requireCompany: false },
    { name: t('navigation.kanban'), path: '/kanban', icon: '📋', requireCompany: true },
    { name: t('navigation.chat'), path: '/chat', icon: '💬', requireCompany: true },
    { name: t('navigation.reports'), path: '/reports', icon: '📈', requireCompany: true },
    { name: t('navigation.aiSettings'), path: '/ai-settings', icon: '🤖', requireCompany: true },
    { name: t('navigation.profileSettings', 'Профиль'), path: '/profile-settings', icon: '👤', requireCompany: false },
  ];

  const visibleNavItems = navItems.filter(item => {
    if (item.requireCompany && !currentCompany) return false;
    if (item.permission && currentCompany && !(currentCompany as any)[item.permission]) return false;
    return true;
  });

  return (
    <aside className={`sidebar ${isCollapsed ? 'collapsed' : ''}`}>
      <div className="sidebar-header">
        {!isCollapsed && (
          <NavLink to="/dashboard" className="sidebar-logo">
            Dock<span>flow</span>
          </NavLink>
        )}
        <button 
          className="sidebar-toggle" 
          onClick={toggleSidebar}
          title={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          {isCollapsed ? '➡️' : '⬅️'}
        </button>
      </div>

      <nav className="sidebar-nav">
        {visibleNavItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}
            title={isCollapsed ? item.name : ""}
          >
            <span className="sidebar-icon">{item.icon}</span>
            {!isCollapsed && <span className="sidebar-link-text">{item.name}</span>}
          </NavLink>
        ))}
      </nav>

      <div className="sidebar-footer">
        <div className="sidebar-controls">
          <button
            className="sidebar-control-btn theme-toggle"
            onClick={() => toggleTheme(theme === 'light' ? 'dark' : 'light')}
            title={theme === 'light' ? 'Switch to Dark Mode' : 'Switch to Light Mode'}
          >
            {theme === 'light' ? '☀️' : '🌙'}
            {!isCollapsed && <span className="ml-2">{theme === 'light' ? 'Light Mode' : 'Dark Mode'}</span>}
          </button>

          {!isCollapsed && (
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
          )}
          
          {isCollapsed && (
            <button 
              className="sidebar-control-btn lang-toggle-mini"
              onClick={() => changeLanguage(i18n.language.startsWith('en') ? 'ru' : i18n.language.startsWith('ru') ? 'kz' : 'en')}
              title="Change Language"
            >
              {i18n.language.toUpperCase().substring(0, 2)}
            </button>
          )}
        </div>

        <div className="sidebar-user">
          <div className="sidebar-avatar">
            {user?.firstName?.[0]}{user?.lastName?.[0]}
          </div>
          {!isCollapsed && (
            <div className="sidebar-user-info">
              <div className="sidebar-user-name">
                {user?.firstName} {user?.lastName}
              </div>
              <div className="sidebar-user-role">
                {currentCompany ? `${currentCompany.companyName} (${currentCompany.roleName})` : user?.userType}
              </div>
            </div>
          )}
          <button 
            onClick={handleLogout} 
            className={isCollapsed ? "sidebar-btn-logout-mini" : "sidebar-btn-logout"} 
            title="Logout"
          >
            🚪
          </button>
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;
