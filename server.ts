import express from 'express';
import path from 'path';
import fs from 'fs';
import cors from 'cors';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI, Type } from '@google/genai';
import dotenv from 'dotenv';
import { MEDICATIONS_DATABASE } from './src/data/medications';

dotenv.config();

// Lazy initialize Gemini AI client to prevent startup crashes if GEMINI_API_KEY is missing
let aiClient: GoogleGenAI | null = null;
function getGeminiClient(runtimeKey?: string): GoogleGenAI {
  if (runtimeKey) {
    return new GoogleGenAI({
      apiKey: runtimeKey,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        }
      }
    });
  }
  if (!aiClient) {
    const apiKey = process.env.GEMINI_API_KEY;
    aiClient = new GoogleGenAI({
      apiKey: apiKey || "MISSING_KEY",
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        }
      }
    });
  }
  return aiClient;
}

const getReqApiKey = (req: express.Request): string | null => {
    console.log('DEBUG: Headers received:', req.headers);
    const key = req.header('X-Gemini-API-Key') || process.env.GEMINI_API_KEY || null;
    console.log('DEBUG: Key from header or env:', key ? '***' : 'null');
    if (key && key.trim() !== '' && key !== 'null' && key !== 'undefined') {
        return key.trim();
    }
    return null;
};

const app = express();
app.use(cors({
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Gemini-API-Key']
}));
const PORT = 3000;

// Increase payload limits for base64 photo transfer
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ limit: '10mb', extended: true }));

// Serve the static database of medications
app.get('/api/medications', (req, res) => {
  res.json(MEDICATIONS_DATABASE);
});

// Endpoint to download the latest compiled Android APK
app.get('/api/download-apk', (req, res) => {
  const apkPath = path.join(process.cwd(), 'app-debug.apk');
  if (fs.existsSync(apkPath)) {
    res.setHeader('Content-Type', 'application/vnd.android.package-archive');
    res.download(apkPath, 'PharmacieTransatlantique-debug.apk');
  } else {
    res.status(404).send("L'APK n'a pas encore été récupéré de GitHub. Veuillez réessayer dans quelques instants.");
  }
});

