import * as fs from 'fs';
import * as path from 'path';
import mammoth from 'mammoth';
import * as XLSX from 'xlsx';

export interface ExtractedText {
  content: string;
  metadata: {
    pages?: number;
    wordCount: number;
    fileType: string;
    filename: string;
  };
}

export class TextExtractor {
  /**
   * Extract text from various file types
   */
  async extractText(buffer: Buffer, filename: string): Promise<ExtractedText> {
    const ext = path.extname(filename).toLowerCase();
    
    switch (ext) {
      case '.pdf':
        return this.extractFromPDF(buffer, filename);
      case '.doc':
      case '.docx':
        return this.extractFromWord(buffer, filename);
      case '.xls':
      case '.xlsx':
        return this.extractFromExcel(buffer, filename);
      case '.ppt':
      case '.pptx':
        return this.extractFromPowerPoint(buffer, filename);
      default:
        throw new Error(`Unsupported file type: ${ext}`);
    }
  }

  private async extractFromPDF(buffer: Buffer, filename: string): Promise<ExtractedText> {
    try {
      // Dynamic import to avoid pdf-parse initialization issues
      const pdfParse = (await import('pdf-parse')).default;
      const data = await pdfParse(buffer);
      return {
        content: data.text,
        metadata: {
          pages: data.numpages,
          wordCount: data.text.split(/\s+/).length,
          fileType: 'pdf',
          filename,
        },
      };
    } catch (error) {
      throw new Error(`Failed to extract text from PDF: ${error.message}`);
    }
  }

  private async extractFromWord(buffer: Buffer, filename: string): Promise<ExtractedText> {
    try {
      const result = await mammoth.extractRawText({ buffer });
      return {
        content: result.value,
        metadata: {
          wordCount: result.value.split(/\s+/).length,
          fileType: path.extname(filename).toLowerCase().slice(1),
          filename,
        },
      };
    } catch (error) {
      throw new Error(`Failed to extract text from Word document: ${error.message}`);
    }
  }

  private async extractFromExcel(buffer: Buffer, filename: string): Promise<ExtractedText> {
    try {
      const workbook = XLSX.read(buffer, { type: 'buffer' });
      let content = '';
      
      // Extract text from all sheets
      workbook.SheetNames.forEach(sheetName => {
        const sheet = workbook.Sheets[sheetName];
        const sheetContent = XLSX.utils.sheet_to_csv(sheet, { header: 1 });
        content += `\n--- ${sheetName} ---\n${sheetContent}\n`;
      });

      return {
        content: content.trim(),
        metadata: {
          wordCount: content.split(/\s+/).length,
          fileType: path.extname(filename).toLowerCase().slice(1),
          filename,
        },
      };
    } catch (error) {
      throw new Error(`Failed to extract text from Excel file: ${error.message}`);
    }
  }

  private async extractFromPowerPoint(buffer: Buffer, filename: string): Promise<ExtractedText> {
    try {
      // For PowerPoint files, we'll try to extract as text
      // Note: This is a basic implementation. For better PPT extraction,
      // you might want to use specialized libraries
      const result = await mammoth.extractRawText({ buffer });
      return {
        content: result.value || "Không thể trích xuất text từ file PowerPoint này",
        metadata: {
          wordCount: result.value.split(/\s+/).length,
          fileType: path.extname(filename).toLowerCase().slice(1),
          filename,
        },
      };
    } catch (error) {
      // Fallback for PowerPoint files
      return {
        content: `File PowerPoint: ${filename}\nKhông thể trích xuất text tự động từ file này.`,
        metadata: {
          wordCount: 10,
          fileType: path.extname(filename).toLowerCase().slice(1),
          filename,
        },
      };
    }
  }

  /**
   * Clean and prepare text for AI training
   */
  cleanText(text: string): string {
    return text
      .replace(/\r\n/g, '\n')
      .replace(/\r/g, '\n')
      .replace(/\n{3,}/g, '\n\n')
      .replace(/\s{2,}/g, ' ')
      .trim();
  }

  /**
   * Split text into chunks for better AI processing
   */
  chunkText(text: string, maxChunkSize: number = 2000): string[] {
    const sentences = text.split(/[.!?]\s+/);
    const chunks: string[] = [];
    let currentChunk = '';

    for (const sentence of sentences) {
      if (currentChunk.length + sentence.length > maxChunkSize) {
        if (currentChunk) {
          chunks.push(currentChunk.trim());
          currentChunk = '';
        }
      }
      currentChunk += sentence + '. ';
    }

    if (currentChunk.trim()) {
      chunks.push(currentChunk.trim());
    }

    return chunks;
  }
}