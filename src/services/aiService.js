// services/aiService.js
import { GoogleGenAI } from "@google/genai";

// --- Konstanter og Konfiguration ---

// Cache for at undgå at genskabe instruktioner og parse tekst unødigt
const instructionCache = new Map();
const textExtractionCache = new Map();

// Sikkerhedsindstillinger - tillad alt indhold for at undgå blokering af legitim tekst
const SAFETY_SETTINGS = [
  { category: "HARM_CATEGORY_HARASSMENT", threshold: "BLOCK_NONE" },
  { category: "HARM_CATEGORY_HATE_SPEECH", threshold: "BLOCK_NONE" },
  { category: "HARM_CATEGORY_SEXUALLY_EXPLICIT", threshold: "BLOCK_NONE" },
  { category: "HARM_CATEGORY_DANGEROUS_CONTENT", threshold: "BLOCK_NONE" },
];

// Fælles formateringsinstruktioner
const FORMATTING_INSTRUCTIONS = `Formatering: BEVAR AL EKSISTERENDE FORMATERING og brug: **omkring tekst** for fed skrift, *omkring tekst* for kursiv, ~~omkring tekst~~ for gennemstreget, start linjer med - for punktopstilling, # for store overskrifter, ## for mindre overskrifter. Brug KUN ét linjeskift mellem afsnit - undgå for mange tomme linjer. Hvis originalteksten har formatering, SKAL du bevare den og forbedre den.

HTML FORMATERING: Du MÅ tilføje passende HTML formatering hvor det forbedrer struktur og læsbarhed: <h1>, <h2>, <h3> for overskrifter, <strong> for vigtige ord/sætninger, <em> for fremhævning, <ul><li> for lister, <p> for almindelige afsnit, <hr> for adskillelse mellem sektioner. Returner KUN valid HTML - ingen markdown. Organiser indholdet logisk med passende overskrifter og fremhæv nøgleord med <strong> hvor det giver mening.

VIGTIGT: Brug ALDRIG borders, rammer, border-stil, eller CSS borders i outputtet - ignorer eksisterende borders i input. Returner kun den færdige note.`;

export const isHtmlContent = (content) => {
  return typeof content === "string" && content.length > 0;
};

export const extractPlainText = (htmlContent) => {
  if (!htmlContent) return "";
  if (textExtractionCache.has(htmlContent)) {
    return textExtractionCache.get(htmlContent);
  }

  // Simpel HTML → plain text konvertering
  const result = htmlContent
    .replace(/<[^>]*>/g, ' ') // Fjern HTML tags
    .replace(/\s+/g, ' ') // Sammenfold whitespace
    .trim();

  textExtractionCache.set(htmlContent, result);
  return result;
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
  // Debug logging
  console.log('=== getInstructionPrompt DEBUG ===');
  console.log('instructionType:', instructionType);
  console.log('userSettings:', userSettings);
  console.log('userSettings?.aiSettings:', userSettings?.aiSettings);
  console.log('customInstructions array:', userSettings?.aiSettings?.customInstructions);
  
  // Check cache first
  if (instructionCache.has(instructionType)) {
    console.log('Found in cache');
    return instructionCache.get(instructionType);
  }
  
  let prompt;
  
  // Check if it's a custom or standard instruction ID (starts with 'custom-' or 'std-')
  if (instructionType && (instructionType.startsWith('custom-') || instructionType.startsWith('std-')) && userSettings?.aiSettings?.customInstructions) {
    const customInstructionsArray = userSettings.aiSettings.customInstructions;
    console.log('Checking customInstructions array:', customInstructionsArray);
    
    // Ensure customInstructions is an array (not the old string format)
    if (Array.isArray(customInstructionsArray)) {
      console.log('customInstructions is array, looking for:', instructionType);
      const instruction = customInstructionsArray.find(
        instr => instr.id === instructionType
      );
      console.log('Found instruction:', instruction);
      
      if (instruction) {
        // Build prompt with formatting instructions
        prompt = `${instruction.instruction} ${FORMATTING_INSTRUCTIONS}`;
        console.log('Using custom/standard instruction from userSettings');
        instructionCache.set(instructionType, prompt);
        return prompt;
      } else {
        console.log('Instruction not found in customInstructions array');
      }
    } else {
      console.log('customInstructions is not an array:', typeof customInstructionsArray);
    }
  } else {
    console.log('Conditions not met for customInstructions lookup');
    console.log('- instructionType exists:', !!instructionType);
    console.log('- starts with custom-/std-:', instructionType && (instructionType.startsWith('custom-') || instructionType.startsWith('std-')));
    console.log('- userSettings.aiSettings.customInstructions exists:', !!userSettings?.aiSettings?.customInstructions);
  }
  
  // Fallback to default instructions if not found in userSettings
  if (instructionType && instructionType.startsWith('std-')) {
    console.log('Using fallback DEFAULT_INSTRUCTIONS for:', instructionType);
    const defaultInstruction = DEFAULT_INSTRUCTIONS.find(instr => instr.id === instructionType);
    if (defaultInstruction) {
      prompt = `${defaultInstruction.instruction} ${FORMATTING_INSTRUCTIONS}`;
      instructionCache.set(instructionType, prompt);
      return prompt;
    }
  }
  
  console.log('=== END getInstructionPrompt DEBUG ===');
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
      model: selectedModel || "gemini-2.5-flash",
      instructionType,
    };
  }

  // Legacy fallback til sessionStorage
  return {
    apiKey: sessionStorage.getItem("gemini-api-key") || "",
    model: sessionStorage.getItem("ai-model") || "gemini-2.5-flash",
    instructionType,
  };
};

export const processTextWithAi = async (content, userSettings = null) => {
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
    const ai = new GoogleGenAI({ apiKey });
    const instructionPrompt = getInstructionPrompt(instructionType, userSettings);

    // HTML-direkte prompt der tilføjer intelligent formatering
    const prompt = `${instructionPrompt}

Input HTML:
${content}`;

    // Debug: Log the complete prompt being sent to Gemini
    // console.log('=== GEMINI PROMPT DEBUG ===');
    // console.log('Instruction Type:', instructionType);
    // console.log('Instruction Prompt:', instructionPrompt);
    console.log('Complete Prompt:');
    console.log(prompt);
    // console.log('Input Content:', content);
    // console.log('=== END PROMPT DEBUG ===');

    const response = await ai.models.generateContent({
      model,
      contents: prompt,
      config: {
        safetySettings: SAFETY_SETTINGS,
        thinkingConfig: {
          thinkingBudget: 0, // Disable thinking capabilities
        },
      },
    });
    
    let processedHtml = response.text;

    // Minimal cleanup - fjern kun evt. wrapping af AI der ikke er HTML
    processedHtml = processedHtml
      .replace(/^```html\s*/, '') // Fjern evt. code block start
      .replace(/\s*```$/, '') // Fjern evt. code block end  
      .trim();

    // Valider at vi har noget HTML-lignende content
    if (!processedHtml.includes('<') || !processedHtml.includes('>')) {
      // Hvis AI returnerede plain text, wrap i paragraph
      processedHtml = `<p>${processedHtml}</p>`;
    }

    return processedHtml;
  } catch (error) {
    console.error("AI Processing Error:", error);
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
