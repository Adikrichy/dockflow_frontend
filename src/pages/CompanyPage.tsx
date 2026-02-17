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
    preferredEditor: 'ONLYOFFICE'
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

  // New state for Edit Company
  const [showEditCompany, setShowEditCompany] = useState(false);
  const [editCompanyForm, setEditCompanyForm] = useState({
    name: '',
    description: '',
    preferredEditor: 'ONLYOFFICE'
  });

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
      setFormData({ name: '', description: '', useDefaultRoles: true, preferredEditor: 'ONLYOFFICE' });

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



  const handleEditCompanyClick = () => {
    if (currentCompany) {
      setEditCompanyForm({
        name: currentCompany.companyName,
        description: currentCompany.description || '',
        preferredEditor: (currentCompany as any).preferredEditor || 'ONLYOFFICE'
      });
      setShowEditCompany(true);
    }
  };

  const handleUpdateCompany = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentCompany) return;

    setError('');
    setIsSubmitting(true);

    try {
      await companyService.updateCompany(currentCompany.companyId, editCompanyForm);
      await refreshAuth();
      setShowEditCompany(false);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to update company');
    } finally {
      setIsSubmitting(false);
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
      <div className="max-w-5xl mx-auto pb-12">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-4xl font-extrabold text-gray-900 tracking-tight">
              Company Management
            </h1>
            <p className="text-gray-500 mt-1">Manage your organizations, roles, and collaboration settings.</p>
          </div>
          {currentCompany && (
            <div className="flex gap-3">
              <button
                onClick={() => setShowCreateForm(true)}
                className="btn-secondary flex items-center gap-2"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                New
              </button>
              <button
                onClick={() => setShowJoinForm(true)}
                className="btn-secondary flex items-center gap-2"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
                </svg>
                Join
              </button>
            </div>
          )}
        </div>

        {/* Empty State: No current company and no companies joined */}
        {!currentCompany && companies.length === 0 && (
          <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-12 text-center mb-10 transform transition-all hover:scale-[1.01]">
            <div className="w-20 h-20 bg-blue-50 rounded-full flex items-center justify-center mx-auto mb-6">
              <svg className="w-10 h-10 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
              </svg>
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Welcome to DocFlow</h2>
            <p className="text-gray-600 mb-8 max-w-md mx-auto">
              You are not currently a member of any company. Start by creating a new organization or joining an existing one.
            </p>
            <div className="flex flex-col sm:flex-row justify-center gap-4">
              <button
                onClick={() => setShowCreateForm(true)}
                className="btn-primary px-8 py-3 text-lg flex items-center justify-center gap-2 shadow-lg shadow-blue-200"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
                Create New Company
              </button>
              <button
                onClick={() => setShowJoinForm(true)}
                className="btn-secondary px-8 py-3 text-lg flex items-center justify-center gap-2"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
                Join Existing
              </button>
            </div>
          </div>
        )}

        {/* Current Company Section */}
        {currentCompany && (
          <div className="relative overflow-hidden bg-white rounded-2xl shadow-xl border border-gray-100 mb-10">
            <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600"></div>
            <div className="p-8">
              <div className="flex flex-col lg:flex-row justify-between items-start gap-8">
                <div className="flex-1">
                  <div className="flex items-center gap-4 mb-4">
                    <div className="w-14 h-14 bg-gradient-to-br from-blue-500 to-blue-700 rounded-xl flex items-center justify-center text-white shadow-lg">
                      <span className="text-2xl font-bold">{currentCompany.companyName.charAt(0).toUpperCase()}</span>
                    </div>
                    <div>
                      <h2 className="text-3xl font-bold text-gray-900 leading-tight">
                        {currentCompany.companyName}
                      </h2>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                          Active Organization
                        </span>
                        {(currentCompany as any).preferredEditor && (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                            {(currentCompany as any).preferredEditor === 'ONLYOFFICE' ? 'OnlyOffice' : 'Collabora'}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {currentCompany.description && (
                    <p className="text-gray-600 text-lg mb-6 leading-relaxed max-w-2xl">
                      {currentCompany.description}
                    </p>
                  )}

                  <div className="bg-gray-50 rounded-xl p-4 border border-gray-100 flex items-center gap-4">
                    <div className="p-2 bg-white rounded-lg shadow-sm">
                      <svg className="w-6 h-6 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                      </svg>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500 font-medium uppercase tracking-wider">Your Personal Identity</p>
                      <p className="text-gray-900 font-semibold text-lg">
                        {currentCompany.roleName} <span className="text-gray-400 font-normal ml-2">Level {currentCompany.roleLevel}</span>
                      </p>
                    </div>
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row lg:flex-col gap-3 w-full lg:w-48">
                  {currentCompany.roleLevel >= 100 && (
                    <>
                      <button
                        onClick={handleEditCompanyClick}
                        className="btn-secondary w-full justify-center flex items-center gap-2 border-gray-200 hover:border-blue-300 hover:bg-blue-50 text-blue-700 transition-colors"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        </svg>
                        Company Settings
                      </button>
                      <button
                        onClick={() => setShowRoleManagement(true)}
                        className="btn-secondary w-full justify-center flex items-center gap-2 border-gray-200 hover:border-indigo-300 hover:bg-indigo-50 text-indigo-700 transition-colors"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                        </svg>
                        Permissions
                      </button>
                    </>
                  )}
                  <div className="lg:mt-4 lg:pt-4 lg:border-t lg:border-gray-100 w-full">
                    <button
                      onClick={handleExitCompany}
                      className="btn-danger w-full justify-center flex items-center gap-2 bg-rose-50 border-rose-100 text-rose-700 hover:bg-rose-600 hover:text-white transition-all duration-200"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                      </svg>
                      Leave Company
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Switch Organization Section */}
        {companies.length > 0 && (!currentCompany || companies.length > 1) && (
          <div className="mb-10">
            <h3 className="text-xl font-bold text-gray-900 mb-4 px-1">Your Organizations</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {companies
                .filter(company => !currentCompany || company.companyId !== currentCompany.companyId)
                .map((company) => (
                  <div
                    key={company.companyId}
                    className="group bg-white rounded-xl p-5 border border-gray-200 shadow-sm hover:shadow-md hover:border-blue-300 transition-all cursor-default"
                  >
                    <div className="flex justify-between items-start gap-4">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <h4 className="text-lg font-bold text-gray-900 truncate group-hover:text-blue-700 transition-colors">
                            {company.companyName}
                          </h4>
                        </div>
                        <p className="text-sm text-gray-500 flex items-center gap-1.5 line-clamp-1 mb-3">
                          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                          </svg>
                          {company.roleName} (Lvl {company.roleLevel})
                        </p>
                        <button
                          onClick={() => handleEnterCompanyClick(company.companyId)}
                          className="w-full btn-secondary text-sm py-2 bg-gray-50 hover:bg-blue-600 hover:text-white hover:border-blue-600 transition-all flex items-center justify-center gap-2"
                        >
                          Switch
                          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                          </svg>
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
            </div>
          </div>
        )}

        {/* Global Controls when in a company */}
        {currentCompany && companies.length === 1 && (
          <div className="flex justify-center gap-4 mb-10">
            <button
              onClick={() => setShowCreateForm(true)}
              className="text-gray-500 hover:text-blue-600 font-medium flex items-center gap-2"
            >
              Create another company
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
            </button>
            <span className="text-gray-300">|</span>
            <button
              onClick={() => setShowJoinForm(true)}
              className="text-gray-500 hover:text-blue-600 font-medium flex items-center gap-2"
            >
              Join another
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
            </button>
          </div>
        )}

        {/* Platform Features Grid */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="bg-gray-50 px-8 py-4 border-b border-gray-200 flex items-center justify-between">
            <h2 className="text-lg font-bold text-gray-900">Enterprise Capabilities</h2>
            <span className="text-xs font-bold text-blue-600 uppercase tracking-widest">DocFlow Infrastructure</span>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-px bg-gray-200">
            <div className="bg-white p-8 group hover:bg-blue-50/30 transition-colors">
              <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center text-blue-600 mb-5 group-hover:scale-110 transition-transform">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                </svg>
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">Multi-tenant Isolation</h3>
              <p className="text-gray-600 leading-relaxed">
                Complete data separation between organizations. Your security keys and document templates are unique to your workspace.
              </p>
            </div>

            <div className="bg-white p-8 group hover:bg-indigo-50/30 transition-colors">
              <div className="w-12 h-12 bg-indigo-100 rounded-xl flex items-center justify-center text-indigo-600 mb-5 group-hover:scale-110 transition-transform">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">Granular RBAC</h3>
              <p className="text-gray-600 leading-relaxed">
                Define custom roles and hierarchy levels. Control precisely who can view reports, edit settings, or initiate workflows.
              </p>
            </div>

            <div className="bg-white p-8 group hover:bg-purple-50/30 transition-colors">
              <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center text-purple-600 mb-5 group-hover:scale-110 transition-transform">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">Managed Workflows</h3>
              <p className="text-gray-600 leading-relaxed">
                Streamline approval processes with organization-wide document flows and automated review steps.
              </p>
            </div>

            <div className="bg-white p-8 group hover:bg-emerald-50/30 transition-colors">
              <div className="w-12 h-12 bg-emerald-100 rounded-xl flex items-center justify-center text-emerald-600 mb-5 group-hover:scale-110 transition-transform">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 3.055A9.001 9.001 0 1020.945 13H11V3.055z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.488 9H15V3.512A9.025 9.025 0 0120.488 9z" />
                </svg>
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">Audit & Reporting</h3>
              <p className="text-gray-600 leading-relaxed">
                Track activity across your workspace with detailed audit trails and visualization tools for workflow health.
              </p>
            </div>

            <div className="bg-white p-8 group hover:bg-rose-50/30 transition-colors">
              <div className="w-12 h-12 bg-rose-100 rounded-xl flex items-center justify-center text-rose-600 mb-5 group-hover:scale-110 transition-transform">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                </svg>
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">Editor Integration</h3>
              <p className="text-gray-600 leading-relaxed">
                Currently optimized for <span className="font-bold text-gray-900">{currentCompany?.preferredEditor === 'COLLABORA' ? 'Collabora Office' : 'OnlyOffice'}</span>.
                Seamlessly coordinate document edits within your browser.
              </p>
            </div>
          </div>
        </div>

        {/* Модальные окна */}
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
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Preferred Document Editor</label>
              <select
                className="input-field"
                value={formData.preferredEditor}
                onChange={(e) => setFormData({ ...formData, preferredEditor: e.target.value })}
              >
                <option value="ONLYOFFICE">OnlyOffice (Modern, high compatibility)</option>
                <option value="COLLABORA">Collabora Online (LibreOffice-based, stable)</option>
              </select>
              <p className="text-xs text-gray-500 mt-1">
                You can change this anytime in company settings.
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
                  setFormData({ name: '', description: '', useDefaultRoles: true, preferredEditor: 'ONLYOFFICE' });
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

        <Modal isOpen={showEditCompany} onClose={() => setShowEditCompany(false)} title="Company Settings">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-4">
              {error}
            </div>
          )}
          <form onSubmit={handleUpdateCompany} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Company Name</label>
              <input
                type="text"
                required
                className="input-field"
                value={editCompanyForm.name}
                onChange={(e) => setEditCompanyForm({ ...editCompanyForm, name: e.target.value })}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
              <textarea
                rows={3}
                className="input-field"
                value={editCompanyForm.description}
                onChange={(e) => setEditCompanyForm({ ...editCompanyForm, description: e.target.value })}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Preferred Editor</label>
              <select
                className="input-field"
                value={editCompanyForm.preferredEditor}
                onChange={(e) => setEditCompanyForm({ ...editCompanyForm, preferredEditor: e.target.value })}
              >
                <option value="ONLYOFFICE">OnlyOffice</option>
                <option value="COLLABORA">Collabora Office</option>
              </select>
            </div>
            <div className="flex justify-end space-x-3">
              <button
                type="submit"
                disabled={isSubmitting}
                className="btn-primary flex items-center"
              >
                {isSubmitting ? <><LoadingSpinner size="sm" className="mr-2" /> Saving...</> : 'Save Changes'}
              </button>
              <button
                type="button"
                onClick={() => setShowEditCompany(false)}
                className="btn-secondary"
              >
                Cancel
              </button>
            </div>
          </form>
        </Modal>

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