// services/aiService.js
import { GoogleGenAI } from "@google/genai";

// --- Konstanter og Konfiguration ---

// Sikkerhedsindstillinger - tillad alt indhold for at undgå blokering af legitim tekst
const SAFETY_SETTINGS = [
  { category: "HARM_CATEGORY_HARASSMENT", threshold: "BLOCK_NONE" },
  { category: "HARM_CATEGORY_HATE_SPEECH", threshold: "BLOCK_NONE" },
  { category: "HARM_CATEGORY_SEXUALLY_EXPLICIT", threshold: "BLOCK_NONE" },
  { category: "HARM_CATEGORY_DANGEROUS_CONTENT", threshold: "BLOCK_NONE" },
];

// Fælles formateringsinstruktioner
const FORMATTING_INSTRUCTIONS = `Formatering: BEVAR AL EKSISTERENDE FORMATERING og brug: **omkring tekst** for fed skrift, *omkring tekst* for kursiv, ~~omkring tekst~~ for gennemstreget, start linjer med - for punktopstilling, # for store overskrifter, ## for mindre overskrifter. Brug KUN ét linjeskift mellem afsnit - undgå for mange tomme linjer. Hvis originalteksten har formatering, SKAL du bevare den og forbedre den.

HTML FORMATERING: Du MÅ tilføje passende HTML formatering hvor det forbedrer struktur og læsbarhed: <h1>, <h2>, <h3> for overskrifter, <strong> for vigtige ord/sætninger, <em> for fremhævning, <ul><li> for lister, <p> for almindelige afsnit, <hr> for adskillelse mellem sektioner, <pre><code> for kodeblokke, <code> for inline kode. Returner KUN valid HTML - ingen markdown. Organiser indholdet logisk med passende overskrifter og fremhæv nøgleord med <strong> hvor det giver mening.

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

  if (userSettings?.aiSettings) {
    const { apiKey, selectedModel, selectedInstruction } = userSettings.aiSettings;
    
    // Use selectedInstruction override if provided
    if (selectedInstruction) {
      instructionType = selectedInstruction;
    }
    
    return {
      apiKey: apiKey || "",
      model: selectedModel || "gemini-2.5-flash-lite-preview-06-17", // Fastest model
      instructionType,
    };
  }

  // Legacy fallback til sessionStorage
  return {
    apiKey: sessionStorage.getItem("gemini-api-key") || "",
    model: sessionStorage.getItem("ai-model") || "gemini-2.5-flash-lite-preview-06-17", // Fastest model
    instructionType,
  };
};


// AI Processing with streaming and systemInstruction optimization
export const processTextWithAi = async (content, title, userSettings = null, enableDebugTiming = false) => {
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

    // Phase 3: AI API Call with streaming optimization
    const apiStartTime = performance.now();
    console.time(`AI_API_Call_Streaming_${model}`);
    
    // Build config object conditionally
    const config = {
      systemInstruction: instructionPrompt,
    };
    
    // Add thinking config if thoughts are requested
    if (userSettings?.aiSettings?.includeThoughts) {
      config.thinkingConfig = {
        includeThoughts: true
      };
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
    
    console.timeEnd(`AI_API_Call_Streaming_${model}`);
    const apiTime = performance.now() - apiStartTime;
    
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
        includeThoughtsEnabled: userSettings?.aiSettings?.includeThoughts || false
      });
    }

    return processedHtml;
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

