import { useState, useEffect } from 'react';
import { useAuth } from '../hooks/useAuth';
import { companyService } from '../services/companyService';
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
    user
  } = useAuth();

  const [showCreateForm, setShowCreateForm] = useState(false);
  const [showJoinForm, setShowJoinForm] = useState(false);
  const [showKeyUploadModal, setShowKeyUploadModal] = useState(false);
  const [showRoleManagement, setShowRoleManagement] = useState(false);
  const [showCreateRole, setShowCreateRole] = useState(false);
  const [selectedCompanyForKey, setSelectedCompanyForKey] = useState<{
    companyId: number;
    companyName: string;
  } | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    useDefaultRoles: true,
  });
  const [roleFormData, setRoleFormData] = useState({
    roleName: '',
    level: 50,
  });
  const [joinCompanyId, setJoinCompanyId] = useState('');
  const [roles, setRoles] = useState<any[]>([]);
  const [companyMembers, setCompanyMembers] = useState<any[]>([]);
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showEditRole, setShowEditRole] = useState(false);
  const [editingRole, setEditingRole] = useState<any | null>(null);
  const [showEditMemberRole, setShowEditMemberRole] = useState(false);
  const [editingMember, setEditingMember] = useState<any | null>(null);
  const [selectedRoleId, setSelectedRoleId] = useState<number | string>('');

  // New state for enhanced Join modal
  const [joinMode, setJoinMode] = useState<'id' | 'search' | 'list'>('id');
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [browseResults, setBrowseResults] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [isBrowsing, setIsBrowsing] = useState(false);

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

  const handleSearchCompanies = async () => {
    if (!searchQuery.trim()) return;
    setIsSearching(true);
    setError('');
    try {
      const results = await companyService.searchCompanies(searchQuery);
      setSearchResults(results);
    } catch (err: any) {
      setError('Failed to search companies');
    } finally {
      setIsSearching(false);
    }
  };

  const handleBrowseAll = async () => {
    setIsBrowsing(true);
    setError('');
    try {
      const results = await companyService.listCompanies();
      setBrowseResults(results);
    } catch (err: any) {
      setError('Failed to load companies');
    } finally {
      setIsBrowsing(false);
    }
  };

  // Switch to list mode and load all
  useEffect(() => {
    if (showJoinForm && joinMode === 'list') {
      handleBrowseAll();
    }
  }, [showJoinForm, joinMode]);

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

  // Load roles and members when current company changes
  useEffect(() => {
    if (currentCompany) {
      loadRolesAndMembers();
    }
  }, [currentCompany]);

  const loadRolesAndMembers = async () => {
    if (!currentCompany) return;

    try {
      const [rolesData, membersData] = await Promise.all([
        companyService.getAllRoles(),
        companyService.getCompanyMembers()
      ]);
      setRoles(rolesData);
      setCompanyMembers(membersData);
    } catch (err) {
      console.error('Failed to load roles and members:', err);
    }
  };

  const handleCreateRole = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsSubmitting(true);

    try {
      await companyService.createRole(roleFormData);
      setShowCreateRole(false);
      setRoleFormData({ roleName: '', level: 50 });
      await loadRolesAndMembers(); // Reload roles
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to create role');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEditRole = (role: any) => {
    setEditingRole(role);
    setRoleFormData({
      roleName: role.name,
      level: role.level,
    });
    setShowEditRole(true);
  };

  const handleUpdateRole = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingRole) return;

    setError('');
    setIsSubmitting(true);

    try {
      await companyService.updateRole(editingRole.id, roleFormData); // ← реализуй этот метод в companyService
      setShowEditRole(false);
      setEditingRole(null);
      setRoleFormData({ roleName: '', level: 50 });
      await loadRolesAndMembers();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to update role');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteRole = async () => {
    if (!editingRole || editingRole.isSystem) return;

    if (!confirm(`Are you sure you want to delete the role "${editingRole.name}"? This action cannot be undone.`)) {
      return;
    }

    setIsSubmitting(true);
    try {
      await companyService.deleteRole(editingRole.id); // ← реализуй этот метод в companyService
      setShowEditRole(false);
      setEditingRole(null);
      await loadRolesAndMembers();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to delete role');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEditMemberRole = (member: any) => {
    setEditingMember(member);
    const currentRole = roles.find(r => r.name === member.companyRole);
    setSelectedRoleId(currentRole ? currentRole.id : '');
    setShowEditMemberRole(true);
  };

  const handleUpdateMemberRole = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingMember || !selectedRoleId) return;
    setError('');
    setIsSubmitting(true);
    try {
      await companyService.updateMemberRole(editingMember.id, Number(selectedRoleId));
      setShowEditMemberRole(false);
      setEditingMember(null);
      setSelectedRoleId('');
      await loadRolesAndMembers();
      alert('Member role updated successfully!');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to update member role');
    } finally {
      setIsSubmitting(false);
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

        {/* Показываем сообщение о том, что пользователь не в компании, только если нет компаний вообще */}
        {!currentCompany && companies.length === 0 && (
          <div className="bg-white rounded-lg shadow p-6 text-center mb-6">
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
        )}

        {/* Показываем текущую компанию только если она существует */}
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
              <div className="flex space-x-2">
                {currentCompany.roleLevel >= 100 && (
                  <button
                    onClick={() => {
                      console.log('Manage Roles button clicked!');
                      console.log('Current company role level:', currentCompany.roleLevel);
                      console.log('Setting showRoleManagement to true');
                      setShowRoleManagement(true);
                    }}
                    className="btn-secondary"
                  >
                    Manage Roles
                  </button>
                )}
                <button
                  onClick={handleExitCompany}
                  className="btn-danger"
                >
                  Exit Company
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Показываем список компаний, если они есть */}
        {companies.length > 0 && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mb-6">
            <p className="text-blue-900 mb-4 text-center">
              {currentCompany
                ? `You are a member of ${companies.length} company(ies). Select another to switch:`
                : `You are a member of ${companies.length} company(ies). Select one to enter:`}
            </p>
            <div className="space-y-3">
              {companies
                .filter(company => !currentCompany || company.companyId !== currentCompany.companyId)
                .map((company) => {
                  const isCurrent = currentCompany?.companyId === company.companyId;
                  return (
                    <div
                      key={company.companyId}
                      className={`flex items-center justify-between rounded-lg p-4 shadow-sm border ${isCurrent
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
                          {currentCompany ? "Switch Company" : "Enter Company"}
                        </button>
                      )}
                    </div>
                  );
                })}
            </div>
          </div>
        )}

        {/* Кнопки Create/Join всегда видны, кроме случая когда нет компаний и нет currentCompany (там уже есть кнопки вверху) */}
        {(!currentCompany && companies.length === 0) ? null : (
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

        {/* Модальные окна остаются без изменений */}
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
          <div className="mb-6">
            <div className="flex border-b border-gray-200">
              <button
                className={`flex-1 py-2 text-sm font-medium border-b-2 transition-colors ${joinMode === 'id' ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700'
                  }`}
                onClick={() => setJoinMode('id')}
              >
                By ID
              </button>
              <button
                className={`flex-1 py-2 text-sm font-medium border-b-2 transition-colors ${joinMode === 'search' ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700'
                  }`}
                onClick={() => setJoinMode('search')}
              >
                Search
              </button>
              <button
                className={`flex-1 py-2 text-sm font-medium border-b-2 transition-colors ${joinMode === 'list' ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700'
                  }`}
                onClick={() => setJoinMode('list')}
              >
                Browse All
              </button>
            </div>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-4">
              {error}
            </div>
          )}

          {joinMode === 'id' && (
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
                  {isSubmitting ? <><LoadingSpinner size="sm" className="mr-2" /> Joining...</> : 'Join Company'}
                </button>
                <button
                  type="button"
                  onClick={() => setShowJoinForm(false)}
                  className="btn-secondary"
                >
                  Cancel
                </button>
              </div>
            </form>
          )}

          {joinMode === 'search' && (
            <div className="space-y-4">
              <div className="flex gap-2">
                <input
                  type="text"
                  className="input-field"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleSearchCompanies()}
                  placeholder="Search by company name..."
                />
                <button
                  onClick={handleSearchCompanies}
                  disabled={isSearching || !searchQuery.trim()}
                  className="btn-primary"
                >
                  {isSearching ? <LoadingSpinner size="sm" /> : 'Search'}
                </button>
              </div>

              <div className="max-h-60 overflow-y-auto space-y-2 custom-scrollbar">
                {searchResults.length === 0 && !isSearching && searchQuery && (
                  <p className="text-center text-gray-500 py-4">No companies found</p>
                )}
                {searchResults.map((company) => (
                  <div key={company.id} className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50">
                    <div>
                      <p className="font-semibold text-gray-900">{company.name}</p>
                      <p className="text-xs text-gray-500">ID: {company.id}</p>
                    </div>
                    <button
                      onClick={() => handleJoinCompany(company.id)}
                      disabled={isSubmitting}
                      className="btn-secondary text-xs py-1.5"
                    >
                      Join
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {joinMode === 'list' && (
            <div className="space-y-4">
              <div className="max-h-80 overflow-y-auto space-y-2 custom-scrollbar">
                {isBrowsing && <div className="flex justify-center py-8"><LoadingSpinner /></div>}
                {!isBrowsing && browseResults.length === 0 && (
                  <p className="text-center text-gray-500 py-4">No companies available</p>
                )}
                {browseResults.map((company) => (
                  <div key={company.id} className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50">
                    <div>
                      <p className="font-semibold text-gray-900">{company.name}</p>
                      <p className="text-xs text-gray-500">ID: {company.id}</p>
                    </div>
                    <button
                      onClick={() => handleJoinCompany(company.id)}
                      disabled={isSubmitting}
                      className="btn-secondary text-xs py-1.5"
                    >
                      Join
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
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

        {/* Главная модалка — Manage Roles */}
        <Modal
          isOpen={showRoleManagement}
          onClose={() => setShowRoleManagement(false)}
          title="Manage Roles"
        >
          <div className="space-y-8">
            {/* Заголовок и кнопка создания роли */}
            <div className="flex justify-between items-center pb-4 border-b border-gray-200">
              <h3 className="text-2xl font-bold text-gray-900">
                Roles in <span className="text-blue-600">{currentCompany?.companyName}</span>
              </h3>
              <button
                onClick={() => setShowCreateRole(true)}
                className="btn-primary flex items-center gap-2 px-5 py-2.5"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                Create New Role
              </button>
            </div>

            {/* Список ролей */}
            {roles.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-gray-500 text-lg">No roles loaded.</p>
              </div>
            ) : (
              <div className="grid gap-5">
                {roles.map((role) => (
                  <div
                    key={role.id}
                    className={`flex justify-between items-center p-6 rounded-2xl border-2 shadow-lg transition-all hover:scale-[1.01] ${role.isSystem
                      ? 'bg-gradient-to-r from-indigo-50 to-purple-50 border-indigo-200'
                      : 'bg-gradient-to-r from-teal-50 to-cyan-50 border-teal-200'
                      }`}
                  >
                    <div>
                      <div className="text-xl font-bold text-gray-900 flex items-center gap-3">
                        {role.name}
                        {role.isSystem && (
                          <span className="text-xs bg-purple-600 text-white px-2.5 py-1 rounded-full font-medium">
                            System
                          </span>
                        )}
                      </div>
                      <div className="text-base text-gray-700 mt-2">
                        Permission Level: <span className="font-bold text-indigo-600">{role.level}</span>
                        {role.level === 100 && ' — Full access (CEO)'}
                        {role.level === 80 && ' — High access (Director)'}
                        {role.level === 60 && ' — Template management (Manager)'}
                        {role.level === 10 && ' — Basic access (Worker)'}
                      </div>
                    </div>

                    {/* Кнопки только для пользовательских ролей */}
                    {!role.isSystem && (
                      <div className="flex gap-4">
                        <button
                          onClick={() => handleEditRole(role)}
                          className="text-indigo-600 hover:text-indigo-800 font-semibold text-sm underline"
                        >
                          Edit
                        </button>
                        <button
                          onClick={async () => {
                            if (!confirm(`Are you sure you want to delete the role "${role.name}"?`)) return;

                            try {
                              await companyService.deleteRole(role.id);
                              await loadRolesAndMembers();
                              alert(`Role "${role.name}" deleted successfully!`);
                            } catch (err: any) {
                              alert("Error: " + (err.message || "Failed to delete role"));
                            }
                          }}
                          className="text-red-600 hover:text-red-800 font-semibold text-sm underline"
                        >
                          Delete
                        </button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}

            {/* Участники компании */}
            {companyMembers.length > 0 && (
              <div className="mt-10">
                <h3 className="text-2xl font-bold text-gray-900 mb-6">
                  Company Members ({companyMembers.length})
                </h3>
                <div className="grid gap-4">
                  {companyMembers.map((member) => {
                    const fullName = `${member.firstName || ''} ${member.lastName || ''}`.trim() || member.email;
                    const isCurrentUser = user?.id === member.id;

                    return (
                      <div
                        key={member.id}
                        className="flex justify-between items-center p-5 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl border border-blue-200 shadow-md"
                      >
                        <div>
                          <div className="text-lg font-semibold text-gray-900 flex items-center gap-3">
                            {fullName}
                            {isCurrentUser && (
                              <span className="text-xs bg-green-600 text-white px-3 py-1.5 rounded-full font-bold">
                                YOU
                              </span>
                            )}
                          </div>
                          <div className="text-base text-blue-800 mt-2">
                            Role: <span className="font-bold">{member.companyRole || 'Unknown'}</span>
                          </div>
                        </div>

                        {/* Кнопка смены роли доступна только CEO и не для самого себя (CEO не может сам себя понизить/сменить роль здесь) */}
                        {(currentCompany?.roleLevel ?? 0) >= 100 && !isCurrentUser && (
                          <button
                            onClick={() => handleEditMemberRole(member)}
                            className="bg-white text-indigo-600 hover:bg-indigo-50 px-4 py-2 rounded-lg border border-indigo-200 font-semibold text-sm shadow-sm transition-colors"
                          >
                            Change Role
                          </button>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </Modal>

        {/* Модалка редактирования роли */}
        <Modal
          isOpen={showEditRole}
          onClose={() => {
            setShowEditRole(false);
            setEditingRole(null);
            setRoleFormData({ roleName: '', level: 50 });
            setError('');
          }}
          title="Edit Role"
        >
          {error && (
            <div className="bg-red-50 border border-red-300 text-red-700 px-4 py-3 rounded-lg mb-4">
              {error}
            </div>
          )}

          <form onSubmit={handleUpdateRole} className="space-y-6">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Role Name
              </label>
              <input
                type="text"
                required
                className="input-field text-lg"
                value={roleFormData.roleName}
                onChange={(e) => setRoleFormData({ ...roleFormData, roleName: e.target.value })}
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Permission Level (10–100)
              </label>
              <input
                type="number"
                min="10"
                max="100"
                required
                className="input-field text-lg"
                value={roleFormData.level}
                onChange={(e) => setRoleFormData({ ...roleFormData, level: parseInt(e.target.value) || 50 })}
              />
              <div className="mt-3 space-y-1 text-sm text-gray-600">
                <p>• <strong>100</strong> — CEO (full access)</p>
                <p>• <strong>80</strong> — Director</p>
                <p>• <strong>60</strong> — Manager</p>
                <p>• <strong>10</strong> — Worker</p>
              </div>
            </div>

            <div className="flex justify-between items-center pt-4">
              <button
                type="button"
                onClick={handleDeleteRole}
                disabled={isSubmitting}
                className="btn-danger px-6"
              >
                {isSubmitting ? 'Deleting...' : 'Delete Role'}
              </button>

              <div className="flex gap-4">
                <button
                  type="button"
                  onClick={() => {
                    setShowEditRole(false);
                    setEditingRole(null);
                    setRoleFormData({ roleName: '', level: 50 });
                    setError('');
                  }}
                  className="btn-secondary px-6"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="btn-primary px-8 flex items-center gap-2"
                >
                  {isSubmitting ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </div>
          </form>
        </Modal>

        {/* Модалка создания новой роли */}
        <Modal
          isOpen={showCreateRole}
          onClose={() => {
            setShowCreateRole(false);
            setRoleFormData({ roleName: '', level: 50 });
            setError('');
          }}
          title="Create New Role"
        >
          {error && (
            <div className="bg-red-50 border border-red-300 text-red-700 px-4 py-3 rounded-lg mb-4">
              {error}
            </div>
          )}

          <form onSubmit={handleCreateRole} className="space-y-6">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Role Name
              </label>
              <input
                type="text"
                required
                className="input-field text-lg"
                value={roleFormData.roleName}
                onChange={(e) => setRoleFormData({ ...roleFormData, roleName: e.target.value })}
                placeholder="e.g. Senior Manager, Auditor, Legal Advisor"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Permission Level (10–100)
              </label>
              <input
                type="number"
                min="10"
                max="100"
                required
                className="input-field text-lg"
                value={roleFormData.level}
                onChange={(e) => setRoleFormData({ ...roleFormData, level: parseInt(e.target.value) || 50 })}
              />
              <div className="mt-3 space-y-1 text-sm text-gray-600">
                <p>• <strong>100</strong> — CEO (full access)</p>
                <p>• <strong>80</strong> — Director</p>
                <p>• <strong>60</strong> — Manager (can create templates)</p>
                <p>• <strong>10</strong> — Worker (basic access)</p>
              </div>
            </div>

            <div className="flex justify-end space-x-4 pt-4">
              <button
                type="button"
                onClick={() => {
                  setShowCreateRole(false);
                  setRoleFormData({ roleName: '', level: 50 });
                  setError('');
                }}
                className="btn-secondary px-6"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="btn-primary px-8 flex items-center gap-2"
              >
                {isSubmitting ? (
                  <>Creating...</>
                ) : (
                  <>
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    Create Role
                  </>
                )}
              </button>
            </div>
          </form>
        </Modal>

        {/* Модалка изменения роли участника */}
        <Modal
          isOpen={showEditMemberRole}
          onClose={() => {
            setShowEditMemberRole(false);
            setEditingMember(null);
            setSelectedRoleId('');
            setError('');
          }}
          title="Change Member Role"
        >
          {error && (
            <div className="bg-red-50 border border-red-300 text-red-700 px-4 py-3 rounded-lg mb-4">
              {error}
            </div>
          )}

          {editingMember && (
            <form onSubmit={handleUpdateMemberRole} className="space-y-6">
              <div>
                <p className="text-gray-600 mb-4">
                  Changing role for: <span className="font-bold text-gray-900">{editingMember.firstName} {editingMember.lastName}</span>
                </p>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Select New Role
                </label>
                <select
                  required
                  className="input-field text-lg"
                  value={selectedRoleId}
                  onChange={(e) => setSelectedRoleId(e.target.value)}
                >
                  <option value="" disabled>Select a role...</option>
                  {roles.map((role) => (
                    <option key={role.id} value={role.id}>
                      {role.name} (Level {role.level})
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex justify-end space-x-4 pt-4">
                <button
                  type="button"
                  onClick={() => {
                    setShowEditMemberRole(false);
                    setEditingMember(null);
                    setSelectedRoleId('');
                    setError('');
                  }}
                  className="btn-secondary px-6"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting || !selectedRoleId}
                  className="btn-primary px-8 flex items-center gap-2"
                >
                  {isSubmitting ? 'Updating...' : 'Update Role'}
                </button>
              </div>
            </form>
          )}
        </Modal>

      </div>
    </Navigation>
  );
}
export default CompanyPage;