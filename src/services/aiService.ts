import { UserProfile, SymptomAnalysisResponse } from '../types';
import { errorService } from './errorService';
import { GoogleGenAI, Type } from '@google/genai';
import { MEDICATIONS_DATABASE } from '../data/medications';

const DEFAULT_FALLBACK_URL = 'https://ais-pre-xm3x2xeexibmmorrzztj6x-485053903653.us-west2.run.app';

const getApiBaseUrl = (): string => {
  if (typeof window !== 'undefined' && window.localStorage) {
    const runtimeUrl = localStorage.getItem('RUNTIME_API_BASE_URL');
    if (runtimeUrl && runtimeUrl.trim() !== '' && runtimeUrl !== 'null' && runtimeUrl !== 'undefined') {
      return runtimeUrl.trim().replace(/\/$/, '');
    }
  }
  const envUrl = ((import.meta as any).env.VITE_API_BASE_URL || '').trim().replace(/\/$/, '');
  if (envUrl) {
    return envUrl;
  }
  if (typeof window !== 'undefined') {
    const isCapacitor = !!(window as any).Capacitor;
    const isMobileWebview = window.location.origin === 'https://localhost' || 
                            window.location.origin === 'capacitor://localhost' || 
                            window.location.protocol === 'file:';
    if (isCapacitor || isMobileWebview) {
      return DEFAULT_FALLBACK_URL;
    }
  }
  return '';
};

const getHeaders = () => {
    const headers: Record<string, string> = { 'Content-Type': 'application/json' };
    const runtimeKey = typeof localStorage !== 'undefined' ? localStorage.getItem('RUNTIME_GEMINI_API_KEY') : null;
    if (runtimeKey && runtimeKey.trim() !== '' && runtimeKey !== 'null' && runtimeKey !== 'undefined') {
        headers['X-Gemini-API-Key'] = runtimeKey.trim();
    }
    return headers;
};

const getClientApiKey = (): string | null => {
  if (typeof localStorage !== 'undefined') {
    const key = localStorage.getItem('RUNTIME_GEMINI_API_KEY');
    if (key && key.trim() !== '' && key !== 'null' && key !== 'undefined') {
      return key.trim();
    }
  }
  const envKey = ((import.meta as any).env?.VITE_GEMINI_API_KEY || '').trim();
  if (envKey) {
    return envKey;
  }
  return null;
};

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
      return JSON.parse(extracted);
    }
    throw firstErr;
  }
}

