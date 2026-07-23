import React, { useState } from 'react';
import { Medication, UserProfile } from '../types';
import { MEDICATIONS_DATABASE } from '../data/medications';
import { generateMedicationPDF } from '../utils/pdfGenerator';
import { errorService } from '../services/errorService';
import { 
  Search, Info, Heart, ArrowLeftRight, ExternalLink, AlertTriangle, 
  CheckCircle, HelpCircle, Pill, ShieldAlert, ShoppingBag, ArrowRight, FileText,
  Filter, ChevronDown, ChevronUp, Activity
} from 'lucide-react';


interface MedicationCatalogProps {
  activeProfile: UserProfile | null;
  favorites: string[];
  toggleFavorite: (id: string) => void;
  onSelectMedication?: (med: Medication) => void;
}

const CATEGORIES = [
  { id: 'all', label: 'Tous', icon: '💊' },
  { id: 'pain', label: 'Douleur / Fièvre', icon: '🤒' },
  { id: 'cold', label: 'Rhume / Gorge', icon: '🤧' },
  { id: 'stomach', label: 'Estomac / Digestion', icon: '🤢' },
  { id: 'allergy', label: 'Allergies', icon: '🌸' },
  { id: 'skin', label: 'Peau / Brûlures', icon: '🧴' }
];

