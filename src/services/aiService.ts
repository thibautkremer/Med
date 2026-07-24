import { UserProfile, SymptomAnalysisResponse } from '../types';
import { errorService } from './errorService';

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
  // Auto-detect if running on Capacitor mobile webview or localhost
  if (typeof window !== 'undefined') {
    const isLocalhost = window.location.hostname === 'localhost' || window.location.origin.includes('localhost');
    const isCapacitor = !!(window as any).Capacitor;
    if (isLocalhost || isCapacitor) {
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

const handleFetchError = (err: any, defaultMsg: string, baseUrl: string) => {
  let errorMessage = err?.message || defaultMsg;
  if (errorMessage.includes('Failed to fetch') || errorMessage.includes('NetworkError') || err instanceof TypeError) {
    errorMessage = `Impossible de contacter le serveur backend API (${baseUrl || 'local'}). Si vous êtes sur mobile, vérifiez la connexion Internet ou l'URL configurée dans les Paramètres.`;
  }
  errorService.log(errorMessage, 'error');
  throw new Error(errorMessage);
};

export const aiService = {
  async analyzeSymptoms(symptoms: string, profile: UserProfile | null): Promise<SymptomAnalysisResponse> {
    const baseUrl = getApiBaseUrl();
    const url = `${baseUrl}/api/symptoms/analyze`;
    const headers = getHeaders();
    errorService.action(`Appel API (analyzeSymptoms): ${symptoms.substring(0, 40)}...`);
    try {
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
    } catch (err: any) {
      return handleFetchError(err, 'Erreur lors de l\'analyse des symptômes', baseUrl);
    }
  },

  async chatWithPharmacist(messages: {role: string, text: string}[], profile: UserProfile | null): Promise<string> {
    const baseUrl = getApiBaseUrl();
    const url = `${baseUrl}/api/chat`;
    const headers = getHeaders();
    const lastMsg = messages[messages.length - 1]?.text || '';
    errorService.action(`Assistant IA - Envoi message: "${lastMsg.substring(0, 40)}..."`);
    try {
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
    } catch (err: any) {
      return handleFetchError(err, 'Erreur assistant IA', baseUrl);
    }
  },

  async analyzeMedicineImage(imageBase64: string, profile: UserProfile | null): Promise<any> {
    errorService.action('Appel API (analyzeMedicineImage) - Analyse photo/boîte de médicament');
    const baseUrl = getApiBaseUrl();
    try {
      const response = await fetch(`${baseUrl}/api/image/analyze`, {
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
    } catch (err: any) {
      return handleFetchError(err, 'Erreur analyse image', baseUrl);
    }
  },

  async translatePrescription(prescriptionText: string, imageBase64: string | null, profile: UserProfile | null): Promise<any> {
    errorService.action('Appel API (translatePrescription) - Traduction / Analyse d\'ordonnance');
    const baseUrl = getApiBaseUrl();
    try {
      const response = await fetch(`${baseUrl}/api/prescription/translate`, {
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
    } catch (err: any) {
      return handleFetchError(err, 'Erreur traduction ordonnance', baseUrl);
    }
  },

  async analyzeExpiration(imageBase64: string): Promise<any> {
    errorService.action('Appel API (analyzeExpiration) - Lecture de date de péremption');
    const baseUrl = getApiBaseUrl();
    try {
      const response = await fetch(`${baseUrl}/api/image/analyze-expiration`, {
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
    } catch (err: any) {
      return handleFetchError(err, 'Erreur lecture date de péremption', baseUrl);
    }
  }
};
