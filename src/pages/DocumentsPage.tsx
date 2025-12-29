import { useState, useEffect } from 'react';
import { documentService } from '../services/documentService';
import type { Document, DocumentVersion } from '../types/document';
import Navigation from '../components/Navigation';
import FileUpload from '../components/FileUpload';
import DataTable from '../components/DataTable';
import Modal from '../components/Modal';
import { useAuth } from '../hooks/useAuth';
const DocumentsPage = () => {
  const { user } = useAuth();
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
      // For demo purposes, show empty list if API fails
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

  const handleRestoreVersion = async (documentId: number, versionId: number) => {
    try {
      await documentService.restoreVersion(documentId, versionId);
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
      render: (_: any, document: Document) => (
        <div className="flex space-x-2">
          <button
            onClick={() => handleDownloadDocument(document.id, document.originalFilename)}
            className="text-blue-600 hover:text-blue-500 text-sm"
          >
            Download
          </button>
          <button
            onClick={() => handleViewVersions(document)}
            className="text-green-600 hover:text-green-500 text-sm"
          >
            Versions
          </button>
          {!document.signed && (
            <>
              <button
                onClick={() => {
                  setSelectedDocument(document);
                  setShowWatermarkModal(true);
                }}
                className="text-purple-600 hover:text-purple-500 text-sm"
              >
                Watermark
              </button>
              <button
                onClick={() => {
                  setSelectedDocument(document);
                  setShowSignModal(true);
                }}
                className="text-orange-600 hover:text-orange-500 text-sm"
              >
                Sign
              </button>
            </>
          )}
        </div>
      )
    }
  ];

  return (
    <Navigation>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-bold text-gray-900">Document Management</h1>
          <button
            onClick={() => setShowUploadModal(true)}
            className="btn-primary"
          >
            Upload Document
          </button>
        </div>

        {/* Search and Filter */}
        <div className="card">
          <div className="flex items-center space-x-4">
            <div className="flex-1">
              <input
                type="text"
                placeholder="Search documents..."
                value={filter}
                onChange={(e) => setFilter(e.target.value)}
                className="input-field"
              />
            </div>
            <div className="text-sm text-gray-500">
              {filteredDocuments.length} document{filteredDocuments.length !== 1 ? 's' : ''}
            </div>
          </div>
        </div>

        {/* Documents Table */}
        <div className="card">
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
            <div key={version.id} className="border border-gray-200 rounded-lg p-4">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <div className="flex items-center space-x-3">
                    <h3 className="text-sm font-medium text-gray-900">
                      Version {version.versionNumber}
                    </h3>
                    {version.isCurrent && (
                      <span className="status-badge status-approved">Current</span>
                    )}
                    {version.hasWatermark && (
                      <span className="status-badge bg-blue-100 text-blue-800">Watermarked</span>
                    )}
                    {version.isSigned && (
                      <span className="status-badge status-approved">Signed</span>
                    )}
                  </div>
                  <div className="mt-1 text-sm text-gray-600">
                    {version.changeDescription && `${version.changeDescription} • `}
                    {formatFileSize(version.fileSize)} • {formatDate(version.createdAt)} by {version.createdBy}
                  </div>
                </div>
                <div className="flex space-x-2">
                  <button
                    onClick={() => handleDownloadDocument(selectedDocument!.id, version.originalFilename)}
                    className="btn-secondary text-xs"
                  >
                    Download
                  </button>
                  {!version.isCurrent && (
                    <button
                      onClick={() => handleRestoreVersion(selectedDocument!.id, version.id)}
                      className="btn-primary text-xs"
                    >
                      Restore
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
          <p className="text-sm text-gray-600">
            Add a watermark to {selectedDocument?.originalFilename}
          </p>
          <div>
            <label htmlFor="watermark" className="block text-sm font-medium text-gray-700 mb-2">
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
          <div className="flex space-x-4">
            <button
              onClick={handleAddWatermark}
              disabled={!watermarkText.trim()}
              className="btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Add Watermark
            </button>
            <button
              onClick={() => {
                setShowWatermarkModal(false);
                setWatermarkText('');
                setSelectedDocument(null);
              }}
              className="btn-secondary"
            >
              Cancel
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
          <p className="text-sm text-gray-600">
            Add your digital signature to {selectedDocument?.originalFilename}
          </p>
          <div>
            <label htmlFor="signature" className="block text-sm font-medium text-gray-700 mb-2">
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
          <div className="flex space-x-4">
            <button
              onClick={handleSignDocument}
              disabled={!signature.trim()}
              className="btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Sign Document
            </button>
            <button
              onClick={() => {
                setShowSignModal(false);
                setSignature('');
                setSelectedDocument(null);
              }}
              className="btn-secondary"
            >
              Cancel
            </button>
          </div>
        </div>
      </Modal>
    </Navigation>
  );
};

export default DocumentsPage;
