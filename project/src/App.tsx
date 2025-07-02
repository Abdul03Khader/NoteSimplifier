import React, { useState } from 'react';
import { Toaster, toast } from 'react-hot-toast';
import { BookOpen, Sparkles } from 'lucide-react';
import UploadButton from './components/UploadButton';
import SimplifyButton from './components/SimplifyButton';
import DownloadButton from './components/DownloadButton';
import PDFPreview from './components/PDFPreview';
import ProgressBar from './components/ProgressBar';
import { extractTextFromPDF, generatePDFFromText, downloadBlob } from './utils/pdfUtils';
import { simplifyTextChunksInParallel, chunkText } from './utils/groqApi';

interface ProcessingState {
  isProcessing: boolean;
  progress: number;
  stage: string;
}

function App() {
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [simplifiedContent, setSimplifiedContent] = useState<string>('');
  const [processingState, setProcessingState] = useState<ProcessingState>({
    isProcessing: false,
    progress: 0,
    stage: ''
  });

  const handleFilesSelected = (files: File[]) => {
    setSelectedFiles(files);
    setSimplifiedContent('');
    if (files.length > 0) {
      toast.success(`${files.length} PDF file(s) selected successfully!`);
    }
  };

  const handleSimplify = async () => {
    if (selectedFiles.length === 0) {
      toast.error('Please select PDF files first');
      return;
    }

    setProcessingState({ isProcessing: true, progress: 0, stage: 'Extracting text from PDF...' });
    
    try {
      let allText = '';
      
      // Extract text from all PDFs
      for (let i = 0; i < selectedFiles.length; i++) {
        const file = selectedFiles[i];
        setProcessingState(prev => ({
          ...prev,
          progress: (i / selectedFiles.length) * 30,
          stage: `Extracting text from ${file.name}...`
        }));
        
        const text = await extractTextFromPDF(file);
        allText += `\n\n=== ${file.name} ===\n\n${text}`;
      }

      if (!allText.trim()) {
        throw new Error('No text could be extracted from the PDF files');
      }

      // Chunk the text for processing
      setProcessingState(prev => ({
        ...prev,
        progress: 30,
        stage: 'Preparing content for parallel simplification...'
      }));

      const chunks = chunkText(allText);
      
      setProcessingState(prev => ({
        ...prev,
        progress: 35,
        stage: `Processing ${chunks.length} chunks simultaneously with 10 API keys...`
      }));

      // Process all chunks in parallel using all 10 API keys
      const simplifiedChunks = await simplifyTextChunksInParallel(
        chunks,
        (completed, total) => {
          const progressPercent = 35 + ((completed / total) * 60);
          setProcessingState(prev => ({
            ...prev,
            progress: progressPercent,
            stage: `Simplifying content (${completed}/${total} chunks completed)...`
          }));
        }
      );

      const simplifiedText = simplifiedChunks.join('\n\n');
      setSimplifiedContent(simplifiedText);
      
      setProcessingState(prev => ({
        ...prev,
        progress: 100,
        stage: 'Simplification completed!'
      }));

      toast.success('Notes simplified successfully!');
      
      // Reset processing state after a short delay
      setTimeout(() => {
        setProcessingState({ isProcessing: false, progress: 0, stage: '' });
      }, 2000);

    } catch (error) {
      console.error('Error during simplification:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to simplify content');
      setProcessingState({ isProcessing: false, progress: 0, stage: '' });
    }
  };

  const handleDownload = async () => {
    if (!simplifiedContent) {
      toast.error('No simplified content to download');
      return;
    }

    try {
      toast.loading('Generating PDF...', { id: 'pdf-generation' });
      
      const filename = selectedFiles.length === 1 
        ? `simplified_${selectedFiles[0].name}`
        : 'simplified_notes.pdf';
      
      const pdfBlob = await generatePDFFromText(simplifiedContent, filename);
      downloadBlob(pdfBlob, filename);
      
      toast.success('PDF downloaded successfully!', { id: 'pdf-generation' });
    } catch (error) {
      console.error('Error generating PDF:', error);
      toast.error('Failed to generate PDF', { id: 'pdf-generation' });
    }
  };

  const handleContentChange = (newContent: string) => {
    setSimplifiedContent(newContent);
    toast.success('Content updated successfully!');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-academic-50 via-white to-primary-50">
      <Toaster 
        position="top-right"
        toastOptions={{
          duration: 4000,
          style: {
            background: '#ffffff',
            color: '#1e293b',
            border: '1px solid #e2e8f0',
            borderRadius: '0.75rem',
            fontSize: '14px',
            fontWeight: '500',
          },
        }}
      />
      
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-academic-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-center space-x-3">
            <div className="p-2 bg-primary-100 rounded-xl">
              <BookOpen className="w-8 h-8 text-primary-600" />
            </div>
            <div className="text-center">
              <h1 className="text-3xl font-bold text-academic-900">Note Simplifier</h1>
              <p className="text-academic-600 mt-1">Transform complex academic content into clear, understandable notes</p>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="space-y-8">
          
          {/* Step 1: Upload */}
          <section className="text-center">
            <div className="mb-6">
              <div className="inline-flex items-center space-x-2 px-4 py-2 bg-primary-100 text-primary-700 rounded-full text-sm font-medium">
                <span className="w-6 h-6 bg-primary-500 text-white rounded-full flex items-center justify-center text-xs font-bold">1</span>
                <span>Upload Your PDF Notes</span>
              </div>
            </div>
            <UploadButton 
              onFilesSelected={handleFilesSelected}
              isProcessing={processingState.isProcessing}
            />
          </section>

          {/* Step 2: Simplify */}
          {selectedFiles.length > 0 && (
            <section className="text-center animate-slide-up">
              <div className="mb-6">
                <div className="inline-flex items-center space-x-2 px-4 py-2 bg-primary-100 text-primary-700 rounded-full text-sm font-medium">
                  <span className="w-6 h-6 bg-primary-500 text-white rounded-full flex items-center justify-center text-xs font-bold">2</span>
                  <span>Simplify Content</span>
                </div>
              </div>
              <SimplifyButton
                onClick={handleSimplify}
                disabled={processingState.isProcessing}
                isProcessing={processingState.isProcessing}
                hasFiles={selectedFiles.length > 0}
              />
            </section>
          )}

          {/* Progress Bar */}
          <ProgressBar 
            progress={processingState.progress}
            isVisible={processingState.isProcessing}
            stage={processingState.stage}
          />

          {/* Step 3: Preview & Edit */}
          {simplifiedContent && !processingState.isProcessing && (
            <section className="animate-fade-in">
              <div className="text-center mb-6">
                <div className="inline-flex items-center space-x-2 px-4 py-2 bg-green-100 text-green-700 rounded-full text-sm font-medium">
                  <span className="w-6 h-6 bg-green-500 text-white rounded-full flex items-center justify-center text-xs font-bold">3</span>
                  <span>Review & Edit (Optional)</span>
                </div>
              </div>
              <PDFPreview
                content={simplifiedContent}
                onContentChange={handleContentChange}
                isVisible={true}
              />
            </section>
          )}

          {/* Step 4: Download */}
          {simplifiedContent && !processingState.isProcessing && (
            <section className="text-center animate-slide-up">
              <div className="mb-6">
                <div className="inline-flex items-center space-x-2 px-4 py-2 bg-green-100 text-green-700 rounded-full text-sm font-medium">
                  <span className="w-6 h-6 bg-green-500 text-white rounded-full flex items-center justify-center text-xs font-bold">4</span>
                  <span>Download Simplified PDF</span>
                </div>
              </div>
              <DownloadButton
                onClick={handleDownload}
                disabled={!simplifiedContent}
                hasSimplifiedContent={!!simplifiedContent}
              />
            </section>
          )}

        </div>
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-academic-100 mt-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="text-center text-academic-600">
            <div className="flex items-center justify-center space-x-2 mb-2">
              <Sparkles className="w-4 h-4 text-primary-500" />
              <span className="font-medium">Powered by AI</span>
            </div>
            <p className="text-sm">
              Making academic content accessible and easy to understand for all students
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default App;