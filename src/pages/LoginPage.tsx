import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../hooks/useAuth';
import LoadingSpinner from '../components/LoadingSpinner';
import AuthLayout from '../components/AuthLayout';

const LoginPage = () => {
  const { t } = useTranslation();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const { login, isAuthenticated } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (isAuthenticated) {
      navigate('/');
    }
  }, [isAuthenticated, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      await login(email, password);
      navigate('/');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Login failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AuthLayout 
      title={t('auth.loginTitle')} 
      subtitle={t('auth.loginSub')}
    >
      <form className="space-y-5" onSubmit={handleSubmit}>
        {error && (
          <div className="bg-red-500/10 border border-red-500/20 text-red-500 px-4 py-3 rounded-lg text-sm">
            {error}
          </div>
        )}

        <div className="space-y-4">
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-[var(--lp-text2)] mb-1.5">
              {t('auth.email')}
            </label>
            <input
              id="email"
              name="email"
              type="email"
              autoComplete="email"
              required
              className="input-field"
              placeholder="name@company.kz"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label htmlFor="password" className="block text-sm font-medium text-[var(--lp-text2)]">
                {t('auth.password')}
              </label>
              <Link
                to="/forgot-password"
                className="text-xs font-semibold text-[var(--lp-accent2)] hover:text-[var(--lp-accent)] transition-colors"
              >
                {t('auth.forgotPassword')}
              </Link>
            </div>
            <input
              id="password"
              name="password"
              type="password"
              autoComplete="current-password"
              required
              className="input-field"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>
        </div>

        <button
          type="submit"
          disabled={isLoading}
          className="lp-btn-primary lp-btn-large w-full justify-center disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isLoading ? (
            <>
              <LoadingSpinner size="sm" className="mr-2" />
              {t('auth.signingIn')}
            </>
          ) : (
            t('auth.signIn')
          )}
        </button>

        <div className="text-center pt-2">
          <Link
            to="/register"
            className="text-[var(--lp-text2)] hover:text-[var(--lp-accent2)] text-sm transition-colors"
          >
            {t('auth.noAccount')}
          </Link>
        </div>
      </form>
    </AuthLayout>
  );
};

export default LoginPage;