// Client-side fallback handlers when backend is unreachable (e.g. mobile standalone APK)
const clientSideGemini = {
  async analyzeSymptoms(symptoms: string, profile: UserProfile | null, apiKey: string): Promise<SymptomAnalysisResponse> {
    const ai = new GoogleGenAI({ apiKey });
    const patientDesc = profile 
      ? `Patient : ${profile.name}, Sexe: ${profile.gender}, Âge: ${profile.age} ans, Poids: ${profile.weight} kg, Taille: ${profile.height} cm.`
      : "Patient adulte type.";

    const prompt = `En tant qu'assistant pharmacien franco-américain de confiance, analyse les symptômes décrits par l'utilisateur et suggère des médicaments appropriés en donnant leur nom en France et leur équivalent direct ou thérapeutique aux États-Unis (USA).
    Sers-toi de cette liste de référence pour suggérer en priorité nos médicaments connus s'ils s'appliquent : ${JSON.stringify(MEDICATIONS_DATABASE.map(m => ({ id: m.id, fr: m.nameFr, us: m.nameUs, active: m.activeIngredientFr, unsafeForPregnancy: m.unsafeForPregnancy })))}.
    Adapte la posologie de manière rigoureuse en fonction du profil du patient : ${patientDesc}.
    
    Symptômes décrits : "${symptoms}"
    
    Règles absolues :
    1. Si l'état de santé semble préoccupant (gravité "medium" ou "high"), indique-le clairement et conseille d'appeler le 911 (USA) ou le 15 (France).
    2. Ne prescris rien de dangereux, indique s'il faut une ordonnance ("requiresPrescription").
    3. Pour chaque médicament suggéré, indique IMPÉRATIVEMENT si ce médicament est déconseillé ou contre-indiqué chez la femme enceinte (unsafeForPregnancy: true/false) avec un avertissement explicite en français (pregnancyWarningFr).
    4. Rédige le diagnostic général en français (analysis), évalue la sévérité (severity) et suggère des médicaments (suggestedMedications).`;

    const response = await ai.models.generateContent({
      model: "gemini-3.6-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            analysis: { type: Type.STRING, description: "Detailed advice, diagnostics and safety recommendations written in French." },
            severity: { type: Type.STRING, description: "Severity of symptoms. Must be 'low', 'medium', or 'high'." },
            suggestedMedications: {
              type: Type.ARRAY,
              description: "List of suggested brand or generic medications (FR and US equivalents).",
              items: {
                type: Type.OBJECT,
                properties: {
                  nameFr: { type: Type.STRING },
                  nameUs: { type: Type.STRING },
                  reasonFr: { type: Type.STRING },
                  reasonUs: { type: Type.STRING },
                  dosageForProfileFr: { type: Type.STRING },
                  dosageForProfileUs: { type: Type.STRING },
                  requiresPrescriptionFr: { type: Type.BOOLEAN },
                  requiresPrescriptionUs: { type: Type.BOOLEAN },
                  unsafeForPregnancy: { type: Type.BOOLEAN },
                  pregnancyWarningFr: { type: Type.STRING }
                },
                required: ["nameFr", "nameUs", "reasonFr", "reasonUs", "dosageForProfileFr", "dosageForProfileUs", "requiresPrescriptionFr", "requiresPrescriptionUs", "unsafeForPregnancy", "pregnancyWarningFr"]
              }
            }
          },
          required: ["analysis", "severity", "suggestedMedications"]
        }
      }
    });

    const parsed = cleanAndParseJSON(response.text);
    return {
      analysis: parsed?.analysis || "Analyse médicale complétée.",
      severity: parsed?.severity || 'low',
      suggestedMedications: Array.isArray(parsed?.suggestedMedications) ? parsed.suggestedMedications : []
    };
  },

  async chatWithPharmacist(messages: {role: string, text: string}[], profile: UserProfile | null, apiKey: string): Promise<string> {
    const ai = new GoogleGenAI({ apiKey });
    const patientDesc = profile 
      ? `Patient actif : ${profile.name}, ${profile.gender}, ${profile.age} ans, ${profile.weight} kg, ${profile.height} cm.`
      : "Aucun profil patient spécifié (adulte type).";

    const systemPrompt = `Tu es l'Assistant IA Pharmacien Virtuel de "Pharmacie Transatlantique".
Ta mission est d'aider les utilisateurs franco-américains à comprendre les équivalences de médicaments entre la France 🇫🇷 et les États-Unis 🇺🇸, leurs usages, posologies, et avertissements de santé.
Contexte : ${patientDesc}`;

    const promptText = `${systemPrompt}\n\nHistorique de la conversation :\n` + 
      messages.map((m: any) => `${m.role === 'user' ? 'Utilisateur' : 'Assistant'}: ${m.text}`).join('\n') +
      `\nAssistant:`;

    const response = await ai.models.generateContent({
      model: "gemini-3.6-flash",
      contents: promptText
    });

    return response.text || "Désolé, je n'ai pas pu générer de réponse.";
  },

  async analyzeMedicineImage(imageBase64: string, profile: UserProfile | null, apiKey: string): Promise<any> {
    const ai = new GoogleGenAI({ apiKey });
    const patientDesc = profile 
      ? `Patient : Sexe: ${profile.gender}, Âge: ${profile.age} ans, Poids: ${profile.weight} kg.`
      : "Patient adulte standard.";

    const prompt = `Analyse l'image de cette boîte de médicament. Identifie la marque, la substance active, l'origine, les équivalences franco-américaines, les précautions et la date de péremption si visible. Profil : ${patientDesc}`;

    const response = await ai.models.generateContent({
      model: "gemini-3.6-flash",
      contents: [
        { inlineData: { mimeType: "image/jpeg", data: imageBase64 } },
        { text: prompt }
      ],
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            detectedMedicine: {
              type: Type.OBJECT,
              properties: {
                name: { type: Type.STRING },
                countryOfOrigin: { type: Type.STRING },
                activeIngredient: { type: Type.STRING },
                purposeFr: { type: Type.STRING },
                purposeUs: { type: Type.STRING },
                equivalentFr: { type: Type.STRING },
                equivalentUs: { type: Type.STRING },
                dosageInfoFr: { type: Type.STRING },
                dosageInfoUs: { type: Type.STRING },
                requiresPrescriptionFr: { type: Type.BOOLEAN },
                requiresPrescriptionUs: { type: Type.BOOLEAN },
                precautionsFr: { type: Type.STRING },
                precautionsUs: { type: Type.STRING },
                category: { type: Type.STRING },
                expirationDate: { type: Type.STRING },
                expirationDateFound: { type: Type.BOOLEAN },
                batchNumber: { type: Type.STRING },
                unsafeForPregnancy: { type: Type.BOOLEAN },
                pregnancyWarningFr: { type: Type.STRING }
              },
              required: [
                "name", "countryOfOrigin", "activeIngredient", "purposeFr", "purposeUs", 
                "equivalentFr", "equivalentUs", "dosageInfoFr", "dosageInfoUs", 
                "requiresPrescriptionFr", "requiresPrescriptionUs", "precautionsFr", "precautionsUs", "category",
                "expirationDateFound"
              ]
            }
          },
          required: ["detectedMedicine"]
        }
      }
    });

    return cleanAndParseJSON(response.text);
  },

  async translatePrescription(prescriptionText: string, imageBase64: string | null, profile: UserProfile | null, apiKey: string): Promise<any> {
    const ai = new GoogleGenAI({ apiKey });
    const patientDesc = profile 
      ? `Patient : ${profile.name}, Âge: ${profile.age} ans, Poids: ${profile.weight} kg, Sexe: ${profile.gender}.`
      : "Patient adulte type.";

    const prompt = `Traduis et explique cette ordonnance médicale pour un expatrié franco-américain. Profil : ${patientDesc}. ${prescriptionText ? `Texte: "${prescriptionText}"` : ''}`;

    const contents: any[] = [];
    if (imageBase64) {
      contents.push({ inlineData: { mimeType: "image/jpeg", data: imageBase64 } });
    }
    contents.push({ text: prompt });

    const response = await ai.models.generateContent({
      model: "gemini-3.6-flash",
      contents,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            originalText: { type: Type.STRING },
            translatedInstructions: { type: Type.STRING },
            medicationsFound: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  originalName: { type: Type.STRING },
                  molecule: { type: Type.STRING },
                  usEquivalent: { type: Type.STRING },
                  purpose: { type: Type.STRING },
                  dosage: { type: Type.STRING },
                  isPrescriptionOnlyUS: { type: Type.BOOLEAN },
                  isPrescriptionOnlyFR: { type: Type.BOOLEAN },
                  unsafeForPregnancy: { type: Type.BOOLEAN },
                  pregnancyWarningFr: { type: Type.STRING }
                },
                required: ["originalName", "molecule", "usEquivalent", "purpose", "dosage", "isPrescriptionOnlyUS", "isPrescriptionOnlyFR"]
              }
            },
            generalPrecautions: { type: Type.STRING }
          },
          required: ["originalText", "translatedInstructions", "medicationsFound", "generalPrecautions"]
        }
      }
    });

    return cleanAndParseJSON(response.text);
  },

  async analyzeExpiration(imageBase64: string, apiKey: string): Promise<any> {
    const ai = new GoogleGenAI({ apiKey });
    const prompt = `Extrais la date de péremption (YYYY-MM-DD ou YYYY-MM) et le numéro de lot de ce médicament.`;

    const response = await ai.models.generateContent({
      model: "gemini-3.6-flash",
      contents: [
        { inlineData: { mimeType: "image/jpeg", data: imageBase64 } },
        { text: prompt }
      ],
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            expirationDate: { type: Type.STRING },
            expirationDateFound: { type: Type.BOOLEAN },
            batchNumber: { type: Type.STRING },
            confidenceMessage: { type: Type.STRING }
          },
          required: ["expirationDate", "expirationDateFound", "confidenceMessage"]
        }
      }
    });

    return cleanAndParseJSON(response.text);
  }
};

