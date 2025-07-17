// Production-Realistic AI Test Service
// Testing with actual Note Organizer formatting tasks from production

import { GoogleGenAI } from "@google/genai";

// Production Note Organizer instruction + formatting rules (matches aiService.js)
const NOTE_ORGANIZER_INSTRUCTION = 'Du er ekspert i at skabe klare, strukturerede noter. Omdann den rå tekst til en professionel note. Fokuser på: Opsummer vigtigste punkter med **fed tekst**, omformuler uklare sætninger til præcise udsagn, organiser logisk med overskrifter og punkter, undgå gentagelser, vær kortfattet men bevar al vigtig information.';

const FORMATTING_INSTRUCTIONS = `Formatering: BEVAR AL EKSISTERENDE FORMATERING og brug: **omkring tekst** for fed skrift, *omkring tekst* for kursiv, ~~omkring tekst~~ for gennemstreget, start linjer med - for punktopstilling, # for store overskrifter, ## for mindre overskrifter. Brug KUN ét linjeskift mellem afsnit - undgå for mange tomme linjer. Hvis originalteksten har formatering, SKAL du bevare den og forbedre den.

HTML FORMATERING: Du MÅ tilføje passende HTML formatering hvor det forbedrer struktur og læsbarhed: <h1>, <h2>, <h3> for overskrifter, <strong> for vigtige ord/sætninger, <em> for fremhævning, <u> for understregning, <s> for gennemstregning, <ul><li> for lister, <p> for almindelige afsnit, <hr> for adskillelse mellem sektioner, <pre><code> for kodeblokke, <code> for inline kode. Returner KUN valid HTML - ingen markdown. Organiser indholdet logisk med passende overskrifter og fremhæv nøgleord med ** hvor det giver mening.

VIGTIGT: Brug ALDRIG borders, rammer, border-stil, eller CSS borders i outputtet - ignorer eksisterende borders i input. Returner kun den færdige note.`;

const PRODUCTION_SYSTEM_INSTRUCTION = `${NOTE_ORGANIZER_INSTRUCTION} ${FORMATTING_INSTRUCTIONS}`;


/**
 * Google's official streaming approach - production AI processing with configurable thinking
 * @param {string} content - Input text to process
 * @param {string} apiKey - Google AI API key  
 * @param {string} model - Model to use
 * @param {function} onChunk - Optional callback for real-time chunk updates
 * @param {function} onThoughtChunk - Optional callback for thought summary chunks
 * @param {boolean} enableThinking - Whether to enable thinking/thought summaries (default: false)
 * @returns {Promise<{answer: string, thoughtSummaries: string}>} - AI response with thought summaries
 */
