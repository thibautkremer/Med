import { GoogleGenAI } from "@google/genai";
import dotenv from "dotenv";
dotenv.config();

async function test() {
  const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
  const response = await ai.models.generateContent({
    model: "gemini-3.6-flash",
    contents: "Say hi"
  });
  console.log("typeof response.text is:", typeof response.text);
  console.log("JSON.stringify({ reply: response.text }) is:", JSON.stringify({ reply: response.text }));
  console.log("response.text value:", response.text);
}
test();
