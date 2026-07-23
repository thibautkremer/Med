import React, { useState, useRef } from 'react';
import { UserProfile } from '../types';
import { aiService } from '../services/aiService';
import { errorService } from '../services/errorService';
import {
  FileText, ArrowRight, ShieldCheck, AlertTriangle, RefreshCw, 
  Sparkles, Camera, Upload, HelpCircle, Check, Info, Heart
} from 'lucide-react';

interface PrescriptionTranslatorProps {
  activeProfile: UserProfile | null;
}

interface TranslatedPrescription {
  originalText: string;
  translatedInstructions: string;
  medicationsFound: {
    originalName: string;
    molecule: string;
    usEquivalent: string;
    purpose: string;
    dosage: string;
    isPrescriptionOnlyUS: boolean;
    isPrescriptionOnlyFR: boolean;
  }[];
  generalPrecautions: string;
}

const PRESET_PRESCRIPTIONS = [
  {
    id: 'fr-basic',
    label: "Ordonnance française (Douleur & Spasmes)",
    text: "Doliprane 1g: 1 comprimé 3 fois par jour si douleur pendant 5 jours.\nSpasfon: 2 comprimés lors des crises douloureuses, max 6/jour."
  },
  {
    id: 'us-basic',
    label: "US Prescription (Infection & Fever)",
    text: "Amoxicillin 500mg: Take 1 capsule three times daily for 7 days.\nTylenol Extra Strength: 500mg, 1-2 tablets every 6 hours as needed for fever."
  }
];

