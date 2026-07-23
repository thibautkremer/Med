import { GoogleGenAI } from '@google/genai';

let genAIInstance: GoogleGenAI | null = null;

export const getGeminiClient = () => {
  if (genAIInstance) return genAIInstance;

  const apiKey = import.meta.env.VITE_GEMINI_API_KEY;

  if (!apiKey || apiKey === "VOTRE_CLE_API_ICI") {
    throw new Error("Clé API Gemini manquante. Veuillez configurer VITE_GEMINI_API_KEY dans votre fichier .env.");
  }

  genAIInstance = new GoogleGenAI(apiKey);
  return genAIInstance;
};

export const getGeminiModel = (modelName: string = "gemini-1.5-flash") => {
  const client = getGeminiClient();
  return client.getGenerativeModel({ model: modelName });
};
