import { UserProfile, SymptomAnalysisResponse } from '../types';

export const aiService = {
  async analyzeSymptoms(symptoms: string, profile: UserProfile | null): Promise<SymptomAnalysisResponse> {
    const response = await fetch('/api/symptoms/analyze', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ symptoms, profile })
    });
    if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Erreur lors de l\'analyse');
    }
    return response.json();
  },

  async chatWithPharmacist(messages: {role: string, text: string}[], profile: UserProfile | null): Promise<string> {
    const response = await fetch('/api/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ messages, profile })
    });
    if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Erreur assistant IA');
    }
    const data = await response.json();
    return data.reply;
  },

  async analyzeMedicineImage(imageBase64: string, profile: UserProfile | null): Promise<any> {
    const response = await fetch('/api/image/analyze', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ imageBase64, profile })
    });
    if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Erreur analyse image');
    }
    return response.json();
  },

  async translatePrescription(prescriptionText: string, imageBase64: string | null, profile: UserProfile | null): Promise<any> {
    const response = await fetch('/api/prescription/translate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ prescriptionText, imageBase64, profile })
    });
    if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Erreur traduction');
    }
    return response.json();
  },

  async analyzeExpiration(imageBase64: string): Promise<any> {
    const response = await fetch('/api/image/analyze-expiration', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ imageBase64 })
    });
    if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Erreur lecture date');
    }
    return response.json();
  }
};
