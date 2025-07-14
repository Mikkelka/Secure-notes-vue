// Standalone AI Test Service - Completely isolated from main app
import { GoogleGenAI } from "@google/genai";

// --- Test-specific Configuration ---

// Safety settings - allow all content for testing
const SAFETY_SETTINGS = [
  { category: "HARM_CATEGORY_HARASSMENT", threshold: "BLOCK_NONE" },
  { category: "HARM_CATEGORY_HATE_SPEECH", threshold: "BLOCK_NONE" },
  { category: "HARM_CATEGORY_SEXUALLY_EXPLICIT", threshold: "BLOCK_NONE" },
  { category: "HARM_CATEGORY_DANGEROUS_CONTENT", threshold: "BLOCK_NONE" },
];

// Simple test instruction - just improve the text
const TEST_INSTRUCTION = `Du er en AI assistent der forbedrer tekst. Forbedre den givne tekst ved at:
- Gøre den mere læsbar og struktureret
- Tilføje passende HTML formatering hvor det hjælper
- Bevare den originale mening
- Returner KUN valid HTML - ingen markdown

HTML FORMATERING: Brug <h1>, <h2>, <h3> for overskrifter, <strong> for vigtige ord, <em> for fremhævning, <ul><li> for lister, <p> for afsnit, <code> for kode.`;

// --- Core AI Testing Functions ---

/**
 * Simplified AI processing specifically for testing
 * @param {string} content - Input text to process
 * @param {string} title - Note title for context
 * @param {Object} testConfig - Test configuration
 * @param {boolean} enableDebugTiming - Enable performance logging
 * @returns {Promise<string>} - Processed HTML content
 */
export const processTextWithAi = async (content, title, testConfig, enableDebugTiming = false) => {
  const totalStartTime = performance.now();
  
  const { apiKey, model, enableThinking, thinkingBudget, includeThoughts } = testConfig;

  if (!apiKey) {
    throw new Error("API key not provided for testing");
  }

  if (!content.trim()) {
    throw new Error("No content to process");
  }

  try {
    // Phase 1: Setup and Initialization
    const setupStartTime = performance.now();
    const ai = new GoogleGenAI({ apiKey });
    const setupTime = performance.now() - setupStartTime;

    // Phase 2: Prompt Preparation
    const promptStartTime = performance.now();
    const simplePrompt = `Note title (for context): "${title}"\n\nInput text:\n${content}`;
    const promptTime = performance.now() - promptStartTime;
    
    if (enableDebugTiming) {
      console.log('=== AI TEST SERVICE DEBUG ===');
      console.log('Model:', model);
      console.log('Content Length:', content.length);
      console.log('Setup Time:', Math.round(setupTime), 'ms');
      console.log('Prompt Prep Time:', Math.round(promptTime), 'ms');
      console.log('Test Config:', { enableThinking, thinkingBudget, includeThoughts });
    }

    // Phase 3: AI API Call with streaming
    const apiStartTime = performance.now();
    console.time(`AI_Test_${model}`);
    
    // Build config object
    const config = {
      systemInstruction: TEST_INSTRUCTION,
    };
    
    // Thinking configuration - same logic as main app
    const isFlashLite = model.includes('flash-lite');
    
    if (enableThinking || includeThoughts) {
      if (isFlashLite) {
        // Flash-Lite: Requires includeThoughts to activate thinking
        config.thinkingConfig = {
          includeThoughts: true,
          thinkingBudget: parseInt(thinkingBudget) || -1
        };
        
        if (enableDebugTiming) {
          console.log(`🧠 Flash-Lite: THINKING ENABLED (budget: ${thinkingBudget})`);
        }
      } else {
        // Standard Flash: Show thoughts when thinking enabled
        config.thinkingConfig = {
          includeThoughts: true
        };
        
        if (enableDebugTiming) {
          console.log('🧠 Standard Flash: THINKING + THOUGHTS ENABLED');
        }
      }
    } else {
      if (enableDebugTiming) {
        const modelName = isFlashLite ? 'Flash-Lite' : 'Standard Flash';
        console.log(`⚡ ${modelName}: PURE SPEED MODE (thinking disabled)`);
      }
    }
    
    const streamResponse = await ai.models.generateContentStream({
      model,
      contents: simplePrompt,
      config,
    });
    
    // Collect all chunks from stream - separate thoughts from answers
    let fullResponse = '';
    let thoughtSummaries = '';
    let firstChunkTime = null;
    let hasThoughts = false;
    
    for await (const chunk of streamResponse) {
      if (firstChunkTime === null) {
        firstChunkTime = performance.now() - apiStartTime;
        if (enableDebugTiming) {
          console.log('First chunk received in:', Math.round(firstChunkTime), 'ms');
        }
      }
      
      // Handle response parts (for thought summaries)
      if (chunk.candidates && chunk.candidates[0]?.content?.parts) {
        for (const part of chunk.candidates[0].content.parts) {
          if (!part.text) continue;
          
          if (part.thought) {
            thoughtSummaries += part.text;
            hasThoughts = true;
            if (enableDebugTiming) {
              console.log('🧠 Thought chunk received:', part.text.substring(0, 100) + '...');
            }
          } else {
            fullResponse += part.text;
          }
        }
      }
      // Fallback for simple text chunks (no thoughts)
      else if (chunk.text) {
        fullResponse += chunk.text;
      }
    }
    
    console.timeEnd(`AI_Test_${model}`);
    const apiTime = performance.now() - apiStartTime;
    
    // Phase 4: Response Processing
    const processStartTime = performance.now();
    let processedHtml = fullResponse;

    // Minimal cleanup
    processedHtml = processedHtml
      .replace(/^```html\s*/, '')
      .replace(/\s*```$/, '')  
      .trim();

    // Ensure HTML wrapper if none exists
    if (!processedHtml.includes('<') || !processedHtml.includes('>')) {
      processedHtml = `<p>${processedHtml}</p>`;
    }
    
    const processTime = performance.now() - processStartTime;
    const totalTime = performance.now() - totalStartTime;

    if (enableDebugTiming) {
      console.log('First Chunk Time:', Math.round(firstChunkTime || 0), 'ms');
      console.log('Total API Time:', Math.round(apiTime), 'ms');
      console.log('Response Processing Time:', Math.round(processTime), 'ms');
      console.log('Total Time:', Math.round(totalTime), 'ms');
      console.log('Response Length:', processedHtml.length);
      if (hasThoughts) {
        console.log('🧠 Thoughts Detected: YES');
        console.log('🧠 Thought Summary Length:', thoughtSummaries.length);
        console.log('🧠 Thought Preview:', thoughtSummaries.substring(0, 200) + '...');
      } else {
        console.log('🧠 Thoughts Detected: NO');
      }
      console.log('=== END AI TEST SERVICE DEBUG ===');
    }

    // Store performance metrics for test results
    if (typeof window !== 'undefined') {
      if (!window.aiPerformanceMetrics) {
        window.aiPerformanceMetrics = [];
      }
      
      window.aiPerformanceMetrics.push({
        timestamp: new Date().toISOString(),
        model,
        testMode: true,
        systemInstruction: true,
        streaming: true,
        firstChunkTime: Math.round(firstChunkTime || 0),
        inputLength: content.length,
        outputLength: processedHtml.length,
        setupTime: Math.round(setupTime),
        promptTime: Math.round(promptTime),
        apiTime: Math.round(apiTime),
        processTime: Math.round(processTime),
        totalTime: Math.round(totalTime),
        // Thought summaries information
        hasThoughts,
        thoughtSummaries: hasThoughts ? thoughtSummaries : null,
        thoughtLength: hasThoughts ? thoughtSummaries.length : 0,
        includeThoughtsEnabled: includeThoughts || false
      });
    }

    return processedHtml;
    
  } catch (error) {
    const totalTime = performance.now() - totalStartTime;
    
    if (enableDebugTiming) {
      console.log('=== AI TEST SERVICE ERROR ===');
      console.log('Error occurred after:', Math.round(totalTime), 'ms');
      console.log('Error:', error.message);
      console.log('=== END AI TEST SERVICE ERROR ===');
    }
    
    console.error("AI Test Service Error:", error);
    let errorMessage = "AI processing failed: ";
    const errorText = error.message.toLowerCase();

    if (errorText.includes("api_key_invalid")) {
      errorMessage += "Your API key is invalid.";
    } else if (errorText.includes("permission_denied")) {
      errorMessage += "Access denied. Check your API key and billing status.";
    } else if (errorText.includes("quota_exceeded")) {
      errorMessage += "API quota exceeded. Check your usage limits.";
    } else if (errorText.includes("blocked")) {
      errorMessage += "Content was blocked by safety filters.";
    } else {
      errorMessage += error.message;
    }
    
    throw new Error(errorMessage);
  }
};

