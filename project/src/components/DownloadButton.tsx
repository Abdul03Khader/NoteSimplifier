import React from 'react';
import { Download, FileCheck } from 'lucide-react';

interface DownloadButtonProps {
  onClick: () => void;
  disabled: boolean;
  hasSimplifiedContent: boolean;
}

const DownloadButton: React.FC<DownloadButtonProps> = ({ 
  onClick, 
  disabled, 
  hasSimplifiedContent 
}) => {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`
        group inline-flex items-center justify-center px-6 py-3 
        text-base font-medium rounded-lg border-2 transition-all duration-300
        transform hover:scale-105 active:scale-95
        ${hasSimplifiedContent && !disabled
          ? 'border-green-500 text-green-600 hover:bg-green-50 hover:border-green-600'
          : 'border-academic-300 text-academic-400 cursor-not-allowed'
        }
      `}
    >
      <div className="flex items-center space-x-2">
        {hasSimplifiedContent ? (
          <Download className="w-5 h-5 group-hover:translate-y-0.5 transition-transform duration-200" />
        ) : (
          <FileCheck className="w-5 h-5" />
        )}
        <span>Download Simplified PDF</span>
      </div>
    </button>
  );
};

export default DownloadButton;