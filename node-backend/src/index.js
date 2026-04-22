import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import multer from 'multer';
import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

import { DocumentModel } from './models/Document.js';
import { AnalyticsModel } from './models/Analytics.js';
import { ingestFile, deleteVectorStore } from './ingestion.js';
import { queryDocuments, clearHistory } from './ragPipeline.js';
import { analyzeDocument } from './analyticsEngine.js';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const BASE_DIR = path.resolve(__dirname, '../../');
const UPLOAD_FOLDER = path.join(BASE_DIR, 'uploaded');

if (!fs.existsSync(UPLOAD_FOLDER)) {
  fs.mkdirSync(UPLOAD_FOLDER, { recursive: true });
}

// Set up Multer for file uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, UPLOAD_FOLDER);
  },
  filename: function (req, file, cb) {
    // Sanitize filename
    const sanitized = file.originalname.replace(/[^\w\s\-\.]/g, '').replace(/^\./, '') || 'uploaded_file';
    cb(null, sanitized);
  }
});
const upload = multer({ 
  storage: storage,
  limits: { fileSize: 10 * 1024 * 1024 } // 10MB limit
});

const app = express();
const PORT = process.env.PORT || 8000; // Keeping 8000 to match previous FastAPI config if possible, or frontend default

app.use(cors({
  origin: ['http://localhost:5173', 'http://127.0.0.1:5173', 'http://localhost:3000'],
  credentials: true
}));
app.use(express.json());

// MongoDB Connection
const MONGO_URI = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/docquery';
mongoose.connect(MONGO_URI)
  .then(() => console.log('Connected to MongoDB'))
  .catch(err => console.error('MongoDB connection error:', err));


// ================= ROUTES =================

app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    version: '2.0.0',
    app: 'DocQuery-MERN',
    llm: 'Groq',
    db: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected'
  });
});

app.post('/upload', upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ detail: 'No file uploaded' });
    }

    const fileExt = path.extname(req.file.originalname).toLowerCase();
    const allowed = ['.pdf', '.docx', '.doc', '.xlsx', '.xls'];
    if (!allowed.includes(fileExt)) {
      return res.status(400).json({ detail: `Unsupported file type. Allowed: ${allowed}` });
    }

    console.log(`Processing file: ${req.file.filename}`);
    const { chunk_count, processed_doc } = await ingestFile(req.file.path);

    // Save metadata to MongoDB
    const newDoc = new DocumentModel({
      doc_id: processed_doc.doc_id,
      filename: req.file.filename,
      file_type: fileExt,
      total_pages: processed_doc.total_pages,
      total_chunks: chunk_count,
      total_tables: processed_doc.tables.length
    });
    await newDoc.save();

    // Generate Analytics
    const fullContent = processed_doc.chunks.map(c => c.content).join('\n\n');
    const analytics = await analyzeDocument(fullContent, processed_doc.tables);
    
    // Save Analytics to MongoDB
    await AnalyticsModel.findOneAndUpdate(
      { doc_id: processed_doc.doc_id },
      { doc_id: processed_doc.doc_id, ...analytics },
      { upsert: true, new: true }
    );

    res.json({
      filename: req.file.filename,
      doc_id: processed_doc.doc_id,
      status: 'Ingested successfully',
      pages: processed_doc.total_pages,
      chunks: chunk_count,
      tables: processed_doc.tables.length,
      analytics: analytics
    });

  } catch (err) {
    console.error('Upload Error:', err);
    res.status(500).json({ detail: err.message || 'Internal Server Error' });
  }
});

app.get('/documents', async (req, res) => {
  try {
    const docs = await DocumentModel.find().sort({ createdAt: -1 });
    res.json(docs);
  } catch (err) {
    res.status(500).json({ detail: err.message });
  }
});

app.delete('/documents', async (req, res) => {
  try {
    await deleteVectorStore();
    await DocumentModel.deleteMany({});
    await AnalyticsModel.deleteMany({});
    
    // Clear upload folder
    if (fs.existsSync(UPLOAD_FOLDER)) {
      const files = fs.readdirSync(UPLOAD_FOLDER);
      for (const file of files) {
        if (!file.startsWith('.')) {
          fs.unlinkSync(path.join(UPLOAD_FOLDER, file));
        }
      }
    }
    res.json({ status: 'All documents and analytics cleared' });
  } catch (err) {
    res.status(500).json({ detail: err.message });
  }
});

app.post('/chat', async (req, res) => {
  try {
    const { query } = req.body;
    if (!query) {
      return res.status(400).json({ detail: 'Query cannot be empty.' });
    }
    
    const docsCount = await DocumentModel.countDocuments();
    if (docsCount === 0) {
      return res.status(400).json({ detail: 'No documents uploaded. Please upload a document first.' });
    }

    const response = await queryDocuments(query);
    
    const sources = [...new Set(response.citations.map(c => `${c.source || 'unknown'} (Page ${c.page_number || 0})`))];
    
    res.json({
      answer: response.answer,
      citations: response.citations,
      sources: sources,
      tables: response.tables || [],
      is_financial_query: true
    });

  } catch (err) {
    console.error('Chat Error:', err);
    res.status(500).json({ detail: err.message });
  }
});

app.post('/chat/clear', (req, res) => {
  try {
    clearHistory();
    res.json({ status: 'Chat history cleared' });
  } catch (err) {
    res.status(500).json({ detail: err.message });
  }
});

app.get('/analyze/:doc_id', async (req, res) => {
  try {
    const { doc_id } = req.params;
    const { force_refresh } = req.query;

    if (force_refresh !== 'true') {
      const cached = await AnalyticsModel.findOne({ doc_id });
      if (cached) {
        return res.json(cached);
      }
    }

    const doc = await DocumentModel.findOne({ doc_id });
    if (!doc) {
      return res.status(404).json({ detail: 'Document not found' });
    }

    res.status(400).json({ detail: 'On-demand re-analysis is not fully implemented in this route yet. Uploading the document generates analytics automatically.' });
  } catch (err) {
    res.status(500).json({ detail: err.message });
  }
});

app.get('/analyze', async (req, res) => {
  try {
    const docsCount = await DocumentModel.countDocuments();
    if (docsCount === 0) {
      return res.status(404).json({ detail: 'No documents found' });
    }
    
    const latestAnalytics = await AnalyticsModel.findOne().sort({ createdAt: -1 });
    if (!latestAnalytics) {
       return res.status(404).json({ detail: 'No analytics found yet. Please upload a document first.' });
    }
    res.json(latestAnalytics);

  } catch (err) {
    res.status(500).json({ detail: err.message });
  }
});

app.get('/pdf/:doc_id', async (req, res) => {
  try {
    const doc = await DocumentModel.findOne({ doc_id: req.params.doc_id });
    if (!doc) {
      return res.status(404).json({ detail: 'Document not found' });
    }

    const filePath = path.join(UPLOAD_FOLDER, doc.filename);
    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ detail: 'PDF file not found on disk' });
    }

    if (!filePath.toLowerCase().endsWith('.pdf')) {
      return res.status(400).json({ detail: 'Document is not a PDF' });
    }

    res.setHeader('Content-Disposition', `inline; filename="${doc.filename}"`);
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.sendFile(filePath);
  } catch (err) {
    res.status(500).json({ detail: err.message });
  }
});

app.listen(PORT, () => {
  console.log(`MERN Backend running on port ${PORT}`);
});
