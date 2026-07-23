import React, { useState, useEffect } from 'react';
import { CabinetItem, TreatmentLog, UserProfile } from '../types';
import { MEDICATIONS_DATABASE } from '../data/medications';
import { errorService } from '../services/errorService';
import { 
  Plus, Trash2, Edit, AlertCircle, CheckCircle, Package, 
  Clock, Calendar, CheckSquare, PlusCircle, Sparkles, HeartPulse, 
  Info, CornerDownRight, RefreshCw, ChevronRight, UserMinus, ShieldCheck
} from 'lucide-react';

interface MedicineCabinetProps {
  activeProfile: UserProfile | null;
  profiles: UserProfile[];
}

export default function MedicineCabinet({ activeProfile, profiles }: MedicineCabinetProps) {
  const [cabinet, setCabinet] = useState<CabinetItem[]>([]);
  const [treatments, setTreatments] = useState<TreatmentLog[]>([]);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Form states for adding medication to cabinet
  const [showAddMedForm, setShowAddMedForm] = useState(false);
  const [cabinetMedName, setCabinetMedName] = useState('');
  const [cabinetActiveIngredient, setCabinetActiveIngredient] = useState('');
  const [cabinetCountry, setCabinetCountry] = useState<'FR' | 'US'>('FR');
  const [cabinetStock, setCabinetStock] = useState(30);
  const [cabinetExpiry, setCabinetExpiry] = useState('');
  const [cabinetNotes, setCabinetNotes] = useState('');

  // Form states for adding treatment schedule
  const [showAddTreatmentForm, setShowAddTreatmentForm] = useState(false);
  const [treatmentMedName, setTreatmentMedName] = useState('');
  const [treatmentDosage, setTreatmentDosage] = useState('1 comprimé');
  const [treatmentFrequency, setTreatmentFrequency] = useState('3 fois par jour');
  const [selectedTimes, setSelectedTimes] = useState<string[]>(['Matin', 'Midi', 'Soir']);
  const [treatmentDays, setTreatmentDays] = useState(7);

  // Load from local storage on mount
  useEffect(() => {
    const savedCabinet = localStorage.getItem('pharmacie_cabinet');
    const savedTreatments = localStorage.getItem('pharmacie_treatments');
    
    if (savedCabinet) {
      try { setCabinet(JSON.parse(savedCabinet)); } catch(e) { console.error(e); }
    } else {
      // Seed initial mock cabinet items
      const seedCabinet: CabinetItem[] = [
        {
          id: 'seed-1',
          medicationName: 'Doliprane 1000mg',
          activeIngredient: 'Paracétamol',
          country: 'FR',
          stockQuantity: 12,
          initialQuantity: 16,
          expirationDate: '2027-12-31',
          lowStockAlert: true,
          notes: 'Pour maux de tête passagers.'
        },
        {
          id: 'seed-2',
          medicationName: 'Advil Liqui-Gels 200mg',
          activeIngredient: 'Ibuprofen',
          country: 'US',
          stockQuantity: 4,
          initialQuantity: 50,
          expirationDate: '2026-09-15',
          lowStockAlert: true,
          notes: 'Courbatures ou fièvre.'
        }
      ];
      setCabinet(seedCabinet);
      localStorage.setItem('pharmacie_cabinet', JSON.stringify(seedCabinet));
    }

    if (savedTreatments) {
      try { setTreatments(JSON.parse(savedTreatments)); } catch(e) { console.error(e); }
    } else {
      // Seed treatment
      const seedTreatments: TreatmentLog[] = [
        {
          id: 'treat-1',
          profileId: activeProfile?.id || 'default-id',
          medicationName: 'Doliprane 1000mg',
          dosage: '1 comprimé',
          frequency: '3 fois par jour',
          timeOfDay: ['Matin', 'Midi', 'Soir'],
          startDate: new Date().toISOString().split('T')[0],
          isActive: true,
          takenHistory: []
        }
      ];
      setTreatments(seedTreatments);
      localStorage.setItem('pharmacie_treatments', JSON.stringify(seedTreatments));
    }
  }, []);

  // Save changes helper
  const saveCabinet = (newCabinet: CabinetItem[]) => {
    setCabinet(newCabinet);
    localStorage.setItem('pharmacie_cabinet', JSON.stringify(newCabinet));
  };

  const saveTreatments = (newTreatments: TreatmentLog[]) => {
    setTreatments(newTreatments);
    localStorage.setItem('pharmacie_treatments', JSON.stringify(newTreatments));
  };

  // Triggers self-clearing toast banner
  const triggerSuccess = (msg: string) => {
    setSuccessMsg(msg);
    setTimeout(() => {
      setSuccessMsg(null);
    }, 4000);
  };

  // Add medicine to inventory box
  const handleAddCabinetItem = (e: React.FormEvent) => {
    e.preventDefault();
    if (!cabinetMedName) return;

    errorService.action(`Armoire à pharmacie - Ajout de médicament: ${cabinetMedName}`);
    const newItem: CabinetItem = {
      id: `cab-${Date.now()}`,
      medicationName: cabinetMedName,
      activeIngredient: cabinetActiveIngredient || 'Non spécifié',
      country: cabinetCountry,
      stockQuantity: Number(cabinetStock),
      initialQuantity: Number(cabinetStock),
      expirationDate: cabinetExpiry || undefined,
      lowStockAlert: Number(cabinetStock) <= 5,
      notes: cabinetNotes || undefined
    };

    const updated = [newItem, ...cabinet];
    saveCabinet(updated);
    errorService.success(`Médicament "${cabinetMedName}" ajouté avec succès (stock: ${cabinetStock})`);
    triggerSuccess(`"${cabinetMedName}" a bien été ajouté à votre armoire à pharmacie.`);

    // Reset fields
    setCabinetMedName('');
    setCabinetActiveIngredient('');
    setCabinetStock(30);
    setCabinetExpiry('');
    setCabinetNotes('');
    setShowAddMedForm(false);
  };

  // Quick fill medication inputs from catalog lookup selection
  const handleQuickLookup = (medId: string) => {
    const med = MEDICATIONS_DATABASE.find(m => m.id === medId);
    if (med) {
      errorService.action(`Armoire à pharmacie - Remplissage rapide depuis le catalogue: ${med.nameFr || med.nameUs}`);
      setCabinetMedName(cabinetCountry === 'FR' ? med.nameFr : med.nameUs);
      setCabinetActiveIngredient(cabinetCountry === 'FR' ? med.activeIngredientFr : med.activeIngredientUs);
    }
  };

  const handleDeleteCabinetItem = (id: string, name: string) => {
    if (confirm(`Voulez-vous retirer "${name}" de votre armoire à pharmacie ?`)) {
      errorService.action(`Armoire à pharmacie - Suppression de médicament: ${name}`);
      const updated = cabinet.filter(item => item.id !== id);
      saveCabinet(updated);
      errorService.success(`Médicament "${name}" supprimé avec succès`);
      triggerSuccess(`"${name}" a été supprimé.`);
    }
  };

  // Set alert low stock trigger
  const handleUpdateStock = (id: string, delta: number) => {
    const updated = cabinet.map(item => {
      if (item.id === id) {
        const newStock = Math.max(0, item.stockQuantity + delta);
        errorService.action(`Armoire à pharmacie - Mise à jour du stock de "${item.medicationName}": ${item.stockQuantity} -> ${newStock}`);
        return {
          ...item,
          stockQuantity: newStock,
          lowStockAlert: newStock <= 5
        };
      }
      return item;
    });
    saveCabinet(updated);
  };

  // Create Treatment log
  const handleAddTreatment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!treatmentMedName || !activeProfile) return;

    errorService.action(`Suivi - Ajout de traitement: "${treatmentMedName}" pour ${activeProfile.name}`);
    const newItem: TreatmentLog = {
      id: `treat-${Date.now()}`,
      profileId: activeProfile.id,
      medicationName: treatmentMedName,
      dosage: treatmentDosage,
      frequency: treatmentFrequency,
      timeOfDay: selectedTimes,
      startDate: new Date().toISOString().split('T')[0],
      isActive: true,
      takenHistory: []
    };

    const updated = [newItem, ...treatments];
    saveTreatments(updated);
    errorService.success(`Traitement "${treatmentMedName}" créé pour ${activeProfile.name}`);
    triggerSuccess(`Nouveau traitement ajouté pour ${activeProfile.name}.`);

    // Reset
    setTreatmentMedName('');
    setTreatmentDosage('1 comprimé');
    setTreatmentFrequency('3 fois par jour');
    setSelectedTimes(['Matin', 'Midi', 'Soir']);
    setShowAddTreatmentForm(false);
  };

  const handleDeleteTreatment = (id: string) => {
    const treatment = treatments.find(t => t.id === id);
    if (treatment) {
      errorService.action(`Suivi - Suppression de traitement: "${treatment.medicationName}"`);
    }
    const updated = treatments.filter(t => t.id !== id);
    saveTreatments(updated);
    errorService.success("Traitement retiré du journal.");
    triggerSuccess("Traitement retiré du journal.");
  };

  // Register taking medication dose!
  // This is highly functional because it checks if the medicine exists in the Cabinet inventory,
  // and decrements the inventory quantity by 1 dose!
  const handleLogDoseTaken = (treatmentId: string, timeOfDayLabel: string) => {
    const todayStr = new Date().toISOString().split('T')[0];
    
    // Find treatment
    const treatment = treatments.find(t => t.id === treatmentId);
    if (!treatment) return;

    errorService.action(`Suivi - Prise de dose pour: "${treatment.medicationName}" (${timeOfDayLabel})`);

    // Check if dose has already been taken for this specific slot today to avoid double counts
    const alreadyTaken = treatment.takenHistory.some(history => {
      const isSameDay = history.timestamp.startsWith(todayStr);
      return isSameDay && history.timestamp.includes(`(${timeOfDayLabel})`);
    });

    if (alreadyTaken) {
      errorService.log(`La dose de (${timeOfDayLabel}) de "${treatment.medicationName}" a déjà été prise aujourd'hui`, 'error');
      alert(`Dose de (${timeOfDayLabel}) déjà enregistrée pour aujourd'hui !`);
      return;
    }

    // Try to decrement stock of matched cabinet item
    let stockFound = false;
    const cabinetMatch = cabinet.find(item => 
      item.medicationName.toLowerCase().includes(treatment.medicationName.toLowerCase()) ||
      treatment.medicationName.toLowerCase().includes(item.medicationName.toLowerCase())
    );

    if (cabinetMatch) {
      if (cabinetMatch.stockQuantity <= 0) {
        if (!confirm(`Attention ! "${cabinetMatch.medicationName}" est marqué en rupture de stock (0 restants) dans votre armoire. Voulez-vous quand même enregistrer la prise ?`)) {
          errorService.info(`Prise de dose annulée par l'utilisateur car rupture de stock`);
          return;
        }
      } else {
        handleUpdateStock(cabinetMatch.id, -1);
        stockFound = true;
      }
    }

    // Append to history log
    const updatedTreatments = treatments.map(t => {
      if (t.id === treatmentId) {
        return {
          ...t,
          takenHistory: [
            {
              timestamp: `${todayStr} à ${new Date().toLocaleTimeString('fr-FR', {hour: '2-digit', minute:'2-digit'})} (${timeOfDayLabel})`,
              takenBy: activeProfile ? activeProfile.name : "Patient"
            },
            ...t.takenHistory
          ]
        };
      }
      return t;
    });

    saveTreatments(updatedTreatments);
    
    let alertMsg = `Prise enregistrée avec succès.`;
    if (stockFound && cabinetMatch) {
      alertMsg += ` Le stock de "${cabinetMatch.medicationName}" a été décrémenté (Reste : ${cabinetMatch.stockQuantity - 1}).`;
    }
    errorService.success(`Prise enregistrée pour "${treatment.medicationName}" (${timeOfDayLabel})`);
    triggerSuccess(alertMsg);
  };

  // Check if expiration is within 1 month or in the past
  const checkExpiryStatus = (expiryStr?: string) => {
    if (!expiryStr) return 'ok';
    const expiryDate = new Date(expiryStr);
    const today = new Date();
    
    if (expiryDate <= today) {
      return 'expired';
    }

    // within 30 days
    const diffTime = expiryDate.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    if (diffDays <= 30) {
      return 'soon';
    }
    return 'ok';
  };

  // Filter treatments for active profile
  const activeProfileTreatments = treatments.filter(t => t.profileId === activeProfile?.id);

  return (
    <div className="space-y-6">
      
      {/* Toast Notification */}
      {successMsg && (
        <div className="bg-emerald-600 text-white font-semibold text-xs px-4 py-3 rounded-xl shadow-lg border border-emerald-500/10 flex items-center gap-2 animate-bounce-short fixed bottom-4 right-4 z-50">
          <CheckCircle className="w-4 h-4 text-emerald-100 shrink-0" />
          <p>{successMsg}</p>
        </div>
      )}

      {/* Intro visual banner */}
      <div className="bg-white rounded-2xl border border-slate-100 p-5 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-indigo-50 rounded-lg text-indigo-600">
              <Package className="w-5 h-5" />
            </div>
            <div>
              <h2 className="font-bold text-slate-800 text-lg">Mon Armoire & Journal Santé</h2>
              <p className="text-xs text-slate-400">Gérez vos boîtes physiques en stock et suivez l'assiduité de vos prises</p>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                setShowAddMedForm(!showAddMedForm);
                setShowAddTreatmentForm(false);
              }}
              className="px-3 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl flex items-center gap-1 transition-all shadow-sm cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" /> Ajouter une boîte
            </button>
            <button
              onClick={() => {
                setShowAddTreatmentForm(!showAddTreatmentForm);
                setShowAddMedForm(false);
              }}
              disabled={!activeProfile}
              className="px-3 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl flex items-center gap-1 transition-all shadow-sm cursor-pointer disabled:opacity-50"
            >
              <Clock className="w-3.5 h-3.5" /> Programmer un traitement
            </button>
          </div>
        </div>
      </div>

      {/* Add Box Form */}
      {showAddMedForm && (
        <form onSubmit={handleAddCabinetItem} className="bg-white rounded-2xl border-2 border-indigo-500 p-5 shadow-md space-y-4 animate-fade-in">
          <div className="flex items-center justify-between border-b border-slate-50 pb-2">
            <h3 className="font-bold text-slate-800 text-sm flex items-center gap-1">
              <PlusCircle className="w-4 h-4 text-indigo-500" /> Ajouter une boîte dans mon armoire
            </h3>
            <button 
              type="button" 
              onClick={() => setShowAddMedForm(false)}
              className="text-xs text-slate-400 hover:text-slate-600 font-bold"
            >
              Fermer
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
            <div className="space-y-1">
              <label className="font-bold text-slate-600 block">Nom du médicament :</label>
              <input
                type="text"
                required
                placeholder="Ex : Doliprane 1000mg, Advil..."
                value={cabinetMedName}
                onChange={(e) => setCabinetMedName(e.target.value)}
                className="w-full p-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
              <div className="pt-1 flex flex-wrap gap-1 items-center">
                <span className="text-[9px] text-slate-400 font-bold">Remplissage rapide :</span>
                {MEDICATIONS_DATABASE.slice(0, 3).map(med => (
                  <button
                    key={med.id}
                    type="button"
                    onClick={() => handleQuickLookup(med.id)}
                    className="text-[9px] bg-slate-100 hover:bg-indigo-50 hover:text-indigo-600 px-1.5 py-0.5 rounded text-slate-500 font-medium"
                  >
                    {cabinetCountry === 'FR' ? med.nameFr : med.nameUs}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-1">
              <label className="font-bold text-slate-600 block">Molécule active (Optionnel) :</label>
              <input
                type="text"
                placeholder="Ex : Paracétamol, Ibuprofène..."
                value={cabinetActiveIngredient}
                onChange={(e) => setCabinetActiveIngredient(e.target.value)}
                className="w-full p-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-1">
                <label className="font-bold text-slate-600 block">Pays d'achat / Norme :</label>
                <div className="flex gap-1">
                  <button
                    type="button"
                    onClick={() => setCabinetCountry('FR')}
                    className={`flex-1 py-2 text-center rounded-lg border font-bold ${
                      cabinetCountry === 'FR'
                        ? 'border-indigo-500 bg-indigo-50 text-indigo-700'
                        : 'border-slate-200 hover:bg-slate-50 text-slate-500'
                    }`}
                  >
                    🇫🇷 France
                  </button>
                  <button
                    type="button"
                    onClick={() => setCabinetCountry('US')}
                    className={`flex-1 py-2 text-center rounded-lg border font-bold ${
                      cabinetCountry === 'US'
                        ? 'border-indigo-500 bg-indigo-50 text-indigo-700'
                        : 'border-slate-200 hover:bg-slate-50 text-slate-500'
                    }`}
                  >
                    🇺🇸 USA
                  </button>
                </div>
              </div>

              <div className="space-y-1">
                <label className="font-bold text-slate-600 block">Quantité de pilules / doses :</label>
                <input
                  type="number"
                  min="1"
                  max="500"
                  required
                  value={cabinetStock}
                  onChange={(e) => setCabinetStock(Number(e.target.value))}
                  className="w-full p-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-1">
                <label className="font-bold text-slate-600 block">Date de péremption :</label>
                <input
                  type="date"
                  value={cabinetExpiry}
                  onChange={(e) => setCabinetExpiry(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div className="space-y-1">
                <label className="font-bold text-slate-600 block">Notes de placard :</label>
                <input
                  type="text"
                  placeholder="Ex : Boîte posée dans la cuisine..."
                  value={cabinetNotes}
                  onChange={(e) => setCabinetNotes(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
            </div>
          </div>

          <div className="pt-2 text-right">
            <button
              type="submit"
              className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl text-xs transition-colors shadow cursor-pointer"
            >
              Enregistrer dans l'armoire
            </button>
          </div>
        </form>
      )}

      {/* Add Treatment Program Form */}
      {showAddTreatmentForm && activeProfile && (
        <form onSubmit={handleAddTreatment} className="bg-white rounded-2xl border-2 border-emerald-500 p-5 shadow-md space-y-4 animate-fade-in">
          <div className="flex items-center justify-between border-b border-slate-50 pb-2">
            <h3 className="font-bold text-slate-800 text-sm flex items-center gap-1">
              <Clock className="w-4 h-4 text-emerald-500" /> Planifier un nouveau suivi de traitement
            </h3>
            <button 
              type="button" 
              onClick={() => setShowAddTreatmentForm(false)}
              className="text-xs text-slate-400 hover:text-slate-600 font-bold"
            >
              Fermer
            </button>
          </div>

          <div className="bg-emerald-50 text-emerald-800 p-3 rounded-xl text-xs flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-emerald-600 shrink-0" />
            <p>
              Ce traitement sera affecté à : <strong>{activeProfile.name}</strong>. Une fois configuré, vous pourrez cocher les prises quotidiennes, ce qui mettra automatiquement à jour les stocks de votre Armoire à Pharmacie !
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
            <div className="space-y-1">
              <label className="font-bold text-slate-600 block">Médicament à prendre :</label>
              <select
                required
                value={treatmentMedName}
                onChange={(e) => setTreatmentMedName(e.target.value)}
                className="w-full p-2.5 rounded-xl border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
              >
                <option value="">-- Sélectionnez un médicament --</option>
                {/* Populate from inventory stocks first */}
                {cabinet.map(item => (
                  <option key={item.id} value={item.medicationName}>
                    📦 Armoire : {item.medicationName} ({item.stockQuantity} restants)
                  </option>
                ))}
                {/* Populate from general DB if not in cabinet */}
                <option disabled>──────────</option>
                {MEDICATIONS_DATABASE.map(med => (
                  <option key={med.id} value={med.nameFr}>
                    🌐 Catalogue : {med.nameFr} (Doliprane, etc.)
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-1">
              <label className="font-bold text-slate-600 block">Posologie unitaire :</label>
              <input
                type="text"
                required
                value={treatmentDosage}
                onChange={(e) => setTreatmentDosage(e.target.value)}
                placeholder="Ex : 1 comprimé, 2 cuillères de sirop..."
                className="w-full p-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            <div className="space-y-1">
              <label className="font-bold text-slate-600 block">Créneaux de prise de la journée :</label>
              <div className="flex flex-wrap gap-2 pt-1">
                {['Matin', 'Midi', 'Soir', 'Coucher'].map(slot => {
                  const isSelected = selectedTimes.includes(slot);
                  return (
                    <button
                      key={slot}
                      type="button"
                      onClick={() => {
                        if (isSelected) {
                          setSelectedTimes(selectedTimes.filter(t => t !== slot));
                        } else {
                          setSelectedTimes([...selectedTimes, slot]);
                        }
                      }}
                      className={`px-3 py-1.5 rounded-lg border text-xs font-bold transition-all ${
                        isSelected
                          ? 'bg-emerald-600 border-emerald-600 text-white shadow'
                          : 'border-slate-200 bg-slate-50 text-slate-500'
                      }`}
                    >
                      {slot}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="space-y-1">
              <label className="font-bold text-slate-600 block">Fréquence ou consigne :</label>
              <input
                type="text"
                required
                value={treatmentFrequency}
                onChange={(e) => setTreatmentFrequency(e.target.value)}
                placeholder="Ex : 3 fois par jour au cours des repas..."
                className="w-full p-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>
          </div>

          <div className="pt-2 text-right">
            <button
              type="submit"
              className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-xs transition-colors shadow cursor-pointer"
            >
              Enregistrer le programme
            </button>
          </div>
        </form>
      )}

      {/* Main split display: Cabinet (Left) and Journal de Traitement (Right) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Left Column: Stocks and inventory */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-extrabold text-slate-700 text-sm flex items-center gap-1.5 uppercase tracking-wider">
              <Package className="w-4 h-4 text-indigo-500" /> Mon Armoire (Stocks physiques)
            </h3>
            <span className="text-slate-400 font-extrabold text-[10px] uppercase">{cabinet.length} Boîtes</span>
          </div>

          {cabinet.length === 0 ? (
            <div className="bg-white rounded-2xl border border-slate-100 p-8 text-center space-y-2">
              <Package className="w-10 h-10 text-slate-200 mx-auto" />
              <p className="font-semibold text-slate-700 text-sm">Votre armoire virtuelle est vide</p>
              <p className="text-xs text-slate-400">Ajoutez-y des boîtes de médicaments pour suivre les dates de péremption et les quantités.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {cabinet.map(item => {
                const expiryStatus = checkExpiryStatus(item.expirationDate);
                const isOutOfStock = item.stockQuantity === 0;

                return (
                  <div 
                    key={item.id} 
                    className={`bg-white rounded-xl border p-4 transition-all flex justify-between items-center ${
                      isOutOfStock 
                        ? 'border-red-100 bg-red-50/10' 
                        : expiryStatus === 'expired' 
                        ? 'border-red-200 bg-red-50/30' 
                        : expiryStatus === 'soon' 
                        ? 'border-amber-200 bg-amber-50/20' 
                        : 'border-slate-100 hover:border-slate-200'
                    }`}
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-1.5">
                        <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-slate-100 text-slate-500">
                          {item.country === 'FR' ? '🇫🇷 FR' : '🇺🇸 US'}
                        </span>
                        <h4 className="font-black text-slate-800 text-sm">{item.medicationName}</h4>
                      </div>
                      
                      <p className="text-[11px] text-slate-400">
                        Molécule : <span className="font-semibold text-slate-600">{item.activeIngredient}</span>
                      </p>

                      {item.notes && (
                        <p className="text-[10px] text-slate-400 italic">💡 {item.notes}</p>
                      )}

                      {/* Expiry alerts */}
                      {item.expirationDate && (
                        <div className="flex items-center gap-1 pt-1">
                          {expiryStatus === 'expired' && (
                            <span className="text-[9px] font-bold bg-red-100 text-red-800 px-2 py-0.5 rounded-full flex items-center gap-0.5">
                              <AlertCircle className="w-3 h-3 text-red-600" /> Expiré ! ({item.expirationDate})
                            </span>
                          )}
                          {expiryStatus === 'soon' && (
                            <span className="text-[9px] font-bold bg-amber-100 text-amber-800 px-2 py-0.5 rounded-full flex items-center gap-0.5">
                              <AlertCircle className="w-3 h-3 text-amber-600" /> Périme bientôt ({item.expirationDate})
                            </span>
                          )}
                          {expiryStatus === 'ok' && (
                            <span className="text-[9px] text-slate-400">
                              Périme le : <strong>{item.expirationDate}</strong>
                            </span>
                          )}
                        </div>
                      )}
                    </div>

                    {/* Quantity controls */}
                    <div className="flex items-center gap-3">
                      <div className="text-right">
                        <p className="text-[10px] text-slate-400 font-extrabold uppercase">Reste</p>
                        <p className={`text-lg font-black ${
                          isOutOfStock ? 'text-red-600' : item.lowStockAlert ? 'text-amber-600' : 'text-slate-800'
                        }`}>
                          {item.stockQuantity} <span className="text-xs font-normal">doses</span>
                        </p>
                        {item.lowStockAlert && !isOutOfStock && (
                          <span className="text-[8px] bg-amber-50 text-amber-700 border border-amber-200 px-1 rounded font-bold">Stock faible</span>
                        )}
                        {isOutOfStock && (
                          <span className="text-[8px] bg-red-100 text-red-800 border border-red-200 px-1 rounded font-bold uppercase">Épuisé</span>
                        )}
                      </div>

                      <div className="flex flex-col gap-1">
                        <button
                          onClick={() => handleUpdateStock(item.id, 1)}
                          className="p-1 hover:bg-slate-100 rounded text-slate-500 border border-slate-200 hover:text-indigo-600 transition-colors cursor-pointer text-xs font-bold"
                          title="Ajouter 1 dose"
                        >
                          +1
                        </button>
                        <button
                          onClick={() => handleUpdateStock(item.id, -1)}
                          className="p-1 hover:bg-slate-100 rounded text-slate-500 border border-slate-200 hover:text-red-500 transition-colors cursor-pointer text-xs font-bold"
                          title="Diminuer 1 dose"
                        >
                          -1
                        </button>
                      </div>

                      <button
                        onClick={() => handleDeleteCabinetItem(item.id, item.medicationName)}
                        className="p-2 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors cursor-pointer shrink-0"
                        title="Retirer de l'armoire"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Right Column: Treatment scheduler and logging */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-extrabold text-slate-700 text-sm flex items-center gap-1.5 uppercase tracking-wider">
              <Clock className="w-4 h-4 text-emerald-600" /> Journal de traitement {activeProfile ? `(${activeProfile.name})` : ''}
            </h3>
            <span className="text-slate-400 font-extrabold text-[10px] uppercase">
              {activeProfile ? `${activeProfileTreatments.length} en cours` : 'Aucun profil'}
            </span>
          </div>

          {!activeProfile ? (
            <div className="bg-white rounded-2xl border border-slate-100 p-8 text-center text-xs space-y-2">
              <Info className="w-8 h-8 text-blue-500 mx-auto" />
              <p className="font-bold text-slate-700">Sélectionnez ou créez un patient</p>
              <p className="text-slate-400">Vous devez activer un profil de patient dans la barre latérale pour activer le suivi des traitements.</p>
            </div>
          ) : activeProfileTreatments.length === 0 ? (
            <div className="bg-white rounded-2xl border border-slate-100 p-8 text-center space-y-3">
              <HeartPulse className="w-10 h-10 text-emerald-200 mx-auto animate-pulse" />
              <div>
                <p className="font-semibold text-slate-700 text-sm">Aucun traitement programmé</p>
                <p className="text-xs text-slate-400 mt-1">
                  Cliquez sur "Programmer un traitement" ci-dessus pour planifier vos prises et gérer vos rappels quotidiens.
                </p>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              {activeProfileTreatments.map(t => (
                <div key={t.id} className="bg-white rounded-xl border border-slate-100 p-4 space-y-3 shadow-sm hover:border-slate-200 transition-all">
                  <div className="flex justify-between items-start">
                    <div>
                      <h4 className="font-black text-slate-800 text-sm flex items-center gap-1.5">
                        <Clock className="w-4 h-4 text-emerald-600 shrink-0" />
                        {t.medicationName}
                      </h4>
                      <p className="text-[11px] text-slate-400 mt-0.5">
                        Posologie : <strong className="text-slate-700">{t.dosage}</strong> • {t.frequency}
                      </p>
                    </div>

                    <button
                      onClick={() => handleDeleteTreatment(t.id)}
                      className="p-1.5 text-slate-300 hover:text-red-500 rounded hover:bg-red-50 transition-colors cursor-pointer"
                      title="Supprimer ce traitement"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  {/* Daily check buttons */}
                  <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-100">
                    <p className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider mb-2">Enregistrer ma prise d'aujourd'hui :</p>
                    <div className="flex gap-1.5">
                      {t.timeOfDay.map(time => {
                        const todayStr = new Date().toISOString().split('T')[0];
                        const alreadyTaken = t.takenHistory.some(h => 
                          h.timestamp.startsWith(todayStr) && h.timestamp.includes(`(${time})`)
                        );

                        return (
                          <button
                            key={time}
                            onClick={() => handleLogDoseTaken(t.id, time)}
                            disabled={alreadyTaken}
                            className={`flex-1 py-1.5 rounded text-[10px] font-extrabold transition-all cursor-pointer ${
                              alreadyTaken
                                ? 'bg-emerald-100 text-emerald-800 border border-emerald-200 cursor-not-allowed'
                                : 'bg-white hover:bg-emerald-50 text-slate-700 border border-slate-200 hover:border-emerald-300'
                            }`}
                          >
                            {alreadyTaken ? `✓ ${time}` : `Prendre ${time}`}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Taken logs timeline */}
                  {t.takenHistory.length > 0 && (
                    <div className="space-y-1.5 text-[10px]">
                      <p className="font-extrabold text-slate-400 uppercase tracking-wider">Prises récentes :</p>
                      <div className="max-h-24 overflow-y-auto space-y-1 pr-1 border-l border-slate-100 pl-2">
                        {t.takenHistory.slice(0, 4).map((h, i) => (
                          <div key={i} className="flex items-center gap-1 text-slate-600">
                            <CornerDownRight className="w-3 h-3 text-emerald-500" />
                            <span>Le {h.timestamp} par <strong>{h.takenBy}</strong></span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
