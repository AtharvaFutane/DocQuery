import fs from 'fs';
import path from 'path';
import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const pdfParse = require('pdf-parse/lib/pdf-parse.js');
import mammoth from 'mammoth';
import xlsx from 'xlsx';

export class DocumentProcessor {
  async processFile(filePath) {
    const ext = path.extname(filePath).toLowerCase();
    let text = "";
    let tables = []; 
    let total_pages = 1;
    
    if (ext === '.pdf') {
      const dataBuffer = fs.readFileSync(filePath);
      const data = await pdfParse(dataBuffer);
      text = data.text;
      total_pages = data.numpages || 1;
    } else if (ext === '.docx' || ext === '.doc') {
      const result = await mammoth.extractRawText({ path: filePath });
      text = result.value;
    } else if (ext === '.xlsx' || ext === '.xls') {
      const workbook = xlsx.readFile(filePath);
      for (const sheetName of workbook.SheetNames) {
        const worksheet = workbook.Sheets[sheetName];
        text += `\n--- Sheet: ${sheetName} ---\n`;
        const csv = xlsx.utils.sheet_to_csv(worksheet);
        text += csv;
        tables.push({
            caption: `Sheet: ${sheetName}`,
            markdown: csv.substring(0, 500) 
        });
      }
    } else {
        throw new Error("Unsupported file type");
    }

    const chunks = text.split('\n\n').filter(c => c.trim().length > 0).map((c, i) => ({
      page: Math.min(Math.floor(i / 5) + 1, total_pages), // rough approximation for PDFs if missing
      content: c
    }));
    
    return {
      chunks,
      tables,
      total_pages,
    };
  }
}
