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
const FORMATTING_INSTRUCTIONS = `Formatering: BEVAR AL EKSISTERENDE FORMATERING og brug: **omkring tekst** for fed skrift, *omkring tekst* for kursiv, ~~omkring tekst~~ for gennemstreget, start linjer med - for punktopstilling, # for store overskrifter, ## for mindre overskrifter. Brug KUN ét linjeskift mellem afsnit - undgå for mange tomme linjer. Hvis originalteksten har formatering, SKAL du bevare den og forbedre den. Returner kun den færdige note.`;

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
 * Konverterer Lexical state til markdown format så AI kan se og bevare formatering.
 * @param {string} lexicalState - JSON-string fra Lexical.
 * @returns {string} Markdown formateret tekst.
 */
export const convertLexicalToMarkdown = (lexicalState) => {
  if (!lexicalState) return "";
  
  if (!isLexicalContent(lexicalState)) {
    // Hvis det ikke er Lexical, returner teksten som den er
    return lexicalState;
  }

  try {
    const parsed = JSON.parse(lexicalState);
    
    const convertNode = (node, context = {}) => {
      if (node.type === "text") {
        let text = node.text || "";
        
        // Anvend formatering baseret på format flags
        if (node.format & 1) text = `**${text}**`; // Bold
        if (node.format & 2) text = `*${text}*`; // Italic  
        if (node.format & 4) text = `~~${text}~~`; // Strikethrough
        if (node.format & 8) text = `<u>${text}</u>`; // Underline
        
        return text;
      }
      
      const children = node.children?.map(child => convertNode(child, { parent: node })).join("") || "";
      
      switch (node.type) {
        case "paragraph":
          return children ? `${children}\n` : "\n";
        case "heading":
          const level = node.tag === "h1" ? "#" : "##";
          return `${level} ${children}\n`;
        case "list":
          // Pass list type til children og tilføj linjeskift efter liste
          const listContent = node.children?.map((child, index) => 
            convertNode(child, { parent: node, listIndex: index + 1 })
          ).join("") || "";
          return listContent + (listContent ? "\n" : "");
        case "listitem":
          // Brug parent information til at bestemme prefix
          const isNumbered = context.parent?.listType === "number";
          const prefix = isNumbered ? `${context.listIndex || 1}. ` : "- ";
          return `${prefix}${children}\n`;
        default:
          return children;
      }
    };
    
    return parsed.root?.children?.map(convertNode).join("") || "";
  } catch {
    // Fallback til plain text hvis parsing fejler
    return extractPlainText(lexicalState);
  }
};

/**
 * Parser inline formatering (**fed**, *kursiv*, ~~strikethrough~~, `code`) til Lexical text nodes.
 * @param {string} text - Tekstlinje der skal parses.
 * @returns {Array<object>} Et array af Lexical text nodes.
 */
