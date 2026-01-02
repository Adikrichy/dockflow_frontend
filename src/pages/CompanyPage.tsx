import { useState } from 'react';
import { useAuth } from '../hooks/useAuth';
import { companyService } from '../services/api';
import LoadingSpinner from '../components/LoadingSpinner';
import Navigation from '../components/Navigation';
import Modal from '../components/Modal';
import KeyUploadModal from '../components/KeyUploadModal';

const CompanyPage = () => {
  const {
    companies,
    currentCompany,
    isLoading: authLoading,
    refreshAuth,
  } = useAuth();

  const [showCreateForm, setShowCreateForm] = useState(false);
  const [showJoinForm, setShowJoinForm] = useState(false);
  const [showKeyUploadModal, setShowKeyUploadModal] = useState(false);
  const [selectedCompanyForKey, setSelectedCompanyForKey] = useState<{
    companyId: number;
    companyName: string;
  } | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    useDefaultRoles: true,
  });
  const [joinCompanyId, setJoinCompanyId] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const downloadKeyFile = (keyFile: Blob, companyId: number, companyName: string) => {
    const url = window.URL.createObjectURL(keyFile);
    const a = document.createElement('a');
    a.href = url;
    // Backend generates .p12 files, so use .p12 extension
    a.download = `company_${companyId}_key.p12`;
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
    document.body.removeChild(a);

    alert(`Key file for "${companyName}" has been downloaded. Keep it safe! Remember the password you used to encrypt it!`);
  };

  const handleCreateCompany = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsSubmitting(true);

    try {
      const response = await companyService.createCompany(formData);
      
      // Refresh auth to get updated company list
      await refreshAuth();
      
      setShowCreateForm(false);
      setFormData({ name: '', description: '', useDefaultRoles: true });

      // Download the key file
      // If company.id is 0, try to find it from refreshed companies
      let companyId = response.company.id;
      let companyName = response.company.name;
      
      if (companyId === 0) {
        // Find the newly created company from refreshed companies
        const newCompany = companies.find(c => c.companyName === formData.name);
        if (newCompany) {
          companyId = newCompany.companyId;
          companyName = newCompany.companyName;
        }
      }
      
      if (companyId > 0) {
        downloadKeyFile(response.keyFile, companyId, companyName);
      } else {
        // Still download with a generic name
        downloadKeyFile(response.keyFile, Date.now(), formData.name || 'company');
      }
    } catch (err: any) {
      console.error('Error creating company:', err);
      setError(err.response?.data?.message || err.message || 'Failed to create company');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleJoinCompany = async (companyId: number) => {
    setError('');
    setIsSubmitting(true);

    try {
      const joinResponse = await companyService.joinCompany(companyId);
      await refreshAuth();
      setShowJoinForm(false);
      setJoinCompanyId('');

      // Find the company name for download - might not be in companies yet, so use a generic name
      const company = companies.find(c => c.companyId === companyId);
      const companyName = company ? company.companyName : `Company ${companyId}`;
      downloadKeyFile(joinResponse.keyFile, companyId, companyName);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to join company');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleJoinCompanySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const companyId = parseInt(joinCompanyId, 10);
    if (isNaN(companyId)) {
      setError('Please enter a valid company ID');
      return;
    }
    await handleJoinCompany(companyId);
  };

  const handleEnterCompanyClick = (companyId: number) => {
    const company = companies.find(c => c.companyId === companyId);
    if (company) {
      setSelectedCompanyForKey({ companyId, companyName: company.companyName });
      setShowKeyUploadModal(true);
    }
  };

  const handleEnterCompanyWithKey = async (keyFile: File) => {
    if (!selectedCompanyForKey) return;

    try {
      await companyService.enterCompany(selectedCompanyForKey.companyId, keyFile);
      await refreshAuth();
      setShowKeyUploadModal(false);
      setSelectedCompanyForKey(null);
    } catch (err: any) {
      throw err; // Re-throw to let the modal handle the error
    }
  };

  const handleExitCompany = async () => {
    try {
      await companyService.exitCompany();
      await refreshAuth();
    } catch (err) {
      console.error('Failed to exit company', err);
    }
  };

  if (authLoading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <LoadingSpinner />
      </div>
    );
  }

  return (
    <Navigation>
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-6">
          Company Management
        </h1>

        {companies.length === 0 ? (
          <div className="bg-white rounded-lg shadow p-6 text-center">
            <p className="text-gray-600 mb-4">
              You are not currently a member of any company.
            </p>
            <div className="space-x-4">
              <button
                onClick={() => setShowCreateForm(true)}
                className="btn-primary"
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
          </div>
        ) : (
          <>
            {currentCompany && (
              <div className="bg-green-50 border border-green-200 rounded-lg p-6 mb-6">
                <div className="flex justify-between items-start">
                  <div>
                    <h2 className="text-2xl font-bold text-green-900">
                      Current Company: {currentCompany.companyName}
                    </h2>
                    {currentCompany.description && (
                      <p className="text-green-700 mt-2">
                        {currentCompany.description}
                      </p>
                    )}
                    <p className="text-green-700 mt-4">
                      Your role:{' '}
                      <span className="font-semibold">
                        {currentCompany.roleName}
                      </span>{' '}
                      (Level {currentCompany.roleLevel})
                    </p>
                  </div>
                  <button
                    onClick={handleExitCompany}
                    className="btn-danger"
                  >
                    Exit Company
                  </button>
                </div>
              </div>
            )}

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mb-6">
              <p className="text-blue-900 mb-4 text-center">
                {currentCompany 
                  ? `You are a member of ${companies.length} company(ies). Select another to switch:`
                  : `You are a member of ${companies.length} company(ies). Select one to enter:`}
              </p>
              <div className="space-y-3">
                {companies.map((company) => {
                  const isCurrent = currentCompany?.companyId === company.companyId;
                  return (
                    <div
                      key={company.companyId}
                      className={`flex items-center justify-between rounded-lg p-4 shadow-sm border ${
                        isCurrent 
                          ? 'bg-green-100 border-green-300' 
                          : 'bg-white border-blue-200'
                      }`}
                    >
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <h3 className="text-lg font-semibold text-gray-900">
                            {company.companyName}
                          </h3>
                          {isCurrent && (
                            <span className="px-2 py-1 text-xs font-semibold bg-green-500 text-white rounded">
                              Current
                            </span>
                          )}
                        </div>
                        {company.description && (
                          <p className="text-gray-600 text-sm mt-1">
                            {company.description}
                          </p>
                        )}
                        <p className="text-blue-700 mt-2">
                          Role: <span className="font-medium">{company.roleName}</span> (Level {company.roleLevel})
                        </p>
                      </div>
                      {!isCurrent && (
                        <button
                          onClick={() => handleEnterCompanyClick(company.companyId)}
                          className="btn-primary"
                        >
                          Enter Company
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Show create/join buttons */}
            <div className="text-center space-x-4 mb-6">
              <button
                onClick={() => setShowCreateForm(true)}
                className="btn-primary"
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
          </>
        )}

        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Company Features</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Multi-tenant Architecture
              </h3>
              <ul className="list-disc list-inside text-gray-700 space-y-1">
                <li>Data isolation between companies</li>
                <li>Company-specific workflow templates</li>
                <li>Role-based access control</li>
                <li>Secure document sharing</li>
              </ul>
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Team Collaboration
              </h3>
              <ul className="list-disc list-inside text-gray-700 space-y-1">
                <li>Real-time notifications</li>
                <li>Document approval workflows</li>
                <li>Team chat and communication</li>
                <li>Audit trails and reporting</li>
              </ul>
            </div>
          </div>
        </div>

        <Modal isOpen={showCreateForm} onClose={() => setShowCreateForm(false)} title="Create New Company">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-4">
              {error}
            </div>
          )}
          <form onSubmit={handleCreateCompany} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Company Name</label>
              <input
                type="text"
                required
                className="input-field"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Enter company name"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
              <textarea
                rows={3}
                className="input-field"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Describe your company (optional)"
              />
            </div>
            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                checked={formData.useDefaultRoles}
                onChange={(e) => setFormData({ ...formData, useDefaultRoles: e.target.checked })}
                className="h-4 w-4 text-blue-600"
              />
              <span className="text-sm text-gray-700">
                Use Default Roles (CEO, Director, Manager, Worker)
              </span>
            </div>
            <div className="flex justify-end space-x-3">
              <button
                type="submit"
                disabled={isSubmitting}
                className="btn-primary flex items-center"
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

        <Modal isOpen={showJoinForm} onClose={() => setShowJoinForm(false)} title="Join Existing Company">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-4">
              {error}
            </div>
          )}
          <form onSubmit={handleJoinCompanySubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Company ID</label>
              <input
                type="number"
                required
                className="input-field"
                value={joinCompanyId}
                onChange={(e) => setJoinCompanyId(e.target.value)}
                placeholder="Enter company ID"
              />
              <p className="text-gray-500 mt-1 text-sm">
                Ask your company administrator for the company ID
              </p>
            </div>
            <div className="flex justify-end space-x-3">
              <button
                type="submit"
                disabled={isSubmitting}
                className="btn-primary flex items-center"
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

        <KeyUploadModal
          isOpen={showKeyUploadModal}
          onClose={() => {
            setShowKeyUploadModal(false);
            setSelectedCompanyForKey(null);
          }}
          onSubmit={handleEnterCompanyWithKey}
          companyName={selectedCompanyForKey?.companyName || ''}
          isLoading={isSubmitting}
        />
      </div>
    </Navigation>
  );
};

export default CompanyPage;