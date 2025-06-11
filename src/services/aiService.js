// services/aiService.js
import { GoogleGenerativeAI } from "@google/generative-ai";

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
const FORMATTING_INSTRUCTIONS = `Formatering: Brug **omkring tekst** for fed skrift, *omkring tekst* for kursiv, start linjer med - for punktopstilling, # for store overskrifter, ## for mindre overskrifter. Lav linjeskift mellem afsnit. Returner kun den færdige note.`;

// Optimeret prompt-struktur for nemmere vedligeholdelse
const PROMPT_DEFINITIONS = {
  "note-organizer": `Du er ekspert i at skabe klare, strukturerede noter. Omdann den rå tekst til en professionel note. ${FORMATTING_INSTRUCTIONS} Fokuser på: Opsummer vigtigste punkter med **fed tekst**, omformuler uklare sætninger til præcise udsagn, organiser logisk med overskrifter og punkter, undgå gentagelser, vær kortfattet men bevar al vigtig information.`,
  summarizer: `Du er ekspert i præcise sammendrag. Læs teksten og lav et kort sammendrag der fanger de vigtigste punkter. ${FORMATTING_INSTRUCTIONS} Brug format: # Sammendrag, **Hovedpunkter:** liste af vigtigste punkter, **Konklusion:** kort afsluttende bemærkning.`,
  "meeting-notes": `Du er ekspert i mødenoter. Strukturer teksten som professionelle mødenoter. ${FORMATTING_INSTRUCTIONS} Brug format: # Mødenotes, ## Deltagere (liste personer), ## Hovedpunkter (vigtige diskussioner med **fed** for nøglepunkter), ## Beslutninger (konkrete beslutninger), ## Handlingspunkter (opgaver med ansvarlig og deadline).`,
  "grammar-checker": `Du er ekspert i grammatik og sproglige formuleringer. Ret grammatiske fejl, stavefejl og forbedre formuleringer. Bevar det oprindelige indhold, betydning og tone. Fokuser på: ret stavefejl og grammatik, forbedre uklare formuleringer, tilføj manglende ord, ret tegnsætning. VIGTIGT: Ændr ikke væsentligt på indholdet - kun sproglige forbedringer.`,
};

// --- Hjælpefunktioner til Lexical State ---

/**
 * Opretter en standard Lexical text node.
 * @param {string} text - Tekstindholdet.
 * @param {number} format - Format-kode (0: normal, 1: fed, 2: kursiv).
 * @returns {object} Lexical text node.
 */
const createLexicalTextNode = (text, format = 0) => ({
  type: "text",
  version: 1,
  style: "",
  mode: "normal",
  detail: 0,
  format,
  text,
});

/**
 * Opretter en standard Lexical node (f.eks. paragraph, heading).
 * @param {string} type - Node-typen ('paragraph', 'heading', etc.).
 * @param {Array<object>} children - Børne-noder.
 * @param {object} [extraProps={}] - Ekstra properties for noden (f.eks. tag for heading).
 * @returns {object} Lexical node.
 */
const createLexicalNode = (type, children, extraProps = {}) => ({
  type,
  version: 1,
  direction: "ltr",
  format: "",
  indent: 0,
  children,
  ...extraProps,
});

/**
 * Tjekker om indhold er i Lexical JSON format.
 * @param {string} content - Indholdet der skal tjekkes.
 * @returns {boolean}
 */
export const isLexicalContent = (content) => {
  if (typeof content !== "string" || !content) return false;
  try {
    const parsed = JSON.parse(content);
    return !!(parsed && typeof parsed === "object" && parsed.root);
  } catch {
    return false;
  }
};

/**
 * Henter ren tekst fra en Lexical state (med cache).
 * @param {string} lexicalState - JSON-string fra Lexical.
 * @returns {string} Den udpakkede rene tekst.
 */
export const extractPlainText = (lexicalState) => {
  if (!lexicalState) return "";
  if (textExtractionCache.has(lexicalState)) {
    return textExtractionCache.get(lexicalState);
  }

  let result = lexicalState; // Fallback til at returnere input, hvis det ikke er Lexical
  if (isLexicalContent(lexicalState)) {
    try {
      const parsed = JSON.parse(lexicalState);
      const extractText = (node) => {
        if (node.type === "text") return node.text || "";
        return node.children?.map(extractText).join("") || "";
      };
      result =
        parsed.root?.children?.map(extractText).join("\n") ?? lexicalState;
    } catch {
      // Ignorer fejl og brug fallback
    }
  }

  textExtractionCache.set(lexicalState, result);
  return result;
};

/**
 * Parser inline formatering (**fed**, *kursiv*) til Lexical text nodes.
 * @param {string} text - Tekstlinje der skal parses.
 * @returns {Array<object>} Et array af Lexical text nodes.
 */
