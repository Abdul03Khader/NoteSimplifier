import React from 'react';
import { Sparkles, Loader2 } from 'lucide-react';

interface SimplifyButtonProps {
  onClick: () => void;
  disabled: boolean;
  isProcessing: boolean;
  hasFiles: boolean;
}

const SimplifyButton: React.FC<SimplifyButtonProps> = ({ 
  onClick, 
  disabled, 
  isProcessing, 
  hasFiles 
}) => {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`
        group relative inline-flex items-center justify-center px-8 py-4 
        text-lg font-semibold rounded-xl transition-all duration-300
        transform hover:scale-105 active:scale-95
        ${hasFiles && !disabled
          ? 'bg-primary-500 hover:bg-primary-600 text-white shadow-lg hover:shadow-xl'
          : 'bg-academic-200 text-academic-500 cursor-not-allowed'
        }
        ${isProcessing ? 'animate-pulse-soft' : ''}
      `}
    >
      <div className="flex items-center space-x-3">
        {isProcessing ? (
          <Loader2 className="w-6 h-6 animate-spin" />
        ) : (
          <Sparkles className="w-6 h-6 group-hover:rotate-12 transition-transform duration-300" />
        )}
        <span>
          {isProcessing ? 'Simplifying Notes...' : 'Simplify My Notes'}
        </span>
      </div>
      
      {hasFiles && !disabled && !isProcessing && (
        <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-primary-400 to-primary-600 opacity-0 group-hover:opacity-20 transition-opacity duration-300" />
      )}
    </button>
  );
};

export default SimplifyButton;