export default function PrescriptionTranslator({ activeProfile }: PrescriptionTranslatorProps) {
  const [inputText, setInputText] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<TranslatedPrescription | null>(null);
  const [dragActive, setDragActive] = useState(false);
  const [imagePreview, setImagePreview] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const handleTranslate = async (textToTranslate: string, base64Image?: string) => {
    if (!textToTranslate && !base64Image) {
      setError("Veuillez saisir du texte ou téléverser une photo d'ordonnance.");
      return;
    }

    errorService.action("Clic sur Traduire / Analyser l'ordonnance");
    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const data = await aiService.translatePrescription(textToTranslate, base64Image || null, activeProfile);
      setResult(data);
    } catch (err: any) {
      console.error(err);
      setError(err.message || "Impossible de traduire l'ordonnance. Veuillez vérifier votre texte et réessayer.");
    } finally {
      setLoading(false);
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      processFile(file);
    }
  };

  const processFile = (file: File) => {
    if (!file.type.startsWith('image/')) {
      setError("Veuillez sélectionner une image (PNG, JPG, etc.).");
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      const base64 = reader.result as string;
      setImagePreview(base64);
      setError(null);
      // Automatically trigger translation with the image
      handleTranslate("", base64);
    };
    reader.onerror = () => {
      setError("Erreur de lecture de l'image.");
    };
    reader.readAsDataURL(file);
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      processFile(e.dataTransfer.files[0]);
    }
  };

  const clearAll = () => {
    setInputText('');
    setImagePreview(null);
    setResult(null);
    setError(null);
  };

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-2xl border border-slate-100 p-5 shadow-sm space-y-4">
        
        {/* Title */}
        <div className="flex items-center gap-2">
          <div className="p-2 bg-indigo-50 rounded-lg text-indigo-600">
            <FileText className="w-5 h-5" />
          </div>
          <div>
            <h2 className="font-bold text-slate-800 text-lg">Traducteur d'Ordonnances Transatlantique</h2>
            <p className="text-xs text-slate-400">Traduisez une ordonnance française ou américaine et obtenez les équivalents locaux instantanément</p>
          </div>
        </div>

        {activeProfile && (
          <div className="bg-indigo-50/50 rounded-xl p-3 border border-indigo-100 text-xs text-indigo-800">
            ✓ Les posologies et précautions seront personnalisées pour : <strong>{activeProfile.name}</strong> ({activeProfile.age} ans, {activeProfile.weight} kg).
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          
          {/* Saisie Textuelle */}
          <div className="space-y-3">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Option A : Saisir le texte de l'ordonnance</h3>
            <textarea
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              placeholder="Ex: Doliprane 1000mg 1g 3 fois par jour pendant 5 jours..."
              className="w-full h-36 p-3 text-xs border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 font-mono"
            />

            {/* Presets */}
            <div className="space-y-1">
              <p className="text-[10px] text-slate-400 font-bold uppercase">Exemples types :</p>
              <div className="flex flex-wrap gap-1.5">
                {PRESET_PRESCRIPTIONS.map(p => (
                  <button
                    key={p.id}
                    onClick={() => {
                      setInputText(p.text);
                      setImagePreview(null);
                      setResult(null);
                    }}
                    className="text-[10px] bg-slate-100 hover:bg-indigo-50 text-slate-600 hover:text-indigo-700 px-2.5 py-1 rounded-lg font-medium border border-slate-200 cursor-pointer"
                  >
                    {p.label}
                  </button>
                ))}
              </div>
            </div>

            <button
              onClick={() => handleTranslate(inputText)}
              disabled={loading || !inputText}
              className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold text-xs rounded-xl flex items-center justify-center gap-2 shadow-sm transition-all cursor-pointer disabled:opacity-50"
            >
              {loading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />} Traduire & Décrypter
            </button>
          </div>

          {/* Saisie Visuelle (Photo / Scan) */}
          <div className="space-y-3">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Option B : Numériser / Téléverser une photo</h3>
            
            <div
              onDragEnter={handleDrag}
              onDragLeave={handleDrag}
              onDragOver={handleDrag}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              className={`border-2 border-dashed rounded-xl h-36 flex flex-col items-center justify-center gap-2 text-center cursor-pointer transition-all p-4 ${
                dragActive 
                  ? 'border-indigo-500 bg-indigo-50/50' 
                  : 'border-slate-200 bg-slate-50 hover:bg-slate-100/50'
              }`}
            >
              <Upload className="w-8 h-8 text-slate-400 animate-bounce-short" />
              <div>
                <p className="text-xs font-bold text-slate-700">Déposer la photo de l'ordonnance ici</p>
                <p className="text-[10px] text-slate-400 mt-0.5">Glissez-déposez ou cliquez pour choisir un fichier</p>
              </div>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleFileUpload}
                className="hidden"
              />
            </div>

            {imagePreview && (
              <div className="flex items-center gap-3 bg-slate-100 p-2.5 rounded-xl border border-slate-200">
                <img src={imagePreview} alt="Aperçu" className="w-12 h-12 object-cover rounded-lg border border-slate-300" />
                <div className="flex-1 text-xs">
                  <p className="font-bold text-slate-700">Image chargée</p>
                  <p className="text-[10px] text-slate-400">Analyse optique par l'IA en cours...</p>
                </div>
                <button
                  onClick={clearAll}
                  className="text-xs text-red-500 hover:text-red-700 font-extrabold bg-red-50 hover:bg-red-100 px-2 py-1 rounded"
                >
                  Effacer
                </button>
              </div>
            )}
          </div>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-800 p-3 rounded-xl text-xs flex gap-2">
            <AlertTriangle className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
            <p>{error}</p>
          </div>
        )}
      </div>

      {/* Translation Output Results */}
      {result && (
        <div className="bg-white rounded-2xl border border-slate-100 shadow-md overflow-hidden animate-fade-in space-y-0">
          
          {/* Header visual */}
          <div className="bg-slate-900 text-white p-5 flex items-center justify-between">
            <div className="space-y-1">
              <span className="bg-indigo-500/20 text-indigo-400 text-[9px] uppercase font-bold tracking-widest px-2 py-0.5 rounded border border-indigo-500/20">
                ✓ Traducteur IA Actif
              </span>
              <h3 className="text-base font-black text-slate-100">Prescription décryptée avec succès</h3>
              <p className="text-[11px] text-slate-400 italic">
                Équivalents identifiés pour le marché cible.
              </p>
            </div>
            <FileText className="w-8 h-8 text-indigo-500 shrink-0 opacity-60" />
          </div>

          <div className="p-5 space-y-5">
            {/* General translated instructions */}
            <div className="space-y-1.5">
              <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Instructions Générales (Traduction libre)</h4>
              <p className="text-xs font-medium text-slate-700 bg-slate-50 p-3.5 rounded-xl border border-slate-100 leading-relaxed">
                {result.translatedInstructions}
              </p>
            </div>

            {/* List of medications matched */}
            <div className="space-y-2.5">
              <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Médicaments Trouvés & Équivalents Transatlantiques</h4>
              
              <div className="grid grid-cols-1 gap-3">
                {result.medicationsFound.map((med, idx) => (
                  <div key={idx} className="border border-slate-100 rounded-xl p-4 bg-white shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="space-y-1 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="w-5 h-5 rounded-full bg-slate-100 text-[10px] font-black flex items-center justify-center text-slate-500">
                          {idx + 1}
                        </span>
                        <h5 className="font-extrabold text-slate-800 text-sm">
                          {med.originalName} <span className="text-xs font-normal text-slate-400">({med.molecule})</span>
                        </h5>
                      </div>
                      <p className="text-xs text-slate-500 pl-7 font-medium leading-relaxed">
                        Usage : <strong className="text-slate-700">{med.purpose}</strong>
                      </p>
                      <p className="text-xs text-indigo-600 pl-7 font-bold">
                        Posologie calculée : {med.dosage}
                      </p>
                    </div>

                    <div className="bg-indigo-50/40 p-3 rounded-lg border border-indigo-100/50 min-w-[240px] md:max-w-xs text-xs space-y-1.5">
                      <p className="font-extrabold text-slate-400 uppercase text-[9px] tracking-wider">Équivalent recommandé :</p>
                      <p className="font-extrabold text-slate-800">{med.usEquivalent}</p>
                      
                      <div className="flex flex-wrap gap-2 pt-1">
                        <span className={`text-[9px] px-1.5 py-0.5 rounded font-extrabold ${
                          med.isPrescriptionOnlyUS 
                            ? 'bg-amber-100 text-amber-800' 
                            : 'bg-emerald-100 text-emerald-800'
                        }`}>
                          USA : {med.isPrescriptionOnlyUS ? "Sur ordonnance (Rx)" : "En vente libre (OTC)"}
                        </span>
                        <span className={`text-[9px] px-1.5 py-0.5 rounded font-extrabold ${
                          med.isPrescriptionOnlyFR 
                            ? 'bg-amber-100 text-amber-800' 
                            : 'bg-emerald-100 text-emerald-800'
                        }`}>
                          FR : {med.isPrescriptionOnlyFR ? "Ordonnance requise" : "Vente libre"}
                        </span>
                        {med.unsafeForPregnancy ? (
                          <span className="text-[9px] px-1.5 py-0.5 rounded font-extrabold bg-rose-100 text-rose-800 flex items-center gap-1">
                            🤰 Déconseillé Grossesse
                          </span>
                        ) : (
                          <span className="text-[9px] px-1.5 py-0.5 rounded font-extrabold bg-teal-100 text-teal-800 flex items-center gap-1">
                            🤰 Ok Grossesse
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Safety & Precautions warnings */}
            <div className="bg-amber-50/70 border border-amber-200 rounded-xl p-4 text-xs space-y-1.5">
              <h5 className="font-bold text-amber-950 flex items-center gap-1">
                <ShieldCheck className="w-4 h-4 text-emerald-600" /> Mises en Garde & Interactions importantes
              </h5>
              <p className="text-amber-900 leading-relaxed font-medium">
                {result.generalPrecautions}
              </p>
            </div>

            {/* Control resetting */}
            <div className="pt-2 text-right">
              <button
                onClick={clearAll}
                className="bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs px-5 py-2.5 rounded-xl transition-all cursor-pointer"
              >
                Traduire une autre ordonnance
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
