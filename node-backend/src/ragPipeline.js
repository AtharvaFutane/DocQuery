import { ChatGroq } from '@langchain/groq';
import { PromptTemplate } from '@langchain/core/prompts';
import { getVectorStore } from './ingestion.js';
import dotenv from 'dotenv';

dotenv.config();

let chatHistory = [];

export const getLLM = () => {
  return new ChatGroq({
    apiKey: process.env.XAI_API_KEY || process.env.GROQ_API_KEY, // Fallback if using XAI name
    modelName: 'llama-3.1-8b-instant', // Replace with desired Groq model
    temperature: 0.2,
  });
};

export const clearHistory = () => {
  chatHistory = [];
};

export const queryDocuments = async (query) => {
  const vectorStore = await getVectorStore();
  if (!vectorStore) {
    throw new Error('Vector store not found. Please upload documents first.');
  }

  // Retrieve relevant documents
  const retriever = vectorStore.asRetriever(5);
  const docs = await retriever.invoke(query);

  const contextText = docs.map(d => `[Source: ${d.metadata.source}, Page: ${d.metadata.page}]\n${d.pageContent}`).join('\n\n---\n\n');

  const promptTemplate = PromptTemplate.fromTemplate(`
You are a financial AI assistant. Use the following pieces of retrieved context to answer the user's question.
If you don't know the answer, just say that you don't know, don't try to make up an answer.
Always include citations to the source document and page number in your answer when referencing specific facts or numbers.

Context:
{context}

Question:
{question}

Answer:
`);

  const prompt = await promptTemplate.format({
    context: contextText,
    question: query,
  });

  const llm = getLLM();
  const response = await llm.invoke(prompt);

  // Parse citations from retrieved docs
  const citations = docs.map(d => ({
    source: d.metadata.source,
    page_number: d.metadata.page,
    doc_id: d.metadata.doc_id,
    text_snippet: d.pageContent.substring(0, 150) + '...',
  }));

  // Update history
  chatHistory.push({ role: 'user', content: query });
  chatHistory.push({ role: 'assistant', content: response.content });
  if (chatHistory.length > 10) {
    chatHistory = chatHistory.slice(chatHistory.length - 10);
  }

  return {
    answer: response.content,
    citations: citations,
    tables: [] // Advanced table extraction left basic for now
  };
};
