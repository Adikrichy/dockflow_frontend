import { useState, useEffect } from 'react';
import { useAuth } from '../hooks/useAuth';
import { companyService } from '../services/api';
import type { Company, Role } from '../types/auth';
import LoadingSpinner from '../components/LoadingSpinner';
import Navigation from '../components/Navigation';
import Modal from '../components/Modal';

const CompanyPage = () => {
  const { user, refreshAuth } = useAuth();
  const [company, setCompany] = useState<Company | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [showJoinForm, setShowJoinForm] = useState(false);
  const [roles, setRoles] = useState<Role[]>([]);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    useDefaultRoles: true
  });
  const [joinCompanyId, setJoinCompanyId] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    loadCompanyData();
  }, []);

  const loadCompanyData = async (retryCount = 0) => {
    try {
      const currentCompany = await companyService.getCurrentCompany();
      setCompany(currentCompany);

      if (currentCompany) {
        const availableRoles = await companyService.getAllRoles();
        setRoles(availableRoles);
      } else {
        setRoles([]);
      }
    } catch (error: any) {
      if (retryCount < 3 && (error.response?.status === 404 || error.response?.status === 401)) {
        // Если нет компании — подождём и попробуем снова
        setTimeout(() => loadCompanyData(retryCount + 1), 1000);
      } else {
        console.error('Failed to load company data:', error);
        setCompany(null);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateCompany = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsSubmitting(true);

    try {
      const newCompany = await companyService.createCompany(formData);
      setCompany(newCompany);
      await refreshAuth(); // Update user context to get the new role
      setShowCreateForm(false);
      setFormData({ name: '', description: '', useDefaultRoles: true });
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to create company');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleJoinCompany = async (companyId: number) => {
    setError('');
    setIsSubmitting(true);
    try {
      // 1. Присоединяемся
      await companyService.joinCompany(companyId);

      // 2. Входим — это установит куку jwtWithCompany
      await companyService.enterCompany(companyId);

      // 3. НЕ вызываем refreshAuth() — он сломает куку!

      // 4. Перезагружаем данные компании — теперь запросы пойдут с новой кукой
      await loadCompanyData();

      setShowJoinForm(false);
      setJoinCompanyId('');
    } catch (err: any) {
      setError(
        err.response?.data?.message ||
        'Failed to join or enter company. Try refreshing the page after a few seconds.'
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleJoinCompanySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const companyId = parseInt(joinCompanyId);
    if (isNaN(companyId)) {
      setError('Please enter a valid company ID');
      return;
    }
    await handleJoinCompany(companyId);
  };

  const handleLeaveCompany = async () => {
    try {
      await companyService.exitCompany();
      setCompany(null);
    } catch (error) {
      console.error('Failed to leave company:', error);
    }
  };

  if (isLoading) {
    return <LoadingSpinner />;
  }

  return (
    <Navigation>
      <div className="space-y-6">
        {/* Current Company Status */}
        <div className="card">
          <h1 className="text-2xl font-bold text-gray-900 mb-6">Company Management</h1>

          {company ? (
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-medium text-green-900">{company.name}</h3>
                  <p className="text-green-700 mt-1">{company.description}</p>
                  <p className="text-sm text-green-600 mt-2">
                    Status: Active Member • Role: {user?.companyRole || 'Member'}
                  </p>
                </div>
                <button
                  onClick={handleLeaveCompany}
                  className="btn-danger"
                >
                  Leave Company
                </button>
              </div>
            </div>
          ) : (
            <div className="text-center py-8">
              <p className="text-gray-600 mb-4">You are not currently a member of any company.</p>
              <button
                onClick={() => setShowCreateForm(true)}
                className="btn-primary mr-4"
              >
                Create New Company
              </button>
              <button
                onClick={() => setShowJoinForm(true)}
                className="btn-secondary"
              >
                Join Existing Company
              </button>
            </div>
          )}
        </div>

        {/* Available Roles */}
        {roles.length > 0 && (
          <div className="card">
            <h2 className="text-xl font-semibold text-gray-900 mb-6">Available Roles</h2>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {roles.map((role) => (
                <div key={role.id} className="bg-gray-50 rounded-lg p-4 text-center">
                  <span className="text-sm font-medium text-gray-900">{role.name} - Level {role.level}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Features Overview */}
        <div className="card">
          <h2 className="text-xl font-semibold text-gray-900 mb-6">Company Features</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <h3 className="text-lg font-medium text-gray-900">Multi-tenant Architecture</h3>
              <ul className="list-disc list-inside text-gray-600 space-y-1">
                <li>Data isolation between companies</li>
                <li>Company-specific workflow templates</li>
                <li>Role-based access control</li>
                <li>Secure document sharing</li>
              </ul>
            </div>
            <div className="space-y-4">
              <h3 className="text-lg font-medium text-gray-900">Team Collaboration</h3>
              <ul className="list-disc list-inside text-gray-600 space-y-1">
                <li>Real-time notifications</li>
                <li>Document approval workflows</li>
                <li>Team chat and communication</li>
                <li>Audit trails and reporting</li>
              </ul>
            </div>
          </div>
        </div>
      </div>

      {/* Create Company Modal */}
      <Modal
        isOpen={showCreateForm}
        onClose={() => setShowCreateForm(false)}
        title="Create New Company"
      >
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6">
            {error}
          </div>
        )}

        <form onSubmit={handleCreateCompany} className="space-y-6">
          <div>
            <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
              Company Name
            </label>
            <input
              type="text"
              id="name"
              required
              className="input-field"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="Enter company name"
            />
          </div>

          <div>
            <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-2">
              Description
            </label>
            <textarea
              id="description"
              rows={3}
              className="input-field"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Describe your company (optional)"
            />
          </div>

          <div>
            <label className="flex items-center space-x-2">
              <input
                type="checkbox"
                checked={formData.useDefaultRoles}
                onChange={(e) => setFormData({ ...formData, useDefaultRoles: e.target.checked })}
                className="form-checkbox h-4 w-4 text-blue-600 transition duration-150 ease-in-out"
              />
              <span className="text-gray-700 font-medium">Use Default Roles (CEO, Director, Manager, Worker)</span>
            </label>
          </div>

          <div className="flex space-x-4">
            <button
              type="submit"
              disabled={isSubmitting}
              className="btn-primary flex items-center disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? (
                <>
                  <LoadingSpinner size="sm" className="mr-2" />
                  Creating...
                </>
              ) : (
                'Create Company'
              )}
            </button>
            <button
              type="button"
              onClick={() => {
                setShowCreateForm(false);
                setError('');
                setFormData({ name: '', description: '', useDefaultRoles: true });
              }}
              className="btn-secondary"
            >
              Cancel
            </button>
          </div>
        </form>
      </Modal>

      {/* Join Company Modal */}
      <Modal
        isOpen={showJoinForm}
        onClose={() => setShowJoinForm(false)}
        title="Join Existing Company"
      >
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6">
            {error}
          </div>
        )}

        <form onSubmit={handleJoinCompanySubmit} className="space-y-6">
          <div>
            <label htmlFor="companyId" className="block text-sm font-medium text-gray-700 mb-2">
              Company ID
            </label>
            <input
              type="number"
              id="companyId"
              required
              className="input-field"
              value={joinCompanyId}
              onChange={(e) => setJoinCompanyId(e.target.value)}
              placeholder="Enter company ID"
            />
            <p className="text-sm text-gray-500 mt-1">
              Ask your company administrator for the company ID
            </p>
          </div>

          <div className="flex space-x-4">
            <button
              type="submit"
              disabled={isSubmitting}
              className="btn-primary flex items-center disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? (
                <>
                  <LoadingSpinner size="sm" className="mr-2" />
                  Joining...
                </>
              ) : (
                'Join Company'
              )}
            </button>
            <button
              type="button"
              onClick={() => {
                setShowJoinForm(false);
                setError('');
                setJoinCompanyId('');
              }}
              className="btn-secondary"
            >
              Cancel
            </button>
          </div>
        </form>
      </Modal>
    </Navigation>
  );
};

export default CompanyPage;
