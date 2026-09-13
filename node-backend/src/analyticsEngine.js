import { ChatGroq } from '@langchain/groq';
import { PromptTemplate } from '@langchain/core/prompts';
import fs from 'fs';
import dotenv from 'dotenv';

dotenv.config();

export const analyzeDocument = async (fullContent, tables) => {
  try {
    const llm = new ChatGroq({
      apiKey: process.env.XAI_API_KEY || process.env.GROQ_API_KEY,
      modelName: 'llama-3.1-8b-instant',
      temperature: 0.1,
    });

    const promptTemplate = PromptTemplate.fromTemplate(`
You are an expert financial analyst. Analyze the following document text and tables to extract key metrics and insights.
You must return a valid JSON object matching this exact structure:
{{
  "document_type": "string (e.g. Income Statement, Annual Report)",
  "summary": "string (a brief 2-3 sentence summary)",
  "metrics": [
    {{
      "label": "string (e.g. Total Revenue)",
      "value": "string (e.g. $10M)",
      "change": "string (e.g. +5%)",
      "change_type": "string (positive, negative, or neutral)"
    }}
  ],
  "charts": [
    {{
      "id": "string",
      "title": "string",
      "type": "string (bar, line, or pie)",
      "dataKey": "string",
      "data": [
        {{"name": "string", "value": "number"}}
      ]
    }}
  ],
  "tables": [],
  "key_insights": ["string"]
}}

Document Text (excerpt):
{text}

Tables Context:
{tables}

ONLY output the valid JSON. No markdown formatting or extra text.
`);

    const textExcerpt = fullContent.substring(0, 15000); // Limit to avoid token limits
    const tablesContext = tables.map(t => typeof t === 'string' ? t : JSON.stringify(t)).join('\n').substring(0, 5000);

    const prompt = await promptTemplate.format({
      text: textExcerpt,
      tables: tablesContext,
    });

    const response = await llm.invoke(prompt);
    
    let jsonStr = response.content.trim();
    const firstBrace = jsonStr.indexOf('{');
    const lastBrace = jsonStr.lastIndexOf('}');
    if (firstBrace !== -1 && lastBrace !== -1) {
      jsonStr = jsonStr.substring(firstBrace, lastBrace + 1);
    }
    
    const parsed = JSON.parse(jsonStr);

    // Normalize chart objects to match frontend expectations
    if (parsed.charts && Array.isArray(parsed.charts)) {
      parsed.charts = parsed.charts.map(chart => {
        // Normalize chart type field: AI may return "type" but frontend expects "chart_type"
        if (chart.type && !chart.chart_type) {
          chart.chart_type = chart.type;
          delete chart.type;
        }

        // Ensure x_key exists (default to "name")
        if (!chart.x_key) {
          chart.x_key = chart.xKey || 'name';
        }

        // Ensure y_keys array exists
        if (!chart.y_keys) {
          if (chart.yKeys) {
            chart.y_keys = chart.yKeys;
          } else if (chart.dataKey) {
            chart.y_keys = [chart.dataKey];
          } else {
            chart.y_keys = ['value'];
          }
        }

        // Clean up non-standard fields
        delete chart.dataKey;
        delete chart.xKey;
        delete chart.yKeys;

        return chart;
      });
    }

    // Normalize metrics to ensure change_type exists
    if (parsed.metrics && Array.isArray(parsed.metrics)) {
      parsed.metrics = parsed.metrics.map(metric => ({
        label: metric.label || '',
        value: metric.value || '',
        change: metric.change || '',
        change_type: metric.change_type || metric.changeType || 'neutral',
      }));
    }

    return parsed;

  } catch (err) {
    console.error('Analytics Generation Error:', err);
    
    // Debug logging to file
    try {
      fs.appendFileSync('groq_debug.txt', '\n\nERROR: ' + err.toString() + '\n' + (err.stack || ''));
      if (err.response) {
        fs.appendFileSync('groq_debug.txt', '\nRESPONSE: ' + JSON.stringify(err.response));
      }
    } catch (_fsErr) {
      // Ignore file write errors in production
    }

    // Fallback default structure
    return {
      document_type: "Unknown Document",
      summary: "Could not generate automated summary.",
      metrics: [],
      charts: [],
      tables: [],
      key_insights: ["Analytics generation failed or timed out."]
    };
  }
};
