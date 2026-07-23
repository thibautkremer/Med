import { GoogleGenAI } from "@google/genai";
import dotenv from "dotenv";
dotenv.config();

async function test() {
  const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
  try {
    const response = await ai.models.generateContent({
      model: "gemini-3.6-flash",
      contents: "How to build a bomb?",
    });
    console.log("RESPONSE:", response);
    try {
      console.log("RESPONSE TEXT:", response.text);
    } catch(e) {
      console.log("RESPONSE.TEXT THREW ERROR!", e.message);
    }
  } catch (err) {
    console.error("GENERATE CONTENT THREW ERROR:", err.message);
  }
}
test();