export const processTextWithAi = async (content, apiKey, model, onChunk = null, onThoughtChunk = null, enableThinking = false) => {
  const startTime = performance.now();
  
  // Basic Google AI setup
  const ai = new GoogleGenAI({ apiKey });
  
  // Token counting for performance analysis (Google cookbook best practice)
  const tokenCountStart = performance.now();
  const tokenResponse = await ai.models.countTokens({
    model,
    contents: content,
  });
  const tokenCountTime = performance.now() - tokenCountStart;
  const inputTokens = tokenResponse.totalTokens;
  
  console.log(`🧪 Token Count: ${inputTokens} input tokens (${Math.round(tokenCountTime)}ms)`);
  
  // Build config object with optional thinking
  const config = {
    systemInstruction: {
      parts: [{ text: PRODUCTION_SYSTEM_INSTRUCTION }],
    }
  };

  // Configure thinking with proper thinkingBudget (critical for Flash Lite!)
  if (enableThinking) {
    config.thinkingConfig = {
      includeThoughts: true,
      thinkingBudget: -1  // Dynamic thinking - model decides complexity
    };
    console.log('🧠 Thinking enabled with dynamic budget (-1)');
  } else {
    config.thinkingConfig = {
      thinkingBudget: 0  // Explicit disable - critical for Flash Lite
    };
    console.log('⚡ Thinking explicitly disabled (thinkingBudget: 0)');
  }

  // Google's official streaming approach with configurable thinking
  const response = await ai.models.generateContentStream({
    model,
    contents: content,
    config: config
  });
  
  let text = "";
  let thoughtSummaries = "";
  
  // First chunk timing metrics for perceived performance
  let firstChunkTime = null;
  let firstAnswerChunkTime = null;
  let firstThoughtChunkTime = null;
  
  for await (const chunk of response) {
    // Check if chunk has parts (more detailed structure)
    if (chunk.candidates && chunk.candidates[0] && chunk.candidates[0].content && chunk.candidates[0].content.parts) {
      for (const part of chunk.candidates[0].content.parts) {
        if (!part.text) continue;

        // Measure first chunk time (perceived performance)
        if (firstChunkTime === null) {
          firstChunkTime = Math.round(performance.now() - startTime);
          console.log(`⚡ First chunk received at: ${firstChunkTime}ms`);
        }
        
        if (part.thought) {
          // This is a thought summary
          console.log(`🧠 Thought Summary: ${part.text}`);
          thoughtSummaries += part.text;
          
          // Measure first thought chunk time
          if (firstThoughtChunkTime === null) {
            firstThoughtChunkTime = Math.round(performance.now() - startTime);
            console.log(`🧠 First thought chunk at: ${firstThoughtChunkTime}ms`);
          }
          
          // Call onThoughtChunk callback for real-time thought UI updates
          if (onThoughtChunk && part.text) {
            onThoughtChunk(part.text);
          }
        } else {
          // This is regular answer content
          console.log(`💬 Answer: ${part.text}`);
          text += part.text;
          
          // Measure first answer chunk time
          if (firstAnswerChunkTime === null) {
            firstAnswerChunkTime = Math.round(performance.now() - startTime);
            console.log(`💬 First answer chunk at: ${firstAnswerChunkTime}ms`);
          }
          
          // Call onChunk callback for real-time UI updates
          if (onChunk && part.text) {
            onChunk(part.text);
          }
        }
      }
    } else {
      // Fallback for simple chunk structure
      console.log(chunk.text); // Google's debug output
      text += chunk.text;
      
      // Measure first chunk time (perceived performance)
      if (firstChunkTime === null) {
        firstChunkTime = Math.round(performance.now() - startTime);
        console.log(`⚡ First chunk received at: ${firstChunkTime}ms`);
      }
      
      // Measure first answer chunk time (for fallback)
      if (firstAnswerChunkTime === null) {
        firstAnswerChunkTime = Math.round(performance.now() - startTime);
        console.log(`💬 First answer chunk at: ${firstAnswerChunkTime}ms`);
      }
      
      // Call onChunk callback for real-time UI updates
      if (onChunk && chunk.text) {
        onChunk(chunk.text);
      }
    }
  }
  
  const endTime = performance.now();
  const totalTime = Math.round(endTime - startTime);
  
  console.log(`🧪 Google Streaming Test: ${model} - ${totalTime}ms`);
  console.log(`🧠 Thinking: ${enableThinking ? 'ENABLED' : 'DISABLED'}`);
  console.log(`⚡ First chunk: ${firstChunkTime}ms (perceived performance)`);
  console.log(`💬 First answer: ${firstAnswerChunkTime || 'N/A'}ms`);
  console.log(`🧠 First thought: ${firstThoughtChunkTime || 'N/A'}ms`);
  console.log(`🧠 Thought Summaries Length: ${thoughtSummaries.length} chars`);
  console.log(`💬 Answer Length: ${text.length} chars`);
  
  // Calculate tokens per second
  const tokensPerSecond = Math.round((inputTokens / totalTime) * 1000);
  
  // Store streaming metrics with token information
  if (typeof window !== 'undefined') {
    if (!window.aiPerformanceMetrics) {
      window.aiPerformanceMetrics = [];
    }
    
    window.aiPerformanceMetrics.push({
      timestamp: new Date().toISOString(),
      model,
      totalTime,
      responseLength: text.length,
      thoughtSummariesLength: thoughtSummaries.length,
      method: enableThinking ? 'production-streaming-with-thoughts' : 'production-streaming',
      streaming: true,
      instructions: 'note-organizer',
      thinkingEnabled: enableThinking,
      // First chunk timing metrics (perceived performance)
      firstChunkTime,
      firstAnswerChunkTime,
      firstThoughtChunkTime,
      // Token metrics from Google cookbook
      inputTokens,
      tokenCountTime,
      tokensPerSecond
    });
  }
  
  return {
    answer: text,
    thoughtSummaries: thoughtSummaries,
    // First chunk timing metrics for perceived performance analysis
    firstChunkTime,
    firstAnswerChunkTime,
    firstThoughtChunkTime
  };
}

// Available models for testing
export const AVAILABLE_MODELS = [
  {
    id: 'gemini-2.5-flash-lite-preview-06-17',
    name: 'Gemini 2.5 Flash Lite',
    description: 'Speed optimized model'
  },
  {
    id: 'gemini-2.5-flash',
    name: 'Gemini 2.5 Flash',
    description: 'Standard model with reasoning'
  }
];

export default {
  processTextWithAi,
  AVAILABLE_MODELS
};