const parseInlineFormatting = (text) => {
  const parts = [];
  let lastIndex = 0;
  
  // Regex til at finde forskellige formatering typer
  const formatRegex = /(\*\*[^*]+\*\*|\*[^*]+\*|~~[^~]+~~|<u>[^<]+<\/u>)/g;

  text.replace(formatRegex, (match, offset) => {
    // Tilføj tekst før match
    if (offset > lastIndex) {
      parts.push(createLexicalTextNode(text.substring(lastIndex, offset)));
    }

    // Tilføj formateret tekst baseret på type
    let content, format;
    
    if (match.startsWith("**")) {
      content = match.slice(2, -2);
      format = 1; // Bold
    } else if (match.startsWith("*")) {
      content = match.slice(1, -1);
      format = 2; // Italic
    } else if (match.startsWith("~~")) {
      content = match.slice(2, -2);
      format = 4; // Strikethrough
    } else if (match.startsWith("<u>")) {
      content = match.slice(3, -4);
      format = 8; // Underline
    } else {
      content = match;
      format = 0;
    }
    
    parts.push(createLexicalTextNode(content, format));
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

  // Normaliser tekst: fjern excessive whitespace og linjeskift
  const normalizedText = text
    .replace(/\n\s*\n\s*\n+/g, '\n\n') // Maksimalt 2 consecutive newlines
    .replace(/[ \t]+/g, ' ') // Multiple spaces til single space
    .trim();

  const lines = normalizedText.split("\n");
  let i = 0;
  let consecutiveEmptyLines = 0;

  while (i < lines.length) {
    const line = lines[i].trim();

    // Skip for mange consecutive empty lines
    if (!line) {
      consecutiveEmptyLines++;
      if (consecutiveEmptyLines > 1) {
        i++;
        continue; // Skip denne tomme linje
      }
      // Tilføj kun én tom linje som paragraph break
      root.children.push(createLexicalNode("paragraph", [
        createLexicalTextNode("")
      ]));
      i++;
      continue;
    }

    // Reset empty line counter når vi finder content
    consecutiveEmptyLines = 0;

    if (line.startsWith("# ")) {
      const children = parseInlineFormatting(line.substring(2));
      root.children.push(createLexicalNode("heading", children, { tag: "h1" }));
      i++;
    } else if (line.startsWith("## ")) {
      const children = parseInlineFormatting(line.substring(3));
      root.children.push(createLexicalNode("heading", children, { tag: "h2" }));
      i++;
    } else if (line.startsWith("- ")) {
      // Bullet list
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
    } else if (/^\d+\.\s/.test(line)) {
      // Numbered list (1. 2. 3. etc.)
      const listItems = [];
      while (i < lines.length && /^\d+\.\s/.test(lines[i].trim())) {
        const itemContent = parseInlineFormatting(lines[i].trim().replace(/^\d+\.\s/, ""));
        listItems.push(
          createLexicalNode("listitem", itemContent, { value: 1 })
        );
        i++;
      }
      root.children.push(
        createLexicalNode("list", listItems, {
          listType: "number",
          tag: "ol",
          start: 1,
        })
      );
    } else if (line) {
      const children = parseInlineFormatting(line);
      root.children.push(createLexicalNode("paragraph", children));
      i++;
    } else {
      i++;
    }
  }

  // Hvis ingen content blev tilføjet, tilføj et tomt paragraph
  if (root.children.length === 0) {
    root.children.push(createLexicalNode("paragraph", [
      createLexicalTextNode("")
    ]));
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

  // Brug markdown konvertering så AI kan se original formatering
  const markdownText = convertLexicalToMarkdown(content);
  if (!markdownText.trim()) {
    throw new Error("Ingen tekst at processere.");
  }

  try {
    const genAI = new GoogleGenerativeAI(apiKey);
    const instructionPrompt = getInstructionPrompt(instructionType);
    const modelInstance = genAI.getGenerativeModel({
      model,
      safetySettings: SAFETY_SETTINGS,
    });

    // Forbedret prompt der fremhæver at originale formatering skal bevares
    const prompt = `${instructionPrompt}

KRITISKE FORMATERINGS REGLER:
- Input teksten nedenfor kan allerede have formatering (fed tekst, kursiv, lister, overskrifter)
- Du SKAL bevare og respektere al eksisterende formatering
- Forbedre kun formateringen hvor det giver mening
- Hvis teksten har **fed tekst** så bevar det som **fed tekst**
- Hvis teksten har lister med - så bevar dem som lister
- Tilføj ny formatering kun hvor det forbedrer læsbarheden

ABSOLUT KRITISK - OUTPUT FORMAT:
- Brug KUN markdown formatering: **bold**, *italic*, ~~strikethrough~~, # overskrift, ## underoverskrift, - liste
- Brug ALDRIG HTML tags som <ul>, </ul>, <li>, </li>, <strong>, </strong> etc.
- Returner KUN ren tekst med markdown formatering
- Brug IKKE for mange linjeskift eller tomme linjer. Maksimalt ét tomt linjeskift mellem afsnit.

Input tekst:
${markdownText}`;

    const result = await modelInstance.generateContent(prompt);
    let processedText = result.response.text();

    // Post-processing: Rens HTML tags og konverter til markdown
    processedText = processedText
      // Konverter HTML bold til markdown
      .replace(/<\/?strong>/g, '**')
      .replace(/<\/?b>/g, '**')
      // Konverter HTML italic til markdown
      .replace(/<\/?em>/g, '*')
      .replace(/<\/?i>/g, '*')
      // Konverter HTML underline til markdown
      .replace(/<u>/g, '<u>').replace(/<\/u>/g, '</u>')
      // Fjern HTML liste tags
      .replace(/<\/?ul>/g, '')
      .replace(/<\/?ol>/g, '')
      .replace(/<li>/g, '- ')
      .replace(/<\/li>/g, '')
      // Konverter HTML headings til markdown
      .replace(/<h1>/g, '# ').replace(/<\/h1>/g, '')
      .replace(/<h2>/g, '## ').replace(/<\/h2>/g, '')
      // Fjern andre HTML tags
      .replace(/<[^>]*>/g, '')
      // Normaliser whitespace igen efter HTML cleanup
      .replace(/\n\s*\n\s*\n+/g, '\n\n')
      .replace(/[ \t]+/g, ' ')
      .trim();

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
