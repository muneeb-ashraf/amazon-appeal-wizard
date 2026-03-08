// ============================================================================
// LOADING SPINNER COMPONENT
// Provides consistent loading states throughout the admin panel
// ============================================================================

interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  color?: 'blue' | 'white' | 'gray';
  text?: string;
  fullPage?: boolean;
}

export default function LoadingSpinner({
  size = 'md',
  color = 'blue',
  text,
  fullPage = false,
}: LoadingSpinnerProps) {
  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-8 h-8',
    lg: 'w-12 h-12',
    xl: 'w-16 h-16',
  };

  const colorClasses = {
    blue: 'border-blue-600',
    white: 'border-white',
    gray: 'border-gray-600',
  };

  const spinner = (
    <div className="flex flex-col items-center justify-center gap-4">
      <div className="relative">
        <div
          className={`${sizeClasses[size]} border-4 border-gray-200 rounded-full animate-spin`}
          style={{
            borderTopColor: 'transparent',
          }}
        >
          <div
            className={`absolute inset-0 ${sizeClasses[size]} border-4 ${colorClasses[color]} rounded-full`}
            style={{
              borderRightColor: 'transparent',
              borderBottomColor: 'transparent',
              borderLeftColor: 'transparent',
            }}
          />
        </div>
      </div>
      {text && (
        <p
          className={`text-sm font-medium ${
            color === 'white' ? 'text-white' : 'text-gray-700'
          }`}
        >
          {text}
        </p>
      )}
    </div>
  );

  if (fullPage) {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-white bg-opacity-75 z-50">
        {spinner}
      </div>
    );
  }

  return spinner;
}
