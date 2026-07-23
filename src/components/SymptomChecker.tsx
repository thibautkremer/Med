import React, { useState } from 'react';
import { UserProfile, SymptomAnalysisResponse } from '../types';
import { aiService } from '../services/aiService';
import { errorService } from '../services/errorService';
import {
  Stethoscope, Send, AlertTriangle, ShieldCheck, RefreshCw, 
  HelpCircle, Pill, ArrowRight, Activity, Info
} from 'lucide-react';

interface SymptomCheckerProps {
  activeProfile: UserProfile | null;
  toggleFavorite: (id: string) => void;
  favorites: string[];
}

export default function SymptomChecker({ activeProfile, toggleFavorite, favorites }: SymptomCheckerProps) {
  const [symptoms, setSymptoms] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<SymptomAnalysisResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!symptoms.trim()) return;

    errorService.action("Clic sur Analyser les symptômes");
    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const data = await aiService.analyzeSymptoms(symptoms.trim(), activeProfile);
      setResult(data);
    } catch (err: any) {
      console.error(err);
      setError(err.message || "Désolé, impossible d'analyser vos symptômes pour le moment. Veuillez réessayer.");
    } finally {
      setLoading(false);
    }
  };

  const getSeverityBadge = (sev: string) => {
    switch (sev) {
      case 'high':
        return (
          <span className="flex items-center gap-1 bg-red-100 text-red-800 text-xs font-black px-3 py-1.5 rounded-full border border-red-200 uppercase">
            ⚠️ Urgence - Gravité Élevée
          </span>
        );
      case 'medium':
        return (
          <span className="flex items-center gap-1 bg-amber-100 text-amber-800 text-xs font-black px-3 py-1.5 rounded-full border border-amber-200 uppercase">
            ⚠️ Attention - Gravité Moyenne
          </span>
        );
      default:
        return (
          <span className="flex items-center gap-1 bg-emerald-100 text-emerald-800 text-xs font-black px-3 py-1.5 rounded-full border border-emerald-200 uppercase">
            ✓ Gravité Faible - Traitement OTC possible
          </span>
        );
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-2xl border border-slate-100 p-5 shadow-sm space-y-4">
        <div className="flex items-center gap-2">
          <div className="p-2 bg-emerald-50 rounded-lg text-emerald-600">
            <Stethoscope className="w-5 h-5" />
          </div>
          <div>
            <h2 className="font-bold text-slate-800 text-lg">Analyseur de Symptômes par IA</h2>
            <p className="text-xs text-slate-400">Conseils d'équivalences de traitement franco-américains</p>
          </div>
        </div>

        {activeProfile ? (
          <div className="bg-emerald-50/50 rounded-xl p-3 border border-emerald-100 text-xs text-emerald-800 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Activity className="w-4 h-4 text-emerald-600" />
              <span>
                Analyse configurée pour : <strong>{activeProfile.name}</strong> ({activeProfile.age} ans, {activeProfile.weight} kg)
              </span>
            </div>
            <span className="text-[10px] bg-emerald-200 px-2 py-0.5 rounded font-bold">Profil appliqué</span>
          </div>
        ) : (
          <div className="bg-slate-50 p-3 rounded-xl border border-slate-100 text-xs text-slate-500">
            ⚠️ Aucun profil actif. L'analyse sera faite pour un adulte de référence.
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-3">
          <div className="relative">
            <textarea
              required
              rows={4}
              value={symptoms}
              onChange={(e) => setSymptoms(e.target.value)}
              placeholder="Décrivez précisément vos symptômes (ex: J'ai très mal à la tête depuis ce matin et de la fièvre à 38.5... ou Mon enfant de 6 ans a le nez bouché et tousse après l'école...)"
              className="w-full bg-slate-50 hover:bg-slate-100/50 focus:bg-white text-slate-800 text-sm border border-slate-200 focus:border-emerald-500 rounded-xl p-4 transition-all outline-none resize-none leading-relaxed"
            />
          </div>

          <div className="flex items-center justify-between gap-4">
            <p className="text-[10px] text-slate-400 max-w-md">
              * Propulsé par Google Gemini. Les suggestions thérapeutiques ne remplacent pas l'avis d'un professionnel de santé.
            </p>
            <button
              type="submit"
              disabled={loading || !symptoms.trim()}
              className="shrink-0 flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-200 text-white disabled:text-slate-400 px-5 py-3 rounded-xl text-sm font-bold transition-all shadow-sm cursor-pointer disabled:cursor-not-allowed"
            >
              {loading ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" /> Analyse en cours...
                </>
              ) : (
                <>
                  <Send className="w-4 h-4" /> Analyser
                </>
              )}
            </button>
          </div>
        </form>
      </div>

      {/* Loading State Skeleton */}
      {loading && (
        <div className="bg-white rounded-2xl border border-slate-100 p-6 shadow-sm space-y-4 animate-pulse">
          <div className="h-4 bg-slate-100 rounded w-1/4"></div>
          <div className="h-3 bg-slate-100 rounded w-3/4"></div>
          <div className="h-20 bg-slate-50 rounded"></div>
          <div className="h-4 bg-slate-100 rounded w-1/3"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
            <div className="h-16 bg-slate-50 rounded"></div>
            <div className="h-16 bg-slate-50 rounded"></div>
          </div>
        </div>
      )}

      {/* Error state */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-800 p-4 rounded-xl text-sm flex gap-2">
          <AlertTriangle className="w-5 h-5 text-red-500 shrink-0" />
          <p>{error}</p>
        </div>
      )}

      {/* Result Card */}
      {result && (
        <div className="space-y-6">
          {/* General Advice and Severity */}
          <div className="bg-white rounded-2xl border border-slate-100 p-6 shadow-sm space-y-4">
            <div className="flex items-center justify-between border-b border-slate-50 pb-3 flex-wrap gap-2">
              <h3 className="font-extrabold text-slate-800 text-base">Rapport d'Analyse des Symptômes</h3>
              {getSeverityBadge(result.severity)}
            </div>

            {result.severity === 'high' && (
              <div className="bg-red-50 border border-red-200 p-4 rounded-xl text-red-900 text-xs leading-relaxed space-y-2">
                <p className="font-bold flex items-center gap-1.5 text-red-800">
                  <AlertTriangle className="w-4 h-4 text-red-600 animate-bounce" />
                  URGENCE MÉDICALE POSSIBLE !
                </p>
                <p>
                  Les symptômes décrits présentent des signes de gravité. Nous vous recommandons de ne pas attendre et d'appeler immédiatement le <strong>15 (en France)</strong> ou le <strong>911 (aux États-Unis)</strong>, ou de vous rendre au service des urgences le plus proche.
                </p>
              </div>
            )}

            <div className="space-y-2">
              <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Avis Pharmaceutique & Conseils</h4>
              <p className="text-slate-700 text-sm leading-relaxed whitespace-pre-line bg-slate-50 p-4 rounded-xl border border-slate-100">
                {result.analysis}
              </p>
            </div>
          </div>

          {/* Suggested Treatments List */}
          <div className="space-y-3">
            <h3 className="font-bold text-slate-800 text-base flex items-center gap-1.5">
              <Pill className="w-5 h-5 text-emerald-500" />
              Traitements Conseillés Equivalents (France / USA)
            </h3>

            {result.suggestedMedications && result.suggestedMedications.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {result.suggestedMedications.map((med, idx) => (
                  <div key={idx} className="bg-white rounded-xl border border-slate-100 p-5 shadow-sm space-y-4 flex flex-col justify-between">
                    <div>
                      {/* Name comparison */}
                      <div className="flex items-center justify-between gap-2 border-b border-slate-50 pb-2">
                        <div className="flex items-center gap-1">
                          <span className="text-sm">🇫🇷</span>
                          <span className="font-black text-slate-800 text-sm">{med.nameFr}</span>
                        </div>
                        <ArrowRight className="w-3.5 h-3.5 text-slate-300" />
                        <div className="flex items-center gap-1">
                          <span className="text-sm">🇺🇸</span>
                          <span className="font-black text-emerald-700 text-sm">{med.nameUs}</span>
                        </div>
                      </div>

                      {/* Reasons */}
                      <div className="mt-3 space-y-2 text-xs">
                        <p className="text-slate-600 leading-relaxed">
                          <strong className="text-slate-500 uppercase text-[9px] block">Pourquoi ?</strong>
                          {med.reasonFr}
                        </p>
                      </div>
                    </div>

                    {/* Dosage profile info */}
                    <div className="bg-emerald-50/50 p-3 rounded-lg border border-emerald-100 text-xs space-y-2 mt-2">
                      <div className="flex items-center justify-between text-[10px] font-black uppercase text-emerald-800">
                        <span>Posologie adaptative</span>
                        {activeProfile && <span>Profil: {activeProfile.name}</span>}
                      </div>
                      
                      <div className="space-y-1">
                        <p className="text-slate-700 font-medium">
                          <strong>FR :</strong> {med.dosageForProfileFr}
                        </p>
                        <p className="text-slate-700 font-medium">
                          <strong>US :</strong> {med.dosageForProfileUs}
                        </p>
                      </div>
                    </div>

                    {/* Pregnancy Notice */}
                    {med.unsafeForPregnancy ? (
                      <div className="bg-rose-50 border border-rose-200 text-rose-900 p-2.5 rounded-lg text-xs font-semibold flex items-start gap-1.5 mt-2">
                        <span className="text-sm">🤰</span>
                        <div>
                          <span className="font-extrabold text-rose-900 block text-[11px]">⚠️ DÉCONSEILLÉ GROSSESSE</span>
                          <span className="text-[10px] text-rose-700 font-normal leading-tight block mt-0.5">
                            {med.pregnancyWarningFr || "Interdit ou fortement déconseillé aux femmes enceintes."}
                          </span>
                        </div>
                      </div>
                    ) : (
                      <div className="bg-teal-50 border border-teal-200 text-teal-800 p-2 rounded-lg text-[10px] font-medium flex items-center gap-1.5 mt-2">
                        <span className="text-sm">🤰</span>
                        <span>Compatible grossesse (selon posologie)</span>
                      </div>
                    )}

                    {/* Prescription requirements */}
                    <div className="flex justify-between text-[9px] font-bold text-slate-400 mt-2">
                      <span className={med.requiresPrescriptionFr ? "text-amber-600" : "text-emerald-600"}>
                        FR : {med.requiresPrescriptionFr ? "Sur ordonnance" : "Vente libre (OTC)"}
                      </span>
                      <span className={med.requiresPrescriptionUs ? "text-amber-600" : "text-emerald-600"}>
                        US : {med.requiresPrescriptionUs ? "Prescription (Rx)" : "Vente libre (OTC)"}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="bg-slate-50 text-slate-500 text-xs p-4 rounded-xl border border-slate-100 text-center">
                Aucun médicament spécifique suggéré en libre service. Reposez-vous et consultez si besoin.
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
