import { RecursiveCharacterTextSplitter } from "langchain/text_splitter";
import { MemoryVectorStore } from "langchain/vectorstores/memory";
import { HuggingFaceTransformersEmbeddings } from "@langchain/community/embeddings/hf_transformers";
import fs from "fs";
import path from "path";
import { DocumentProcessor } from "./documentProcessor.js";

const VECTOR_STORE_PATH = "./vectorstore";

let vectorStore = null;
let embeddings = null;

export async function getEmbeddings() {
  if (!embeddings) {
    // using a lighter model than Python's mpnet for speed in Node.js
    embeddings = new HuggingFaceTransformersEmbeddings({
      modelName: "Xenova/all-MiniLM-L6-v2",
    });
  }
  return embeddings;
}

export async function getVectorStore() {
    if (!vectorStore) {
        vectorStore = new MemoryVectorStore(await getEmbeddings());
    }
    return vectorStore;
}

export async function deleteVectorStore() {
    vectorStore = null;
}

export async function ingestFile(filePath) {
    const processor = new DocumentProcessor();
    const processedDoc = await processor.processFile(filePath);
    
    const textSplitter = new RecursiveCharacterTextSplitter({
        chunkSize: 1000,
        chunkOverlap: 200,
    });
    
    const docs = [];
    const docId = path.basename(filePath) + "_" + Date.now();
    for (const chunk of processedDoc.chunks) {
        docs.push({
            pageContent: chunk.content,
            metadata: {
                source: path.basename(filePath),
                page: chunk.page,
                doc_id: docId
            }
        });
    }
    
    const splitDocs = await textSplitter.splitDocuments(docs);
    
    const emb = await getEmbeddings();
    if (!vectorStore) {
        vectorStore = await MemoryVectorStore.fromDocuments(splitDocs, emb);
    } else {
        await vectorStore.addDocuments(splitDocs);
    }
    
    return {
        chunk_count: splitDocs.length,
        processed_doc: {
            doc_id: docId,
            chunks: processedDoc.chunks,
            tables: processedDoc.tables,
            total_pages: processedDoc.total_pages
        }
    };
}