const handleFetchOrFallback = async <T>(
  fetchFn: () => Promise<T>,
  fallbackFn: (apiKey: string) => Promise<T>,
  actionName: string,
  baseUrl: string
): Promise<T> => {
  try {
    return await fetchFn();
  } catch (err: any) {
    console.warn(`Fetch backend échoué pour ${actionName}, tentative fallback client...`, err);
    const clientKey = getClientApiKey();
    if (clientKey) {
      errorService.log(`Serveur distant injoignable. Basculement en mode IA autonome client (Clé Gemini)...`, 'info');
      try {
        const result = await fallbackFn(clientKey);
        errorService.success(`${actionName} réussi (mode autonome direct)`);
        return result;
      } catch (fallbackErr: any) {
        const msg = fallbackErr?.message || 'Erreur lors de l\'exécution IA autonome.';
        errorService.log(`Erreur IA autonome : ${msg}`, 'error');
        throw new Error(`Erreur IA autonome : ${msg}`);
      }
    } else {
      const msg = `Impossible de contacter le serveur backend Cloud Run (${baseUrl}). Sur mobile, veuillez configurer votre Clé API Gemini dans les Paramètres (icône ⚙️) pour utiliser l'application en mode direct et autonome.`;
      errorService.log(msg, 'error');
      throw new Error(msg);
    }
  }
};

