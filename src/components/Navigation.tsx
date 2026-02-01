import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { useTranslation } from 'react-i18next';
import { LanguageSelector } from './LanguageSelector';

interface NavigationProps {
  children?: React.ReactNode;
}

const Navigation = ({ children }: NavigationProps) => {
  const { user, logout } = useAuth();
  const { t } = useTranslation();
  const location = useLocation();

  const navigation = [
    { name: t('navigation.dashboard'), href: '/', current: location.pathname === '/' },
    { name: t('navigation.documents'), href: '/documents', current: location.pathname === '/documents' },
    { name: t('navigation.workflow'), href: '/workflow', current: location.pathname === '/workflow' },
    { name: t('navigation.company'), href: '/company', current: location.pathname === '/company' },
    { name: t('navigation.kanban'), href: '/kanban', current: location.pathname === '/kanban' },
    { name: t('navigation.chat'), href: '/chat', current: location.pathname === '/chat' },
    { name: t('navigation.aiSettings'), href: '/ai-settings', current: location.pathname === '/ai-settings' },
  ];

  const handleLogout = async () => {
    await logout();
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-4">
              <Link to="/" className="text-2xl font-bold text-gray-900">DocFlow</Link>
              <nav className="flex space-x-8">
                {navigation.map((item) => (
                  <Link
                    key={item.name}
                    to={item.href}
                    className={`pb-2 ${item.current
                      ? 'text-blue-600 border-b-2 border-blue-600'
                      : 'text-gray-600 hover:text-gray-900'
                      }`}
                  >
                    {item.name}
                  </Link>
                ))}
              </nav>
            </div>
            <div className="flex items-center space-x-4">
              <LanguageSelector />
              {user && (
                <span className="text-sm text-gray-600">
                  {t('navigation.welcome')}, {user.firstName} {user.lastName}
                </span>
              )}
              <button
                onClick={handleLogout}
                className="btn-secondary text-sm"
              >
                {t('navigation.logout')}
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {children}
      </main>
    </div>
  );
};

export default Navigation;
