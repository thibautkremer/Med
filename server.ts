import express from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI, Type } from '@google/genai';
import dotenv from 'dotenv';
import { MEDICATIONS_DATABASE } from './src/data/medications';

dotenv.config();

// Lazy initialize Gemini AI client to prevent startup crashes if GEMINI_API_KEY is missing
let aiClient: GoogleGenAI | null = null;
function getGeminiClient(): GoogleGenAI {
  if (!aiClient) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      console.warn("WARNING: GEMINI_API_KEY is missing in environment variables. AI features will fallback to local mocks or fail.");
    }
    aiClient = new GoogleGenAI({
      apiKey: apiKey || "MOCK_KEY",
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        }
      }
    });
  }
  return aiClient;
}

const app = express();
const PORT = 3000;

// Increase payload limits for base64 photo transfer
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ limit: '10mb', extended: true }));

// Serve the static database of medications
app.get('/api/medications', (req, res) => {
  res.json(MEDICATIONS_DATABASE);
});

// API endpoint for symptom checker
app.post('/api/symptoms/analyze', async (req, res) => {
  try {
    const { symptoms, profile } = req.body;
    
    if (!symptoms) {
      return res.status(400).json({ error: "Symptômes requis." });
    }

    const patientDesc = profile 
      ? `Patient : ${profile.name}, Sexe: ${profile.gender}, Âge: ${profile.age} ans, Poids: ${profile.weight} kg, Taille: ${profile.height} cm.`
      : "Patient adulte type (sans profil spécifique fourni).";

    const prompt = `En tant qu'assistant pharmacien franco-américain de confiance, analyse les symptômes décrits par l'utilisateur et suggère des médicaments appropriés en donnant leur nom en France et leur équivalent direct ou thérapeutique aux États-Unis (USA).
    Sers-toi de cette liste de référence pour suggérer en priorité nos médicaments connus s'ils s'appliquent : ${JSON.stringify(MEDICATIONS_DATABASE.map(m => ({ id: m.id, fr: m.nameFr, us: m.nameUs, active: m.activeIngredientFr })))}.
    Adapte la posologie de manière rigoureuse en fonction du profil du patient : ${patientDesc}. Calcule bien selon le poids si c'est un enfant.
    
    Symptômes décrits : "${symptoms}"
    
    Règles absolues :
    1. Si l'état de santé semble préoccupant (gravité "medium" ou "high"), indique-le clairement et conseille d'appeler le 911 (USA) ou le 15 (France).
    2. Ne prescris rien de dangereux, indique s'il faut une ordonnance ("requiresPrescription").
    3. Rédige le diagnostic général ("analysis") en français.`;

    const ai = getGeminiClient();
    
    // Fallback if key is missing
    if (process.env.GEMINI_API_KEY === undefined || process.env.GEMINI_API_KEY === "MY_GEMINI_API_KEY") {
      console.log("Using Mock Symptom Response because API Key is not set");
      return res.json({
        analysis: `[MODE DÉMO] Analyse factice pour vos symptômes : "${symptoms}". Veuillez configurer la clé API Gemini pour de vrais diagnostics IA. Pour ${profile?.name || 'vous'}, nous conseillons du repos et une bonne hydratation.`,
        severity: 'low',
        suggestedMedications: [
          {
            nameFr: "Doliprane (Paracétamol)",
            nameUs: "Tylenol (Acetaminophen)",
            reasonFr: "Suggéré pour soulager d'éventuels maux légers ou fièvre.",
            reasonUs: "Suggested to reduce mild fever or aches.",
            dosageForProfileFr: profile ? `${profile.weight * 15} mg toutes les 6h, soit environ ${profile.age < 12 ? 'un dosage enfant adapté' : '1 comprimé de 500mg ou 1000mg'}` : "1000 mg toutes les 6 heures.",
            dosageForProfileUs: profile ? `${profile.weight * 15} mg every 6 hours.` : "1000 mg every 6 hours.",
            requiresPrescriptionFr: false,
            requiresPrescriptionUs: false
          }
        ]
      });
    }

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
                  nameFr: { type: Type.STRING, description: "French brand or generic name." },
                  nameUs: { type: Type.STRING, description: "US brand or generic equivalent name." },
                  reasonFr: { type: Type.STRING, description: "Why this medicine is suggested (in French)." },
                  reasonUs: { type: Type.STRING, description: "Why this medicine is suggested (in English)." },
                  dosageForProfileFr: { type: Type.STRING, description: "Custom dosage instructions in French adjusted for this specific patient (age/weight)." },
                  dosageForProfileUs: { type: Type.STRING, description: "Custom dosage instructions in English adjusted for this specific patient (age/weight)." },
                  requiresPrescriptionFr: { type: Type.BOOLEAN, description: "Whether this medicine requires a prescription in France." },
                  requiresPrescriptionUs: { type: Type.BOOLEAN, description: "Whether this medicine requires a prescription in the US." }
                },
                required: ["nameFr", "nameUs", "reasonFr", "reasonUs", "dosageForProfileFr", "dosageForProfileUs", "requiresPrescriptionFr", "requiresPrescriptionUs"]
              }
            }
          },
          required: ["analysis", "severity", "suggestedMedications"]
        }
      }
    });

    const resultText = response.text;
    if (!resultText) {
      throw new Error("No response text from Gemini");
    }
    
    res.json(JSON.parse(resultText));
  } catch (error: any) {
    console.error("Symptom Analysis Error:", error);
    res.status(500).json({ error: "Erreur lors de l'analyse des symptômes: " + error.message });
  }
});

