import { getModel } from '../lib/gemini';
import { UserProfile, SymptomAnalysisResponse, Medication } from '../types';
import { MEDICATIONS_DATABASE } from '../data/medications';

// Helper to clean JSON from Gemini output
function cleanAndParseJSON(text: string | null | undefined): any {
  if (!text) throw new Error("Réponse de l'IA vide.");
  let cleaned = text.trim();
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
        throw new Error(`Erreur de lecture du format JSON : ${firstErr.message}`);
      }
    }
    throw new Error(`Erreur de lecture du format JSON : ${firstErr.message}`);
  }
}

export const aiService = {
  async analyzeSymptoms(symptoms: string, profile: UserProfile | null): Promise<SymptomAnalysisResponse> {
    const model = getModel("gemini-1.5-flash");

    const patientDesc = profile
      ? `Patient : ${profile.name}, Sexe: ${profile.gender}, Âge: ${profile.age} ans, Poids: ${profile.weight} kg, Taille: ${profile.height} cm.`
      : "Patient adulte type (sans profil spécifique fourni).";

    const prompt = `En tant qu'assistant pharmacien franco-américain de confiance, analyse les symptômes décrits par l'utilisateur et suggère des médicaments appropriés en donnant leur nom en France et leur équivalent direct ou thérapeutique aux États-Unis (USA).
    Sers-toi de cette liste de référence pour suggérer en priorité nos médicaments connus s'ils s'appliquent : ${JSON.stringify(MEDICATIONS_DATABASE.map(m => ({ id: m.id, fr: m.nameFr, us: m.nameUs, active: m.activeIngredientFr, unsafeForPregnancy: m.unsafeForPregnancy })))}.
    Adapte la posologie de manière rigoureuse en fonction du profil du patient : ${patientDesc}. Calcule bien selon le poids si c'est un enfant.

    Symptômes décrits : "${symptoms}"

    Règles absolues :
    1. Si l'état de santé semble préoccupant (gravité "medium" ou "high"), indique-le clairement et conseille d'appeler le 911 (USA) ou le 15 (France).
    2. Ne prescris rien de dangereux, indique s'il faut une ordonnance ("requiresPrescription").
    3. Pour chaque médicament suggéré, indique IMPÉRATIVEMENT si ce médicament est déconseillé ou contre-indiqué chez la femme enceinte (unsafeForPregnancy: true/false) avec un avertissement explicite en français (pregnancyWarningFr).
    4. Rédige le diagnostic général en français (analysis), évalue la sévérité (severity) et suggère des médicaments (suggestedMedications).

    RÉPONDRE UNIQUEMENT AU FORMAT JSON.`;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();
    const parsed = cleanAndParseJSON(text);

    return {
      analysis: parsed?.analysis || parsed?.diagnostic || parsed?.summary || "Analyse complétée.",
      severity: parsed?.severity || 'low',
      suggestedMedications: Array.isArray(parsed?.suggestedMedications) ? parsed.suggestedMedications : []
    };
  },

  async chatWithPharmacist(messages: {role: string, text: string}[], profile: UserProfile | null): Promise<string> {
    const model = getModel("gemini-1.5-flash");

    const patientDesc = profile
      ? `Patient actif : ${profile.name}, ${profile.gender}, ${profile.age} ans, ${profile.weight} kg, ${profile.height} cm.`
      : "Aucun profil patient spécifié (adulte type).";

    const systemPrompt = `Tu es l'Assistant IA Pharmacien Virtuel de "Pharmacie Transatlantique".
    Ta mission est d'aider les utilisateurs franco-américains (expatriés, voyageurs, familles) à comprendre les équivalences de médicaments entre la France 🇫🇷 et les États-Unis 🇺🇸, leurs usages, posologies, et avertissements de santé.
    Contexte : ${patientDesc}
    Règles :
    1. Français clair et professionnel.
    2. Indique la molécule active.
    3. Précise le statut USA (Rx vs OTC).
    4. Rappelle de consulter un médecin en cas de doute.`;

    const chatHistory = messages.map(m => `${m.role === 'user' ? 'Utilisateur' : 'Assistant'}: ${m.text}`).join('\n');
    const prompt = `${systemPrompt}\n\nHistorique :\n${chatHistory}\nAssistant:`;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    return response.text() || "Désolé, je n'ai pas pu répondre.";
  },

  async analyzeMedicineImage(imageBase64: string, profile: UserProfile | null): Promise<any> {
    const model = getModel("gemini-1.5-flash");

    const patientDesc = profile
      ? `Patient : Sexe: ${profile.gender}, Âge: ${profile.age} ans, Poids: ${profile.weight} kg.`
      : "Patient adulte standard.";

    const prompt = `Analyse l'image de cette boîte de médicament. Identifie marque, substance active, origine, usage, équivalences FR/US, et précautions.
    Repère la DATE DE PÉREMPTION. Si non visible, expirationDateFound: false.
    Indique si unsafeForPregnancy: true/false.
    Donne la posologie pour : ${patientDesc}.
    Réponds UNIQUEMENT en JSON avec la structure { detectedMedicine: { ... } }.`;

    const result = await model.generateContent([
      prompt,
      { inlineData: { data: imageBase64.split(',')[1] || imageBase64, mimeType: "image/jpeg" } }
    ]);
    const response = await result.response;
    return cleanAndParseJSON(response.text());
  },

  async translatePrescription(prescriptionText: string, imageBase64: string | null, profile: UserProfile | null): Promise<any> {
    const model = getModel("gemini-1.5-flash");

    const patientDesc = profile
      ? `Patient : ${profile.name}, Âge: ${profile.age} ans, Poids: ${profile.weight} kg.`
      : "Patient adulte type.";

    const prompt = `Traduis et explique cette ordonnance pour un expatrié. Donne les équivalents locaux (US si FR, FR si US).
    Indique Rx/OTC et précautions grossesse.
    Profil : ${patientDesc}.
    Données : ${prescriptionText || "Image fournie"}.
    Réponds UNIQUEMENT en JSON.`;

    const parts: any[] = [prompt];
    if (imageBase64) {
      parts.push({ inlineData: { data: imageBase64.split(',')[1] || imageBase64, mimeType: "image/jpeg" } });
    }

    const result = await model.generateContent(parts);
    const response = await result.response;
    return cleanAndParseJSON(response.text());
  }
};
