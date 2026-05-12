import { useEffect } from 'react';
import type { ReactNode } from 'react';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
  size?: 'sm' | 'md' | 'lg' | 'xl';
}

const Modal = ({ isOpen, onClose, title, children, size = 'md' }: ModalProps) => {
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      document.body.style.overflow = 'hidden';
    }

    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const sizeClasses = {
    sm: 'max-w-md',
    md: 'max-w-lg',
    lg: 'max-w-2xl',
    xl: 'max-w-4xl',
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex min-h-screen items-center justify-center p-4 sm:p-8 text-center">
        {/* Background overlay */}
        <div
          className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity"
          onClick={onClose}
        />

        {/* Modal panel */}
        <div className={`relative bg-white rounded-xl text-left shadow-2xl transform transition-all flex flex-col max-h-[80vh] w-full ${sizeClasses[size]}`}>
          {/* Header */}
          <div className="bg-white px-6 py-5 border-b border-gray-100 flex-shrink-0">
            <div className="flex items-center justify-between line-clamp-1">
              <h3 className="text-xl font-bold text-gray-900 truncate pr-4">
                {title}
              </h3>
              <button
                type="button"
                className="bg-gray-50 rounded-lg p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 focus:outline-none transition-colors"
                onClick={onClose}
              >
                <span className="sr-only">Close</span>
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>

          {/* Content */}
          <div className="bg-white px-6 py-5 overflow-y-auto w-full">
            {children}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Modal;