export default function MedicationCatalog({ activeProfile, favorites, toggleFavorite, onSelectMedication }: MedicationCatalogProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [targetFilter, setTargetFilter] = useState<'all' | 'adult' | 'infant'>('all');
  const [pregnancyFilter, setPregnancyFilter] = useState<'all' | 'safe' | 'discouraged'>('all');
  const [filterMode, setFilterMode] = useState<'all' | 'fr_to_us' | 'us_to_fr'>('all');
  const [selectedMed, setSelectedMed] = useState<Medication | null>(null);
  const [showFilters, setShowFilters] = useState<boolean>(false);

  const activeFilterCount = (filterMode !== 'all' ? 1 : 0) + 
    (targetFilter !== 'all' ? 1 : 0) + 
    (pregnancyFilter !== 'all' ? 1 : 0) + 
    (selectedCategory !== 'all' ? 1 : 0);

  // Filter items
  const filteredMeds = MEDICATIONS_DATABASE.filter(med => {
    // Search matching
    const query = searchQuery.toLowerCase().trim();
    const matchesSearch = !query || 
      med.nameFr.toLowerCase().includes(query) ||
      med.nameUs.toLowerCase().includes(query) ||
      med.activeIngredientFr.toLowerCase().includes(query) ||
      med.activeIngredientUs.toLowerCase().includes(query) ||
      med.descriptionFr.toLowerCase().includes(query) ||
      med.descriptionUs.toLowerCase().includes(query);

    // Category matching
    const matchesCategory = selectedCategory === 'all' || med.category === selectedCategory;

    // Target group matching
    let matchesTarget = true;
    if (targetFilter === 'infant') {
      matchesTarget = med.targetGroup === 'infant' || med.targetGroup === 'child' || med.targetGroup === 'all';
    } else if (targetFilter === 'adult') {
      matchesTarget = med.targetGroup === 'adult' || med.targetGroup === 'all';
    }

    // Pregnancy matching
    let matchesPregnancy = true;
    if (pregnancyFilter === 'safe') {
      matchesPregnancy = !med.unsafeForPregnancy;
    } else if (pregnancyFilter === 'discouraged') {
      matchesPregnancy = !!med.unsafeForPregnancy;
    }

    return matchesSearch && matchesCategory && matchesTarget && matchesPregnancy;
  });

  const getCustomDosage = (med: Medication, profile: UserProfile | null) => {
    if (!profile) return null;
    
    const isChild = profile.age < 12;
    
    if (med.id === 'doliprane-tylenol') {
      // Paracetamol child dosage calculation: 15mg/kg per dose
      if (isChild) {
        const mgDose = profile.weight * 15;
        return {
          textFr: `Dosage Enfant Calculé : environ ${mgDose} mg par prise toutes les 6 heures (Ne pas dépasser ${profile.weight * 60} mg par jour). Utilisez toujours l'outil de mesure inclus.`,
          textUs: `Calculated Pediatric Dose: approx ${mgDose} mg every 6 hours (Max ${profile.weight * 60} mg/day). Use the syringe or measuring cup provided.`
        };
      } else {
        const standardDose = profile.weight < 50 ? '500 mg' : '1000 mg';
        return {
          textFr: `Dosage Adulte Conseillé : ${standardDose} toutes les 6 heures (Max 4g par jour).`,
          textUs: `Suggested Adult Dose: ${standardDose} every 6 hours (Max 4g per day).`
        };
      }
    }

    if (med.id === 'nurofen-advil') {
      // Ibuprofen child dose: 7.5mg/kg to 10mg/kg
      if (isChild) {
        const mgDose = Math.round(profile.weight * 7.5);
        return {
          textFr: `Dosage Enfant Calculé : environ ${mgDose} mg toutes les 6 heures avec de la nourriture. (Ne pas dépasser 30 mg/kg/jour).`,
          textUs: `Calculated Pediatric Dose: approx ${mgDose} mg every 6 to 8 hours with food.`
        };
      } else {
        return {
          textFr: `Dosage Adulte Conseillé : 200 mg à 400 mg toutes les 6 heures pendant les repas. Max 1200 mg par jour.`,
          textUs: `Suggested Adult Dose: 200 mg to 400 mg every 6 hours with meals. Max 1200 mg per day.`
        };
      }
    }

    if (med.id === 'spasfon-none') {
      if (isChild) {
        return {
          textFr: "Le Spasfon est déconseillé chez le jeune enfant sans prescription médicale explicite.",
          textUs: "Not recommended for young children unless advised by a doctor."
        };
      } else {
        return {
          textFr: "Dosage standard : 2 comprimés par prise, à renouveler si nécessaire en cas de crise de spasmes intestinaux ou de règles, maximum 6 par jour.",
          textUs: "Standard dosage: 2 tablets per dose as symptoms occur, maximum 6 tablets per day."
        };
      }
    }

    if (med.id === 'biafine-aquaphor') {
      return {
        textFr: "Appliquer généreusement sur la brûlure ou le coup de soleil en couche épaisse. Faire pénétrer légèrement.",
        textUs: "Apply a generous layer to clean skin on the sunburn or minor burn 2-3 times daily."
      };
    }

    // Default return
    return {
      textFr: isChild ? med.dosageChildFr : med.dosageAdultFr,
      textUs: isChild ? med.dosageChildUs : med.dosageAdultUs
    };
  };

  return (
    <div className="space-y-6">
      {/* Search Header */}
      <div className="bg-white rounded-2xl border border-slate-100 p-5 shadow-sm space-y-4">
        {/* Title & PDF Export */}
        <div className="flex items-center justify-between gap-3">
          <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
            <Pill className="w-5 h-5 text-emerald-500" />
            Équivalences & Recherche de Médicaments
          </h2>
          <div className="flex items-center gap-2">
            {activeProfile && (
              <span className="hidden sm:inline-flex text-xs text-emerald-700 font-medium bg-emerald-50 border border-emerald-100 px-3 py-1.5 rounded-lg">
                Profil : {activeProfile.name} ({activeProfile.age} ans)
              </span>
            )}
            <button
              onClick={() => {
                errorService.action(`Catalogue - Génération du PDF des médicaments (${filteredMeds.length} articles)`);
                generateMedicationPDF(filteredMeds);
                errorService.success("PDF généré et téléchargé avec succès");
              }}
              className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white px-3.5 py-2 rounded-xl text-xs font-semibold transition-colors cursor-pointer shadow-sm"
              title="Exporter la liste filtrée en PDF"
            >
              <FileText className="w-4 h-4" />
              <span className="hidden sm:inline">PDF</span>
            </button>
          </div>
        </div>
        
        {/* Search Bar */}
        <div className="relative">
          <Search className="absolute left-3.5 top-3.5 text-slate-400 w-5 h-5" />
          <input
            type="text"
            placeholder="Rechercher par nom (ex: Doliprane, Advil, Tylenol), molécule (ex: Paracétamol) ou usage..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-slate-50 hover:bg-slate-100/70 focus:bg-white text-slate-800 text-sm border border-slate-200 focus:border-emerald-500 rounded-xl pl-11 pr-10 py-3 transition-all outline-none"
          />
          {searchQuery && (
            <button 
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-3 text-slate-400 hover:text-slate-600 text-xs font-bold px-1"
            >
              ✕
            </button>
          )}
        </div>

        {/* Toggle Filters Header */}
        <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="flex items-center gap-2.5 bg-slate-100 hover:bg-slate-200/80 text-slate-800 px-4 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer shadow-xs"
          >
            <Filter className="w-4 h-4 text-emerald-600" />
            <span>Filtres</span>
            {activeFilterCount > 0 && (
              <span className="bg-emerald-600 text-white text-[10px] font-extrabold px-2 py-0.5 rounded-full ml-0.5">
                {activeFilterCount}
              </span>
            )}
            {showFilters ? (
              <ChevronUp className="w-4 h-4 text-slate-500 ml-1" />
            ) : (
              <ChevronDown className="w-4 h-4 text-slate-500 ml-1" />
            )}
          </button>

          {activeFilterCount > 0 && (
            <button
              onClick={() => {
                setFilterMode('all');
                setTargetFilter('all');
                setPregnancyFilter('all');
                setSelectedCategory('all');
              }}
              className="text-xs text-rose-600 hover:text-rose-700 font-bold bg-rose-50 hover:bg-rose-100 px-3 py-1.5 rounded-lg transition-colors cursor-pointer"
            >
              Réinitialiser les filtres ↺
            </button>
          )}
        </div>

        {/* Expandable Filter Panel (Direction, Public Cible, Grossesse, Pathologie) */}
        {showFilters && (
          <div className="space-y-4 pt-3 border-t border-slate-100">
            {/* Filter Topic Cards (Direction, Public Cible, Grossesse) */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {/* Topic 1: Direction / Country */}
              <div className="bg-slate-50/80 rounded-xl p-3 border border-slate-100 flex flex-col justify-between space-y-2">
                <div className="flex items-center justify-between text-xs font-bold text-slate-600">
                  <span className="flex items-center gap-1.5">
                    <span>🌐</span> Direction
                  </span>
                  <span className="text-[10px] text-slate-400 font-normal">Pays d'origine</span>
                </div>
                <div className="grid grid-cols-3 gap-1 bg-white p-1 rounded-lg border border-slate-200/60">
                  <button
                    onClick={() => setFilterMode('all')}
                    className={`py-1.5 px-2 rounded-md text-xs font-semibold text-center transition-all cursor-pointer ${
                      filterMode === 'all'
                        ? 'bg-slate-800 text-white shadow-sm'
                        : 'text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    Tous
                  </button>
                  <button
                    onClick={() => setFilterMode('fr_to_us')}
                    className={`py-1.5 px-1 rounded-md text-[11px] font-semibold text-center transition-all cursor-pointer flex items-center justify-center gap-1 ${
                      filterMode === 'fr_to_us'
                        ? 'bg-emerald-600 text-white shadow-sm'
                        : 'text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    🇫🇷 ➔ 🇺🇸
                  </button>
                  <button
                    onClick={() => setFilterMode('us_to_fr')}
                    className={`py-1.5 px-1 rounded-md text-[11px] font-semibold text-center transition-all cursor-pointer flex items-center justify-center gap-1 ${
                      filterMode === 'us_to_fr'
                        ? 'bg-emerald-600 text-white shadow-sm'
                        : 'text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    🇺🇸 ➔ 🇫🇷
                  </button>
                </div>
              </div>

              {/* Topic 2: Target Age Group */}
              <div className="bg-slate-50/80 rounded-xl p-3 border border-slate-100 flex flex-col justify-between space-y-2">
                <div className="flex items-center justify-between text-xs font-bold text-slate-600">
                  <span className="flex items-center gap-1.5">
                    <span>👥</span> Public Cible
                  </span>
                  <span className="text-[10px] text-slate-400 font-normal">Tranche d'âge</span>
                </div>
                <div className="grid grid-cols-3 gap-1 bg-white p-1 rounded-lg border border-slate-200/60">
                  <button
                    onClick={() => setTargetFilter('all')}
                    className={`py-1.5 px-1 rounded-md text-xs font-semibold text-center transition-all cursor-pointer ${
                      targetFilter === 'all'
                        ? 'bg-indigo-600 text-white shadow-sm'
                        : 'text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    Tous
                  </button>
                  <button
                    onClick={() => setTargetFilter('adult')}
                    className={`py-1.5 px-1 rounded-md text-xs font-semibold text-center transition-all cursor-pointer ${
                      targetFilter === 'adult'
                        ? 'bg-indigo-600 text-white shadow-sm'
                        : 'text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    🧑 Adulte
                  </button>
                  <button
                    onClick={() => setTargetFilter('infant')}
                    className={`py-1.5 px-1 rounded-md text-xs font-semibold text-center transition-all cursor-pointer ${
                      targetFilter === 'infant'
                        ? 'bg-indigo-600 text-white shadow-sm'
                        : 'text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    👶 Bébé
                  </button>
                </div>
              </div>

              {/* Topic 3: Pregnancy Safety */}
              <div className="bg-slate-50/80 rounded-xl p-3 border border-slate-100 flex flex-col justify-between space-y-2">
                <div className="flex items-center justify-between text-xs font-bold text-slate-600">
                  <span className="flex items-center gap-1.5">
                    <span>🤰</span> Grossesse
                  </span>
                  <span className="text-[10px] text-slate-400 font-normal">Maternité</span>
                </div>
                <div className="grid grid-cols-3 gap-1 bg-white p-1 rounded-lg border border-slate-200/60">
                  <button
                    onClick={() => setPregnancyFilter('all')}
                    className={`py-1.5 px-1 rounded-md text-xs font-semibold text-center transition-all cursor-pointer ${
                      pregnancyFilter === 'all'
                        ? 'bg-teal-700 text-white shadow-sm'
                        : 'text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    Tous
                  </button>
                  <button
                    onClick={() => setPregnancyFilter('safe')}
                    className={`py-1.5 px-1 rounded-md text-[11px] font-semibold text-center transition-all cursor-pointer ${
                      pregnancyFilter === 'safe'
                        ? 'bg-emerald-600 text-white shadow-sm'
                        : 'text-emerald-700 hover:bg-emerald-50'
                    }`}
                  >
                    ✓ Autorisé
                  </button>
                  <button
                    onClick={() => setPregnancyFilter('discouraged')}
                    className={`py-1.5 px-1 rounded-md text-[11px] font-semibold text-center transition-all cursor-pointer ${
                      pregnancyFilter === 'discouraged'
                        ? 'bg-rose-600 text-white shadow-sm'
                        : 'text-rose-700 hover:bg-rose-50'
                    }`}
                  >
                    ⚠️ Risque
                  </button>
                </div>
              </div>
            </div>

            {/* Pathologies / Categories Grid */}
            <div className="bg-slate-50/80 rounded-xl p-3.5 border border-slate-100 space-y-2.5">
              <div className="flex items-center justify-between text-xs font-bold text-slate-700">
                <span className="flex items-center gap-1.5">
                  <Activity className="w-4 h-4 text-emerald-600" />
                  Pathologies & Symptômes
                </span>
                <span className="text-[10px] text-slate-400 font-normal">Catégories médicales</span>
              </div>
              
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-2">
                {CATEGORIES.map((cat) => {
                  const isSelected = selectedCategory === cat.id;
                  return (
                    <button
                      key={cat.id}
                      onClick={() => setSelectedCategory(cat.id)}
                      className={`flex items-center justify-center gap-2 p-2.5 rounded-xl border text-xs font-semibold transition-all cursor-pointer ${
                        isSelected
                          ? 'bg-emerald-600 text-white border-emerald-600 shadow-sm'
                          : 'bg-white text-slate-700 border-slate-200/80 hover:bg-slate-100 hover:border-slate-300'
                      }`}
                    >
                      <span className="text-base leading-none">{cat.icon}</span>
                      <span className="truncate">{cat.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Catalog Grid */}
      {selectedMed ? (
        // Med Fiche view (Medication Details)
        <div className="bg-white rounded-2xl border border-slate-100 shadow-md overflow-hidden">
          {/* Header block with flags */}
          <div className="bg-gradient-to-r from-emerald-500 to-teal-600 text-white p-6 relative">
            <button
              onClick={() => setSelectedMed(null)}
              className="absolute left-4 top-4 bg-white/20 hover:bg-white/35 text-white text-xs font-semibold px-3 py-1.5 rounded-lg backdrop-blur-sm transition-all cursor-pointer"
            >
              ← Retour
            </button>
            
            <div className="text-center mt-6">
              <div className="flex items-center justify-center gap-2 mt-3">
                <span className="text-xs uppercase font-extrabold tracking-widest bg-white/15 px-3 py-1 rounded-full text-white/90">
                  Fiche d'Équivalence Médicamenteuse
                </span>
                <span className="text-xs font-bold px-3 py-1 rounded-full bg-white text-emerald-800 shadow-sm">
                  {selectedMed.targetGroup === 'infant' ? '👶 Nourrisson' :
                   selectedMed.targetGroup === 'child' ? '👦 Enfant' :
                   selectedMed.targetGroup === 'adult' ? '🧑 Adulte' : '👥 Tous publics'}
                </span>
              </div>
              
              <div className="flex items-center justify-center gap-6 mt-4 flex-wrap">
                <div className="text-right">
                  <div className="flex items-center justify-end gap-1.5">
                    <span className="text-xl">🇫🇷</span>
                    <span className="text-xs font-semibold text-emerald-100">En France :</span>
                  </div>
                  <h3 className="text-2xl font-black">{selectedMed.nameFr}</h3>
                </div>

                <div className="w-8 h-8 rounded-full bg-white/25 flex items-center justify-center backdrop-blur-sm">
                  <ArrowLeftRight className="w-4 h-4 text-white" />
                </div>

                <div className="text-left">
                  <div className="flex items-center justify-start gap-1.5">
                    <span className="text-xl">🇺🇸</span>
                    <span className="text-xs font-semibold text-emerald-100">Aux USA :</span>
                  </div>
                  <h3 className="text-2xl font-black text-white">{selectedMed.nameUs}</h3>
                </div>
              </div>

              {/* Molecule */}
              <p className="text-xs text-emerald-50/90 mt-4 max-w-md mx-auto italic font-medium">
                Principe actif : {selectedMed.activeIngredientFr} ({selectedMed.activeIngredientUs})
              </p>
            </div>
          </div>

          <div className="p-6 space-y-6">
            {/* Description split */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
                <div className="flex items-center gap-1 mb-2">
                  <span className="text-sm">🇫🇷</span>
                  <h4 className="text-xs font-bold text-slate-500 uppercase">Usage & Description (FR)</h4>
                </div>
                <p className="text-sm text-slate-700 leading-relaxed">{selectedMed.descriptionFr}</p>
                <div className="mt-3 text-xs flex items-center gap-1 text-slate-500">
                  <span className="font-semibold">Catégorie :</span>
                  <span className="bg-slate-200 text-slate-800 px-2 py-0.5 rounded-full font-medium">
                    {selectedMed.classFr}
                  </span>
                </div>
              </div>

              <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
                <div className="flex items-center gap-1 mb-2">
                  <span className="text-sm">🇺🇸</span>
                  <h4 className="text-xs font-bold text-slate-500 uppercase">Usage & Description (US)</h4>
                </div>
                <p className="text-sm text-slate-700 leading-relaxed">{selectedMed.descriptionUs}</p>
                <div className="mt-3 text-xs flex items-center gap-1 text-slate-500">
                  <span className="font-semibold">Category:</span>
                  <span className="bg-slate-200 text-slate-800 px-2 py-0.5 rounded-full font-medium">
                    {selectedMed.classUs}
                  </span>
                </div>
              </div>
            </div>

            {/* Custom patient dosage recommendation */}
            {activeProfile && (
              <div className="bg-emerald-50 border border-emerald-200 p-4 rounded-xl shadow-sm">
                <div className="flex items-center justify-between mb-3">
                  <h4 className="text-sm font-bold text-emerald-800 flex items-center gap-1.5">
                    <CheckCircle className="w-4 h-4 text-emerald-600" />
                    Posologie Personnalisée pour : {activeProfile.name}
                  </h4>
                  <span className="text-[10px] bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded font-extrabold uppercase">
                    Calculateur IA
                  </span>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-2 text-xs text-slate-700">
                  <div className="space-y-1">
                    <p className="font-bold text-slate-500">En Français :</p>
                    <p className="bg-white/80 p-2.5 rounded-lg border border-emerald-100 text-emerald-950 font-medium">
                      {getCustomDosage(selectedMed, activeProfile)?.textFr}
                    </p>
                  </div>
                  <div className="space-y-1">
                    <p className="font-bold text-slate-500">In English :</p>
                    <p className="bg-white/80 p-2.5 rounded-lg border border-emerald-100 text-emerald-950 font-medium">
                      {getCustomDosage(selectedMed, activeProfile)?.textUs}
                    </p>
                  </div>
                </div>

                <p className="text-[10px] text-emerald-600/80 mt-2.5 text-right font-medium">
                  * Basé sur : {activeProfile.age} ans, {activeProfile.weight} kg
                </p>
              </div>
            )}

            {/* Standard Dosages */}
            <div className="space-y-3">
              <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Posologies Standards de Référence</h4>
              <div className="border border-slate-100 rounded-xl overflow-hidden divide-y divide-slate-100">
                <div className="grid grid-cols-1 md:grid-cols-2 p-3 bg-slate-50/50 text-xs">
                  <div className="p-1">
                    <p className="font-bold text-slate-700">Posologie Adulte (France)</p>
                    <p className="text-slate-600 mt-1">{selectedMed.dosageAdultFr}</p>
                  </div>
                  <div className="p-1 border-t md:border-t-0 md:border-l border-slate-100">
                    <p className="font-bold text-slate-700">Adult Dosage (USA)</p>
                    <p className="text-slate-600 mt-1">{selectedMed.dosageAdultUs}</p>
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 p-3 bg-slate-50/50 text-xs">
                  <div className="p-1">
                    <p className="font-bold text-slate-700">Posologie Enfant (France)</p>
                    <p className="text-slate-600 mt-1">{selectedMed.dosageChildFr}</p>
                  </div>
                  <div className="p-1 border-t md:border-t-0 md:border-l border-slate-100">
                    <p className="font-bold text-slate-700">Pediatric Dosage (USA)</p>
                    <p className="text-slate-600 mt-1">{selectedMed.dosageChildUs}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Prescription Status and Side Effects */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
              <div className="border border-slate-100 rounded-xl p-4 space-y-3">
                <h5 className="font-bold text-slate-700 flex items-center gap-1">
                  <HelpCircle className="w-4 h-4 text-slate-500" />
                  Réglementation & Ordonnance
                </h5>
                <div className="flex gap-4">
                  <div className="flex-1 bg-slate-50 p-2.5 rounded-lg text-center">
                    <p className="text-slate-400 font-bold text-[10px]">FRANCE</p>
                    <p className={`font-black text-sm mt-1 ${selectedMed.requiresPrescriptionFr ? 'text-red-600' : 'text-emerald-600'}`}>
                      {selectedMed.requiresPrescriptionFr ? 'Sur Ordonnance' : 'Vente Libre (OTC)'}
                    </p>
                  </div>
                  <div className="flex-1 bg-slate-50 p-2.5 rounded-lg text-center">
                    <p className="text-slate-400 font-bold text-[10px]">USA</p>
                    <p className={`font-black text-sm mt-1 ${selectedMed.requiresPrescriptionUs ? 'text-red-600' : 'text-emerald-600'}`}>
                      {selectedMed.requiresPrescriptionUs ? 'Prescription (Rx)' : 'Over-The-Counter'}
                    </p>
                  </div>
                </div>
              </div>

              <div className="border border-slate-100 rounded-xl p-4 space-y-2">
                <h5 className="font-bold text-slate-700 flex items-center gap-1">
                  <ShieldAlert className="w-4 h-4 text-amber-500" />
                  Précautions Importantes
                </h5>
                <p className="text-amber-800 bg-amber-50 p-2.5 rounded-lg font-medium leading-relaxed">
                  <strong>FR :</strong> {selectedMed.precautionsFr}<br/>
                  <strong className="block mt-1">US :</strong> {selectedMed.precautionsUs}
                </p>
              </div>
            </div>

            {/* Pregnancy Safety Banner */}
            <div className={`p-4 rounded-xl border text-xs space-y-1 ${
              selectedMed.unsafeForPregnancy 
                ? 'bg-rose-50 border-rose-200 text-rose-900' 
                : 'bg-teal-50 border-teal-200 text-teal-900'
            }`}>
              <h5 className="font-extrabold flex items-center gap-1.5 text-sm">
                <span>🤰</span>
                {selectedMed.unsafeForPregnancy 
                  ? '⚠️ ATTENTION : DÉCONSEILLÉ OU CONTRE-INDIQUÉ PENDANT LA GROSSESSE' 
                  : '✓ COMPATIBILITÉ GROSSESSE (Sous réserve d\'avis médical)'}
              </h5>
              <p className="font-medium leading-relaxed">
                {selectedMed.pregnancyWarningFr || (
                  selectedMed.unsafeForPregnancy
                    ? 'Ce médicament présente des risques connus pour la mère ou le fœtus. Consultez impérativement votre médecin ou pharmacien avant toute prise.'
                    : 'Ce médicament est généralement considéré comme sans risque majeur pendant la grossesse lorsqu\'il est pris selon les doses recommandées.'
                )}
              </p>
            </div>

            {/* Side effects list */}
            <div className="border border-slate-100 rounded-xl p-4 text-xs space-y-2">
              <h5 className="font-bold text-slate-700">Effets Secondaires Possibles</h5>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <p className="font-semibold text-slate-500 mb-1">Effets (FR) :</p>
                  <ul className="list-disc pl-4 space-y-1 text-slate-600">
                    {selectedMed.sideEffectsFr.map((item, idx) => (
                      <li key={idx}>{item}</li>
                    ))}
                  </ul>
                </div>
                <div>
                  <p className="font-semibold text-slate-500 mb-1">Side Effects (US) :</p>
                  <ul className="list-disc pl-4 space-y-1 text-slate-600">
                    {selectedMed.sideEffectsUs.map((item, idx) => (
                      <li key={idx}>{item}</li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>

            {/* Purchase & Favorites Controls */}
            <div className="flex flex-wrap gap-3 pt-2">
              <button
                onClick={() => toggleFavorite(selectedMed.id)}
                className={`flex-1 shrink-0 flex items-center justify-center gap-2 px-5 py-3 rounded-xl border text-sm font-bold transition-all cursor-pointer ${
                  favorites.includes(selectedMed.id)
                    ? 'bg-rose-50 border-rose-200 text-rose-600 hover:bg-rose-100'
                    : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                }`}
              >
                <Heart className={`w-4 h-4 ${favorites.includes(selectedMed.id) ? 'fill-rose-500 text-rose-500' : ''}`} />
                {favorites.includes(selectedMed.id) ? 'Enregistré dans mes favoris' : 'Ajouter aux favoris'}
              </button>

              <div className="flex gap-2 w-full md:w-auto">
                <a
                  href={selectedMed.amazonSearchUrlFr}
                  target="_blank"
                  referrerPolicy="no-referrer"
                  className="flex-1 flex items-center justify-center gap-2 bg-amber-50 hover:bg-amber-100 border border-amber-200 text-amber-900 px-4 py-3 rounded-xl text-xs font-bold transition-colors text-center"
                >
                  <ShoppingBag className="w-4 h-4 text-amber-700" />
                  Amazon FR 🇫🇷
                </a>
                <a
                  href={selectedMed.amazonSearchUrlUs}
                  target="_blank"
                  referrerPolicy="no-referrer"
                  className="flex-1 flex items-center justify-center gap-2 bg-amber-50 hover:bg-amber-100 border border-amber-200 text-amber-900 px-4 py-3 rounded-xl text-xs font-bold transition-colors text-center"
                >
                  <ShoppingBag className="w-4 h-4 text-amber-700" />
                  Amazon US 🇺🇸
                </a>
              </div>
            </div>
          </div>
        </div>
      ) : (
        // Med List Grid
        <div>
          {filteredMeds.length === 0 ? (
            <div className="text-center py-10 bg-white rounded-2xl border border-slate-100">
              <p className="text-slate-400 text-sm font-medium">Aucun médicament trouvé pour cette recherche.</p>
              <button
                onClick={() => { setSearchQuery(''); setSelectedCategory('all'); }}
                className="mt-3 text-xs font-semibold text-emerald-600 hover:text-emerald-700 bg-emerald-50 px-3 py-1.5 rounded-lg"
              >
                Réinitialiser la recherche
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {filteredMeds.map((med) => {
                const isFavorite = favorites.includes(med.id);
                
                // Show custom representation depending on French / US filter highlight
                const primaryName = filterMode === 'us_to_fr' ? med.nameUs : med.nameFr;
                const equivalentName = filterMode === 'us_to_fr' ? med.nameFr : med.nameUs;
                const primaryFlag = filterMode === 'us_to_fr' ? '🇺🇸' : '🇫🇷';
                const eqFlag = filterMode === 'us_to_fr' ? '🇫🇷' : '🇺🇸';

                return (
                  <div
                    key={med.id}
                    onClick={() => {
                      errorService.action(`Catalogue - Sélection du médicament: "${med.nameFr} / ${med.nameUs}"`);
                      setSelectedMed(med);
                    }}
                    className="bg-white rounded-xl border border-slate-100 p-5 hover:border-emerald-200 hover:shadow-sm transition-all cursor-pointer flex flex-col justify-between group relative"
                  >
                    {/* Top line with category icon, target badge & favorite button */}
                    <div className="flex justify-between items-start gap-2">
                      <div className="flex flex-wrap items-center gap-1.5">
                        <span className="bg-slate-50 text-slate-800 text-[10px] font-bold px-2 py-1 rounded-full border border-slate-100 uppercase">
                          {med.category === 'pain' ? '🤒 Douleur' : 
                           med.category === 'cold' ? '🤧 Rhume' : 
                           med.category === 'stomach' ? '🤢 Digestion' : 
                           med.category === 'allergy' ? '🌸 Allergie' : 
                           med.category === 'skin' ? '🧴 Peau' : '💊 Autre'}
                        </span>

                        <span className={`text-[10px] font-bold px-2 py-1 rounded-full border ${
                          med.targetGroup === 'infant' ? 'bg-purple-50 text-purple-700 border-purple-200' :
                          med.targetGroup === 'child' ? 'bg-blue-50 text-blue-700 border-blue-200' :
                          med.targetGroup === 'adult' ? 'bg-amber-50 text-amber-700 border-amber-200' :
                          'bg-emerald-50 text-emerald-700 border-emerald-200'
                        }`}>
                          {med.targetGroup === 'infant' ? '👶 Nourrisson' :
                           med.targetGroup === 'child' ? '👦 Enfant' :
                           med.targetGroup === 'adult' ? '🧑 Adulte' : '👥 Tous'}
                        </span>

                        {med.unsafeForPregnancy ? (
                          <span className="text-[10px] font-bold px-2 py-1 rounded-full bg-rose-50 text-rose-700 border border-rose-200 flex items-center gap-1">
                            🤰 Déconseillé Grossesse
                          </span>
                        ) : (
                          <span className="text-[10px] font-bold px-2 py-1 rounded-full bg-teal-50 text-teal-700 border border-teal-200 flex items-center gap-1">
                            🤰 Autorisé Grossesse
                          </span>
                        )}
                      </div>
                      
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          errorService.action((isFavorite ? "Favoris - Retrait de " : "Favoris - Ajout de ") + `"${med.nameFr} / ${med.nameUs}"`);
                          toggleFavorite(med.id);
                        }}
                        className="p-1.5 text-slate-400 hover:text-rose-500 rounded-full hover:bg-rose-50 transition-colors cursor-pointer shrink-0"
                        title={isFavorite ? "Retirer des favoris" : "Ajouter aux favoris"}
                      >
                        <Heart className={`w-4 h-4 ${isFavorite ? 'fill-rose-500 text-rose-500' : ''}`} />
                      </button>
                    </div>

                    {/* Content comparison display */}
                    <div className="mt-3 space-y-2">
                      <div>
                        <div className="flex items-center gap-1 text-slate-400 text-[10px] font-bold uppercase tracking-wider">
                          <span>{primaryFlag} Original</span>
                        </div>
                        <h3 className="font-extrabold text-slate-800 text-base">{primaryName}</h3>
                      </div>

                      <div className="flex items-center gap-2">
                        <div className="h-[1px] bg-slate-100 flex-1"></div>
                        <span className="text-[10px] text-slate-300 font-bold uppercase">Équivalent</span>
                        <div className="h-[1px] bg-slate-100 flex-1"></div>
                      </div>

                      <div>
                        <div className="flex items-center gap-1 text-slate-400 text-[10px] font-bold uppercase tracking-wider">
                          <span>{eqFlag} Équivalent</span>
                        </div>
                        <h4 className="font-bold text-emerald-600 text-sm group-hover:underline">
                          {equivalentName}
                        </h4>
                      </div>

                      <p className="text-xs text-slate-400 line-clamp-2 pt-1 leading-relaxed">
                        Molécule : {med.activeIngredientFr} ({med.activeIngredientUs})
                      </p>
                    </div>

                    {/* Prescription status details */}
                    <div className="border-t border-slate-50 pt-3 mt-4 flex items-center justify-between text-[10px] font-bold text-slate-400">
                      <span className="flex items-center gap-1">
                        <span className="text-xs">🇫🇷</span>
                        <span className={med.requiresPrescriptionFr ? 'text-amber-600' : 'text-slate-500'}>
                          {med.requiresPrescriptionFr ? 'Sur ordonnance' : 'Vente libre'}
                        </span>
                      </span>
                      <span className="flex items-center gap-1">
                        <span className="text-xs">🇺🇸</span>
                        <span className={med.requiresPrescriptionUs ? 'text-amber-600' : 'text-slate-500'}>
                          {med.requiresPrescriptionUs ? 'Rx required' : 'OTC'}
                        </span>
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
