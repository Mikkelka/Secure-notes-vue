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
const FORMATTING_INSTRUCTIONS = `Formatering: BEVAR AL EKSISTERENDE FORMATERING og brug: **omkring tekst** for fed skrift, *omkring tekst* for kursiv, ~~omkring tekst~~ for gennemstreget, start linjer med - for punktopstilling, # for store overskrifter, ## for mindre overskrifter. Brug KUN ét linjeskift mellem afsnit - undgå for mange tomme linjer. Hvis originalteksten har formatering, SKAL du bevare den og forbedre den. Returner kun den færdige note.`;

// Optimeret prompt-struktur for nemmere vedligeholdelse
const PROMPT_DEFINITIONS = {
  "note-organizer": `Du er ekspert i at skabe klare, strukturerede noter. Omdann den rå tekst til en professionel note. ${FORMATTING_INSTRUCTIONS} Fokuser på: Opsummer vigtigste punkter med **fed tekst**, omformuler uklare sætninger til præcise udsagn, organiser logisk med overskrifter og punkter, undgå gentagelser, vær kortfattet men bevar al vigtig information.`,
  summarizer: `Du er ekspert i præcise sammendrag. Læs teksten og lav et kort sammendrag der fanger de vigtigste punkter. ${FORMATTING_INSTRUCTIONS} Brug format: # Sammendrag, **Hovedpunkter:** liste af vigtigste punkter, **Konklusion:** kort afsluttende bemærkning.`,
  "meeting-notes": `Du er ekspert i mødenoter. Strukturer teksten som professionelle mødenoter. ${FORMATTING_INSTRUCTIONS} Brug format: # Mødenotes, ## Deltagere (liste personer), ## Hovedpunkter (vigtige diskussioner med **fed** for nøglepunkter), ## Beslutninger (konkrete beslutninger), ## Handlingspunkter (opgaver med ansvarlig og deadline).`,
  "grammar-checker": `Du er ekspert i grammatik og sproglige formuleringer. Ret grammatiske fejl, stavefejl og forbedre formuleringer. Bevar det oprindelige indhold, betydning og tone. Fokuser på: ret stavefejl og grammatik, forbedre uklare formuleringer, tilføj manglende ord, ret tegnsætning. VIGTIGT: Ændr ikke væsentligt på indholdet - kun sproglige forbedringer.`,
};

// --- HTML Content Processing Utilities ---

/**
 * Simple check for HTML content (always assume HTML now)
 * @param {string} content - Indholdet der skal tjekkes.
 * @returns {boolean}
 */
export const isHtmlContent = (content) => {
  return typeof content === "string" && content.length > 0;
};

/**
 * Henter ren tekst fra HTML indhold (med cache).
 * @param {string} htmlContent - HTML string.
 * @returns {string} Den udpakkede rene tekst.
 */
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

/**
 * Konverterer HTML til plain text format til AI processering.
 * @param {string} htmlContent - HTML string.
 * @returns {string} Plain text formateret tekst.
 */
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


/**
 * Konverterer plain text til HTML format.
 * @param {string} text - Plain text fra AI'en.
 * @returns {string} HTML string.
 */
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

/**
 * Henter AI-instruktion baseret på type (med cache).
 * @param {string} instructionType - Typen af instruktion eller custom instruction ID.
 * @param {object | null} [userSettings=null] - Brugerens indstillinger for at tilgå custom instructions.
 * @returns {string} Den færdige prompt.
 */
const getInstructionPrompt = (instructionType, userSettings = null) => {
  // Check cache first
  if (instructionCache.has(instructionType)) {
    return instructionCache.get(instructionType);
  }
  
  let prompt;
  
  // Check if it's a custom instruction ID (starts with 'custom-')
  if (instructionType && instructionType.startsWith('custom-') && userSettings?.aiSettings?.customInstructions) {
    const customInstructionsArray = userSettings.aiSettings.customInstructions;
    
    // Ensure customInstructions is an array (not the old string format)
    if (Array.isArray(customInstructionsArray)) {
      const customInstruction = customInstructionsArray.find(
        instruction => instruction.id === instructionType
      );
      
      if (customInstruction) {
        // Build prompt with formatting instructions for custom instructions
        prompt = `${customInstruction.instruction} ${FORMATTING_INSTRUCTIONS}`;
        instructionCache.set(instructionType, prompt);
        return prompt;
      }
    }
  }
  
  // Fallback to standard prompt definitions
  prompt = PROMPT_DEFINITIONS[instructionType] || PROMPT_DEFINITIONS["note-organizer"];
  instructionCache.set(instructionType, prompt);
  return prompt;
};

/**
 * Henter AI-indstillinger fra userSettings eller falder tilbage til sessionStorage.
 * @param {object | null} userSettings - Brugerens indstillinger.
 * @returns {{apiKey: string, model: string, instructionType: string}}
 */
const getAiSettings = (userSettings) => {
  if (userSettings?.aiSettings) {
    const { apiKey, selectedModel, customInstructions } =
      userSettings.aiSettings;
    return {
      apiKey: apiKey || "",
      model: selectedModel || "gemini-2.5-flash",
      instructionType: customInstructions || "note-organizer",
    };
  }

  // Legacy fallback til sessionStorage
  return {
    apiKey: sessionStorage.getItem("gemini-api-key") || "",
    model: sessionStorage.getItem("ai-model") || "gemini-2.5-flash",
    instructionType:
      sessionStorage.getItem("ai-instruction-preference") || 
      sessionStorage.getItem("ai-instructions") || 
      "note-organizer",
  };
};

/**
 * Processerer HTML med AI og returnerer forbedret HTML.
 * @param {string} content - HTML indholdet.
 * @param {object | null} [userSettings=null] - Brugerens indstillinger.
 * @returns {Promise<string>} En Promise der resolver til HTML string.
 */
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

KRITISKE HTML FORMATERINGS REGLER:
- Input nedenfor er HTML indhold der kan forbedres med formatering
- Du SKAL bevare eksisterende HTML formatering (overskrifter, fed tekst, etc.)
- Du MÅ tilføje passende HTML formatering hvor det forbedrer struktur og læsbarhed:
  * Brug <h1>, <h2>, <h3> for overskrifter
  * Brug <strong> for vigtige ord/sætninger
  * Brug <em> for fremhævning
  * Brug <ul><li> for lister  
  * Brug <p> for almindelige afsnit
- Returner KUN valid HTML - ingen markdown
- Organiser indholdet logisk med passende overskrifter
- Fremhæv nøgleord med <strong> hvor det giver mening

Input HTML:
${content}`;

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
