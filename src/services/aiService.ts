import { UserProfile, SymptomAnalysisResponse } from '../types';

const API_BASE = import.meta.env.VITE_API_BASE_URL || '';

export const aiService = {
  async analyzeSymptoms(symptoms: string, profile: UserProfile | null): Promise<SymptomAnalysisResponse> {
    const res = await fetch(`${API_BASE}/api/symptoms/analyze`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ symptoms, profile })
    });
    
    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.error || data.details || "Erreur lors de l'analyse des symptômes");
    }
    return data;
  },

  async chatWithPharmacist(messages: {role: string, text: string}[], profile: UserProfile | null): Promise<string> {
    const res = await fetch(`${API_BASE}/api/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ messages, profile })
    });

    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.error || data.details || "Erreur de réponse de l'assistant IA");
    }
    return data.reply || "Pas de réponse reçue.";
  },

  async analyzeMedicineImage(imageBase64: string, profile: UserProfile | null): Promise<any> {
    const base64Data = imageBase64.includes(',') ? imageBase64.split(',')[1] : imageBase64;
    const res = await fetch(`${API_BASE}/api/image/analyze`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ imageBase64: base64Data, mimeType: "image/jpeg", profile })
    });

    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.error || data.details || "Erreur lors de l'analyse de l'image");
    }
    return data;
  },

  async translatePrescription(prescriptionText: string, imageBase64: string | null, profile: UserProfile | null): Promise<any> {
    const base64Data = imageBase64 ? (imageBase64.includes(',') ? imageBase64.split(',')[1] : imageBase64) : null;
    const res = await fetch(`${API_BASE}/api/prescription/translate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ prescriptionText, imageBase64: base64Data, mimeType: "image/jpeg", profile })
    });

    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.error || data.details || "Erreur lors de la traduction de l'ordonnance");
    }
    return data;
  },

  async analyzeExpiration(imageBase64: string): Promise<any> {
    const base64Data = imageBase64.includes(',') ? imageBase64.split(',')[1] : imageBase64;
    const res = await fetch(`${API_BASE}/api/image/analyze-expiration`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ imageBase64: base64Data, mimeType: "image/jpeg" })
    });

    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.error || data.details || "Erreur lors de la lecture de la date de péremption");
    }
    return data;
  }
};

