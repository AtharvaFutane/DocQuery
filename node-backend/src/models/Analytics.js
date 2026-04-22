import mongoose from 'mongoose';

const AnalyticsSchema = new mongoose.Schema({
  doc_id: { type: String, required: true, unique: true },
  document_type: { type: String, required: true },
  summary: { type: String, required: true },
  metrics: [{
    label: String,
    value: String,
    change: String,
    change_type: String
  }],
  charts: [mongoose.Schema.Types.Mixed], // Dynamic chart configs
  tables: [mongoose.Schema.Types.Mixed],
  key_insights: [String],
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

export const AnalyticsModel = mongoose.model('Analytics', AnalyticsSchema);
