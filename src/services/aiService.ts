import { UserProfile, SymptomAnalysisResponse } from '../types';
import { errorService } from './errorService';

const API_BASE_URL = (import.meta as any).env.VITE_API_BASE_URL || '';

const getHeaders = () => {
    const headers: Record<string, string> = { 'Content-Type': 'application/json' };
    const runtimeKey = localStorage.getItem('RUNTIME_GEMINI_API_KEY');
    console.log('DEBUG: Runtime API key from localStorage:', runtimeKey ? '***' : 'null');
    if (runtimeKey && runtimeKey.trim() !== '' && runtimeKey !== 'null' && runtimeKey !== 'undefined') {
        headers['X-Gemini-API-Key'] = runtimeKey.trim();
    }
    return headers;
};

export const aiService = {
  async analyzeSymptoms(symptoms: string, profile: UserProfile | null): Promise<SymptomAnalysisResponse> {
    const url = `${API_BASE_URL}/api/symptoms/analyze`;
    const headers = getHeaders();
    errorService.action(`Appel API (analyzeSymptoms): ${symptoms.substring(0, 40)}...`);
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
        errorService.log(errorMessage, 'error');
        throw new Error(errorMessage);
    }
    const data = await response.json();
    errorService.success('Analyse des symptômes réussie');
    return data;
  },

  async chatWithPharmacist(messages: {role: string, text: string}[], profile: UserProfile | null): Promise<string> {
    const url = `${API_BASE_URL}/api/chat`;
    const headers = getHeaders();
    const lastMsg = messages[messages.length - 1]?.text || '';
    errorService.action(`Assistant IA - Envoi message: "${lastMsg.substring(0, 40)}..."`);
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
        errorService.log(errorMessage, 'error');
        throw new Error(errorMessage);
    }
    const data = await response.json();
    errorService.success('Réponse reçue de l\'assistant IA');
    return data.reply;
  },

  async analyzeMedicineImage(imageBase64: string, profile: UserProfile | null): Promise<any> {
    errorService.action('Appel API (analyzeMedicineImage) - Analyse photo/boîte de médicament');
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
        errorService.log(errorMessage, 'error');
        throw new Error(errorMessage);
    }
    const data = await response.json();
    errorService.success('Analyse de la boîte de médicament réussie');
    return data;
  },

  async translatePrescription(prescriptionText: string, imageBase64: string | null, profile: UserProfile | null): Promise<any> {
    errorService.action('Appel API (translatePrescription) - Traduction / Analyse d\'ordonnance');
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
        errorService.log(errorMessage, 'error');
        throw new Error(errorMessage);
    }
    const data = await response.json();
    errorService.success('Traduction / Analyse d\'ordonnance réussie');
    return data;
  },

  async analyzeExpiration(imageBase64: string): Promise<any> {
    errorService.action('Appel API (analyzeExpiration) - Lecture de date de péremption');
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
        errorService.log(errorMessage, 'error');
        throw new Error(errorMessage);
    }
    const data = await response.json();
    errorService.success('Lecture de la date de péremption réussie');
    return data;
  }
};
