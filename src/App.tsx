import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { UserProfile, Medication } from './types';
import ProfileSelector from './components/ProfileSelector';
import MedicationCatalog from './components/MedicationCatalog';
import SymptomChecker from './components/SymptomChecker';
import CameraScanner from './components/CameraScanner';
import FavoritesList from './components/FavoritesList';
import MedicineCabinet from './components/MedicineCabinet';
import PrescriptionTranslator from './components/PrescriptionTranslator';
import MedicalTools from './components/MedicalTools';
import ThemeToggle from './components/ThemeToggle';
import AIChat from './components/AIChat';
import { MEDICATIONS_DATABASE } from './data/medications';
import { 
  Pill, Heart, Camera, Stethoscope, User, 
  Activity, BookOpen, ShieldCheck, Search, HelpCircle, HeartHandshake,
  FileText, Package, Ruler, MessageSquare
} from 'lucide-react';


export default function App() {
  const [activeProfile, setActiveProfile] = useState<UserProfile | null>(null);
  const [profiles, setProfiles] = useState<UserProfile[]>([]);
  const [favorites, setFavorites] = useState<string[]>([]);
  
  // Tabs for Dashboard
  const [activeWebTab, setActiveWebTab] = useState<'catalog' | 'symptoms' | 'scanner' | 'prescription' | 'cabinet' | 'tools' | 'favorites' | 'chat'>('catalog');
  
  // Load favorites from LocalStorage
  useEffect(() => {
    const saved = localStorage.getItem('pharmacie_favorites');
    if (saved) {
      try {
        setFavorites(JSON.parse(saved));
      } catch (e) {
        console.error(e);
      }
    }
  }, []);

  const toggleFavorite = (id: string) => {
    let updated;
    if (favorites.includes(id)) {
      updated = favorites.filter(favId => favId !== id);
    } else {
      updated = [...favorites, id];
    }
    setFavorites(updated);
    localStorage.setItem('pharmacie_favorites', JSON.stringify(updated));
  };

  const handleSelectMedicationFromShortcut = (med: Medication) => {
    setActiveWebTab('catalog');
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-100 antialiased font-sans transition-colors duration-300">
      {/* Top Navigation / Brand Header */}
      <header className="bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 sticky top-0 z-40 px-6 py-4 shadow-sm">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
          
          {/* Logo Brand */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-600 flex items-center justify-center text-white shadow-md shadow-emerald-500/10">
              <Pill className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <h1 className="text-lg font-black tracking-tight text-slate-900 dark:text-white flex items-center gap-1.5">
                Pharmacie Transatlantique
              </h1>
              <p className="text-[10px] text-slate-500 dark:text-slate-400 font-bold uppercase tracking-wider">
                Liaison France-USA • Équivalences & IA
              </p>
            </div>
          </div>
          <ThemeToggle />
        </div>
      </header>

      {/* Main Container */}
      <main className="max-w-7xl mx-auto px-4 py-6 md:px-6">
        
        {/* Bento Grid Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          
          {/* Profile & Sidebar Widgets (Col 4) */}
          <div className="lg:col-span-4 space-y-6">
            <ProfileSelector
              activeProfile={activeProfile}
              setActiveProfile={setActiveProfile}
              onProfilesChanged={setProfiles}
            />
            
            {/* Quick shortcuts in a bento card */}
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 shadow-sm">
                <h3 className="text-xs font-extrabold text-slate-400 uppercase tracking-wider mb-4">
                  Raccourcis Phares
                </h3>
                <div className="space-y-2">
                    <div className="p-3 bg-slate-50 dark:bg-slate-800 rounded-xl text-xs font-semibold">🇫🇷 Doliprane ➔ 🇺🇸 Tylenol</div>
                    <div className="p-3 bg-slate-50 dark:bg-slate-800 rounded-xl text-xs font-semibold">🇫🇷 Nurofen ➔ 🇺🇸 Advil</div>
                </div>
            </div>
          </div>

          {/* Main Interactive Workspace (Col 8) */}
          <div className="lg:col-span-8 space-y-6">
            
            {/* Tabs selector */}
            <div className="flex flex-wrap gap-2 bg-white dark:bg-slate-900 p-2 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
                <button onClick={() => setActiveWebTab('catalog')} className={`px-4 py-2.5 text-xs font-black rounded-xl transition-all flex items-center gap-1.5 cursor-pointer ${activeWebTab === 'catalog' ? 'bg-emerald-600 text-white shadow' : 'text-slate-500 hover:text-slate-800'}`}> <BookOpen className="w-4 h-4" /> Équivalences & Catalogue</button>
                <button onClick={() => setActiveWebTab('symptoms')} className={`px-4 py-2.5 text-xs font-black rounded-xl transition-all flex items-center gap-1.5 cursor-pointer ${activeWebTab === 'symptoms' ? 'bg-emerald-600 text-white shadow' : 'text-slate-500 hover:text-slate-800'}`}> <Stethoscope className="w-4 h-4" /> Analyseur Symptômes</button>
                <button onClick={() => setActiveWebTab('scanner')} className={`px-4 py-2.5 text-xs font-black rounded-xl transition-all flex items-center gap-1.5 cursor-pointer ${activeWebTab === 'scanner' ? 'bg-emerald-600 text-white shadow' : 'text-slate-500 hover:text-slate-800'}`}> <Camera className="w-4 h-4" /> Scanner Boîte Photo</button>
                <button onClick={() => setActiveWebTab('prescription')} className={`px-4 py-2.5 text-xs font-black rounded-xl transition-all flex items-center gap-1.5 cursor-pointer ${activeWebTab === 'prescription' ? 'bg-emerald-600 text-white shadow' : 'text-slate-500 hover:text-slate-800'}`}> <FileText className="w-4 h-4" /> Traducteur Ordonnance</button>
                <button onClick={() => setActiveWebTab('cabinet')} className={`px-4 py-2.5 text-xs font-black rounded-xl transition-all flex items-center gap-1.5 cursor-pointer ${activeWebTab === 'cabinet' ? 'bg-emerald-600 text-white shadow' : 'text-slate-500 hover:text-slate-800'}`}> <Package className="w-4 h-4" /> Mon Armoire & Suivi</button>
                <button onClick={() => setActiveWebTab('tools')} className={`px-4 py-2.5 text-xs font-black rounded-xl transition-all flex items-center gap-1.5 cursor-pointer ${activeWebTab === 'tools' ? 'bg-emerald-600 text-white shadow' : 'text-slate-500 hover:text-slate-800'}`}> <Ruler className="w-4 h-4" /> Outils °C/°F</button>
                <button onClick={() => setActiveWebTab('chat')} className={`px-4 py-2.5 text-xs font-black rounded-xl transition-all flex items-center gap-1.5 cursor-pointer ${activeWebTab === 'chat' ? 'bg-emerald-600 text-white shadow' : 'text-slate-500 hover:text-slate-800'}`}> <MessageSquare className="w-4 h-4" /> Assistant IA</button>
                <button onClick={() => setActiveWebTab('favorites')} className={`px-4 py-2.5 text-xs font-black rounded-xl transition-all flex items-center gap-1.5 cursor-pointer ${activeWebTab === 'favorites' ? 'bg-emerald-600 text-white shadow' : 'text-slate-500 hover:text-slate-800'}`}> <Heart className="w-4 h-4" /> Favoris ({favorites.length})</button>
            </div>

            {/* Dynamic Workspace */}
            <div className="min-h-[400px]">
              <AnimatePresence mode="wait">
                <motion.div
                  key={activeWebTab}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.2 }}
                  className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm"
                >
                  {activeWebTab === 'catalog' && (<MedicationCatalog activeProfile={activeProfile} favorites={favorites} toggleFavorite={toggleFavorite} onSelectMedication={handleSelectMedicationFromShortcut} />)}
                  {activeWebTab === 'symptoms' && (<SymptomChecker activeProfile={activeProfile} toggleFavorite={toggleFavorite} favorites={favorites} />)}
                  {activeWebTab === 'scanner' && (<CameraScanner activeProfile={activeProfile} toggleFavorite={toggleFavorite} favorites={favorites} />)}
                  {activeWebTab === 'prescription' && (<PrescriptionTranslator activeProfile={activeProfile} />)}
                  {activeWebTab === 'cabinet' && (<MedicineCabinet activeProfile={activeProfile} profiles={profiles} />)}
                  {activeWebTab === 'tools' && (<MedicalTools />)}
                  {activeWebTab === 'chat' && (<AIChat />)}
                  {activeWebTab === 'favorites' && (<FavoritesList favorites={favorites} toggleFavorite={toggleFavorite} activeProfile={activeProfile} onSelectMedication={handleSelectMedicationFromShortcut} />)}
                </motion.div>
              </AnimatePresence>
            </div>
          </div>
        </div>
      </main>

      {/* Footer copyright */}
      <footer className="bg-white dark:bg-slate-900 border-t border-slate-100 dark:border-slate-800 py-8 text-center mt-12 text-xs text-slate-500 dark:text-slate-400 font-medium">
        <div className="max-w-7xl mx-auto px-6 space-y-2">
          <p className="flex items-center justify-center gap-1 font-semibold">
            <HeartHandshake className="w-4 h-4 text-emerald-500" />
            Pharmacie Transatlantique © 2026. Conçu pour les expatriés et voyageurs franco-américains.
          </p>
          <p className="max-w-2xl mx-auto leading-relaxed">
            Clause de non-responsabilité : L'application Pharmacie Transatlantique fournit des équivalences à titre indicatif et éducatif par IA. L'usage de cette application ne remplace pas une consultation médicale, un diagnostic ou l'avis qualifié d'un médecin ou pharmacien compétent. En cas de doute, consultez un professionnel.
          </p>
        </div>
      </footer>
    </div>
  );
}
