import React, { useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { companyService } from '../services/companyService';
import AuthLayout from '../components/AuthLayout';
import LoadingSpinner from '../components/LoadingSpinner';

const AcceptInvitePage: React.FC = () => {
    const { t } = useTranslation();
    const [searchParams] = useSearchParams();
    const token = searchParams.get('token');
    const navigate = useNavigate();

    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirm, setShowConfirm] = useState(false);

    const passwordStrength = password.length === 0 ? 0 : password.length < 6 ? 1 : password.length < 10 ? 2 : 3;
    const passwordsMatch = password.length > 0 && confirmPassword.length > 0 && password === confirmPassword;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');

        if (!token) {
            setError(t('auth.invalidToken') || 'Invitation token is missing');
            return;
        }

        if (password !== confirmPassword) {
            setError(t('auth.passwordsDoNotMatch'));
            return;
        }

        if (password.length < 6) {
            setError(t('auth.passwordTooShort'));
            return;
        }

        setIsLoading(true);
        try {
            const blob = await companyService.acceptInvite({ token, keyPassword: password });
            
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = 'company_key.p12';
            document.body.appendChild(a);
            a.click();
            window.URL.revokeObjectURL(url);
            document.body.removeChild(a);

            setSuccess(true);
        } catch (err: any) {
            console.error('Failed to accept invite:', err);
            setError(err.response?.data?.message || 'Failed to accept invitation. The link may be expired or invalid.');
        } finally {
            setIsLoading(false);
        }
    };

    if (success) {
        return (
            <AuthLayout title={t('auth.successJoined')} subtitle={t('auth.keepKeySafe')}>
                <div className="flex flex-col items-center space-y-6 pt-4">
                    <div className="w-20 h-20 bg-[var(--lp-green)] bg-opacity-10 text-[var(--lp-green)] rounded-full flex items-center justify-center shadow-lg">
                        <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={3}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                        </svg>
                    </div>
                    
                    <div className="bg-[var(--lp-surface2)] border border-[var(--lp-border)] rounded-2xl p-5 w-full flex items-start gap-4">
                        <div className="bg-[var(--lp-accent)] bg-opacity-10 p-2 rounded-lg text-[var(--lp-accent)] shrink-0">
                            <span className="text-xl">🔑</span>
                        </div>
                        <p className="text-sm text-[var(--lp-text2)] leading-relaxed">
                            {t('auth.keepKeySafe')}
                        </p>
                    </div>

                    <button 
                        onClick={() => navigate('/login')}
                        className="lp-btn-primary lp-btn-large w-full mt-2"
                    >
                        {t('auth.signIn')} →
                    </button>
                </div>
            </AuthLayout>
        );
    }

    return (
        <AuthLayout 
            title={t('auth.acceptInviteTitle')} 
            subtitle={t('auth.acceptInviteSub')}
        >
            <form onSubmit={handleSubmit} className="space-y-6">
                {error && (
                    <div className="bg-red-500/10 border border-red-500/20 text-red-500 px-4 py-3 rounded-xl text-sm flex items-center gap-2">
                        <span>⚠️</span> {error}
                    </div>
                )}

                <div className="space-y-5">
                    {/* Password Field */}
                    <div className="space-y-2">
                        <label className="block text-sm font-semibold text-[var(--lp-text2)] px-1">
                            {t('auth.keyPasswordLabel')}
                        </label>
                        <div className="relative group">
                            <input
                                type={showPassword ? "text" : "password"}
                                required
                                className="input-field pr-12 font-medium"
                                placeholder={t('auth.passwordTooShort')}
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                            />
                            <button
                                type="button"
                                onClick={() => setShowPassword(!showPassword)}
                                className="absolute right-3 top-1/2 -translate-y-1/2 p-2 text-[var(--lp-text3)] hover:text-[var(--lp-accent2)] transition-colors"
                                tabIndex={-1}
                            >
                                {showPassword ? (
                                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
                                        <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19"></path>
                                        <line x1="1" y1="1" x2="23" y2="23"></line>
                                        <path d="M9.9 9.9a3 3 0 1 1 4.2 4.2"></path>
                                    </svg>
                                ) : (
                                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
                                        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
                                        <circle cx="12" cy="12" r="3"></circle>
                                    </svg>
                                )}
                            </button>
                        </div>
                        
                        {/* Strength Indicator */}
                        {password.length > 0 && (
                            <div className="px-1 space-y-2 pt-1">
                                <div className="flex gap-2 h-1.5">
                                    {[1, 2, 3].map(level => (
                                        <div 
                                            key={level} 
                                            className={`flex-1 rounded-full transition-all duration-500 ${
                                                passwordStrength >= level 
                                                    ? level === 1 ? 'bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.4)]' : level === 2 ? 'bg-amber-500 shadow-[0_0_8px_rgba(245,158,11,0.4)]' : 'bg-[var(--lp-green)] shadow-[0_0_8px_rgba(31,207,122,0.4)]'
                                                    : 'bg-[var(--lp-border)]'
                                            }`}
                                        />
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Confirm Password Field */}
                    <div className="space-y-2">
                        <label className="block text-sm font-semibold text-[var(--lp-text2)] px-1">
                            {t('auth.confirmPassword')}
                        </label>
                        <div className="relative group">
                            <input
                                type={showConfirm ? "text" : "password"}
                                required
                                className={`input-field pr-12 font-medium ${
                                    confirmPassword.length > 0 
                                        ? passwordsMatch ? 'border-[var(--lp-green)] ring-2 ring-[var(--lp-green)] ring-opacity-10' : 'border-red-500 ring-2 ring-red-500 ring-opacity-10'
                                        : ''
                                }`}
                                placeholder={t('auth.confirmPassword')}
                                value={confirmPassword}
                                onChange={(e) => setConfirmPassword(e.target.value)}
                            />
                            <button
                                type="button"
                                onClick={() => setShowConfirm(!showConfirm)}
                                className="absolute right-3 top-1/2 -translate-y-1/2 p-2 text-[var(--lp-text3)] hover:text-[var(--lp-accent2)] transition-colors"
                                tabIndex={-1}
                            >
                                {showConfirm ? (
                                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
                                        <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19"></path>
                                        <line x1="1" y1="1" x2="23" y2="23"></line>
                                        <path d="M9.9 9.9a3 3 0 1 1 4.2 4.2"></path>
                                    </svg>
                                ) : (
                                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
                                        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
                                        <circle cx="12" cy="12" r="3"></circle>
                                    </svg>
                                )}
                            </button>
                        </div>
                    </div>
                </div>

                <button
                    type="submit"
                    disabled={isLoading || !token || !passwordsMatch || passwordStrength < 1}
                    className="lp-btn-primary lp-btn-large w-full justify-center disabled:opacity-50 disabled:cursor-not-allowed transform active:scale-[0.98] transition-all hover:shadow-lg hover:shadow-[var(--lp-accent)] hover:shadow-opacity-20 flex items-center gap-2"
                >
                    {isLoading ? (
                        <>
                            <LoadingSpinner size="sm" />
                            <span>{t('auth.creatingAccount')}</span>
                        </>
                    ) : (
                        <>
                            <span>{t('auth.acceptAndDownload')}</span>
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
                                <line x1="5" y1="12" x2="19" y2="12"></line>
                                <polyline points="12 5 19 12 12 19"></polyline>
                            </svg>
                        </>
                    )}
                </button>
            </form>
        </AuthLayout>
    );
};

export default AcceptInvitePage;
