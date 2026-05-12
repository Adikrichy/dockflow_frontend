import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { documentService } from '../services/documentService';
import type { Document, DocumentVersion } from '../types/document';
import DashboardLayout from '../components/DashboardLayout';
import { useTranslation } from 'react-i18next';
import FileUpload from '../components/FileUpload';
import DataTable from '../components/DataTable';
import Modal from '../components/Modal';
import './DocumentsPage.css';

const DocumentsPage = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [documents, setDocuments] = useState<Document[]>([]);
  const [selectedDocument, setSelectedDocument] = useState<Document | null>(null);
  const [documentVersions, setDocumentVersions] = useState<DocumentVersion[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isUploading, setIsUploading] = useState(false);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [showVersionsModal, setShowVersionsModal] = useState(false);
  const [showWatermarkModal, setShowWatermarkModal] = useState(false);
  const [showSignModal, setShowSignModal] = useState(false);
  const [watermarkText, setWatermarkText] = useState('');
  const [signature, setSignature] = useState('');
  const [selectedVersionNumbers, setSelectedVersionNumbers] = useState<Record<number, number>>({});
  const [filter, setFilter] = useState('');

  useEffect(() => {
    loadDocuments();
  }, []);

  const loadDocuments = async () => {
    try {
      const userDocuments = await documentService.getUserDocuments();
      setDocuments(userDocuments);
    } catch (error) {
      console.error('Failed to load documents:', error);
      setDocuments([]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDocumentUpload = async (request: any) => {
    setIsUploading(true);
    try {
      const uploadedDocument = await documentService.uploadDocument(request);
      setDocuments(prev => [uploadedDocument, ...prev]);
      setShowUploadModal(false);
    } catch (error) {
      console.error('Failed to upload document:', error);
      alert('Failed to upload document. Please try again.');
    } finally {
      setIsUploading(false);
    }
  };

  const handleViewVersions = async (document: Document) => {
    setSelectedDocument(document);
    try {
      const versions = await documentService.getDocumentVersions(document.id);
      setDocumentVersions(versions);
      setShowVersionsModal(true);
    } catch (error) {
      console.error('Failed to load document versions:', error);
      alert('Failed to load document versions.');
    }
  };

  const handleDownloadDocument = async (documentId: number, filename: string) => {
    try {
      const blob = await documentService.getDocumentFile(documentId);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error('Failed to download document:', error);
      alert('Failed to download document.');
    }
  };

  const handleDownloadVersion = async (documentId: number, versionNumber: number, filename: string) => {
    try {
      const blob = await documentService.getDocumentVersionFile(documentId, versionNumber);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error('Failed to download document version:', error);
      alert('Failed to download document version.');
    }
  };

  const handleRestoreVersion = async (documentId: number, versionNumber: number) => {
    try {
      await documentService.restoreVersion(documentId, versionNumber);
      await loadDocuments();
      setShowVersionsModal(false);
      alert('Version restored successfully!');
    } catch (error) {
      console.error('Failed to restore version:', error);
      alert('Failed to restore version.');
    }
  };

  const handleAddWatermark = async () => {
    if (!selectedDocument || !watermarkText.trim()) return;
    try {
      await documentService.addWatermark(selectedDocument.id, watermarkText);
      await loadDocuments();
      setShowWatermarkModal(false);
      setWatermarkText('');
      setSelectedDocument(null);
      alert('Watermark added successfully!');
    } catch (error) {
      console.error('Failed to add watermark:', error);
      alert('Failed to add watermark.');
    }
  };

  const handleSignDocument = async () => {
    if (!selectedDocument || !signature.trim()) return;
    try {
      await documentService.signDocument(selectedDocument.id, signature);
      await loadDocuments();
      setShowSignModal(false);
      setSignature('');
      setSelectedDocument(null);
      alert('Document signed successfully!');
    } catch (error) {
      console.error('Failed to sign document:', error);
      alert('Failed to sign document.');
    }
  };

  const handleSelectLocalVersion = (documentId: number, versionNumber: number) => {
    setSelectedVersionNumbers(prev => ({
      ...prev,
      [documentId]: versionNumber
    }));
    setShowVersionsModal(false);
  };

  const getEffectiveVersionNumber = (document: Document) => {
    return selectedVersionNumbers[document.id] || null;
  };

  const getStatusBadge = (status: string) => {
    const statusClasses = {
      DRAFT: 'status-active',
      PENDING: 'status-pending',
      APPROVED: 'status-approved',
      REJECTED: 'status-rejected',
    };
    return `status-badge ${statusClasses[status as keyof typeof statusClasses] || 'status-active'}`;
  };

  const getPriorityBadge = (priority?: string): string | undefined => {
    if (!priority) return undefined;
    const priorityClasses = {
      LOW: 'bg-gray-100 text-gray-800',
      MEDIUM: 'bg-yellow-100 text-yellow-800',
      HIGH: 'bg-orange-100 text-orange-800',
      URGENT: 'bg-red-100 text-red-800',
    };
    return `status-badge ${priorityClasses[priority as keyof typeof priorityClasses] || 'bg-gray-100 text-gray-800'}`;
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const filteredDocuments = documents.filter(doc =>
    doc.originalFilename.toLowerCase().includes(filter.toLowerCase()) ||
    doc.documentType?.toLowerCase().includes(filter.toLowerCase())
  );

  const documentColumns = [
    { key: 'originalFilename', header: 'Filename' },
    {
      key: 'fileSize',
      header: 'Size',
      render: (value: number) => formatFileSize(value)
    },
    {
      key: 'status',
      header: 'Status',
      render: (value: string) => <span className={getStatusBadge(value)}>{value}</span>
    },
    {
      key: 'priority',
      header: 'Priority',
      render: (value?: string) => {
        const badgeClass = getPriorityBadge(value);
        return value && badgeClass ? <span className={badgeClass}>{value}</span> : null;
      }
    },
    {
      key: 'uploadedAt',
      header: 'Uploaded',
      render: (value: string) => formatDate(value)
    },
    {
      key: 'actions',
      header: 'Actions',
      render: (_: any, document: Document) => {
        const localVersion = getEffectiveVersionNumber(document);
        return (
          <div className="action-buttons">
            {document.contentType?.includes('wordprocessingml.document') && (
              <button
                onClick={() => {
                  const url = localVersion
                    ? `/documents/${document.id}/edit?version=${localVersion}`
                    : `/documents/${document.id}/edit`;
                  navigate(url);
                }}
                className="action-link edit"
              >
                Edit {localVersion ? `V${localVersion}` : ''}
              </button>
            )}
            <button
              onClick={() => {
                if (localVersion) {
                  handleDownloadVersion(document.id, localVersion, document.originalFilename);
                } else {
                  handleDownloadDocument(document.id, document.originalFilename);
                }
              }}
              className="action-link download"
            >
              Download
            </button>
            <button
              onClick={() => handleViewVersions(document)}
              className="action-link versions"
            >
              Versions {localVersion ? `(v${localVersion})` : ''}
            </button>
            {!document.signed && (
              <>
                <button
                  onClick={() => {
                    setSelectedDocument(document);
                    setShowWatermarkModal(true);
                  }}
                  className="action-link watermark"
                >
                  Watermark
                </button>
                <button
                  onClick={() => {
                    setSelectedDocument(document);
                    setShowSignModal(true);
                  }}
                  className="action-link sign"
                >
                  Sign
                </button>
              </>
            )}
          </div>
        );
      }
    }
  ];

  return (
    <DashboardLayout title={t('navigation.documents')}>
      <div className="space-y-6">
        {/* Toolbar */}
        <div className="documents-toolbar">
          <div className="search-wrapper">
             <div className="search-icon">
              <svg 
                width="16" height="16" viewBox="0 0 24 24" fill="none" 
                stroke="currentColor" strokeWidth="2" strokeLinecap="round" 
                strokeLinejoin="round"
              >
                <circle cx="11" cy="11" r="8"></circle>
                <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
              </svg>
            </div>
            <input
              type="text"
              placeholder="Search documents..."
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
            />
          </div>
          
          <div className="toolbar-actions">
            <span className="doc-count">
              {filteredDocuments.length} document{filteredDocuments.length !== 1 ? 's' : ''}
            </span>
            <button
              onClick={() => setShowUploadModal(true)}
              className="lp-btn-primary py-2 px-6"
            >
              Upload Document
            </button>
          </div>
        </div>

        {/* Documents Table */}
        <div className="documents-table-container">
          <DataTable
            data={filteredDocuments}
            columns={documentColumns}
            loading={isLoading}
            emptyMessage="No documents uploaded yet. Click 'Upload Document' to get started."
          />
        </div>
      </div>

      {/* Upload Modal */}
      <Modal
        isOpen={showUploadModal}
        onClose={() => setShowUploadModal(false)}
        title="Upload Document"
        size="lg"
      >
        <FileUpload
          onFileSelect={handleDocumentUpload}
          accept=".pdf,.docx"
          disabled={isUploading}
        />
      </Modal>

      {/* Versions Modal */}
      <Modal
        isOpen={showVersionsModal}
        onClose={() => setShowVersionsModal(false)}
        title={`Versions - ${selectedDocument?.originalFilename}`}
        size="xl"
      >
        <div className="space-y-4">
          {documentVersions.map((version) => (
            <div key={version.id} className="border border-[var(--lp-border)] rounded-lg p-4 bg-[var(--lp-surface2)]">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <div className="flex items-center space-x-3">
                    <h3 className="text-sm font-medium text-[var(--lp-white)]">
                      Version {version.versionNumber}
                    </h3>
                    {version.isCurrent && (
                      <span className="status-badge status-approved">Current</span>
                    )}
                    {version.hasWatermark && (
                      <span className="status-badge bg-blue-100/10 text-blue-400">Watermarked</span>
                    )}
                    {version.isSigned && (
                      <span className="status-badge status-approved">Signed</span>
                    )}
                  </div>
                  <div className="mt-1 text-sm text-[var(--lp-text3)]">
                    {version.changeDescription && `${version.changeDescription} • `}
                    {formatFileSize(version.fileSize)} • {formatDate(version.createdAt)} by {version.createdBy}
                  </div>
                </div>
                <div className="flex space-x-2">
                  <button
                    onClick={() => handleSelectLocalVersion(selectedDocument!.id, version.versionNumber)}
                    className="lp-btn-primary text-xs py-1 px-3"
                  >
                    View locally
                  </button>
                  <button
                    onClick={() => handleDownloadVersion(selectedDocument!.id, version.versionNumber, version.originalFilename)}
                    className="lp-btn-ghost text-xs py-1 px-3"
                  >
                    Download
                  </button>
                  {!version.isCurrent && (
                    <button
                      onClick={() => handleRestoreVersion(selectedDocument!.id, version.versionNumber)}
                      className="lp-btn-ghost text-xs py-1 px-3 hover:bg-red-500/10 hover:text-red-500"
                    >
                      Restore (Global)
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </Modal>

      {/* Watermark Modal */}
      <Modal
        isOpen={showWatermarkModal}
        onClose={() => setShowWatermarkModal(false)}
        title="Add Watermark"
      >
        <div className="space-y-4">
          <p className="text-sm text-[var(--lp-text2)]">
            Add a watermark to {selectedDocument?.originalFilename}
          </p>
          <div>
            <label htmlFor="watermark" className="block text-sm font-medium text-[var(--lp-text2)] mb-2">
              Watermark Text
            </label>
            <input
              type="text"
              id="watermark"
              value={watermarkText}
              onChange={(e) => setWatermarkText(e.target.value)}
              className="input-field"
              placeholder="Enter watermark text"
            />
          </div>
          <div className="flex justify-end space-x-3">
             <button
              onClick={() => {
                setShowWatermarkModal(false);
                setWatermarkText('');
                setSelectedDocument(null);
              }}
              className="lp-btn-ghost py-2 px-4"
            >
              Cancel
            </button>
            <button
              onClick={handleAddWatermark}
              disabled={!watermarkText.trim()}
              className="lp-btn-primary py-2 px-6 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Add Watermark
            </button>
          </div>
        </div>
      </Modal>

      {/* Sign Modal */}
      <Modal
        isOpen={showSignModal}
        onClose={() => setShowSignModal(false)}
        title="Sign Document"
      >
        <div className="space-y-4">
          <p className="text-sm text-[var(--lp-text2)]">
            Add your digital signature to {selectedDocument?.originalFilename}
          </p>
          <div>
            <label htmlFor="signature" className="block text-sm font-medium text-[var(--lp-text2)] mb-2">
              Signature
            </label>
            <input
              type="text"
              id="signature"
              value={signature}
              onChange={(e) => setSignature(e.target.value)}
              className="input-field"
              placeholder="Enter your signature"
            />
          </div>
          <div className="flex justify-end space-x-3">
             <button
              onClick={() => {
                setShowSignModal(false);
                setSignature('');
                setSelectedDocument(null);
              }}
              className="lp-btn-ghost py-2 px-4"
            >
              Cancel
            </button>
            <button
              onClick={handleSignDocument}
              disabled={!signature.trim()}
              className="lp-btn-primary py-2 px-6 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Sign Document
            </button>
          </div>
        </div>
      </Modal>
    </DashboardLayout>
  );
};

export default DocumentsPage;
