export interface UserProfile {
  id: string;
  name: string;
  gender: 'M' | 'F' | 'Autre';
  age: number;
  height: number; // in cm
  weight: number; // in kg
  isDefault: boolean;
}

export interface Contraindication {
  substance: string;
  riskLevel: 'low' | 'medium' | 'high';
  descriptionFr: string;
  descriptionUs: string;
}

export interface Medication {
  id: string;
  nameFr: string;
  nameUs: string;
  activeIngredientFr: string;
  activeIngredientUs: string;
  classFr: string; // e.g., Antalgique, Anti-inflammatoire
  classUs: string; // e.g., Analgesic, NSAID
  descriptionFr: string;
  descriptionUs: string;
  dosageAdultFr: string;
  dosageAdultUs: string;
  dosageChildFr: string;
  dosageChildUs: string;
  requiresPrescriptionFr: boolean;
  requiresPrescriptionUs: boolean;
  amazonSearchUrlFr: string;
  amazonSearchUrlUs: string;
  sideEffectsFr: string[];
  sideEffectsUs: string[];
  precautionsFr: string;
  precautionsUs: string;
  contraindications: Contraindication[];
  category: string; // e.g., 'pain', 'cold', 'stomach', 'allergy', 'skin', 'other'
  targetGroup: 'adult' | 'child' | 'infant' | 'all'; // target patient group
}

export interface SymptomAnalysisRequest {
  symptoms: string;
  profileId: string;
}

export interface SymptomAnalysisResponse {
  analysis: string; // Detailed description of what to do, precautions
  suggestedMedications: {
    medicationId?: string; // If matches one of our pre-seeded meds
    nameFr: string;
    nameUs: string;
    reasonFr: string;
    reasonUs: string;
    dosageForProfileFr: string;
    dosageForProfileUs: string;
    requiresPrescriptionFr: boolean;
    requiresPrescriptionUs: boolean;
  }[];
  severity: 'low' | 'medium' | 'high'; // high means consult a doctor immediately
}

export interface ImageAnalysisResponse {
  detectedMedicine: {
    name: string;
    countryOfOrigin: 'FR' | 'US' | 'Unknown';
    activeIngredient: string;
    purposeFr: string;
    purposeUs: string;
    equivalentFr: string;
    equivalentUs: string;
    dosageInfoFr: string;
    dosageInfoUs: string;
    requiresPrescriptionFr: boolean;
    requiresPrescriptionUs: boolean;
    precautionsFr: string;
    precautionsUs: string;
    category: string;
    expirationDate?: string; // Formatted YYYY-MM-DD or YYYY-MM if detected
    expirationDateFound: boolean;
    batchNumber?: string;
  };
}

export interface CabinetItem {
  id: string;
  medicationName: string;
  activeIngredient: string;
  country: 'FR' | 'US';
  stockQuantity: number;
  initialQuantity: number;
  expirationDate?: string;
  lowStockAlert: boolean;
  notes?: string;
}

export interface TreatmentLog {
  id: string;
  profileId: string;
  medicationName: string;
  dosage: string; // e.g. "1 comprimé"
  frequency: string; // e.g. "3 fois par jour"
  timeOfDay: string[]; // e.g. ["Matin", "Midi", "Soir"]
  startDate: string;
  endDate?: string;
  isActive: boolean;
  takenHistory: {
    timestamp: string;
    takenBy: string; // profile name
  }[];
}