// API endpoint for image analysis (photo scan of medicine box)
app.post('/api/image/analyze', async (req, res) => {
  try {
    const { imageBase64, mimeType, profile } = req.body;

    if (!imageBase64) {
      return res.status(400).json({ error: "Image requise sous forme base64." });
    }

    const patientDesc = profile 
      ? `Patient : Sexe: ${profile.gender}, Âge: ${profile.age} ans, Poids: ${profile.weight} kg.`
      : "Patient adulte standard.";

    const prompt = `Analyse l'image de cette boîte de médicament fournie. Identifie précisément la marque, la substance active, l'origine, l'usage, les équivalences franco-américaines (si c'est français, donne l'équivalent américain et inversement), et les précautions importantes.
    S'il te plaît, donne des instructions de posologie adaptées à ce profil de patient : ${patientDesc}.
    Rédige les explications françaises avec précision.`;

    const imagePart = {
      inlineData: {
        mimeType: mimeType || "image/jpeg",
        data: imageBase64
      }
    };

    const textPart = {
      text: prompt
    };

    const ai = getGeminiClient();

    // Fallback if key is missing or is mock
    if (process.env.GEMINI_API_KEY === undefined || process.env.GEMINI_API_KEY === "MY_GEMINI_API_KEY") {
      console.log("Using Mock Image Response because API Key is not set");
      // Simulate detection of a random popular medicine or fallback
      return res.json({
        detectedMedicine: {
          name: "Doliprane 1000mg (Boîte Simulée)",
          countryOfOrigin: "FR",
          activeIngredient: "Paracétamol (Acetaminophen)",
          purposeFr: "Traitement symptomatique des douleurs légères à modérées et de la fièvre.",
          purposeUs: "Temporary relief of minor aches, pains, and fever reduction.",
          equivalentFr: "Doliprane / Efferalgan / Dafalgan",
          equivalentUs: "Tylenol / FeverAll",
          dosageInfoFr: profile 
            ? `Pour ${profile.name} (${profile.age} ans, ${profile.weight} kg) : Posologie recommandée de ${profile.weight * 15} mg par prise toutes les 6 heures.`
            : "1 comprimé de 1000 mg toutes les 6 heures, maximum 4 comprimés par 24 heures.",
          dosageInfoUs: profile
            ? `For ${profile.name} (${profile.age} y/o, ${profile.weight} kg): Recommended dose is ${profile.weight * 15} mg every 6 hours.`
            : "1 tablet of 1000 mg every 6 hours, maximum 4000 mg daily.",
          requiresPrescriptionFr: false,
          requiresPrescriptionUs: false,
          precautionsFr: "Attention au surdosage mortel pour le foie. Ne pas prendre d'autres médicaments contenant du paracétamol.",
          precautionsUs: "Severe liver damage may occur if you take more than 4,000 mg of acetaminophen in 24 hours.",
          category: "pain"
        }
      });
    }

    const response = await ai.models.generateContent({
      model: "gemini-3.6-flash",
      contents: [imagePart, textPart],
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            detectedMedicine: {
              type: Type.OBJECT,
              properties: {
                name: { type: Type.STRING, description: "The name of the detected medicine." },
                countryOfOrigin: { type: Type.STRING, description: "Country of marketing: 'FR', 'US', or 'Unknown'." },
                activeIngredient: { type: Type.STRING, description: "Active ingredient name (API), e.g., 'Ibuprofène' or 'Acetaminophen'." },
                purposeFr: { type: Type.STRING, description: "Indications/purpose in French." },
                purposeUs: { type: Type.STRING, description: "Indications/purpose in English." },
                equivalentFr: { type: Type.STRING, description: "Equivalent brand/generic in France (if scanned a US medicine, or repeat name if French)." },
                equivalentUs: { type: Type.STRING, description: "Equivalent brand/generic in the US (if scanned a FR medicine, or repeat name if US)." },
                dosageInfoFr: { type: Type.STRING, description: "Custom dosing guide in French adjusted for the provided patient's age and weight." },
                dosageInfoUs: { type: Type.STRING, description: "Custom dosing guide in English adjusted for the provided patient's age and weight." },
                requiresPrescriptionFr: { type: Type.BOOLEAN, description: "Whether prescription is required in France." },
                requiresPrescriptionUs: { type: Type.BOOLEAN, description: "Whether prescription is required in the USA." },
                precautionsFr: { type: Type.STRING, description: "Main side effects and warnings in French." },
                precautionsUs: { type: Type.STRING, description: "Main side effects and warnings in English." },
                category: { type: Type.STRING, description: "Suggested category: 'pain', 'cold', 'stomach', 'allergy', 'skin', 'other'." }
              },
              required: [
                "name", "countryOfOrigin", "activeIngredient", "purposeFr", "purposeUs", 
                "equivalentFr", "equivalentUs", "dosageInfoFr", "dosageInfoUs", 
                "requiresPrescriptionFr", "requiresPrescriptionUs", "precautionsFr", "precautionsUs", "category"
              ]
            }
          },
          required: ["detectedMedicine"]
        }
      }
    });

    const resultText = response.text;
    if (!resultText) {
      throw new Error("No response text from Gemini");
    }

    res.json(JSON.parse(resultText));
  } catch (error: any) {
    console.error("Image Analysis Error:", error);
    res.status(500).json({ error: "Erreur lors de l'analyse de l'image de médicament: " + error.message });
  }
});

