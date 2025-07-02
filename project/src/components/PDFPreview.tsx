import React, { useState } from 'react';
import { Edit3, Eye, Save } from 'lucide-react';

interface PDFPreviewProps {
  content: string;
  onContentChange: (newContent: string) => void;
  isVisible: boolean;
}

const PDFPreview: React.FC<PDFPreviewProps> = ({ 
  content, 
  onContentChange, 
  isVisible 
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editContent, setEditContent] = useState(content);

  React.useEffect(() => {
    setEditContent(content);
  }, [content]);

  const handleSave = () => {
    onContentChange(editContent);
    setIsEditing(false);
  };

  const handleCancel = () => {
    setEditContent(content);
    setIsEditing(false);
  };

  if (!isVisible || !content) return null;

  return (
    <div className="w-full max-w-4xl mx-auto animate-fade-in">
      <div className="bg-white rounded-xl shadow-lg border border-academic-200 overflow-hidden">
        <div className="bg-academic-50 px-6 py-4 border-b border-academic-200">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-academic-800 flex items-center space-x-2">
              <Eye className="w-5 h-5 text-primary-500" />
              <span>Simplified Content Preview</span>
            </h3>
            <div className="flex items-center space-x-2">
              {isEditing ? (
                <>
                  <button
                    onClick={handleSave}
                    className="flex items-center space-x-1 px-3 py-1.5 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors duration-200"
                  >
                    <Save className="w-4 h-4" />
                    <span>Save</span>
                  </button>
                  <button
                    onClick={handleCancel}
                    className="px-3 py-1.5 bg-academic-300 text-academic-700 rounded-lg hover:bg-academic-400 transition-colors duration-200"
                  >
                    Cancel
                  </button>
                </>
              ) : (
                <button
                  onClick={() => setIsEditing(true)}
                  className="flex items-center space-x-1 px-3 py-1.5 bg-primary-500 text-white rounded-lg hover:bg-primary-600 transition-colors duration-200"
                >
                  <Edit3 className="w-4 h-4" />
                  <span>Edit</span>
                </button>
              )}
            </div>
          </div>
        </div>
        
        <div className="p-6">
          {isEditing ? (
            <textarea
              value={editContent}
              onChange={(e) => setEditContent(e.target.value)}
              className="w-full h-96 p-4 border border-academic-300 rounded-lg resize-none focus:ring-2 focus:ring-primary-500 focus:border-transparent text-academic-800 leading-relaxed"
              placeholder="Edit your simplified content here..."
            />
          ) : (
            <div className="prose prose-academic max-w-none">
              <div 
                className="whitespace-pre-wrap text-academic-800 leading-relaxed text-base"
                style={{ fontFamily: 'Inter, system-ui, sans-serif' }}
              >
                {content}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default PDFPreview;