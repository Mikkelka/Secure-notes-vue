// services/aiService.js
import { GoogleGenAI } from "@google/genai";

// --- Konstanter og Konfiguration ---

// Sikkerhedsindstillinger - tillad alt indhold for at undgå blokering af legitim tekst
const _SAFETY_SETTINGS = [
  { category: "HARM_CATEGORY_HARASSMENT", threshold: "BLOCK_NONE" },
  { category: "HARM_CATEGORY_HATE_SPEECH", threshold: "BLOCK_NONE" },
  { category: "HARM_CATEGORY_SEXUALLY_EXPLICIT", threshold: "BLOCK_NONE" },
  { category: "HARM_CATEGORY_DANGEROUS_CONTENT", threshold: "BLOCK_NONE" },
];

// Fælles formateringsinstruktioner
const FORMATTING_INSTRUCTIONS = `Formatering: BEVAR AL EKSISTERENDE FORMATERING og brug: **omkring tekst** for fed skrift, *omkring tekst* for kursiv, ~~omkring tekst~~ for gennemstreget, start linjer med - for punktopstilling, # for store overskrifter, ## for mindre overskrifter. Brug KUN ét linjeskift mellem afsnit - undgå for mange tomme linjer. Hvis originalteksten har formatering, SKAL du bevare den og forbedre den.

HTML FORMATERING: Du MÅ tilføje passende HTML formatering hvor det forbedrer struktur og læsbarhed: <h1>, <h2>, <h3> for overskrifter, <strong> for vigtige ord/sætninger, <em> for fremhævning, <u> for understregning, <s> for gennemstregning, <ul><li> for lister, <p> for almindelige afsnit, <hr> for adskillelse mellem sektioner, <pre><code> for kodeblokke, <code> for inline kode. Returner KUN valid HTML - ingen markdown. Organiser indholdet logisk med passende overskrifter og fremhæv nøgleord med ** hvor det giver mening.

VIGTIGT: Brug ALDRIG borders, rammer, border-stil, eller CSS borders i outputtet - ignorer eksisterende borders i input. Returner kun den færdige note.`;

export const isHtmlContent = (content) => {
  return typeof content === "string" && content.length > 0;
};

export const extractPlainText = (htmlContent) => {
  if (!htmlContent) return "";

  // Simpel HTML → plain text konvertering
  return htmlContent
    .replace(/<[^>]*>/g, ' ') // Fjern HTML tags
    .replace(/\s+/g, ' ') // Sammenfold whitespace
    .trim();
};

