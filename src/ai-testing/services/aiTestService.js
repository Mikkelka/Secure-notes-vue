// Ultra-Minimal AI Test Service - Back to Basics
// Starting from Google's basic example and building up scientifically

import { GoogleGenAI } from "@google/genai";

/**
 * Ultra-minimal AI processing - Google's basic example
 * @param {string} content - Input text to process
 * @param {string} apiKey - Google AI API key
 * @param {string} model - Model to use
 * @returns {Promise<string>} - AI response
 */
export const processTextWithAi = async (content, apiKey, model) => {
  const startTime = performance.now();
  
  // Basic Google AI setup
  const ai = new GoogleGenAI({ apiKey });
  
  // Minimal configuration - exactly like Google's example
  const response = await ai.models.generateContent({
    model,
    contents: content,
  });
  
  const endTime = performance.now();
  const totalTime = Math.round(endTime - startTime);
  
  // Basic performance logging
  console.log(`🧪 Ultra-Minimal Test: ${model} - ${totalTime}ms`);
  
  // Store basic metrics for UI
  if (typeof window !== 'undefined') {
    if (!window.aiPerformanceMetrics) {
      window.aiPerformanceMetrics = [];
    }
    
    window.aiPerformanceMetrics.push({
      timestamp: new Date().toISOString(),
      model,
      totalTime,
      responseLength: response.text()?.length || 0,
      minimal: true
    });
  }
  
  return response.text();
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