interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

const LoadingSpinner = ({ size = 'md', className = '' }: LoadingSpinnerProps) => {
  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-12 h-12',
    lg: 'w-20 h-20',
  };

  return (
    <div className={`fixed inset-0 flex items-center justify-center bg-white bg-opacity-75 z-[9999] ${className}`}>
      <div className="flex flex-col items-center">
        <div
          className={`${sizeClasses[size]} border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin mb-4`}
        />
        <div className="text-blue-600 font-medium animate-pulse">Loading...</div>
      </div>
    </div>
  );
};

export default LoadingSpinner;
