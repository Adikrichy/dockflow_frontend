import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../hooks/useAuth';
import LoadingSpinner from '../components/LoadingSpinner';
import AuthLayout from '../components/AuthLayout';

const RegisterPage = () => {
  const { t } = useTranslation();
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    confirmPassword: '',
  });
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const { register } = useAuth();
  const navigate = useNavigate();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (formData.password !== formData.confirmPassword) {
      setError(t('auth.passwordsDoNotMatch') || 'Passwords do not match');
      return;
    }

    if (formData.password.length < 6) {
      setError(t('auth.passwordTooShort') || 'Password must be at least 6 characters long');
      return;
    }

    setIsLoading(true);

    try {
      await register(
        formData.email,
        formData.password,
        formData.firstName,
        formData.lastName
      );
      localStorage.setItem('registrationEmail', formData.email);
      navigate(`/verify-email?email=${encodeURIComponent(formData.email)}`);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Registration failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AuthLayout 
      title={t('auth.registerTitle')} 
      subtitle={t('auth.registerSub')}
    >
      <form className="space-y-5" onSubmit={handleSubmit}>
        {error && (
          <div className="bg-red-500/10 border border-red-500/20 text-red-500 px-4 py-3 rounded-lg text-sm">
            {error}
          </div>
        )}

        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label htmlFor="firstName" className="block text-sm font-medium text-[var(--lp-text2)] mb-1.5">
                {t('auth.firstName')}
              </label>
              <input
                id="firstName"
                name="firstName"
                type="text"
                required
                className="input-field"
                value={formData.firstName}
                onChange={handleChange}
              />
            </div>
            <div>
              <label htmlFor="lastName" className="block text-sm font-medium text-[var(--lp-text2)] mb-1.5">
                {t('auth.lastName')}
              </label>
              <input
                id="lastName"
                name="lastName"
                type="text"
                required
                className="input-field"
                value={formData.lastName}
                onChange={handleChange}
              />
            </div>
          </div>

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
              value={formData.email}
              onChange={handleChange}
            />
          </div>

          <div>
            <label htmlFor="password" className="block text-sm font-medium text-[var(--lp-text2)] mb-1.5">
              {t('auth.password')}
            </label>
            <input
              id="password"
              name="password"
              type="password"
              required
              className="input-field"
              placeholder="••••••••"
              value={formData.password}
              onChange={handleChange}
            />
          </div>

          <div>
            <label htmlFor="confirmPassword" className="block text-sm font-medium text-[var(--lp-text2)] mb-1.5">
              {t('auth.confirmPassword')}
            </label>
            <input
              id="confirmPassword"
              name="confirmPassword"
              type="password"
              required
              className="input-field"
              placeholder="••••••••"
              value={formData.confirmPassword}
              onChange={handleChange}
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
              {t('auth.creatingAccount')}
            </>
          ) : (
            t('auth.createAccount')
          )}
        </button>

        <div className="text-center pt-2">
          <Link
            to="/login"
            className="text-[var(--lp-text2)] hover:text-[var(--lp-accent2)] text-sm transition-colors"
          >
            {t('auth.hasAccount')}
          </Link>
        </div>
      </form>
    </AuthLayout>
  );
};

export default RegisterPage;
