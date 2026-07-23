import React, { useState, useEffect } from 'react';
import { UserProfile } from '../types';
import { User, Plus, Trash2, Shield, Heart, Scale, Ruler, Calendar, Check } from 'lucide-react';
import { errorService } from '../services/errorService';

interface ProfileSelectorProps {
  activeProfile: UserProfile | null;
  setActiveProfile: (profile: UserProfile) => void;
  onProfilesChanged?: (profiles: UserProfile[]) => void;
}

const DEFAULT_PROFILES: UserProfile[] = [
  {
    id: '1',
    name: 'Thibaut (Adulte)',
    gender: 'M',
    age: 32,
    height: 180,
    weight: 78,
    isDefault: true
  },
  {
    id: '2',
    name: 'Chloé (Enfant)',
    gender: 'F',
    age: 6,
    height: 115,
    weight: 20,
    isDefault: false
  }
];

export default function ProfileSelector({ activeProfile, setActiveProfile, onProfilesChanged }: ProfileSelectorProps) {
  const [profiles, setProfiles] = useState<UserProfile[]>([]);
  const [isAdding, setIsAdding] = useState(false);
  const [errors, setErrors] = useState(errorService.getErrors());

  useEffect(() => {
    const interval = setInterval(() => setErrors(errorService.getErrors()), 1000);
    return () => clearInterval(interval);
  }, []);
  
  // New profile form state
  const [name, setName] = useState('');
  const [gender, setGender] = useState<'M' | 'F' | 'Autre'>('M');
  const [age, setAge] = useState<number>(30);
  const [weight, setWeight] = useState<number>(70);
  const [height, setHeight] = useState<number>(175);

  // Load profiles from LocalStorage
  useEffect(() => {
    const saved = localStorage.getItem('pharmacie_profiles');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (parsed.length > 0) {
          setProfiles(parsed);
          const active = parsed.find((p: UserProfile) => p.isDefault) || parsed[0];
          setActiveProfile(active);
          if (onProfilesChanged) onProfilesChanged(parsed);
          return;
        }
      } catch (e) {
        console.error(e);
      }
    }
    
    // Default fallback
    setProfiles(DEFAULT_PROFILES);
    setActiveProfile(DEFAULT_PROFILES[0]);
    localStorage.setItem('pharmacie_profiles', JSON.stringify(DEFAULT_PROFILES));
    if (onProfilesChanged) onProfilesChanged(DEFAULT_PROFILES);
  }, []);

  const saveProfiles = (updated: UserProfile[]) => {
    setProfiles(updated);
    localStorage.setItem('pharmacie_profiles', JSON.stringify(updated));
    if (onProfilesChanged) onProfilesChanged(updated);
  };

  const handleSelect = (profile: UserProfile) => {
    const updated = profiles.map(p => ({
      ...p,
      isDefault: p.id === profile.id
    }));
    saveProfiles(updated);
    setActiveProfile(profile);
  };

  const handleAddProfile = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    const newProfile: UserProfile = {
      id: Date.now().toString(),
      name: name.trim(),
      gender,
      age,
      height,
      weight,
      isDefault: profiles.length === 0
    };

    const updated = [...profiles, newProfile];
    saveProfiles(updated);
    if (newProfile.isDefault || !activeProfile) {
      setActiveProfile(newProfile);
    }
    
    // Reset form
    setName('');
    setGender('M');
    setAge(30);
    setWeight(70);
    setHeight(175);
    setIsAdding(false);
  };

  const handleDeleteProfile = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (profiles.length <= 1) {
      alert("Vous devez garder au moins un profil.");
      return;
    }

    const updated = profiles.filter(p => p.id !== id);
    
    if (activeProfile?.id === id) {
      const firstLeft = updated[0];
      firstLeft.isDefault = true;
      setActiveProfile(firstLeft);
    }
    
    saveProfiles(updated);
  };

  return (
    <div id="profile-section" className="bg-white rounded-2xl border border-slate-100 p-5 shadow-sm">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className="p-2 bg-emerald-50 rounded-lg text-emerald-600">
            <User className="w-5 h-5" />
          </div>
          <div>
            <h2 className="font-semibold text-slate-800">Profils Patients</h2>
            <p className="text-xs text-slate-400">Pour adapter la posologie</p>
          </div>
        </div>
        {!isAdding && (
          <button
            onClick={() => setIsAdding(true)}
            id="add-profile-btn"
            className="flex items-center gap-1 text-xs font-semibold text-emerald-600 bg-emerald-50 hover:bg-emerald-100 px-3 py-1.5 rounded-lg transition-colors cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" /> Ajouter
          </button>
        )}
      </div>

      {isAdding ? (
        <form onSubmit={handleAddProfile} className="space-y-4 p-4 bg-slate-50 rounded-xl border border-slate-100">
          <h3 className="text-sm font-semibold text-slate-700">Nouveau profil</h3>
          
          <div>
            <label className="block text-xs font-medium text-slate-500 mb-1">Nom / Prénom</label>
            <input
              type="text"
              required
              placeholder="Ex: Jean, Chloé..."
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full text-sm bg-white border border-slate-200 rounded-lg px-3 py-2 text-slate-800 focus:outline-none focus:border-emerald-500"
            />
          </div>

          <div className="grid grid-cols-3 gap-2">
            <div>
              <label className="block text-xs font-medium text-slate-500 mb-1">Sexe</label>
              <select
                value={gender}
                onChange={(e) => setGender(e.target.value as any)}
                className="w-full text-sm bg-white border border-slate-200 rounded-lg px-2 py-2 text-slate-800 focus:outline-none focus:border-emerald-500"
              >
                <option value="M">Masculin</option>
                <option value="F">Féminin</option>
                <option value="Autre">Autre</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-500 mb-1">Âge (ans)</label>
              <input
                type="number"
                min="0"
                max="120"
                value={age}
                onChange={(e) => setAge(parseInt(e.target.value) || 0)}
                className="w-full text-sm bg-white border border-slate-200 rounded-lg px-2 py-2 text-slate-800 focus:outline-none focus:border-emerald-500"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-500 mb-1">Poids (kg)</label>
              <input
                type="number"
                min="1"
                max="200"
                value={weight}
                onChange={(e) => setWeight(parseInt(e.target.value) || 0)}
                className="w-full text-sm bg-white border border-slate-200 rounded-lg px-2 py-2 text-slate-800 focus:outline-none focus:border-emerald-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-500 mb-1">Taille (cm)</label>
            <input
              type="number"
              min="30"
              max="250"
              value={height}
              onChange={(e) => setHeight(parseInt(e.target.value) || 0)}
              className="w-full text-sm bg-white border border-slate-200 rounded-lg px-3 py-2 text-slate-800 focus:outline-none focus:border-emerald-500"
            />
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={() => setIsAdding(false)}
              className="px-3 py-1.5 text-xs font-medium text-slate-500 hover:bg-slate-200 rounded-lg transition-colors"
            >
              Annuler
            </button>
            <button
              type="submit"
              className="px-4 py-1.5 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg shadow-sm transition-all"
            >
              Créer
            </button>
          </div>
        </form>
      ) : (
        <div className="space-y-2">
          {profiles.map((p) => {
            const isSelected = activeProfile?.id === p.id;
            return (
              <div
                key={p.id}
                onClick={() => handleSelect(p)}
                className={`flex items-center justify-between p-3 rounded-xl border transition-all cursor-pointer ${
                  isSelected 
                    ? 'border-emerald-500 bg-emerald-50/50 shadow-sm' 
                    : 'border-slate-100 bg-white hover:bg-slate-50'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm ${
                    isSelected ? 'bg-emerald-600 text-white' : 'bg-slate-100 text-slate-500'
                  }`}>
                    {p.name.charAt(0)}
                  </div>
                  <div>
                    <div className="flex items-center gap-1.5">
                      <span className="font-semibold text-slate-800 text-sm">{p.name}</span>
                      {isSelected && (
                        <span className="bg-emerald-100 text-emerald-800 text-[10px] font-bold px-1.5 py-0.2 rounded-full flex items-center gap-0.5">
                          <Check className="w-2.5 h-2.5" /> Actif
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-2 text-xs text-slate-400 mt-0.5">
                      <span className="flex items-center gap-0.5"><Calendar className="w-3 h-3" /> {p.age} ans</span>
                      <span>•</span>
                      <span className="flex items-center gap-0.5"><Scale className="w-3 h-3" /> {p.weight} kg</span>
                      <span>•</span>
                      <span className="flex items-center gap-0.5"><Ruler className="w-3 h-3" /> {p.height} cm</span>
                    </div>
                  </div>
                </div>
                
                <button
                  onClick={(e) => handleDeleteProfile(p.id, e)}
                  disabled={profiles.length <= 1}
                  className="p-1.5 text-slate-400 hover:text-red-500 disabled:opacity-30 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer"
                  title="Supprimer ce profil"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            );
          })}
        </div>
      )}

      {/* Safety info warning banner */}
      <div className="mt-4 flex gap-2.5 p-3 bg-blue-50/70 rounded-xl border border-blue-100 text-xs text-blue-700 leading-relaxed">
        <Shield className="w-4 h-4 text-blue-500 shrink-0 mt-0.5" />
        <p>
          <strong>Avertissement médical :</strong> Les dosages et équivalences fournis par l'application sont indicatifs. Consultez toujours un médecin ou un pharmacien agréé avant de prendre tout traitement.
        </p>
      </div>

      {/* Admin Panel */}
      <div className="mt-6 p-4 bg-slate-900 rounded-xl text-white space-y-4">
        <h3 className="font-bold text-sm">Console Admin</h3>
        
        {/* API Key Config */}
        <div>
            <label className="block text-[10px] text-slate-400 uppercase font-bold mb-1">Clé API Gemini (Runtime Override)</label>
            <input 
                type="password"
                placeholder="Entrez votre clé API manuellement"
                className="w-full text-xs p-2 rounded bg-slate-800 border border-slate-700 text-white"
                onChange={(e) => localStorage.setItem('RUNTIME_GEMINI_API_KEY', e.target.value)}
                defaultValue={localStorage.getItem('RUNTIME_GEMINI_API_KEY') || ''}
            />
            <p className="text-[10px] text-slate-500 mt-1">
                <strong>Attention :</strong> Cette clé est stockée localement dans votre navigateur.
            </p>
        </div>

        {/* Error Console */}
        <div>
            <h4 className="text-[10px] text-slate-400 uppercase font-bold mb-1">Journal des erreurs</h4>
            <div className="bg-black p-2 rounded text-[10px] font-mono h-24 overflow-y-auto">
                {errors.length === 0 ? <p className="text-slate-600 italic">Aucune erreur détectée.</p> : errors.map(err => (
                    <p key={err.id} className="text-red-400 mb-1">{new Date(err.timestamp).toLocaleTimeString()}: {err.message}</p>
                ))}
            </div>
        </div>
      </div>
    </div>
  );
}
