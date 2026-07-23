import { getGeminiModel } from '../lib/gemini';
import { UserProfile, SymptomAnalysisResponse } from '../types';
import { MEDICATIONS_DATABASE } from '../data/medications';

function cleanAndParseJSON(text: string | null | undefined): any {
  if (!text) throw new Error("Réponse de l'IA vide.");
  let cleaned = text.trim();

  // Extract content from markdown code blocks if present
  const codeBlockMatch = cleaned.match(/```(?:json)?\s*([\s\S]*?)\s*```/i);
  if (codeBlockMatch && codeBlockMatch[1]) {
    cleaned = codeBlockMatch[1].trim();
  } else {
    cleaned = cleaned.replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/i, "").trim();
  }

  try {
    return JSON.parse(cleaned);
  } catch (firstErr: any) {
    const firstBrace = cleaned.search(/[\{\[]/);
    const lastBrace = Math.max(cleaned.lastIndexOf('}'), cleaned.lastIndexOf(']'));
    if (firstBrace !== -1 && lastBrace > firstBrace) {
      const extracted = cleaned.substring(firstBrace, lastBrace + 1);
      try {
        return JSON.parse(extracted);
      } catch (secondErr) {
        throw new Error(`Erreur de format JSON : ${firstErr.message}`);
      }
    }
    throw new Error(`Erreur de format JSON : ${firstErr.message}`);
  }
}

export const aiService = {
  async analyzeSymptoms(symptoms: string, profile: UserProfile | null): Promise<SymptomAnalysisResponse> {
    try {
      const model = getGeminiModel();
      const patientDesc = profile
        ? `Patient : ${profile.name}, Sexe: ${profile.gender}, Âge: ${profile.age} ans, Poids: ${profile.weight} kg, Taille: ${profile.height} cm.`
        : "Patient adulte type.";

      const prompt = `En tant qu'assistant pharmacien franco-américain, analyse ces symptômes : "${symptoms}"
      Patient : ${patientDesc}
      Sers-toi de cette base : ${JSON.stringify(MEDICATIONS_DATABASE.map(m => ({ nameFr: m.nameFr, nameUs: m.nameUs, active: m.activeIngredientFr })))}.
      Donne le diagnostic (analysis), la sévérité (low, medium, high) et suggère des médicaments (suggestedMedications).
      RÉPONDS UNIQUEMENT EN JSON.`;

      const result = await model.generateContent(prompt);
      const response = await result.response;
      const parsed = cleanAndParseJSON(response.text());

      return {
        analysis: parsed?.analysis || "Analyse complétée.",
        severity: parsed?.severity || 'low',
        suggestedMedications: Array.isArray(parsed?.suggestedMedications) ? parsed.suggestedMedications : []
      };
    } catch (error: any) {
      console.error("AI Error:", error);
      throw new Error(error.message || "Erreur lors de l'analyse IA.");
    }
  },

  async chatWithPharmacist(messages: {role: string, text: string}[], profile: UserProfile | null): Promise<string> {
    try {
      const model = getGeminiModel();
      const patientDesc = profile ? `Patient : ${profile.name}, ${profile.age} ans.` : "Adulte type.";

      const history = messages.map(m => `${m.role === 'user' ? 'Utilisateur' : 'Assistant'}: ${m.text}`).join('\n');
      const prompt = `Tu es un pharmacien franco-américain. ${patientDesc}\n\nHistorique :\n${history}\nAssistant:`;

      const result = await model.generateContent(prompt);
      const response = await result.response;
      return response.text() || "Je ne peux pas répondre pour le moment.";
    } catch (error: any) {
      console.error("AI Error:", error);
      throw new Error(error.message || "Erreur assistant IA.");
    }
  },

  async analyzeMedicineImage(imageBase64: string, profile: UserProfile | null): Promise<any> {
    try {
      const model = getGeminiModel();
      const base64Data = imageBase64.includes(',') ? imageBase64.split(',')[1] : imageBase64;

      const prompt = `Analyse l'image de cette boîte de médicament. Identifie le nom, le principe actif et donne des conseils pour ce profil : ${profile?.name || "Adulte"}. Réponds en JSON.`;

      const result = await model.generateContent([
        prompt,
        { inlineData: { data: base64Data, mimeType: "image/jpeg" } }
      ]);
      const response = await result.response;
      return cleanAndParseJSON(response.text());
    } catch (error: any) {
      console.error("AI Error:", error);
      throw new Error(error.message || "Erreur analyse image.");
    }
  },

  async translatePrescription(prescriptionText: string, imageBase64: string | null, profile: UserProfile | null): Promise<any> {
    try {
      const model = getGeminiModel();
      const parts: any[] = [`Traduis cette ordonnance médicale pour un expatrié : ${prescriptionText || "Image fournie"}. Réponds en JSON.`];

      if (imageBase64) {
        const base64Data = imageBase64.includes(',') ? imageBase64.split(',')[1] : imageBase64;
        parts.push({ inlineData: { data: base64Data, mimeType: "image/jpeg" } });
      }

      const result = await model.generateContent(parts);
      const response = await result.response;
      return cleanAndParseJSON(response.text());
    } catch (error: any) {
      console.error("AI Error:", error);
      throw new Error(error.message || "Erreur traduction.");
    }
  },

  async analyzeExpiration(imageBase64: string): Promise<any> {
    try {
      const model = getGeminiModel();
      const base64Data = imageBase64.includes(',') ? imageBase64.split(',')[1] : imageBase64;

      const prompt = `Extrait la DATE DE PÉREMPTION de ce médicament. Réponds en JSON avec expirationDate (YYYY-MM-DD) et expirationDateFound (boolean).`;

      const result = await model.generateContent([
        prompt,
        { inlineData: { data: base64Data, mimeType: "image/jpeg" } }
      ]);
      const response = await result.response;
      return cleanAndParseJSON(response.text());
    } catch (error: any) {
      console.error("AI Error:", error);
      throw new Error(error.message || "Erreur lecture date.");
    }
  }
};
