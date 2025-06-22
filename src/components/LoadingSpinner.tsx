import React, { memo } from 'react';

type LoadingSpinnerProps = {
  message?: string;
  size?: 'sm' | 'md' | 'lg';
};

const LoadingSpinner = memo(({ message = 'טוען...', size = 'md' }: LoadingSpinnerProps) => {
  console.log("Rendering: LoadingSpinner");
  
  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-8 h-8', 
    lg: 'w-12 h-12'
  };

  const textSizes = {
    sm: 'text-sm',
    md: 'text-lg',
    lg: 'text-xl'
  };

  return (
    <div className="flex flex-col items-center justify-center gap-3">
      <div className={`${sizeClasses[size]} border-4 border-pinkKid border-t-transparent rounded-full animate-spin`} />
      <p className={`${textSizes[size]} text-blueKid font-varela animate-pulse`}>
        {message}
      </p>
    </div>
  );
});

LoadingSpinner.displayName = 'LoadingSpinner';

export default LoadingSpinner;