// --- Utility Functions for Testing ---

/**
 * Extract plain text from HTML content
 */
export const extractPlainText = (htmlContent) => {
  if (!htmlContent) return "";

  return htmlContent
    .replace(/<[^>]*>/g, ' ') // Remove HTML tags
    .replace(/\s+/g, ' ') // Collapse whitespace
    .trim();
};

/**
 * Convert HTML to plain text with basic structure preservation
 */
export const convertHtmlToPlainText = (htmlContent) => {
  if (!htmlContent) return "";
  
  return htmlContent
    .replace(/<br\s*\/?>/gi, '\n') // <br> → line break
    .replace(/<\/p>/gi, '\n\n') // </p> → double line break
    .replace(/<h[1-6][^>]*>/gi, '\n') // Start of headings
    .replace(/<\/h[1-6]>/gi, '\n\n') // End of headings 
    .replace(/<li[^>]*>/gi, '- ') // List items
    .replace(/<\/li>/gi, '\n')
    .replace(/<[^>]*>/g, '') // Remove all other HTML tags
    .replace(/\n\s*\n\s*\n+/g, '\n\n') // Max 2 consecutive newlines
    .replace(/^\s+|\s+$/g, '') // Trim
    .trim();
};

/**
 * Check if content is HTML
 */
export const isHtmlContent = (content) => {
  return typeof content === "string" && content.length > 0;
};

// Export available models for testing
export const AVAILABLE_MODELS = [
  {
    id: 'gemini-2.5-flash-lite-preview-06-17',
    name: 'Gemini 2.5 Flash Lite',
    description: 'Fastest model (~1s)',
    expectedSpeed: '1-4s',
    supportsThinking: true
  },
  {
    id: 'gemini-2.5-flash',
    name: 'Gemini 2.5 Flash',
    description: 'Standard model (~15s)',
    expectedSpeed: '10-20s',
    supportsThinking: true
  }
];

export default {
  processTextWithAi,
  extractPlainText,
  convertHtmlToPlainText,
  isHtmlContent,
  AVAILABLE_MODELS
};