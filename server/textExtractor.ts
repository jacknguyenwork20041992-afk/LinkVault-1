import * as fs from 'fs';
import * as path from 'path';
import mammoth from 'mammoth';
import * as XLSX from 'xlsx';
import * as yauzl from 'yauzl';

export interface ExtractedText {
  content: string;
  metadata: {
    pages?: number;
    wordCount: number;
    fileType: string;
    filename: string;
    note?: string;
    slides?: number;
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
      // Temporary fallback - return file info without text extraction
      // TODO: Implement proper PDF text extraction
      const content = `[PDF File: ${filename}]\nFile đã được upload thành công nhưng text extraction cho PDF đang được phát triển.\nFile size: ${Math.round(buffer.length / 1024)}KB`;
      
      return {
        content,
        metadata: {
          pages: 0,
          wordCount: content.split(/\s+/).length,
          fileType: 'pdf',
          filename,
          note: 'PDF text extraction temporarily disabled',
        },
      };
    } catch (error) {
      throw new Error(`Failed to process PDF: ${error instanceof Error ? error.message : 'Unknown error'}`);
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
      throw new Error(`Failed to extract text from Word document: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  private async extractFromExcel(buffer: Buffer, filename: string): Promise<ExtractedText> {
    try {
      const workbook = XLSX.read(buffer, { type: 'buffer' });
      let content = '';
      
      // Extract text from all sheets
      workbook.SheetNames.forEach(sheetName => {
        const sheet = workbook.Sheets[sheetName];
        const sheetContent = XLSX.utils.sheet_to_csv(sheet);
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
      throw new Error(`Failed to extract text from Excel file: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  private async extractFromPowerPoint(buffer: Buffer, filename: string): Promise<ExtractedText> {
    return new Promise((resolve) => {
      try {
        const ext = path.extname(filename).toLowerCase();
        
        if (ext === '.pptx') {
          // For PPTX files, try to extract from the XML structure
          yauzl.fromBuffer(buffer, { lazyEntries: true }, (err: any, zipfile: any) => {
            if (err || !zipfile) {
              resolve(this.getPowerPointFallback(filename));
              return;
            }

            let extractedText = '';
            let slideCount = 0;
            let processedEntries = 0;
            let totalSlideEntries = 0;

            // First pass: count slide entries
            zipfile.on('entry', (entry: any) => {
              if (entry.fileName.startsWith('ppt/slides/slide') && entry.fileName.endsWith('.xml')) {
                totalSlideEntries++;
              }
            });

            zipfile.readEntry();

            // Reset and process entries
            yauzl.fromBuffer(buffer, { lazyEntries: true }, (err2: any, zipfile2: any) => {
              if (err2 || !zipfile2) {
                resolve(this.getPowerPointFallback(filename));
                return;
              }

              zipfile2.on('entry', (entry: any) => {
                if (entry.fileName.startsWith('ppt/slides/slide') && entry.fileName.endsWith('.xml')) {
                  slideCount++;
                  zipfile2.openReadStream(entry, (err3: any, readStream: any) => {
                    if (err3 || !readStream) {
                      processedEntries++;
                      if (processedEntries === totalSlideEntries) {
                        resolve(this.formatPowerPointResult(extractedText, filename, slideCount));
                      } else {
                        zipfile2.readEntry();
                      }
                      return;
                    }

                    let xmlData = '';
                    readStream.on('data', (chunk: any) => {
                      xmlData += chunk;
                    });

                    readStream.on('end', () => {
                      // Extract text from XML using regex
                      const textMatches = xmlData.match(/<a:t[^>]*>([^<]+)<\/a:t>/g);
                      if (textMatches) {
                        const slideText = textMatches
                          .map(match => match.replace(/<[^>]+>/g, ''))
                          .join(' ')
                          .trim();
                        if (slideText) {
                          extractedText += `\n--- Slide ${slideCount} ---\n${slideText}\n`;
                        }
                      }

                      processedEntries++;
                      if (processedEntries === totalSlideEntries) {
                        resolve(this.formatPowerPointResult(extractedText, filename, slideCount));
                      } else {
                        zipfile2.readEntry();
                      }
                    });

                    readStream.on('error', () => {
                      processedEntries++;
                      if (processedEntries === totalSlideEntries) {
                        resolve(this.formatPowerPointResult(extractedText, filename, slideCount));
                      } else {
                        zipfile2.readEntry();
                      }
                    });
                  });
                } else {
                  zipfile2.readEntry();
                }
              });

              zipfile2.on('end', () => {
                if (totalSlideEntries === 0) {
                  resolve(this.getPowerPointFallback(filename));
                }
              });

              zipfile2.on('error', () => {
                resolve(this.getPowerPointFallback(filename));
              });

              zipfile2.readEntry();
            });
          });
        } else {
          // For .ppt files (older format), use fallback
          resolve(this.getPowerPointFallback(filename));
        }
      } catch (error) {
        resolve(this.getPowerPointFallback(filename));
      }
    });
  }

  private getPowerPointFallback(filename: string): ExtractedText {
    const content = `File PowerPoint: ${filename}\n\nFile đã được upload thành công.\n\nGhi chú: Hiện tại hệ thống hỗ trợ trích xuất text cơ bản từ file PowerPoint. Nếu không thể trích xuất được text, vui lòng kiểm tra lại định dạng file hoặc liên hệ admin để được hỗ trợ.\n\nFile này đã được lưu trữ và có thể được sử dụng để training AI.`;
    
    return {
      content,
      metadata: {
        wordCount: content.split(/\s+/).length,
        fileType: path.extname(filename).toLowerCase().slice(1),
        filename,
        note: 'PowerPoint file uploaded successfully with basic text extraction'
      },
    };
  }

  private formatPowerPointResult(extractedText: string, filename: string, slideCount: number): ExtractedText {
    const content = extractedText.trim() || `File PowerPoint: ${filename}\n\nFile đã được upload và xử lý thành công.\nSố slide: ${slideCount}\n\nGhi chú: Một số slide có thể không chứa text hoặc chứa text dạng hình ảnh không thể trích xuất được.`;
    
    return {
      content,
      metadata: {
        wordCount: content.split(/\s+/).length,
        fileType: path.extname(filename).toLowerCase().slice(1),
        filename,
        slides: slideCount,
        note: slideCount > 0 ? `Successfully processed ${slideCount} slides` : 'PowerPoint file processed'
      },
    };
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