// API endpoint for translating written/photo medical prescriptions
app.post('/api/prescription/translate', async (req, res) => {
  try {
    const { prescriptionText, imageBase64, mimeType, profile } = req.body;

    const patientDesc = profile 
      ? `Patient : ${profile.name}, Âge: ${profile.age} ans, Poids: ${profile.weight} kg, Sexe: ${profile.gender}.`
      : "Patient adulte type.";

    const prompt = `En tant qu'assistant de liaison médicale franco-américaine, traduis et explique cette ordonnance médicale pour un expatrié ou un voyageur.
    Identifie chaque médicament mentionné, donne son principe actif, sa fonction principale, la traduction des posologies, et surtout les équivalents locaux correspondants (USA si l'ordonnance est française, France si l'ordonnance est américaine).
    Indique clairement si les équivalents américains nécessitent une ordonnance ("Prescription required" / Rx) ou sont en vente libre (OTC - Over-the-counter).
    Prends en compte le profil patient suivant : ${patientDesc}.
    
    Données de l'ordonnance : ${prescriptionText ? `Texte saisi : "${prescriptionText}"` : "Une image d'ordonnance a été transmise."}`;

    const ai = getGeminiClient();

    // Fallback if key is missing or is mock
    if (process.env.GEMINI_API_KEY === undefined || process.env.GEMINI_API_KEY === "MY_GEMINI_API_KEY") {
      console.log("Using Mock Prescription Response because API Key is not set");
      return res.json({
        originalText: prescriptionText || "Ordonnance manuscrite ou numérisée (Image)",
        translatedInstructions: "Traduction générale : Prendre les comprimés indiqués pendant les repas. En cas d'effets secondaires, stopper immédiatement.",
        medicationsFound: [
          {
            originalName: "Doliprane 1g",
            molecule: "Paracétamol",
            usEquivalent: "Tylenol Extra Strength (Acetaminophen 500mg) - En vente libre (OTC)",
            purpose: "Anti-douleur et fièvre (Analgésique / Antipyretic)",
            dosage: "1 comprimé toutes les 6 heures si maux de tête. Maximum 4g par jour.",
            isPrescriptionOnlyUS: false,
            isPrescriptionOnlyFR: false
          },
          {
            originalName: "Spasfon 80mg",
            molecule: "Phloroglucinol",
            usEquivalent: "Bentyl (Dicyclomine) - Uniquement sur ordonnance aux USA (Rx) • Alternative OTC possible : Pepto-Bismol ou Imodium selon le type exact de maux.",
            purpose: "Antispasmodique pour douleurs abdominales / contractions",
            dosage: "2 comprimés lors de la crise, à renouveler si maux persistants.",
            isPrescriptionOnlyUS: true,
            isPrescriptionOnlyFR: false
          }
        ],
        generalPrecautions: "Ne dépassez jamais les doses prescrites. Attention aux interactions médicamenteuses si vous combinez ces boîtes avec des remèdes américains."
      });
    }

    const contents: any[] = [];
    if (imageBase64) {
      contents.push({
        inlineData: {
          mimeType: mimeType || "image/jpeg",
          data: imageBase64
        }
      });
    }
    contents.push({ text: prompt });

    const response = await ai.models.generateContent({
      model: "gemini-3.6-flash",
      contents: contents,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            originalText: { type: Type.STRING, description: "Raw or extracted prescription text." },
            translatedInstructions: { type: Type.STRING, description: "Overall French translation/explanation of the prescription steps." },
            medicationsFound: {
              type: Type.ARRAY,
              description: "List of individual medicines detected in the prescription.",
              items: {
                type: Type.OBJECT,
                properties: {
                  originalName: { type: Type.STRING, description: "Brand name or generic name written on prescription." },
                  molecule: { type: Type.STRING, description: "Active substance molecule." },
                  usEquivalent: { type: Type.STRING, description: "Direct equivalent in USA/France with description (including brand names and whether OTC/Rx)." },
                  purpose: { type: Type.STRING, description: "What the medicine cures or targets." },
                  dosage: { type: Type.STRING, description: "Translated dosage instructions adjusted for the patient profile." },
                  isPrescriptionOnlyUS: { type: Type.BOOLEAN, description: "Is this prescription-only (Rx) in the US?" },
                  isPrescriptionOnlyFR: { type: Type.BOOLEAN, description: "Is this prescription-only in France?" }
                },
                required: ["originalName", "molecule", "usEquivalent", "purpose", "dosage", "isPrescriptionOnlyUS", "isPrescriptionOnlyFR"]
              }
            },
            generalPrecautions: { type: Type.STRING, description: "Critical interactions, cautions, or general safety tips." }
          },
          required: ["originalText", "translatedInstructions", "medicationsFound", "generalPrecautions"]
        }
      }
    });

    const resultText = response.text;
    if (!resultText) {
      throw new Error("No response text from Gemini");
    }

    res.json(JSON.parse(resultText));
  } catch (error: any) {
    console.error("Prescription Translation Error:", error);
    res.status(500).json({ error: "Erreur lors de la traduction de l'ordonnance: " + error.message });
  }
});

// Setup Vite Development Server or Serve Compiled Static Assets
async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
    console.log("Vite development middleware integrated.");
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
    console.log("Serving static production files from /dist.");
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
