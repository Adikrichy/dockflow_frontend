import React, { useState } from 'react';
import Modal from './Modal';
import LoadingSpinner from './LoadingSpinner';

interface KeyUploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (keyFile: File) => Promise<void>;
  companyName: string;
  isLoading?: boolean;
}

const KeyUploadModal: React.FC<KeyUploadModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  companyName,
  isLoading = false,
}) => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [error, setError] = useState<string>('');

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      // Check if file has .dsk or .p12 extension (both are valid)
      const fileName = file.name.toLowerCase();
      if (!fileName.endsWith('.dsk') && !fileName.endsWith('.p12')) {
        setError('Please select a valid .dsk or .p12 key file');
        setSelectedFile(null);
        return;
      }

      setError('');
      setSelectedFile(file);
    }
  };

  const handleSubmit = async () => {
    if (!selectedFile) {
      setError('Please select a key file');
      return;
    }

    try {
      await onSubmit(selectedFile);
      setSelectedFile(null);
      setError('');
      onClose();
    } catch (err: any) {
      setError(err.response?.data?.message || err.message || 'Failed to enter company. Please check your key file.');
    }
  };

  const handleClose = () => {
    setSelectedFile(null);
    setError('');
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title={`Enter Company - ${companyName}`}
    >
      <div className="space-y-4">
        <p className="text-sm text-gray-600">
          To enter "{companyName}", please upload your digital signature key file (.dsk or .p12).
          This file was provided when you created or joined the company.
        </p>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
            {error}
          </div>
        )}

        <div>
          <label htmlFor="keyFile" className="block text-sm font-medium text-gray-700 mb-2">
            Key File
          </label>
          <input
            type="file"
            id="keyFile"
            accept=".dsk,.p12"
            onChange={handleFileSelect}
            className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
          />
          <p className="text-gray-500 mt-1 text-sm">
            Only .dsk or .p12 files are accepted
          </p>
        </div>

        {selectedFile && (
          <div className="bg-green-50 border border-green-200 rounded p-3">
            <p className="text-sm text-green-800">
              Selected: <span className="font-medium">{selectedFile.name}</span>
            </p>
          </div>
        )}

        <div className="flex justify-end space-x-4">
          <button
            onClick={handleSubmit}
            disabled={!selectedFile || isLoading}
            className="btn-primary disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
          >
            {isLoading ? (
              <>
                <LoadingSpinner size="sm" className="mr-2" />
                Entering...
              </>
            ) : (
              'Enter Company'
            )}
          </button>
          <button
            onClick={handleClose}
            className="btn-secondary"
            disabled={isLoading}
          >
            Cancel
          </button>
        </div>
      </div>
    </Modal>
  );
};

export default KeyUploadModal;