const parseInlineFormatting = (text) => {
  const parts = [];
  let lastIndex = 0;
  // Regex til at finde **fed** eller *kursiv* tekst
  const formatRegex = /(\*\*[^*]+\*\*|\*[^*]+\*)/g;

  text.replace(formatRegex, (match, offset) => {
    // Tilføj tekst før match
    if (offset > lastIndex) {
      parts.push(createLexicalTextNode(text.substring(lastIndex, offset)));
    }

    // Tilføj formateret tekst
    const isBold = match.startsWith("**");
    const content = match.slice(isBold ? 2 : 1, isBold ? -2 : -1);
    parts.push(createLexicalTextNode(content, isBold ? 1 : 2));

    lastIndex = offset + match.length;
  });

  // Tilføj resterende tekst efter sidste match
  if (lastIndex < text.length) {
    parts.push(createLexicalTextNode(text.substring(lastIndex)));
  }

  return parts.length > 0 ? parts : [createLexicalTextNode(text)];
};

/**
 * Konverterer markdown-lignende tekst til en Lexical state.
 * @param {string} text - Teksten fra AI'en.
 * @returns {string} En JSON-string der repræsenterer Lexical state.
 */
export const createLexicalState = (text) => {
  const root = createLexicalNode("root", []);
  if (!text) return JSON.stringify({ root });

  const lines = text.split("\n");
  let i = 0;

  while (i < lines.length) {
    const line = lines[i].trim();

    if (line.startsWith("# ")) {
      const children = parseInlineFormatting(line.substring(2));
      root.children.push(createLexicalNode("heading", children, { tag: "h1" }));
      i++;
    } else if (line.startsWith("## ")) {
      const children = parseInlineFormatting(line.substring(3));
      root.children.push(createLexicalNode("heading", children, { tag: "h2" }));
      i++;
    } else if (line.startsWith("- ")) {
      // **FEJL RETTET**: Gruppér efterfølgende listepunkter korrekt
      const listItems = [];
      while (i < lines.length && lines[i].trim().startsWith("- ")) {
        const itemContent = parseInlineFormatting(lines[i].trim().substring(2));
        listItems.push(
          createLexicalNode("listitem", itemContent, { value: 1 })
        );
        i++;
      }
      root.children.push(
        createLexicalNode("list", listItems, {
          listType: "bullet",
          tag: "ul",
          start: 1,
        })
      );
    } else if (line) {
      const children = parseInlineFormatting(line);
      root.children.push(createLexicalNode("paragraph", children));
      i++;
    } else {
      // Håndter tomme linjer som tomme afsnit for linjeskift
      root.children.push(createLexicalNode("paragraph", []));
      i++;
    }
  }

  return JSON.stringify({ root });
};

// --- AI Service Logik ---

/**
 * Henter AI-instruktion baseret på type (med cache).
 * @param {string} instructionType - Typen af instruktion.
 * @returns {string} Den færdige prompt.
 */
const getInstructionPrompt = (instructionType) => {
  if (instructionCache.has(instructionType)) {
    return instructionCache.get(instructionType);
  }
  // Brug definitionsobjektet med et fallback til 'note-organizer'
  const prompt =
    PROMPT_DEFINITIONS[instructionType] || PROMPT_DEFINITIONS["note-organizer"];
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
      model: selectedModel || "gemini-2.0-flash",
      instructionType: customInstructions || "note-organizer",
    };
  }

  // Legacy fallback til sessionStorage
  return {
    apiKey: sessionStorage.getItem("gemini-api-key") || "",
    model: sessionStorage.getItem("ai-model") || "gemini-2.0-flash",
    instructionType:
      sessionStorage.getItem("ai-instructions") || "note-organizer",
  };
};

/**
 * Processerer tekst med AI og returnerer et formateret resultat.
 * @param {string} content - Indholdet (enten ren tekst eller Lexical JSON).
 * @param {object | null} [userSettings=null] - Brugerens indstillinger.
 * @returns {Promise<string>} En Promise der resolver til en ny Lexical state JSON-string.
 */
export const processTextWithAi = async (content, userSettings = null) => {
  const { apiKey, model, instructionType } = getAiSettings(userSettings);

  if (!apiKey) {
    throw new Error(
      "API nøgle ikke fundet. Konfigurer AI indstillinger først."
    );
  }

  const plainText = extractPlainText(content);
  if (!plainText.trim()) {
    throw new Error("Ingen tekst at processere.");
  }

  try {
    const genAI = new GoogleGenerativeAI(apiKey);
    const instructionPrompt = getInstructionPrompt(instructionType);
    const modelInstance = genAI.getGenerativeModel({
      model,
      safetySettings: SAFETY_SETTINGS,
    });

    const prompt = `${instructionPrompt}\n\nTekst: ${plainText}`;
    const result = await modelInstance.generateContent(prompt);
    const processedText = result.response.text();

    return createLexicalState(processedText);
  } catch (error) {
    console.error("AI Processing Error:", error); // Log den fulde fejl for debugging
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
