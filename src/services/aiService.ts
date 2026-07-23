import { UserProfile, SymptomAnalysisResponse } from '../types';
import { errorService } from './errorService';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'https://ais-pre-xm3x2xeexibmmorrzztj6x-485053903653.us-west2.run.app';

const getHeaders = () => {
    const headers: Record<string, string> = { 'Content-Type': 'application/json' };
    const runtimeKey = localStorage.getItem('RUNTIME_GEMINI_API_KEY');
    if (runtimeKey) {
        headers['X-Gemini-API-Key'] = runtimeKey;
    }
    return headers;
};

export const aiService = {
  async analyzeSymptoms(symptoms: string, profile: UserProfile | null): Promise<SymptomAnalysisResponse> {
    const response = await fetch(`${API_BASE_URL}/api/symptoms/analyze`, {
      method: 'POST',
      headers: getHeaders(),
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
        errorService.log(errorMessage);
        throw new Error(errorMessage);
    }
    return response.json();
  },

  async chatWithPharmacist(messages: {role: string, text: string}[], profile: UserProfile | null): Promise<string> {
    const response = await fetch(`${API_BASE_URL}/api/chat`, {
      method: 'POST',
      headers: getHeaders(),
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
        errorService.log(errorMessage);
        throw new Error(errorMessage);
    }
    const data = await response.json();
    return data.reply;
  },

  async analyzeMedicineImage(imageBase64: string, profile: UserProfile | null): Promise<any> {
    const response = await fetch(`${API_BASE_URL}/api/image/analyze`, {
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
        errorService.log(errorMessage);
        throw new Error(errorMessage);
    }
    return response.json();
  },

  async translatePrescription(prescriptionText: string, imageBase64: string | null, profile: UserProfile | null): Promise<any> {
    const response = await fetch(`${API_BASE_URL}/api/prescription/translate`, {
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
        errorService.log(errorMessage);
        throw new Error(errorMessage);
    }
    return response.json();
  },

  async analyzeExpiration(imageBase64: string): Promise<any> {
    const response = await fetch(`${API_BASE_URL}/api/image/analyze-expiration`, {
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
        errorService.log(errorMessage);
        throw new Error(errorMessage);
    }
    return response.json();
  }
};
