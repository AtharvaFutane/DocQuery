import mongoose from 'mongoose';

const DocumentSchema = new mongoose.Schema({
  doc_id: { type: String, required: true, unique: true },
  filename: { type: String, required: true },
  file_type: { type: String },
  total_pages: { type: Number, default: 1 },
  total_chunks: { type: Number, default: 0 },
  total_tables: { type: Number, default: 0 },
  createdAt: { type: Date, default: Date.now }
});

export const DocumentModel = mongoose.model('Document', DocumentSchema);
