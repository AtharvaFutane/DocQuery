<p align="center">
  <img src="https://img.shields.io/badge/MongoDB-4EA94B?style=for-the-badge&logo=mongodb&logoColor=white" alt="MongoDB">
  <img src="https://img.shields.io/badge/Express.js-000000?style=for-the-badge&logo=express&logoColor=white" alt="Express">
  <img src="https://img.shields.io/badge/React-19-61DAFB?style=for-the-badge&logo=react&logoColor=black" alt="React">
  <img src="https://img.shields.io/badge/Node.js-339933?style=for-the-badge&logo=node.js&logoColor=white" alt="Node.js">
  <img src="https://img.shields.io/badge/LangChain-121212?style=for-the-badge&logo=chainlink&logoColor=white" alt="LangChain">
  <img src="https://img.shields.io/badge/Grok_AI-000000?style=for-the-badge&logo=x&logoColor=white" alt="Grok">
</p>

<h1 align="center">📄 DocQuery - Document Intelligence Platform</h1>

<p align="center">
  <strong>AI-Powered RAG System for Financial Document Analysis with Dynamic Analytics</strong>
</p>

<p align="center">
  <a href="#features">Features</a> •
  <a href="#architecture">Architecture</a> •
  <a href="#installation">Installation</a> •
  <a href="#usage">Usage</a>
</p>

---

## 📋 Overview