export const aiService = {
  async analyzeSymptoms(symptoms: string, profile: UserProfile | null): Promise<SymptomAnalysisResponse> {
    const baseUrl = getApiBaseUrl();
    const url = `${baseUrl}/api/symptoms/analyze`;
    const headers = getHeaders();
    errorService.action(`Appel API (analyzeSymptoms): ${symptoms.substring(0, 40)}...`);

    return handleFetchOrFallback(
      async () => {
        const response = await fetch(url, {
          method: 'POST',
          headers,
          body: JSON.stringify({ symptoms, profile })
        });
        if (!response.ok) {
          const contentType = response.headers.get("content-type");
          let errorMessage = 'Erreur lors de l\'analyse';
          if (contentType && contentType.indexOf("application/json") !== -1) {
            const error = await response.json();
            errorMessage = error.error || errorMessage;
          } else {
            const errorText = await response.text();
            errorMessage = `Erreur serveur (${response.status}): ${errorText.substring(0, 50)}...`;
          }
          throw new Error(errorMessage);
        }
        const data = await response.json();
        errorService.success('Analyse des symptômes réussie');
        return data;
      },
      (apiKey) => clientSideGemini.analyzeSymptoms(symptoms, profile, apiKey),
      'Analyse des symptômes',
      baseUrl
    );
  },

  async chatWithPharmacist(messages: {role: string, text: string}[], profile: UserProfile | null): Promise<string> {
    const baseUrl = getApiBaseUrl();
    const url = `${baseUrl}/api/chat`;
    const headers = getHeaders();
    const lastMsg = messages[messages.length - 1]?.text || '';
    errorService.action(`Assistant IA - Envoi message: "${lastMsg.substring(0, 40)}..."`);

    return handleFetchOrFallback(
      async () => {
        const response = await fetch(url, {
          method: 'POST',
          headers,
          body: JSON.stringify({ messages, profile })
        });
        if (!response.ok) {
          const contentType = response.headers.get("content-type");
          let errorMessage = 'Erreur assistant IA';
          if (contentType && contentType.indexOf("application/json") !== -1) {
            const error = await response.json();
            errorMessage = error.error || errorMessage;
          } else {
            const errorText = await response.text();
            errorMessage = `Erreur serveur (${response.status}): ${errorText.substring(0, 50)}...`;
          }
          throw new Error(errorMessage);
        }
        const data = await response.json();
        errorService.success('Réponse reçue de l\'assistant IA');
        return data.reply;
      },
      (apiKey) => clientSideGemini.chatWithPharmacist(messages, profile, apiKey),
      'Assistant IA Chat',
      baseUrl
    );
  },

  async analyzeMedicineImage(imageBase64: string, profile: UserProfile | null): Promise<any> {
    errorService.action('Appel API (analyzeMedicineImage) - Analyse photo/boîte de médicament');
    const baseUrl = getApiBaseUrl();
    const url = `${baseUrl}/api/image/analyze`;

    return handleFetchOrFallback(
      async () => {
        const response = await fetch(url, {
          method: 'POST',
          headers: getHeaders(),
          body: JSON.stringify({ imageBase64, profile })
        });
        if (!response.ok) {
          const contentType = response.headers.get("content-type");
          let errorMessage = 'Erreur analyse image';
          if (contentType && contentType.indexOf("application/json") !== -1) {
            const error = await response.json();
            errorMessage = error.error || errorMessage;
          } else {
            const errorText = await response.text();
            errorMessage = `Erreur serveur (${response.status}): ${errorText.substring(0, 50)}...`;
          }
          throw new Error(errorMessage);
        }
        const data = await response.json();
        errorService.success('Analyse de la boîte de médicament réussie');
        return data;
      },
      (apiKey) => clientSideGemini.analyzeMedicineImage(imageBase64, profile, apiKey),
      'Analyse d\'image de médicament',
      baseUrl
    );
  },

  async translatePrescription(prescriptionText: string, imageBase64: string | null, profile: UserProfile | null): Promise<any> {
    errorService.action('Appel API (translatePrescription) - Traduction / Analyse d\'ordonnance');
    const baseUrl = getApiBaseUrl();
    const url = `${baseUrl}/api/prescription/translate`;

    return handleFetchOrFallback(
      async () => {
        const response = await fetch(url, {
          method: 'POST',
          headers: getHeaders(),
          body: JSON.stringify({ prescriptionText, imageBase64, profile })
        });
        if (!response.ok) {
          const contentType = response.headers.get("content-type");
          let errorMessage = 'Erreur traduction';
          if (contentType && contentType.indexOf("application/json") !== -1) {
            const error = await response.json();
            errorMessage = error.error || errorMessage;
          } else {
            const errorText = await response.text();
            errorMessage = `Erreur serveur (${response.status}): ${errorText.substring(0, 50)}...`;
          }
          throw new Error(errorMessage);
        }
        const data = await response.json();
        errorService.success('Traduction / Analyse d\'ordonnance réussie');
        return data;
      },
      (apiKey) => clientSideGemini.translatePrescription(prescriptionText, imageBase64, profile, apiKey),
      'Traduction d\'ordonnance',
      baseUrl
    );
  },

  async analyzeExpiration(imageBase64: string): Promise<any> {
    errorService.action('Appel API (analyzeExpiration) - Lecture de date de péremption');
    const baseUrl = getApiBaseUrl();
    const url = `${baseUrl}/api/image/analyze-expiration`;

    return handleFetchOrFallback(
      async () => {
        const response = await fetch(url, {
          method: 'POST',
          headers: getHeaders(),
          body: JSON.stringify({ imageBase64 })
        });
        if (!response.ok) {
          const contentType = response.headers.get("content-type");
          let errorMessage = 'Erreur lecture date';
          if (contentType && contentType.indexOf("application/json") !== -1) {
            const error = await response.json();
            errorMessage = error.error || errorMessage;
          } else {
            const errorText = await response.text();
            errorMessage = `Erreur serveur (${response.status}): ${errorText.substring(0, 50)}...`;
          }
          throw new Error(errorMessage);
        }
        const data = await response.json();
        errorService.success('Lecture de la date de péremption réussie');
        return data;
      },
      (apiKey) => clientSideGemini.analyzeExpiration(imageBase64, apiKey),
      'Lecture date de péremption',
      baseUrl
    );
  }
};