// Helper function to safely parse JSON returned by Gemini API (handling possible markdown backticks)
function cleanAndParseJSON(text: string | null | undefined): any {
  if (!text) {
    throw new Error("Réponse de l'IA vide.");
  }
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
    // Fallback: locate first '{' or '[' and last '}' or ']'
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

// API endpoint for symptom checker
app.post('/api/symptoms/analyze', async (req, res) => {
  res.setHeader('Content-Type', 'application/json');
  try {
    const { symptoms, profile } = req.body;
    
    if (!symptoms) {
      return res.status(400).json({ error: "Symptômes requis." });
    }

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
    4. Rédige le diagnostic général en français (analysis), évalue la sévérité (severity) et suggère des médicaments (suggestedMedications).`;

    const runtimeKey = getReqApiKey(req) || undefined;
    const ai = getGeminiClient(runtimeKey);
    
    // Check if key is present and not the placeholder
    const apiKey = runtimeKey;
    if (!apiKey || apiKey === "MY_GEMINI_API_KEY" || apiKey === "MISSING_KEY") {
      return res.status(403).json({ 
        error: "Clé API Gemini manquante ou non configurée.", 
        details: "Veuillez configurer votre clé API Gemini dans les paramètres Secrets de l'AI Studio pour activer l'analyse IA réelle." 
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
                  requiresPrescriptionUs: { type: Type.BOOLEAN, description: "Whether this medicine requires a prescription in the US." },
                  unsafeForPregnancy: { type: Type.BOOLEAN, description: "True if contraindicated or discouraged during pregnancy." },
                  pregnancyWarningFr: { type: Type.STRING, description: "Specific warning regarding pregnancy in French." }
                },
                required: ["nameFr", "nameUs", "reasonFr", "reasonUs", "dosageForProfileFr", "dosageForProfileUs", "requiresPrescriptionFr", "requiresPrescriptionUs", "unsafeForPregnancy", "pregnancyWarningFr"]
              }
            }
          },
          required: ["analysis", "severity", "suggestedMedications"]
        }
      }
    });

    let resultText = response.text;
    if (typeof resultText !== 'string' || resultText.trim() === '') {
      resultText = '{"analysis": "Désolé, je n\'ai pas pu analyser ces symptômes pour le moment. Veuillez réessayer.", "severity": "low", "suggestedMedications": []}';
    }
    const parsed = cleanAndParseJSON(resultText);
    const normalized = {
      analysis: parsed?.analysis || parsed?.diagnostic || parsed?.summary || parsed?.advice || (typeof parsed === 'string' ? parsed : "Analyse médicale complétée."),
      severity: parsed?.severity || 'low',
      suggestedMedications: Array.isArray(parsed?.suggestedMedications) ? parsed.suggestedMedications : (Array.isArray(parsed?.medications) ? parsed.medications : [])
    };
    return res.json(normalized);
  } catch (error: any) {
    console.error("Symptom Analysis Error:", error);
    return res.status(500).json({ error: error.message || "Erreur lors de l'analyse des symptômes" });
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
    Aussi, examine attentivement l'image pour repérer la DATE DE PÉREMPTION (expiration date / EXP / Valide jusqu'au) et le numéro de lot s'ils sont lisibles sur la boîte, le rabat ou le blister.
    Format de date attendu si trouvée : AAAA-MM-JJ ou AAAA-MM (ex: 2027-12-31 ou 2028-06). Si la date de péremption n'est pas clairement visible sur cette image, fixe expirationDateFound à false.
    Indique clairement si ce médicament est déconseillé ou contre-indiqué chez la femme enceinte (unsafeForPregnancy: true/false) avec un avertissement explicite en français (pregnancyWarningFr).
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

    const runtimeKey = getReqApiKey(req) || undefined;
    const ai = getGeminiClient(runtimeKey);

    const apiKey = runtimeKey;
    if (!apiKey || apiKey === "MY_GEMINI_API_KEY" || apiKey === "MISSING_KEY") {
      return res.status(403).json({ 
        error: "Clé API Gemini manquante.", 
        details: "Veuillez ajouter votre clé API Gemini dans AI Studio (Settings > Secrets) pour activer le scanner de médicaments." 
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
                category: { type: Type.STRING, description: "Suggested category: 'pain', 'cold', 'stomach', 'allergy', 'skin', 'other'." },
                expirationDate: { type: Type.STRING, description: "Detected expiration date (YYYY-MM-DD or YYYY-MM) if readable, else empty string." },
                expirationDateFound: { type: Type.BOOLEAN, description: "True if expiration date was clearly read on the image." },
                batchNumber: { type: Type.STRING, description: "Batch / Lot number if readable." },
                unsafeForPregnancy: { type: Type.BOOLEAN, description: "True if contraindicated or discouraged during pregnancy." },
                pregnancyWarningFr: { type: Type.STRING, description: "Specific warning regarding pregnancy in French." }
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

    const resultText = response.text;
    res.json(cleanAndParseJSON(resultText));
  } catch (error: any) {
    console.error("Image Analysis Error:", error);
    res.status(500).json({ error: error.message || "Erreur lors de l'analyse de l'image de médicament" });
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
    Pour chaque médicament, indique aussi s'il est déconseillé/contre-indiqué chez la femme enceinte (unsafeForPregnancy: true/false) avec une mise en garde en français (pregnancyWarningFr).
    Prends en compte le profil patient suivant : ${patientDesc}.
    
    Données de l'ordonnance : ${prescriptionText ? `Texte saisi : "${prescriptionText}"` : "Une image d'ordonnance a été transmise."}`;

    const runtimeKey = getReqApiKey(req) || undefined;
    const ai = getGeminiClient(runtimeKey);

    const apiKey = runtimeKey;
    if (!apiKey || apiKey === "MY_GEMINI_API_KEY" || apiKey === "MISSING_KEY") {
      return res.status(403).json({ 
        error: "Clé API Gemini manquante.", 
        details: "L'IA a besoin d'une clé API valide pour analyser les ordonnances." 
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
                  isPrescriptionOnlyFR: { type: Type.BOOLEAN, description: "Is this prescription-only in France?" },
                  unsafeForPregnancy: { type: Type.BOOLEAN, description: "True if contraindicated or discouraged during pregnancy." },
                  pregnancyWarningFr: { type: Type.STRING, description: "Pregnancy warning in French." }
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
    res.json(cleanAndParseJSON(resultText));
  } catch (error: any) {
    console.error("Prescription Translation Error:", error);
    res.status(500).json({ error: "Erreur lors de la traduction de l'ordonnance: " + error.message });
  }
});

// API endpoint specifically for scanning a close-up photo of an expiration date
app.post('/api/image/analyze-expiration', async (req, res) => {
  try {
    const { imageBase64, mimeType } = req.body;

    if (!imageBase64) {
      return res.status(400).json({ error: "Image requise." });
    }

    const prompt = `Cette image est un gros plan ou une photo du verso/côté d'un médicament ou d'une boîte.
    Analyse l'image pour extraire LA DATE DE PÉREMPTION (Expiry date, EXP, MM/YY, YYYY-MM, etc.) et le numéro de lot (Batch / Lot #).
    Renvoie la date au format YYYY-MM-DD ou YYYY-MM (ex: 2027-12-31 ou 2028-06). Si tu ne trouves pas la date, fixe expirationDateFound à false.`;

    const runtimeKey = getReqApiKey(req) || undefined;
    const ai = getGeminiClient(runtimeKey);

    const apiKey = runtimeKey;
    if (!apiKey || apiKey === "MY_GEMINI_API_KEY" || apiKey === "MISSING_KEY") {
      return res.status(403).json({ 
        error: "Clé API Gemini manquante.", 
        details: "La lecture de date par IA nécessite une clé API valide." 
      });
    }

    const response = await ai.models.generateContent({
      model: "gemini-3.6-flash",
      contents: [
        { inlineData: { mimeType: mimeType || "image/jpeg", data: imageBase64 } },
        { text: prompt }
      ],
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            expirationDate: { type: Type.STRING, description: "Extracted expiration date YYYY-MM-DD or YYYY-MM" },
            expirationDateFound: { type: Type.BOOLEAN, description: "True if expiration date was clearly detected" },
            batchNumber: { type: Type.STRING, description: "Batch or Lot number if present" },
            confidenceMessage: { type: Type.STRING, description: "Explanation in French of what was read on the image" }
          },
          required: ["expirationDate", "expirationDateFound", "confidenceMessage"]
        }
      }
    });

    const resultText = response.text;
    res.json(cleanAndParseJSON(resultText));
  } catch (error: any) {
    console.error("Expiration Scan Error:", error);
    res.status(500).json({ error: "Erreur lors du scan de la date de péremption: " + error.message });
  }
});

// API endpoint for interactive AI Chat Assistant
app.post('/api/chat', async (req, res) => {
  res.setHeader('Content-Type', 'application/json');
  try {
    const { messages, profile } = req.body;

    if (!messages || !Array.isArray(messages)) {
      return res.status(400).json({ error: "Messages requis." });
    }

    const patientDesc = profile 
      ? `Patient actif : ${profile.name}, ${profile.gender}, ${profile.age} ans, ${profile.weight} kg, ${profile.height} cm.`
      : "Aucun profil patient spécifié (adulte type).";

    const systemPrompt = `Tu es l'Assistant IA Pharmacien Virtuel de "Pharmacie Transatlantique".
Ta mission est d'aider les utilisateurs franco-américains (expatriés, voyageurs, familles) à comprendre les équivalences de médicaments entre la France 🇫🇷 et les États-Unis 🇺🇸, leurs usages, posologies, et avertissements de santé.

Contexte : ${patientDesc}

Règles de réponse :
1. Rédige en français clair, bienveillant, structuré et professionnel.
2. Indique toujours la molécule active (ex: Paracétamol = Acetaminophen, Ibuprofène = Ibuprofen).
3. Précise le statut légal aux USA : Rx (Sur ordonnance) vs OTC (Over-The-Counter / Vente libre).
4. Adapte les conseils au profil du patient si pertinent.
5. Rappelle de toujours consulter un médecin ou pharmacien en cas de symptôme grave ou doute.`;

    const runtimeKey = getReqApiKey(req) || undefined;
    const ai = getGeminiClient(runtimeKey);

    const apiKey = runtimeKey;
    if (!apiKey || apiKey === "MY_GEMINI_API_KEY" || apiKey === "MISSING_KEY") {
      return res.status(403).json({ 
        error: "Clé API Gemini manquante.", 
        details: "L'assistant IA interactif nécessite une clé API configurée dans AI Studio." 
      });
    }

    const promptText = `${systemPrompt}\n\nHistorique de la conversation :\n` + 
      messages.map((m: any) => `${m.role === 'user' ? 'Utilisateur' : 'Assistant'}: ${m.text}`).join('\n') +
      `\nAssistant:`;

    const response = await ai.models.generateContent({
      model: "gemini-3.6-flash",
      contents: promptText,
    });

    const text = response.text;
    const reply = (typeof text === 'string' && text.trim() !== '') ? text : "Désolé, je n'ai pas pu générer de réponse. Veuillez reformuler votre question.";
    return res.json({ reply });
  } catch (error: any) {
    console.error("AI Chat Error:", error);
    return res.status(500).json({ error: "Erreur de réponse de l'assistant IA: " + (error.message || "Erreur inconnue") });
  }
});

// Explicit 404 handler for unmatched /api routes so they return JSON, never HTML
app.use('/api/*', (req, res) => {
  res.status(404).json({ error: `Route API introuvable: ${req.originalUrl}` });
});

// Global Express error handling middleware to catch express JSON body parsing errors & internal errors
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error("Express Global Error Handler:", err);
  if (res.headersSent) {
    return next(err);
  }
  res.status(err.status || 500).json({ 
    error: err.message || "Erreur interne du serveur" 
  });
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
