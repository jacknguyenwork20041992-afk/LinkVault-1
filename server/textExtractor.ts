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
          // For PPTX files, extract from XML structure
          yauzl.fromBuffer(buffer, { lazyEntries: true }, (err: any, zipfile: any) => {
            if (err || !zipfile) {
              console.log(`Failed to open PPTX file: ${filename}`);
              resolve(this.getPowerPointFallback(filename));
              return;
            }

            let extractedText = '';
            let slideCount = 0;
            const slideTexts: string[] = [];

            zipfile.on('entry', (entry: any) => {
              const isSlideFile = entry.fileName.startsWith('ppt/slides/slide') && entry.fileName.endsWith('.xml');
              
              if (isSlideFile) {
                slideCount++;
                
                zipfile.openReadStream(entry, (err3: any, readStream: any) => {
                  if (err3 || !readStream) {
                    console.log(`Failed to read slide ${slideCount} from ${filename}`);
                    zipfile.readEntry();
                    return;
                  }

                  let xmlData = '';
                  readStream.on('data', (chunk: any) => {
                    xmlData += chunk.toString();
                  });

                  readStream.on('end', () => {
                    try {
                      // More comprehensive text extraction patterns
                      const patterns = [
                        /<a:t[^>]*>([^<]+)<\/a:t>/g,           // Standard text runs
                        /<t[^>]*>([^<]+)<\/t>/g,               // Alternative text format
                        /<a:p[^>]*><a:r[^>]*><a:t[^>]*>([^<]+)<\/a:t>/g, // Paragraph text
                        /<p:txBody[^>]*>.*?<a:t[^>]*>([^<]+)<\/a:t>/g    // Text body content
                      ];
                      
                      let slideText = '';
                      patterns.forEach(pattern => {
                        let match;
                        while ((match = pattern.exec(xmlData)) !== null) {
                          if (match[1] && match[1].trim()) {
                            slideText += match[1].trim() + ' ';
                          }
                        }
                      });

                      // Also try to extract from CDATA sections
                      const cdataPattern = /<!\[CDATA\[(.*?)\]\]>/g;
                      let cdataMatch;
                      while ((cdataMatch = cdataPattern.exec(xmlData)) !== null) {
                        if (cdataMatch[1] && cdataMatch[1].trim()) {
                          slideText += cdataMatch[1].trim() + ' ';
                        }
                      }

                      if (slideText.trim()) {
                        slideTexts.push(`--- Slide ${slideCount} ---\n${slideText.trim()}`);
                        console.log(`Extracted text from slide ${slideCount}: ${slideText.substring(0, 100)}...`);
                      } else {
                        console.log(`No text found in slide ${slideCount} of ${filename}`);
                      }
                    } catch (textError) {
                      console.log(`Error extracting text from slide ${slideCount}: ${textError}`);
                    }
                    
                    zipfile.readEntry();
                  });

                  readStream.on('error', (streamError: any) => {
                    console.log(`Stream error reading slide ${slideCount}: ${streamError}`);
                    zipfile.readEntry();
                  });
                });
              } else {
                zipfile.readEntry();
              }
            });

            zipfile.on('end', () => {
              extractedText = slideTexts.join('\n\n');
              
              if (extractedText.trim()) {
                console.log(`Successfully extracted text from ${slideCount} slides in ${filename}`);
                resolve(this.formatPowerPointResult(extractedText, filename, slideCount));
              } else {
                console.log(`No text extracted from any slides in ${filename}`);
                resolve(this.getPowerPointFallback(filename));
              }
            });

            zipfile.on('error', (zipError: any) => {
              console.log(`Zip error processing ${filename}: ${zipError}`);
              resolve(this.getPowerPointFallback(filename));
            });

            zipfile.readEntry();
          });
        } else {
          // For .ppt files (older format), use fallback
          console.log(`Old format PPT file, using fallback: ${filename}`);
          resolve(this.getPowerPointFallback(filename));
        }
      } catch (error) {
        console.log(`Error processing PowerPoint file ${filename}: ${error}`);
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