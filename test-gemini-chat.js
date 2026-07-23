import { GoogleGenAI } from "@google/genai";
import dotenv from "dotenv";
dotenv.config();

async function test() {
  const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
  const systemPrompt = `Tu es l'Assistant IA Pharmacien Virtuel.`;
  const promptText = `${systemPrompt}\n\nHistorique:\nUtilisateur: hello\nAssistant:`;
  try {
    const response = await ai.models.generateContent({
      model: "gemini-3.6-flash",
      contents: promptText,
    });
    console.log("RESPONSE:", response);
    console.log("RESPONSE TEXT:", response.text);
    const reply = response.text || "Fallback";
    console.log("JSON STRINGIFY:", JSON.stringify({ reply }));
  } catch (err) {
    console.error("ERROR:", err);
  }
}
test();
