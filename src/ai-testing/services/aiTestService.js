// Production-Realistic AI Test Service
// Testing with actual Note Organizer formatting tasks from production

import { GoogleGenAI } from "@google/genai";

// Production Note Organizer instruction + formatting rules (matches aiService.js)
const NOTE_ORGANIZER_INSTRUCTION = 'Du er ekspert i at skabe klare, strukturerede noter. Omdann den rå tekst til en professionel note. Fokuser på: Opsummer vigtigste punkter med **fed tekst**, omformuler uklare sætninger til præcise udsagn, organiser logisk med overskrifter og punkter, undgå gentagelser, vær kortfattet men bevar al vigtig information.';

const FORMATTING_INSTRUCTIONS = `Formatering: BEVAR AL EKSISTERENDE FORMATERING og brug: **omkring tekst** for fed skrift, *omkring tekst* for kursiv, ~~omkring tekst~~ for gennemstreget, start linjer med - for punktopstilling, # for store overskrifter, ## for mindre overskrifter. Brug KUN ét linjeskift mellem afsnit - undgå for mange tomme linjer. Hvis originalteksten har formatering, SKAL du bevare den og forbedre den.

HTML FORMATERING: Du MÅ tilføje passende HTML formatering hvor det forbedrer struktur og læsbarhed: <h1>, <h2>, <h3> for overskrifter, <strong> for vigtige ord/sætninger, <em> for fremhævning, <ul><li> for lister, <p> for almindelige afsnit, <hr> for adskillelse mellem sektioner, <pre><code> for kodeblokke, <code> for inline kode. Returner KUN valid HTML - ingen markdown. Organiser indholdet logisk med passende overskrifter og fremhæv nøgleord med <strong> hvor det giver mening.

VIGTIGT: Brug ALDRIG borders, rammer, border-stil, eller CSS borders i outputtet - ignorer eksisterende borders i input. Returner kun den færdige note.`;

const PRODUCTION_SYSTEM_INSTRUCTION = `${NOTE_ORGANIZER_INSTRUCTION} ${FORMATTING_INSTRUCTIONS}`;

/**
 * Model-specific optimized AI processing
 * @param {string} content - Input text to process
 * @param {string} apiKey - Google AI API key
 * @param {string} model - Model to use
 * @returns {Promise<string>} - AI response
 */
export const processTextWithAi = async (content, apiKey, model) => {
  const startTime = performance.now();
  
  const ai = new GoogleGenAI({ apiKey });
  
  // Model-specific configuration - Standard Flash gets optimization, Flash-Lite stays minimal
  const isStandardFlash = model.includes('flash') && !model.includes('lite');
  
  if (isStandardFlash) {
    // Optimized configuration for Standard Flash using new SDK approach
    console.log(`🧪 Standard Flash Optimized: ${model} - starting...`);
    
    const response = await ai.models.generateContent({
      model,
      contents: content,
      config: {
        // Explicit thinking disabling + output control
        thinkingConfig: {
          thinkingBudget: 0  // Explicitly disable thinking for speed
        },
        generationConfig: {
          maxOutputTokens: 8192, // Ensure longer responses
          temperature: 0.7,
          topP: 0.8,
          topK: 40
        },
        systemInstruction: {
          parts: [{ text: PRODUCTION_SYSTEM_INSTRUCTION }],
        }
      }
    });
    
    const endTime = performance.now();
    const totalTime = Math.round(endTime - startTime);
    
    console.log(`🧪 Standard Flash Optimized: ${model} - ${totalTime}ms`);
    
    const responseText = response.text || '';
    
    // Store metrics
    if (typeof window !== 'undefined') {
      if (!window.aiPerformanceMetrics) {
        window.aiPerformanceMetrics = [];
      }
      
      window.aiPerformanceMetrics.push({
        timestamp: new Date().toISOString(),
        model,
        totalTime,
        responseLength: responseText.length,
        method: 'optimized-standard-flash',
        optimized: true,
        thinkingDisabled: true,
        instructions: 'note-organizer'
      });
    }
    
    return responseText;
    
  } else {
    // Minimal configuration for Flash-Lite - keep it simple and fast
    console.log(`🧪 Flash-Lite Minimal: ${model} - starting...`);
    
    const response = await ai.models.generateContent({
      model,
      contents: content,
    });
    
    const endTime = performance.now();
    const totalTime = Math.round(endTime - startTime);
    
    console.log(`🧪 Flash-Lite Minimal: ${model} - ${totalTime}ms`);
    
    const responseText = response.text || '';
    
    // Store metrics
    if (typeof window !== 'undefined') {
      if (!window.aiPerformanceMetrics) {
        window.aiPerformanceMetrics = [];
      }
      
      window.aiPerformanceMetrics.push({
        timestamp: new Date().toISOString(),
        model,
        totalTime,
        responseLength: responseText.length,
        method: 'minimal-flash-lite',
        minimal: true,
        instructions: 'note-organizer'
      });
    }
    
    return responseText;
  }
}

/**
 * Google's official streaming approach - exactly like their examples
 * @param {string} content - Input text to process
 * @param {string} apiKey - Google AI API key  
 * @param {string} model - Model to use
 * @returns {Promise<string>} - AI response
 */
export const processTextWithAiStreaming = async (content, apiKey, model) => {
  const startTime = performance.now();
  
  // Basic Google AI setup
  const ai = new GoogleGenAI({ apiKey });
  
  // Google's official streaming approach with production formatting instructions
  const response = await ai.models.generateContentStream({
    model,
    contents: content,
    config: {
      systemInstruction: {
        parts: [{ text: PRODUCTION_SYSTEM_INSTRUCTION }],
      }
    }
  });
  
  let text = "";
  for await (const chunk of response) {
    console.log(chunk.text); // Google's debug output
    text += chunk.text;
  }
  
  const endTime = performance.now();
  const totalTime = Math.round(endTime - startTime);
  
  console.log(`🧪 Google Streaming Test: ${model} - ${totalTime}ms`);
  
  // Store streaming metrics
  if (typeof window !== 'undefined') {
    if (!window.aiPerformanceMetrics) {
      window.aiPerformanceMetrics = [];
    }
    
    window.aiPerformanceMetrics.push({
      timestamp: new Date().toISOString(),
      model,
      totalTime,
      responseLength: text.length,
      method: 'production-streaming',
      streaming: true,
      instructions: 'note-organizer'
    });
  }
  
  return text;
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
  processTextWithAiStreaming,
  AVAILABLE_MODELS
};