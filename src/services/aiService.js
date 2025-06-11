// services/aiService.js
import { GoogleGenerativeAI } from "@google/generative-ai";

// Cache for instruction prompts to avoid regeneration
const instructionCache = new Map();

// Cache for text extraction to avoid repeated parsing
const textExtractionCache = new Map();

/**
 * AI Service for processing text with Google Generative AI
 * Handles safety settings, instruction prompts, and text conversion
 */

// Safety settings - allow all content
const SAFETY_SETTINGS = [
  {
    category: "HARM_CATEGORY_HARASSMENT",
    threshold: "BLOCK_NONE",
  },
  {
    category: "HARM_CATEGORY_HATE_SPEECH",
    threshold: "BLOCK_NONE",
  },
  {
    category: "HARM_CATEGORY_SEXUALLY_EXPLICIT",
    threshold: "BLOCK_NONE",
  },
  {
    category: "HARM_CATEGORY_DANGEROUS_CONTENT",
    threshold: "BLOCK_NONE",
  },
];

// Optimized formatting instructions
const FORMATTING_INSTRUCTIONS = `Formatering: Brug **omkring tekst** for fed skrift, *omkring tekst* for kursiv, start linjer med - for punktopstilling, # for store overskrifter, ## for mindre overskrifter. Lav linjeskift mellem afsnit. Returner kun den færdige note.`;

/**
 * Get AI instruction prompt based on selected instruction type (cached)
 */
const getInstructionPrompt = (instructionType) => {
  // Return cached prompt if available
  if (instructionCache.has(instructionType)) {
    return instructionCache.get(instructionType);
  }
  
  let prompt;
  if (instructionType === "note-organizer") {
    prompt = `Du er ekspert i at skabe klare, strukturerede noter. Omdann den rå tekst til en professionel note. ${FORMATTING_INSTRUCTIONS} Fokuser på: Opsummer vigtigste punkter med **fed tekst**, omformuler uklare sætninger til præcise udsagn, organiser logisk med overskrifter og punkter, undgå gentagelser, vær kortfattet men bevar al vigtig information.`;
  } else if (instructionType === "summarizer") {
    prompt = `Du er ekspert i præcise sammendrag. Læs teksten og lav et kort sammendrag der fanger de vigtigste punkter. ${FORMATTING_INSTRUCTIONS} Brug format: # Sammendrag, **Hovedpunkter:** liste af vigtigste punkter, **Konklusion:** kort afsluttende bemærkning.`;
  } else if (instructionType === "meeting-notes") {
    prompt = `Du er ekspert i mødenoter. Strukturer teksten som professionelle mødenoter. ${FORMATTING_INSTRUCTIONS} Brug format: # Mødenotes, ## Deltagere (liste personer), ## Hovedpunkter (vigtige diskussioner med **fed** for nøglepunkter), ## Beslutninger (konkrete beslutninger), ## Handlingspunkter (opgaver med ansvarlig og deadline).`;
  } else if (instructionType === "grammar-checker") {
    prompt = `Du er ekspert i grammatik og sproglige formuleringer. Ret grammatiske fejl, stavefejl og forbedre formuleringer. Bevar det oprindelige indhold, betydning og tone. Fokuser på: ret stavefejl og grammatik, forbedre uklare formuleringer, tilføj manglende ord, ret tegnsætning. VIGTIGT: Ændr ikke væsentligt på indholdet - kun sproglige forbedringer.`;
  } else {
    // Default fallback
    prompt = `Du er ekspert i at skabe klare, strukturerede noter. Omdann den rå tekst til en professionel og letlæselig note. ${FORMATTING_INSTRUCTIONS}`;
  }
  
  // Cache the prompt for future use
  instructionCache.set(instructionType, prompt);
  return prompt;
};

/**
 * Check if content is in Lexical JSON format
 */
export const isLexicalContent = (content) => {
  if (!content || typeof content !== "string") return false;
  try {
    const parsed = JSON.parse(content);
    return parsed && typeof parsed === "object" && parsed.root;
  } catch {
    return false;
  }
};

/**
 * Extract plain text from Lexical state (with caching)
 */
export const extractPlainText = (lexicalState) => {
  if (!lexicalState) return "";
  
  // Check cache first
  if (textExtractionCache.has(lexicalState)) {
    return textExtractionCache.get(lexicalState);
  }

  let result;
  try {
    if (isLexicalContent(lexicalState)) {
      const parsed = JSON.parse(lexicalState);
      const extractText = (node) => {
        if (node.type === "text") {
          return node.text || "";
        }
        if (node.children && Array.isArray(node.children)) {
          return node.children.map(extractText).join("");
        }
        return "";
      };

      if (parsed.root && parsed.root.children) {
        result = parsed.root.children
          .map((child) => extractText(child))
          .join("\n");
      } else {
        result = lexicalState;
      }
    } else {
      result = lexicalState; // If not Lexical format, assume plain text
    }
  } catch {
    result = lexicalState || "";
  }
  
  // Cache the result
  textExtractionCache.set(lexicalState, result);
  return result;
};

/**
 * Parse inline formatting (bold, italic) for Lexical conversion
 */
