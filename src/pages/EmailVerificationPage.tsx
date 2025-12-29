import { useState, useEffect } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import LoadingSpinner from '../components/LoadingSpinner';

const EmailVerificationPage = () => {
  const [searchParams] = useSearchParams();
  const { verifyEmail, resendVerificationCode } = useAuth();

  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [message, setMessage] = useState('');
  const [isResending, setIsResending] = useState(false);
  const [manualCode, setManualCode] = useState('');

  // 1. Get email from URL (priority) or LocalStorage
  const email = searchParams.get('email') || localStorage.getItem('registrationEmail') || '';
  const codeFromUrl = searchParams.get('verificationCode') || '';

  // Automatic verification from email link
  useEffect(() => {
    // We strictly use the email found in URL or LocalStorage
    const targetEmail = searchParams.get('email') || localStorage.getItem('registrationEmail');

    // Only attempt auto-verify if we have BOTH email and code (from URL)
    if (targetEmail && codeFromUrl && status === 'idle') {
      const verify = async () => {
        setStatus('loading');
        try {
          await verifyEmail(targetEmail, codeFromUrl);
          setStatus('success');
          setMessage('Your email has been successfully verified!');
          localStorage.removeItem('registrationEmail');
        } catch (err: any) {
          setStatus('error');
          const errorMessage = typeof err.response?.data === 'string'
            ? err.response.data
            : err.response?.data?.message || 'Invalid or expired code.';
          setMessage(errorMessage);
        }
      };
      verify();
    }
  }, [codeFromUrl, verifyEmail, status, searchParams]);

  const handleManualSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) {
      setMessage('Session expired. Please register again.');
      return;
    }
    if (!manualCode.trim()) {
      setMessage('Code is required.');
      return;
    }

    setStatus('loading');
    try {
      await verifyEmail(email, manualCode.trim());
      setStatus('success');
      setMessage('Your email has been successfully verified!');
      localStorage.removeItem('registrationEmail');
    } catch (err: any) {
      setStatus('error');
      const errorMessage = typeof err.response?.data === 'string'
        ? err.response.data
        : err.response?.data?.message || 'Wrong code. Try again.';
      setMessage(errorMessage);
    }
  };

  const handleResend = async () => {
    if (!email) return;
    setIsResending(true);
    try {
      await resendVerificationCode(email);
      setMessage('New code sent!');
    } catch (err: any) {
      const errorMessage = typeof err.response?.data === 'string'
        ? err.response.data
        : err.response?.data?.message || 'Failed to resend.';
      setMessage(errorMessage);
    } finally {
      setIsResending(false);
    }
  };

  // If email is missing (e.g. user cleared cache or didn't register), we can't proceed.
  // We show a message asking them to register.
  const isSessionValid = !!email;

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4">
      <div className="max-w-md w-full bg-white p-8 rounded-lg shadow">
        <h2 className="text-3xl font-bold text-center mb-4">Verify Your Email</h2>

        {isSessionValid ? (
          <p className="text-center text-gray-600 mb-6">Code sent to: <strong>{email}</strong></p>
        ) : (
          <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 mb-6">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <p className="text-sm text-yellow-700">
                  Email not found in session. Please <Link to="/register" className="font-medium underline hover:text-yellow-600">register again</Link> or use the link from your email.
                </p>
              </div>
            </div>
          </div>
        )}

        {status === 'success' ? (
          <div className="text-center space-y-6">
            <div className="w-16 h-16 mx-auto bg-green-100 rounded-full flex items-center justify-center">
              <svg className="w-10 h-10 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h3 className="text-xl font-semibold">Success!</h3>
            <p>{message}</p>
            <Link to="/login" className="block w-full text-center bg-blue-600 text-white py-3 rounded-md hover:bg-blue-700">
              Go to Sign In
            </Link>
          </div>
        ) : (
          <>
            {message && status !== 'idle' && (
              <div className={`p-4 rounded text-center ${status === 'error' ? 'bg-red-50 text-red-700' : 'bg-green-50 text-green-700'}`}>
                {message}
              </div>
            )}

            {status === 'loading' ? (
              <div className="text-center py-12">
                <LoadingSpinner />
                <p className="mt-4">Verifying...</p>
              </div>
            ) : (
              <form onSubmit={handleManualSubmit} className="space-y-6">
                <input
                  type="text"
                  placeholder="Enter confirmation code (UUID)"
                  value={manualCode}
                  onChange={(e) => setManualCode(e.target.value)}
                  className="w-full px-4 py-3 border rounded-md text-center text-lg shadow-sm focus:ring-blue-500 focus:border-blue-500"
                  required
                  disabled={!isSessionValid}
                />
                <button
                  type="submit"
                  disabled={!manualCode.trim() || !isSessionValid}
                  className="w-full py-3 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-gray-400 font-medium transition-colors"
                >
                  Verify Email
                </button>
              </form>
            )}

            {isSessionValid && (
              <div className="text-center mt-6 space-y-3">
                <button
                  onClick={handleResend}
                  disabled={isResending}
                  className="text-blue-600 hover:underline disabled:text-gray-400 text-sm"
                >
                  {isResending ? 'Sending...' : "Didn't receive code? Resend"}
                </button>
              </div>
            )}

            <div className="text-center mt-4">
              <Link to="/login" className="text-gray-500 hover:text-gray-700 hover:underline text-sm">
                Back to Sign In
              </Link>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default EmailVerificationPage;