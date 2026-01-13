import { useState, useRef } from 'react';
import type { UploadDocumentRequest } from '../types/document';

interface FileUploadProps {
  onFileSelect: (request: UploadDocumentRequest) => void;
  accept?: string;
  maxSize?: number; // in MB
  disabled?: boolean;
}

const FileUpload = ({ onFileSelect, accept = '.pdf', maxSize = 10, disabled = false }: FileUploadProps) => {
  const [isDragOver, setIsDragOver] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [metadata, setMetadata] = useState({
    amount: '',
    priority: 'MEDIUM',
    documentType: '',
  });
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    if (!disabled) {
      setIsDragOver(true);
    }
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);

    if (disabled) return;

    const files = e.dataTransfer.files;
    if (files.length > 0) {
      handleFileSelect(files[0]);
    }
  };

  const handleFileSelect = (file: File) => {
    // Validate file type
    if (accept) {
      const allowedExts = accept
        .split(',')
        .map((s) => s.trim().toLowerCase())
        .filter(Boolean);

      const fileName = file.name.toLowerCase();
      const isAllowedByExt = allowedExts.some((ext) => fileName.endsWith(ext));

      if (!isAllowedByExt) {
        alert(`Please select a ${accept} file`);
        return;
      }
    }

    // Validate file size
    if (file.size > maxSize * 1024 * 1024) {
      alert(`File size must be less than ${maxSize}MB`);
      return;
    }

    setSelectedFile(file);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      handleFileSelect(files[0]);
    }
  };

  const handleMetadataChange = (field: string, value: string) => {
    setMetadata(prev => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleUpload = () => {
    if (!selectedFile) return;

    const request: UploadDocumentRequest = {
      file: selectedFile,
      metadata: {
        amount: metadata.amount ? parseFloat(metadata.amount) : undefined,
        priority: metadata.priority as 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT',
        documentType: metadata.documentType || undefined,
      },
    };

    onFileSelect(request);
    // Reset form
    setSelectedFile(null);
    setMetadata({ amount: '', priority: 'MEDIUM', documentType: '' });
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <div className="space-y-6">
      {/* File Drop Zone */}
      <div
        className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
          isDragOver
            ? 'border-blue-400 bg-blue-50'
            : selectedFile
            ? 'border-green-400 bg-green-50'
            : 'border-gray-300 hover:border-gray-400'
        } ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => !disabled && fileInputRef.current?.click()}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept={accept}
          onChange={handleInputChange}
          className="hidden"
          disabled={disabled}
        />

        {selectedFile ? (
          <div className="space-y-2">
            <svg className="mx-auto h-12 w-12 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <div>
              <p className="text-sm font-medium text-gray-900">{selectedFile.name}</p>
              <p className="text-sm text-gray-500">{formatFileSize(selectedFile.size)}</p>
            </div>
          </div>
        ) : (
          <div className="space-y-2">
            <svg className="mx-auto h-12 w-12 text-gray-400" stroke="currentColor" fill="none" viewBox="0 0 48 48">
              <path d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            <div>
              <p className="text-sm font-medium text-gray-900">
                {disabled ? 'Upload disabled' : 'Drop your file here, or click to browse'}
              </p>
              <p className="text-xs text-gray-500">
                {accept} files up to {maxSize}MB
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Metadata Form */}
      {selectedFile && (
        <div className="space-y-4">
          <h3 className="text-lg font-medium text-gray-900">Document Details</h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label htmlFor="amount" className="block text-sm font-medium text-gray-700">
                Amount (optional)
              </label>
              <input
                type="number"
                id="amount"
                value={metadata.amount}
                onChange={(e) => handleMetadataChange('amount', e.target.value)}
                className="input-field mt-1"
                placeholder="0.00"
                step="0.01"
              />
            </div>

            <div>
              <label htmlFor="priority" className="block text-sm font-medium text-gray-700">
                Priority
              </label>
              <select
                id="priority"
                value={metadata.priority}
                onChange={(e) => handleMetadataChange('priority', e.target.value)}
                className="input-field mt-1"
              >
                <option value="LOW">Low</option>
                <option value="MEDIUM">Medium</option>
                <option value="HIGH">High</option>
                <option value="URGENT">Urgent</option>
              </select>
            </div>
          </div>

          <div>
            <label htmlFor="documentType" className="block text-sm font-medium text-gray-700">
              Document Type (optional)
            </label>
            <input
              type="text"
              id="documentType"
              value={metadata.documentType}
              onChange={(e) => handleMetadataChange('documentType', e.target.value)}
              className="input-field mt-1"
              placeholder="e.g., Contract, Invoice, Report"
            />
          </div>

          <div className="flex justify-end space-x-3">
            <button
              type="button"
              onClick={() => {
                setSelectedFile(null);
                setMetadata({ amount: '', priority: 'MEDIUM', documentType: '' });
                if (fileInputRef.current) {
                  fileInputRef.current.value = '';
                }
              }}
              className="btn-secondary"
            >
              Clear
            </button>
            <button
              type="button"
              onClick={handleUpload}
              className="btn-primary"
            >
              Upload Document
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default FileUpload;