const parseInlineFormatting = (text) => {
  const parts = [];
  let currentIndex = 0;

  // Simple regex to find **bold** and *italic* text
  const formatRegex = /(\*\*[^*]+\*\*|\*[^*]+\*)/g;
  let match;

  while ((match = formatRegex.exec(text)) !== null) {
    // Add text before the match
    if (match.index > currentIndex) {
      const beforeText = text.substring(currentIndex, match.index);
      if (beforeText) {
        parts.push({
          detail: 0,
          format: 0,
          mode: "normal",
          style: "",
          text: beforeText,
          type: "text",
          version: 1,
        });
      }
    }

    // Add the formatted text
    const matchedText = match[0];
    if (matchedText.startsWith("**") && matchedText.endsWith("**")) {
      // Bold text
      parts.push({
        detail: 0,
        format: 1, // Bold format
        mode: "normal",
        style: "",
        text: matchedText.slice(2, -2),
        type: "text",
        version: 1,
      });
    } else if (matchedText.startsWith("*") && matchedText.endsWith("*")) {
      // Italic text
      parts.push({
        detail: 0,
        format: 2, // Italic format
        mode: "normal",
        style: "",
        text: matchedText.slice(1, -1),
        type: "text",
        version: 1,
      });
    }

    currentIndex = match.index + match[0].length;
  }

  // Add remaining text
  if (currentIndex < text.length) {
    const remainingText = text.substring(currentIndex);
    if (remainingText) {
      parts.push({
        detail: 0,
        format: 0,
        mode: "normal",
        style: "",
        text: remainingText,
        type: "text",
        version: 1,
      });
    }
  }

  // Return appropriate format
  if (parts.length === 0) {
    return {
      detail: 0,
      format: 0,
      mode: "normal",
      style: "",
      text: text,
      type: "text",
      version: 1,
    };
  }

  return parts;
};

/**
 * Convert markdown-like text to Lexical state
 */
export const createLexicalState = (text) => {
  if (!text)
    return JSON.stringify({
      root: {
        children: [],
        direction: "ltr",
        format: "",
        indent: 0,
        type: "root",
        version: 1,
      },
    });

  const lines = text.split("\n");
  const children = [];

  lines.forEach((line) => {
    const trimmedLine = line.trim();

    // Skip empty lines (add empty paragraph)
    if (!trimmedLine) {
      children.push({
        children: [],
        direction: "ltr",
        format: "",
        indent: 0,
        type: "paragraph",
        version: 1,
      });
      return;
    }

    // Parse headings
    if (trimmedLine.startsWith("# ")) {
      children.push({
        children: [
          {
            detail: 0,
            format: 0,
            mode: "normal",
            style: "",
            text: trimmedLine.substring(2),
            type: "text",
            version: 1,
          },
        ],
        direction: "ltr",
        format: "",
        indent: 0,
        type: "heading",
        tag: "h1",
        version: 1,
      });
      return;
    }

    if (trimmedLine.startsWith("## ")) {
      children.push({
        children: [
          {
            detail: 0,
            format: 0,
            mode: "normal",
            style: "",
            text: trimmedLine.substring(3),
            type: "text",
            version: 1,
          },
        ],
        direction: "ltr",
        format: "",
        indent: 0,
        type: "heading",
        tag: "h2",
        version: 1,
      });
      return;
    }

    // Parse bullet points
    if (trimmedLine.startsWith("- ")) {
      const inlineContent = parseInlineFormatting(trimmedLine.substring(2));
      children.push({
        children: [
          {
            children: Array.isArray(inlineContent)
              ? inlineContent
              : [inlineContent],
            direction: "ltr",
            format: "",
            indent: 0,
            type: "listitem",
            value: 1,
            version: 1,
          },
        ],
        direction: "ltr",
        format: "",
        indent: 0,
        type: "list",
        listType: "bullet",
        start: 1,
        tag: "ul",
        version: 1,
      });
      return;
    }

    // Regular paragraph with inline formatting
    const inlineContent = parseInlineFormatting(trimmedLine);
    children.push({
      children: Array.isArray(inlineContent) ? inlineContent : [inlineContent],
      direction: "ltr",
      format: "",
      indent: 0,
      type: "paragraph",
      version: 1,
    });
  });

  return JSON.stringify({
    root: {
      children,
      direction: "ltr",
      format: "",
      indent: 0,
      type: "root",
      version: 1,
    },
  });
};

/**
 * Get AI settings from userSettings or fallback to sessionStorage (for legacy)
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

  // Legacy fallback to sessionStorage
  return {
    apiKey: sessionStorage.getItem("gemini-api-key") || "",
    model: sessionStorage.getItem("ai-model") || "gemini-2.0-flash",
    instructionType:
      sessionStorage.getItem("ai-instructions") || "note-organizer",
  };
};

/**
 * Process text with AI and return formatted result (optimized)
 */
export const processTextWithAi = async (content, userSettings = null) => {
  const { apiKey, model, instructionType } = getAiSettings(userSettings);

  if (!apiKey) {
    throw new Error(
      "API nøgle ikke fundet. Konfigurer AI indstillinger først."
    );
  }

  // Extract plain text from current content (cached)
  const plainText = extractPlainText(content);

  if (!plainText.trim()) {
    throw new Error("Ingen tekst at processere.");
  }

  try {
    const genAI = new GoogleGenerativeAI(apiKey);
    const instructionPrompt = getInstructionPrompt(instructionType);

    // Compact prompt format for faster processing
    const prompt = `${instructionPrompt}\n\nTekst: ${plainText}`;

    const response = await genAI
      .getGenerativeModel({
        model,
        safetySettings: SAFETY_SETTINGS,
      })
      .generateContent(prompt);

    const processedText = response.response.text();

    // Convert processed text back to Lexical format
    return createLexicalState(processedText);
  } catch (error) {
    let errorMessage = "AI processing fejlede: ";

    if (error.message.includes("API_KEY_INVALID")) {
      errorMessage += "Din API nøgle er ugyldig.";
    } else if (error.message.includes("PERMISSION_DENIED")) {
      errorMessage += "Adgang nægtet. Check din API nøgle og betalingsplan.";
    } else if (error.message.includes("QUOTA_EXCEEDED")) {
      errorMessage += "API kvote overskredet.";
    } else {
      errorMessage += error.message;
    }

    throw new Error(errorMessage);
  }
};