export const convertHtmlToPlainText = (htmlContent) => {
  if (!htmlContent) return "";
  
  // Simpel HTML → plain text konvertering der bevarer grundlæggende struktur
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

export const convertTextToHtml = (text) => {
  if (!text) return '<p></p>';

  // Normaliser tekst: fjern excessive whitespace og linjeskift
  const normalizedText = text
    .replace(/\n\s*\n\s*\n+/g, '\n\n') // Maksimalt 2 consecutive newlines
    .replace(/[ \t]+/g, ' ') // Multiple spaces til single space
    .trim();

  // Simpel konvertering til HTML
  return normalizedText
    .split('\n\n') // Split på dobbelte linjeskift for afsnit
    .map(paragraph => paragraph.trim())
    .filter(paragraph => paragraph.length > 0)
    .map(paragraph => {
      // Konverter enkle linjeskift til <br>
      return `<p>${paragraph.replace(/\n/g, '<br>')}</p>`;
    })
    .join('');
};

// --- AI Service Logik ---
// Default instructions definitions - exported for use in AiModal
export const DEFAULT_INSTRUCTIONS = [
  {
    id: 'std-note-organizer',
    name: 'Note Organizer',
    instruction: 'Du er ekspert i at skabe klare, strukturerede noter. Omdann den rå tekst til en professionel note. Fokuser på: Opsummer vigtigste punkter med **fed tekst**, omformuler uklare sætninger til præcise udsagn, organiser logisk med overskrifter og punkter, undgå gentagelser, vær kortfattet men bevar al vigtig information.',
    isDefault: true
  },
  {
    id: 'std-summarizer',
    name: 'Summarizer',
    instruction: 'Du er ekspert i præcise sammendrag. Læs teksten og lav et kort sammendrag der fanger de vigtigste punkter. Brug format: # Sammendrag, **Hovedpunkter:** liste af vigtigste punkter, **Konklusion:** kort afsluttende bemærkning.',
    isDefault: true
  },
  {
    id: 'std-meeting-notes',
    name: 'Meeting Noter',
    instruction: 'Du er ekspert i mødenoter. Strukturer teksten som professionelle mødenoter. Brug format: # Mødenotes, ## Deltagere (liste personer), ## Hovedpunkter (vigtige diskussioner med **fed** for nøglepunkter), ## Beslutninger (konkrete beslutninger), ## Handlingspunkter (opgaver med ansvarlig og deadline).',
    isDefault: true
  },
  {
    id: 'std-grammar-checker',
    name: 'Grammatik Rettelse',
    instruction: 'Du er ekspert i grammatik og sproglige formuleringer. Ret grammatiske fejl, stavefejl og forbedre formuleringer. Bevar det oprindelige indhold, betydning og tone. Fokuser på: ret stavefejl og grammatik, forbedre uklare formuleringer, tilføj manglende ord, ret tegnsætning. VIGTIGT: Ændr ikke væsentligt på indholdet - kun sproglige forbedringer.',
    isDefault: true
  }
]

const getInstructionPrompt = (instructionType, userSettings = null) => {
  // Check if it's a custom or standard instruction ID (starts with 'custom-' or 'std-')
  if (instructionType && (instructionType.startsWith('custom-') || instructionType.startsWith('std-')) && userSettings?.aiSettings?.customInstructions) {
    const customInstructionsArray = userSettings.aiSettings.customInstructions;
    
    // Ensure customInstructions is an array (not the old string format)
    if (Array.isArray(customInstructionsArray)) {
      const instruction = customInstructionsArray.find(
        instr => instr.id === instructionType
      );
      
      if (instruction) {
        // Build prompt with formatting instructions
        return `${instruction.instruction} ${FORMATTING_INSTRUCTIONS}`;
      }
    }
  }
  
  // Fallback to default instructions if not found in userSettings
  if (instructionType && instructionType.startsWith('std-')) {
    const defaultInstruction = DEFAULT_INSTRUCTIONS.find(instr => instr.id === instructionType);
    if (defaultInstruction) {
      return `${defaultInstruction.instruction} ${FORMATTING_INSTRUCTIONS}`;
    }
  }
  
  // This should never happen in normal use
  throw new Error(`AI instruction not found: ${instructionType}. Please check your AI settings.`);
};

const getAiSettings = (userSettings) => {
  // Get instruction type - prioritize override from userSettings, then session storage
  let instructionType = sessionStorage.getItem("ai-instruction-preference") || 
                       sessionStorage.getItem("ai-instructions") || 
                       "std-note-organizer";

  // Always check sessionStorage for model selection first (AI modal saves here)
  const selectedModel = sessionStorage.getItem("ai-model") || "gemini-2.5-flash-lite-preview-06-17";

  if (userSettings?.aiSettings) {
    const { apiKey, selectedInstruction } = userSettings.aiSettings;
    
    // Use selectedInstruction override if provided
    if (selectedInstruction) {
      instructionType = selectedInstruction;
    }
    
    return {
      apiKey: apiKey || "",
      model: selectedModel, // Always use sessionStorage model
      instructionType,
    };
  }

  // Legacy fallback til sessionStorage
  return {
    apiKey: sessionStorage.getItem("gemini-api-key") || "",
    model: selectedModel, // Always use sessionStorage model
    instructionType,
  };
};


// AI Processing with streaming and systemInstruction optimization
export const processTextWithAi = async (content, title, userSettings = null, enableDebugTiming = false, onChunk = null, onThoughtChunk = null) => {
  const totalStartTime = performance.now();
  
  const { apiKey, model, instructionType } = getAiSettings(userSettings);

  if (!apiKey) {
    throw new Error(
      "API nøgle ikke fundet. Konfigurer AI indstillinger først."
    );
  }

  if (!content.trim()) {
    throw new Error("Ingen tekst at processere.");
  }

  try {
    // Phase 1: Setup and Initialization
    const setupStartTime = performance.now();
    const ai = new GoogleGenAI({ apiKey });
    const instructionPrompt = getInstructionPrompt(instructionType, userSettings);
    const setupTime = performance.now() - setupStartTime;

    // Phase 2: Prompt Preparation + Performance optimization
    const promptStartTime = performance.now();
    const simplePrompt = `Note titel (kun til kontekst): "${title}"\n\nInput HTML:\n${content}`;
    const promptTime = performance.now() - promptStartTime;
    
    if (enableDebugTiming) {
      console.log('=== STREAMING AI PERFORMANCE DEBUG ===');
      console.log('Model:', model);
      console.log('Using systemInstruction + Streaming: YES');
      console.log('Content Length:', content.length);
      console.log('Setup Time:', Math.round(setupTime), 'ms');
      console.log('Prompt Prep Time:', Math.round(promptTime), 'ms');
    }

    // Phase 3: Token counting for performance analysis (Google cookbook best practice)
    const tokenCountStart = performance.now();
    let inputTokens = 0;
    let tokenCountTime = 0;
    
    try {
      const tokenResponse = await ai.models.countTokens({
        model,
        contents: simplePrompt,
      });
      tokenCountTime = performance.now() - tokenCountStart;
      inputTokens = tokenResponse.totalTokens;
      
      if (enableDebugTiming) {
        console.log(`🧪 Token Count: ${inputTokens} input tokens (${Math.round(tokenCountTime)}ms)`);
      }
    } catch (error) {
      console.warn('Token counting failed:', error);
      tokenCountTime = performance.now() - tokenCountStart;
    }
    
    // Phase 4: AI API Call with streaming optimization
    const apiStartTime = performance.now();
    console.time(`AI_API_Call_Streaming_${model}`);
    
    // Build config object conditionally
    const config = {
      systemInstruction: instructionPrompt,
    };
    
    // OPTIMIZED THINKING IMPLEMENTATION: Based on test environment learnings
    const enableThinking = userSettings?.aiSettings?.enableThinking;
    
    // Configure thinking with proper thinkingBudget (critical for Flash Lite!)
    if (enableThinking) {
      config.thinkingConfig = {
        includeThoughts: true,
        thinkingBudget: -1  // Dynamic thinking - model decides complexity
      };
      
      if (enableDebugTiming) {
        console.log('🧠 Thinking enabled with dynamic budget (-1)');
      }
    } else {
      config.thinkingConfig = {
        thinkingBudget: 0  // Explicit disable - critical for Flash Lite
      };
      
      if (enableDebugTiming) {
        console.log('⚡ Thinking explicitly disabled (thinkingBudget: 0)');
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
    let firstAnswerChunkTime = null;
    let firstThoughtChunkTime = null;
    let hasThoughts = false;
    
    for await (const chunk of streamResponse) {
      if (firstChunkTime === null) {
        firstChunkTime = performance.now() - apiStartTime;
        if (enableDebugTiming) {
          console.log('First chunk received in:', Math.round(firstChunkTime), 'ms');
        }
      }
      
      // Handle response parts (for thought summaries) - Enhanced with test environment learnings
      if (chunk.candidates && chunk.candidates[0]?.content?.parts) {
        for (const part of chunk.candidates[0].content.parts) {
          if (!part.text) continue;
          
          if (part.thought) {
            // This is a thought summary
            thoughtSummaries += part.text;
            hasThoughts = true;
            
            // Measure first thought chunk time
            if (firstThoughtChunkTime === null) {
              firstThoughtChunkTime = performance.now() - apiStartTime;
              if (enableDebugTiming) {
                console.log(`🧠 First thought chunk at: ${Math.round(firstThoughtChunkTime)}ms`);
              }
            }
            
            if (enableDebugTiming) {
              console.log('🧠 Thought Summary:', part.text.substring(0, 100) + '...');
            }
            
            // Call onThoughtChunk callback for real-time thought UI updates
            if (onThoughtChunk && part.text) {
              onThoughtChunk(part.text);
            }
          } else {
            // This is regular answer content
            fullResponse += part.text;
            
            // Measure first answer chunk time
            if (firstAnswerChunkTime === null) {
              firstAnswerChunkTime = performance.now() - apiStartTime;
              if (enableDebugTiming) {
                console.log(`💬 First answer chunk at: ${Math.round(firstAnswerChunkTime)}ms`);
              }
            }
            
            if (enableDebugTiming) {
              console.log('💬 Answer:', part.text.substring(0, 100) + '...');
            }
            
            // Call onChunk callback for real-time UI updates
            if (onChunk && part.text) {
              onChunk(part.text);
            }
          }
        }
      }
      // Fallback for simple text chunks (no thoughts)
      else if (chunk.text) {
        fullResponse += chunk.text;
        
        // Measure first answer chunk time (for fallback)
        if (firstAnswerChunkTime === null) {
          firstAnswerChunkTime = performance.now() - apiStartTime;
          if (enableDebugTiming) {
            console.log(`💬 First answer chunk at: ${Math.round(firstAnswerChunkTime)}ms`);
          }
        }
        
        // Call onChunk callback for real-time UI updates (fallback)
        if (onChunk && chunk.text) {
          onChunk(chunk.text);
        }
      }
    }
    
    console.timeEnd(`AI_API_Call_Streaming_${model}`);
    const apiTime = performance.now() - apiStartTime;
    
    // Enhanced debug logging from test environment
    if (enableDebugTiming) {
      console.log(`🧪 Google Streaming Test: ${model} - ${Math.round(apiTime)}ms`);
      console.log(`🧠 Thinking: ${enableThinking ? 'ENABLED' : 'DISABLED'}`);
      console.log(`⚡ First chunk: ${firstChunkTime}ms (perceived performance)`);
      console.log(`💬 First answer: ${firstAnswerChunkTime || 'N/A'}ms`);
      console.log(`🧠 First thought: ${firstThoughtChunkTime || 'N/A'}ms`);
      console.log(`🧠 Thought Summaries Length: ${thoughtSummaries.length} chars`);
      console.log(`💬 Answer Length: ${fullResponse.length} chars`);
    }
    
    // Phase 4: Response Processing
    const processStartTime = performance.now();
    let processedHtml = fullResponse;

    // Minimal cleanup
    processedHtml = processedHtml
      .replace(/^```html\s*/, '')
      .replace(/\s*```$/, '')  
      .trim();

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
      console.log('=== END STREAMING AI PERFORMANCE DEBUG ===');
    }

    // Store performance metrics
    if (typeof window !== 'undefined' && window.aiPerformanceMetrics) {
      window.aiPerformanceMetrics.push({
        timestamp: new Date().toISOString(),
        model,
        instructionType,
        optimized: true,
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
        includeThoughtsEnabled: userSettings?.aiSettings?.includeThoughts || false,
        // Token metrics from test environment
        tokenMetrics: {
          inputTokens,
          tokenCountTime: Math.round(tokenCountTime),
          tokensPerSecond: inputTokens > 0 ? Math.round((inputTokens / apiTime) * 1000) : 0
        },
        // First chunk timing metrics from test environment  
        firstAnswerChunkTime: Math.round(firstAnswerChunkTime || 0),
        firstThoughtChunkTime: Math.round(firstThoughtChunkTime || 0),
        // Thinking configuration
        thinkingEnabled: enableThinking
      });
    }

    // Enhanced return object with thought summaries and performance metrics
    const performanceMetrics = {
      timestamp: new Date().toISOString(),
      model,
      instructionType,
      optimized: true,
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
      // Token metrics from test environment
      tokenMetrics: {
        inputTokens,
        tokenCountTime: Math.round(tokenCountTime),
        tokensPerSecond: inputTokens > 0 ? Math.round((inputTokens / apiTime) * 1000) : 0
      },
      // First chunk timing metrics from test environment  
      firstAnswerChunkTime: Math.round(firstAnswerChunkTime || 0),
      firstThoughtChunkTime: Math.round(firstThoughtChunkTime || 0),
      // Thinking configuration
      thinkingEnabled: enableThinking
    };
    
    return {
      processedHtml,
      thoughtSummaries,
      performanceMetrics
    };
  } catch (error) {
    const totalTime = performance.now() - totalStartTime;
    
    if (enableDebugTiming) {
      console.log('=== STREAMING AI ERROR DEBUG ===');
      console.log('Error occurred after:', Math.round(totalTime), 'ms');
      console.log('Error:', error.message);
      console.log('=== END STREAMING AI ERROR DEBUG ===');
    }
    
    console.error("Streaming AI Processing Error:", error);
    let errorMessage = "AI processering fejlede: ";
    const errorText = error.message.toLowerCase();

    if (errorText.includes("api_key_invalid")) {
      errorMessage += "Din API nøgle er ugyldig.";
    } else if (errorText.includes("permission_denied")) {
      errorMessage +=
        "Adgang nægtet. Tjek din API nøgle og at fakturering er aktiv.";
    } else if (errorText.includes("quota_exceeded")) {
      errorMessage += "API kvote overskredet.";
    } else {
      errorMessage += error.message;
    }
    throw new Error(errorMessage);
  }
};

