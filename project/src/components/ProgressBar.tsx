import React from 'react';

interface ProgressBarProps {
  progress: number;
  isVisible: boolean;
  stage: string;
}

const ProgressBar: React.FC<ProgressBarProps> = ({ progress, isVisible, stage }) => {
  if (!isVisible) return null;

  return (
    <div className="w-full max-w-2xl mx-auto animate-slide-up">
      <div className="bg-white rounded-lg p-6 shadow-lg border border-academic-200">
        <div className="mb-4">
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm font-medium text-academic-700">{stage}</span>
            <span className="text-sm text-academic-500">{Math.round(progress)}%</span>
          </div>
          <div className="w-full bg-academic-200 rounded-full h-2">
            <div
              className="bg-gradient-to-r from-primary-500 to-primary-600 h-2 rounded-full transition-all duration-300 ease-out"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
        <p className="text-sm text-academic-600 text-center">
          Please wait while we process your notes...
        </p>
      </div>
    </div>
  );
};

export default ProgressBar;