**DocQuery** is a production-ready Document Intelligence Platform that leverages **Retrieval-Augmented Generation (RAG)** and **AI-powered analytics** (powered by **xAI's Grok**) to transform how organizations interact with financial documents. Upload annual reports, balance sheets, income statements, or any financial PDF, and instantly query your documents with natural language while receiving AI-generated insights, metrics, and visualizations.

### 🎯 Problem Solved

Financial professionals spend hours manually extracting data from lengthy reports. DocQuery automates this process by:
- **Intelligent Document Processing** - Extracts text, tables, and even OCR content from images
- **Natural Language Querying** - Ask questions in plain English and get cited answers
- **Dynamic Analytics Generation** - AI automatically identifies key metrics and generates relevant charts
- **Citation Tracking** - Every answer includes page-level citations for verification

---

## ✨ Features

### 🔍 Intelligent RAG Chat System
- **Context-Aware Responses** - Powered by xAI Grok for accurate, contextual answers
- **Smart Query Routing** - Automatically distinguishes between greetings and financial queries
- **Page-Level Citations** - Every response includes clickable citations with source documents
- **Conversation Memory** - Maintains context across multiple questions

### 📊 AI-Powered Dynamic Analytics
- **Automatic Document Classification** - Identifies document types (Income Statement, Balance Sheet, etc.)
- **Smart Table Categorization** - Prioritizes PRIMARY, SECONDARY, and REFERENCE tables
- **Dynamic Chart Generation** - Bar, Line, Pie, and Area charts based on document content
- **Key Metrics Extraction** - Revenue, profit margins, growth rates, and financial ratios

### 📄 Advanced Document Processing
- **Multi-Format Support** - PDF, DOCX, XLSX file processing
- **Table Extraction** - Uses pdfplumber for accurate table detection with bounding boxes
- **OCR Capabilities** - pytesseract integration for extracting text from embedded images
- **Smart Chunking** - Structure-aware text splitting with 1500-char chunks and 200-char overlap

### 🖥️ Modern React Frontend
- **PDF Viewer Integration** - View documents with highlighted citations
- **Interactive Charts** - Recharts-powered visualizations
- **Dark/Light Theme** - User preference toggle
- **Responsive Design** - Works across desktop and mobile devices

---

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────────────────────┐
│                       DOCQUERY ARCHITECTURE                          │
├─────────────────────────────────────────────────────────────────────┤
│                                                                      │
│  ┌──────────────┐     ┌──────────────┐     ┌──────────────────────┐ │
│  │   Frontend   │────▶│ Express.js   │────▶│   Document Processor  │ │
│  │   (React)    │     │   Backend    │     │   (pdf-parse/mammoth) │ │
│  └──────────────┘     └──────────────┘     └──────────────────────┘ │
│         │                    │                        │              │
│         │                    ▼                        ▼              │
│         │             ┌──────────────┐     ┌──────────────────────┐ │
│         │             │  RAG Pipeline │────▶│ MongoDB & HNSWLib  │ │
│         │             │ (LangChain.js)│     │  (Vector Database)   │ │
│         │             └──────────────┘     └──────────────────────┘ │
│         │                    │                                       │
│         │                    ▼                                       │
│         │             ┌──────────────┐     ┌──────────────────────┐ │
│         └────────────▶│   Analytics  │────▶│   Grok (xAI)         │ │
│                       │    Engine    │     │   via Groq API       │ │
│                       └──────────────┘     └──────────────────────┘ │
│                                                                      │
└─────────────────────────────────────────────────────────────────────┘
```

### Tech Stack

| Layer | Technology |
|-------|------------|
| **Frontend** | React 19, TypeScript, TailwindCSS, Framer Motion, Recharts |
| **Backend** | Node.js, Express.js |
| **Database** | MongoDB (Mongoose), HNSWLib (Vector Store) |
| **AI/ML** | LangChain.js, xAI Grok (via Groq API SDK), HuggingFace Transformers |
| **Document Processing** | pdf-parse, mammoth, xlsx |
| **Deployment** | Vercel, AWS Amplify |

---

## 📁 Project Structure

```
DocQuery/
├── node-backend/
│   ├── src/
│   │   ├── index.js             # Express.js application with all endpoints
│   │   ├── ragPipeline.js       # Enhanced RAG chain with citations
│   │   ├── analyticsEngine.js   # AI-powered analytics generation (Groq)
│   │   ├── ingestion.js         # Document ingestion pipeline
│   │   └── models/              # Mongoose database schemas
│   ├── .env                     # Backend environment variables
│   └── package.json
├── frontend/
│   ├── src/
│   │   ├── components/      # React components
│   │   │   ├── ChatInterface.tsx
│   │   │   ├── FileUploader.tsx
│   │   │   ├── PDFViewer.tsx
│   │   │   └── AnalyticsGrid.tsx
│   │   ├── api.ts           # API client
│   │   └── App.tsx          # Main application
│   ├── .env.production      # Production environment vars
│   └── package.json
```

---

## 🚀 Installation

### Prerequisites
- Node.js 18+
- MongoDB (Local instance or Atlas connection)
- xAI/Groq API Key — Get one at [console.groq.com](https://console.groq.com)

### Backend Setup

```bash
# Clone the repository
git clone https://github.com/yourusername/DocQuery.git
cd DocQuery/node-backend

# Install dependencies
npm install

# Set up environment variables
cp .env.example .env
# Edit .env and add your GROQ_API_KEY and MONGO_URI

# Run the backend
npm start
```

### Frontend Setup

```bash
cd frontend

# Install dependencies
npm install

# Set up environment variables
echo "VITE_API_URL=http://localhost:8000" > .env

# Run development server
npm run dev
```

### Docker Deployment

```bash
# Build the Docker image
docker build -t docquery-backend .

# Run the container
docker run -p 8000:8000 -e XAI_API_KEY=your_key docquery-backend
```

---

## 💡 Usage

### 1. Upload Documents
Upload financial documents (PDF, DOCX, XLSX) through the intuitive drag-and-drop interface. The system automatically:
- Extracts text and tables
- Generates document embeddings
- Creates AI-powered analytics

### 2. Chat with Documents
Ask natural language questions like:
- *"What was the total revenue in 2024?"*
- *"Compare operating expenses across quarters"*
- *"What are the key risk factors mentioned?"*

### 3. Explore Analytics
View AI-generated insights including:
- Key financial metrics with YoY changes
- Dynamic charts (revenue trends, expense breakdowns)
- Highlighted key insights and patterns

---

## 🔌 API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/upload` | Upload and process a document |
| `GET` | `/documents` | List all uploaded documents |
| `DELETE` | `/documents` | Clear all documents |
| `POST` | `/chat` | Query documents with RAG |
| `GET` | `/analyze/{doc_id}` | Get analytics for a document |
| `GET` | `/pdf/{doc_id}` | Serve PDF for viewing |
| `GET` | `/health` | Health check endpoint |

---

## 📈 Performance Metrics

- **Document Processing**: ~2-5 seconds for typical 50-page PDF
- **Query Response**: ~1-3 seconds with citations
- **Analytics Generation**: ~3-5 seconds per document
- **Embedding Model**: `all-mpnet-base-v2` (768 dimensions)

---

## 📄 License

This project is open source and available under the [MIT License](LICENSE).

---

## 👨‍💻 Author
Atharva N. Futane
---

<p align="center">
  <strong>⭐ Star this repository if you find it helpful!</strong>
</p>
