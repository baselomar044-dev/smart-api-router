/**
 * 📁 FILE PARSER - Extracts content from various file types
 * Supports: Images, PDF, Word (.docx), Excel (.xlsx)
 */

// Types
export interface ParsedFile {
  type: 'image' | 'pdf' | 'word' | 'excel' | 'text' | 'unknown';
  name: string;
  mimeType: string;
  content: string; // Text content or base64 for images
  isImage: boolean;
  preview?: string; // Short preview for UI
  pages?: number; // For PDFs
  sheets?: string[]; // For Excel
}

export interface FileParseResult {
  success: boolean;
  file?: ParsedFile;
  error?: string;
}

// File type detection
export function detectFileType(fileName: string, mimeType?: string): ParsedFile['type'] {
  const ext = fileName.toLowerCase().split('.').pop() || '';
  
  // Images
  if (['png', 'jpg', 'jpeg', 'gif', 'webp', 'bmp', 'svg'].includes(ext) ||
      mimeType?.startsWith('image/')) {
    return 'image';
  }
  
  // PDF
  if (ext === 'pdf' || mimeType === 'application/pdf') {
    return 'pdf';
  }
  
  // Word
  if (['doc', 'docx'].includes(ext) || 
      mimeType === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' ||
      mimeType === 'application/msword') {
    return 'word';
  }
  
  // Excel
  if (['xls', 'xlsx', 'csv'].includes(ext) ||
      mimeType === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' ||
      mimeType === 'application/vnd.ms-excel') {
    return 'excel';
  }
  
  // Text files
  if (['txt', 'md', 'json', 'xml', 'html', 'css', 'js', 'ts', 'py'].includes(ext) ||
      mimeType?.startsWith('text/')) {
    return 'text';
  }
  
  return 'unknown';
}

// Convert file to base64
export async function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      // Extract base64 part after "data:...;base64,"
      const base64 = result.split(',')[1] || result;
      resolve(base64);
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

// Get data URL for images
export async function fileToDataURL(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

// Parse file on client side (basic parsing)
export async function parseFileClient(file: File): Promise<FileParseResult> {
  try {
    const type = detectFileType(file.name, file.type);
    
    // For images, just convert to data URL
    if (type === 'image') {
      const dataUrl = await fileToDataURL(file);
      return {
        success: true,
        file: {
          type: 'image',
          name: file.name,
          mimeType: file.type,
          content: dataUrl,
          isImage: true,
          preview: `[Image: ${file.name}]`
        }
      };
    }
    
    // For text files, read as text
    if (type === 'text') {
      const text = await file.text();
      return {
        success: true,
        file: {
          type: 'text',
          name: file.name,
          mimeType: file.type,
          content: text,
          isImage: false,
          preview: text.substring(0, 200) + (text.length > 200 ? '...' : '')
        }
      };
    }
    
    // For other files, convert to base64 and send to server for parsing
    const base64 = await fileToBase64(file);
    return {
      success: true,
      file: {
        type,
        name: file.name,
        mimeType: file.type,
        content: base64,
        isImage: false,
        preview: `[${type.toUpperCase()}: ${file.name}]`
      }
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to parse file'
    };
  }
}

// Format Excel data as markdown table
export function formatExcelAsMarkdown(data: Record<string, unknown[][]>): string {
  let result = '';
  
  for (const [sheetName, rows] of Object.entries(data)) {
    if (!rows || rows.length === 0) continue;
    
    result += `## Sheet: ${sheetName}\n\n`;
    
    // Get headers from first row
    const headers = rows[0] as string[];
    if (!headers || headers.length === 0) continue;
    
    // Create markdown table header
    result += '| ' + headers.map(h => String(h || '')).join(' | ') + ' |\n';
    result += '| ' + headers.map(() => '---').join(' | ') + ' |\n';
    
    // Add data rows (limit to 100 rows)
    const dataRows = rows.slice(1, 101);
    for (const row of dataRows) {
      const cells = (row as unknown[]).map(cell => {
        if (cell === null || cell === undefined) return '';
        return String(cell).replace(/\|/g, '\\|').replace(/\n/g, ' ');
      });
      result += '| ' + cells.join(' | ') + ' |\n';
    }
    
    if (rows.length > 101) {
      result += `\n*... و ${rows.length - 101} صف إضافي*\n`;
    }
    
    result += '\n';
  }
  
  return result;
}

// Supported file extensions
export const SUPPORTED_EXTENSIONS = {
  image: ['.png', '.jpg', '.jpeg', '.gif', '.webp', '.bmp', '.svg'],
  pdf: ['.pdf'],
  word: ['.doc', '.docx'],
  excel: ['.xls', '.xlsx', '.csv'],
  text: ['.txt', '.md', '.json', '.xml', '.html', '.css', '.js', '.ts']
};

export const SUPPORTED_MIME_TYPES = [
  // Images
  'image/png', 'image/jpeg', 'image/gif', 'image/webp', 'image/bmp', 'image/svg+xml',
  // PDF
  'application/pdf',
  // Word
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/msword',
  // Excel
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'application/vnd.ms-excel',
  'text/csv',
  // Text
  'text/plain', 'text/markdown', 'application/json', 'text/html', 'text/css',
  'text/javascript', 'application/javascript'
];

// Get accept string for file input
export const FILE_ACCEPT_STRING = [
  ...SUPPORTED_EXTENSIONS.image,
  ...SUPPORTED_EXTENSIONS.pdf,
  ...SUPPORTED_EXTENSIONS.word,
  ...SUPPORTED_EXTENSIONS.excel,
  ...SUPPORTED_EXTENSIONS.text
].join(',');

// Max file sizes
export const MAX_FILE_SIZES = {
  image: 20 * 1024 * 1024,  // 20MB for images
  pdf: 50 * 1024 * 1024,    // 50MB for PDFs
  word: 20 * 1024 * 1024,   // 20MB for Word
  excel: 20 * 1024 * 1024,  // 20MB for Excel
  text: 5 * 1024 * 1024,    // 5MB for text
  unknown: 10 * 1024 * 1024 // 10MB default
};

export function getMaxFileSize(type: ParsedFile['type']): number {
  return MAX_FILE_SIZES[type] || MAX_FILE_SIZES.unknown;
}

export function formatFileSize(bytes: number): string {
  if (bytes < 1024) return bytes + ' B';
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
  return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
}
