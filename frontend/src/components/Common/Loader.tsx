import React from 'react';
import { Loader as LoaderIcon } from 'lucide-react';

interface LoaderProps {
  text?: string;
  size?: 'small' | 'medium' | 'large';
}

export default function Loader({ text = 'Memuat Data', size = 'medium' }: LoaderProps) {
  const sizeClasses = {
    small: 'h-4 w-4',
    medium: 'h-6 w-6',
    large: 'h-8 w-8'
  };

  return (
    <div className="p-6 flex items-center justify-center min-h-96">
      <div className="flex items-center space-x-2">
        <LoaderIcon className={`${sizeClasses[size]} animate-spin text-blue-600`} />
        <span className="text-gray-600">{text}</span>
      </div>
    </div>
  );
}