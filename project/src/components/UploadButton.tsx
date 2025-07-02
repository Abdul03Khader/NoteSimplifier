import React, { useRef, useState } from 'react';
import { Upload, FileText, X } from 'lucide-react';

interface UploadButtonProps {
  onFilesSelected: (files: File[]) => void;
  isProcessing: boolean;
}

const UploadButton: React.FC<UploadButtonProps> = ({ onFilesSelected, isProcessing }) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [dragActive, setDragActive] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);

  const handleFiles = (files: FileList | null) => {
    if (!files) return;
    
    const pdfFiles = Array.from(files).filter(file => file.type === 'application/pdf');
    setSelectedFiles(pdfFiles);
    onFilesSelected(pdfFiles);
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    handleFiles(e.dataTransfer.files);
  };

  const handleClick = () => {
    fileInputRef.current?.click();
  };

  const removeFile = (index: number) => {
    const newFiles = selectedFiles.filter((_, i) => i !== index);
    setSelectedFiles(newFiles);
    onFilesSelected(newFiles);
  };

  return (
    <div className="w-full max-w-2xl mx-auto">
      <div
        className={`
          border-2 border-dashed rounded-xl p-8 text-center cursor-pointer
          transition-all duration-300 ease-in-out transform hover:scale-[1.02]
          ${dragActive 
            ? 'border-primary-500 bg-primary-50 shadow-lg' 
            : 'border-academic-300 hover:border-primary-400 hover:bg-primary-50'
          }
          ${isProcessing ? 'opacity-50 cursor-not-allowed' : ''}
        `}
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
        onClick={!isProcessing ? handleClick : undefined}
      >
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept=".pdf"
          onChange={(e) => handleFiles(e.target.files)}
          className="hidden"
          disabled={isProcessing}
        />
        
        <div className="flex flex-col items-center space-y-4">
          <div className={`
            p-4 rounded-full transition-colors duration-300
            ${dragActive ? 'bg-primary-100' : 'bg-academic-100'}
          `}>
            <Upload className={`
              w-8 h-8 transition-colors duration-300
              ${dragActive ? 'text-primary-600' : 'text-academic-500'}
            `} />
          </div>
          
          <div>
            <h3 className="text-lg font-semibold text-academic-800 mb-2">
              Upload PDF Notes
            </h3>
            <p className="text-academic-600 mb-2">
              Drag and drop your PDF files here, or click to browse
            </p>
            <p className="text-sm text-academic-500">
              Supports multiple PDF files • Max 10MB per file
            </p>
          </div>
        </div>
      </div>

      {selectedFiles.length > 0 && (
        <div className="mt-6 space-y-3 animate-slide-up">
          <h4 className="font-medium text-academic-700">Selected Files:</h4>
          {selectedFiles.map((file, index) => (
            <div
              key={index}
              className="flex items-center justify-between p-3 bg-white rounded-lg border border-academic-200 shadow-sm"
            >
              <div className="flex items-center space-x-3">
                <FileText className="w-5 h-5 text-primary-500" />
                <div>
                  <p className="font-medium text-academic-800">{file.name}</p>
                  <p className="text-sm text-academic-500">
                    {(file.size / 1024 / 1024).toFixed(2)} MB
                  </p>
                </div>
              </div>
              <button
                onClick={() => removeFile(index)}
                className="p-1 hover:bg-red-100 rounded-full transition-colors duration-200"
                disabled={isProcessing}
              >
                <X className="w-4 h-4 text-red-500" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default UploadButton;