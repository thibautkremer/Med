import { UserProfile, SymptomAnalysisResponse } from '../types';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'https://ais-pre-xm3x2xeexibmmorrzztj6x-485053903653.us-west2.run.app';

export const aiService = {
  async analyzeSymptoms(symptoms: string, profile: UserProfile | null): Promise<SymptomAnalysisResponse> {
    const response = await fetch(`${API_BASE_URL}/api/symptoms/analyze`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ symptoms, profile })
    });
    if (!response.ok) {
        const contentType = response.headers.get("content-type");
        if (contentType && contentType.indexOf("application/json") !== -1) {
            const error = await response.json();
            throw new Error(error.error || 'Erreur lors de l\'analyse');
        } else {
            const errorText = await response.text();
            throw new Error(`Erreur serveur (${response.status}): ${errorText.substring(0, 50)}...`);
        }
    }
    return response.json();
  },

  async chatWithPharmacist(messages: {role: string, text: string}[], profile: UserProfile | null): Promise<string> {
    const response = await fetch(`${API_BASE_URL}/api/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ messages, profile })
    });
    if (!response.ok) {
        const contentType = response.headers.get("content-type");
        if (contentType && contentType.indexOf("application/json") !== -1) {
            const error = await response.json();
            throw new Error(error.error || 'Erreur assistant IA');
        } else {
            const errorText = await response.text();
            throw new Error(`Erreur serveur (${response.status}): ${errorText.substring(0, 50)}...`);
        }
    }
    const data = await response.json();
    return data.reply;
  },

  async analyzeMedicineImage(imageBase64: string, profile: UserProfile | null): Promise<any> {
    const response = await fetch(`${API_BASE_URL}/api/image/analyze`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ imageBase64, profile })
    });
    if (!response.ok) {
        const contentType = response.headers.get("content-type");
        if (contentType && contentType.indexOf("application/json") !== -1) {
            const error = await response.json();
            throw new Error(error.error || 'Erreur analyse image');
        } else {
            const errorText = await response.text();
            throw new Error(`Erreur serveur (${response.status}): ${errorText.substring(0, 50)}...`);
        }
    }
    return response.json();
  },

  async translatePrescription(prescriptionText: string, imageBase64: string | null, profile: UserProfile | null): Promise<any> {
    const response = await fetch(`${API_BASE_URL}/api/prescription/translate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ prescriptionText, imageBase64, profile })
    });
    if (!response.ok) {
        const contentType = response.headers.get("content-type");
        if (contentType && contentType.indexOf("application/json") !== -1) {
            const error = await response.json();
            throw new Error(error.error || 'Erreur traduction');
        } else {
            const errorText = await response.text();
            throw new Error(`Erreur serveur (${response.status}): ${errorText.substring(0, 50)}...`);
        }
    }
    return response.json();
  },

  async analyzeExpiration(imageBase64: string): Promise<any> {
    const response = await fetch(`${API_BASE_URL}/api/image/analyze-expiration`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ imageBase64 })
    });
    if (!response.ok) {
        const contentType = response.headers.get("content-type");
        if (contentType && contentType.indexOf("application/json") !== -1) {
            const error = await response.json();
            throw new Error(error.error || 'Erreur lecture date');
        } else {
            const errorText = await response.text();
            throw new Error(`Erreur serveur (${response.status}): ${errorText.substring(0, 50)}...`);
        }
    }
    return response.json();
  }
};
