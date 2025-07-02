import * as pdfjsLib from 'pdfjs-dist';
import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';
import pdfjsWorker from 'pdfjs-dist/build/pdf.worker.min.mjs?url';

// Set up PDF.js worker - use Vite's ?url import for proper bundling
pdfjsLib.GlobalWorkerOptions.workerSrc = pdfjsWorker;

export async function extractTextFromPDF(file: File): Promise<string> {
  try {
    const arrayBuffer = await file.arrayBuffer();
    const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
    let fullText = '';

    for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
      const page = await pdf.getPage(pageNum);
      const textContent = await page.getTextContent();
      const pageText = textContent.items
        .map((item: any) => item.str)
        .join(' ');
      fullText += pageText + '\n\n';
    }

    return fullText.trim();
  } catch (error) {
    console.error('Error extracting text from PDF:', error);
    throw new Error('Failed to extract text from PDF. Please ensure the file is a valid PDF.');
  }
}

export async function generatePDFFromText(text: string, filename: string): Promise<Blob> {
  try {
    // Clean text to handle problematic characters
    const cleanedText = text
      .replace(/\t/g, '    ') // Replace tabs with spaces
      .replace(/[\u0000-\u001F\u007F-\u009F]/g, '') // Remove control characters
      .replace(/[^\x20-\x7E\u00A0-\u024F\u1E00-\u1EFF\u0370-\u03FF\u0400-\u04FF]/g, '?'); // Replace unsupported Unicode with ?
    
    const pdfDoc = await PDFDocument.create();
    
    // Use TimesRoman which has better Unicode support than Helvetica
    const font = await pdfDoc.embedFont(StandardFonts.TimesRoman);
    const fontSize = 12;
    const lineHeight = fontSize * 1.2;
    const margin = 50;
    const pageWidth = 612; // Letter size width
    const pageHeight = 792; // Letter size height
    const textWidth = pageWidth - 2 * margin;

    // First, split text into paragraphs by newlines
    const paragraphs = cleanedText.split(/\r?\n/);
    const lines: string[] = [];

    // Process each paragraph separately
    for (const paragraph of paragraphs) {
      if (paragraph.trim() === '') {
        // Add empty line for paragraph breaks
        lines.push('');
        continue;
      }

      // Split paragraph into words and wrap to fit page width
      const words = paragraph.split(' ');
      let currentLine = '';

      for (const word of words) {
        const testLine = currentLine ? `${currentLine} ${word}` : word;
        
        // Use a try-catch to handle any remaining encoding issues
        try {
          const textWidthTest = font.widthOfTextAtSize(testLine, fontSize);
          
          if (textWidthTest <= textWidth) {
            currentLine = testLine;
          } else {
            if (currentLine) {
              lines.push(currentLine);
              currentLine = word;
            } else {
              // Handle very long words
              lines.push(word);
            }
          }
        } catch (encodingError) {
          // If there's still an encoding error, replace problematic characters
          const safeLine = testLine.replace(/[^\x20-\x7E]/g, '?');
          const textWidthTest = font.widthOfTextAtSize(safeLine, fontSize);
          
          if (textWidthTest <= textWidth) {
            currentLine = safeLine;
          } else {
            if (currentLine) {
              lines.push(currentLine);
              currentLine = word.replace(/[^\x20-\x7E]/g, '?');
            } else {
              lines.push(word.replace(/[^\x20-\x7E]/g, '?'));
            }
          }
        }
      }
      if (currentLine) {
        lines.push(currentLine);
      }
    }

    // Add pages and content
    let page = pdfDoc.addPage([pageWidth, pageHeight]);
    let yPosition = pageHeight - margin;

    for (const line of lines) {
      if (yPosition < margin + lineHeight) {
        page = pdfDoc.addPage([pageWidth, pageHeight]);
        yPosition = pageHeight - margin;
      }

      // Only draw non-empty lines and handle any remaining encoding issues
      if (line.trim() !== '') {
        try {
          page.drawText(line, {
            x: margin,
            y: yPosition,
            size: fontSize,
            font,
            color: rgb(0, 0, 0),
          });
        } catch (drawError) {
          // If drawing fails, try with ASCII-only version
          const asciiLine = line.replace(/[^\x20-\x7E]/g, '?');
          page.drawText(asciiLine, {
            x: margin,
            y: yPosition,
            size: fontSize,
            font,
            color: rgb(0, 0, 0),
          });
        }
      }

      yPosition -= lineHeight;
    }

    const pdfBytes = await pdfDoc.save();
    return new Blob([pdfBytes], { type: 'application/pdf' });
  } catch (error) {
    console.error('Error generating PDF:', error);
    throw new Error('Failed to generate PDF. Please try again.');
  }
}

export function downloadBlob(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
