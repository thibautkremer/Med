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
import MobileBottomNav, { TabType } from './components/MobileBottomNav';
import { MEDICATIONS_DATABASE } from './data/medications';
import { 
  Pill, Heart, Camera, Stethoscope, User, 
  Activity, BookOpen, ShieldCheck, Search, HelpCircle, HeartHandshake,
  FileText, Package, Ruler, MessageSquare, ChevronRight, Sparkles, Download
} from 'lucide-react';


export default function App() {
  const [activeProfile, setActiveProfile] = useState<UserProfile | null>(null);
  const [profiles, setProfiles] = useState<UserProfile[]>([]);
  const [favorites, setFavorites] = useState<string[]>([]);
  const [isAndroid, setIsAndroid] = useState(false);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  
  // Tabs for Dashboard
  const [activeWebTab, setActiveWebTab] = useState<TabType>('catalog');
  
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
    
    // Check if running on Android
    if (/Android/i.test(navigator.userAgent)) {
        setIsAndroid(true);
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
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-100 antialiased font-sans transition-colors duration-300 flex flex-col">
      {/* Top Navigation / Brand Header */}
      <header className="bg-white/90 dark:bg-slate-900/90 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 sticky top-0 z-30 px-4 py-3 sm:px-6 shadow-sm">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-3">
          
          {/* Logo Brand */}
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-emerald-600 flex items-center justify-center text-white shadow-md shadow-emerald-500/20 shrink-0">
              <Pill className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <h1 className="text-base sm:text-lg font-black tracking-tight text-slate-900 dark:text-white flex items-center gap-1.5 leading-tight">
                Pharmacie Transatlantique
              </h1>
              <p className="text-[10px] text-slate-500 dark:text-slate-400 font-bold uppercase tracking-wider hidden sm:block">
                Liaison France-USA • Équivalences & IA
              </p>
              <p className="text-[9px] text-slate-500 dark:text-slate-400 font-extrabold uppercase tracking-wider sm:hidden">
                🇫🇷 ⇄ 🇺🇸 Équivalences Santé
              </p>
            </div>
          </div>

          {/* Top Actions: Theme Toggle + Profile Button */}
          <div className="flex items-center gap-2">
            {/* Download Android APK Button */}
            <a 
              href="/api/download-apk" 
              className="hidden md:flex items-center gap-1.5 px-3 py-1.5 bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-950/40 dark:hover:bg-emerald-900/60 text-emerald-700 dark:text-emerald-300 rounded-xl text-xs font-black transition-all border border-emerald-200 dark:border-emerald-800"
              title="Télécharger l'application Android (APK)"
              download
            >
              <Download className="w-3.5 h-3.5" />
              <span>Android APK</span>
            </a>
            <ThemeToggle />
            <button
              onClick={() => setIsProfileModalOpen(true)}
              className="flex items-center gap-2 px-3 py-2 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 hover:bg-emerald-100 dark:hover:bg-emerald-900/60 transition-all text-xs font-black"
              title="Gérer les profils"
            >
              <User className="w-4 h-4" />
              <span>{activeProfile ? activeProfile.name.split(' ')[0] : 'Profil'}</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-3 sm:px-4 py-4 sm:py-6 lg:px-6 pb-28 lg:pb-8">
        
        {/* Bento Grid Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          
          {/* Profile & Sidebar Widgets (Desktop/Tablet column 4, Mobile collapsible/top) */}
          <div className="lg:col-span-4 space-y-6">

            {/* Beautiful gradient APK download card */}
            {!isAndroid && (
            <div className="bg-gradient-to-br from-emerald-600 to-teal-700 dark:from-emerald-700 dark:to-teal-800 rounded-2xl p-5 text-white shadow-md shadow-emerald-500/10 space-y-3">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-white/20 flex items-center justify-center">
                  <Download className="w-4 h-4 text-white" />
                </div>
                <div>
                  <h4 className="text-xs font-black tracking-tight leading-none uppercase">App Android (APK)</h4>
                  <p className="text-[10px] text-emerald-100 font-bold mt-1">Liaison Mobile Native</p>
                </div>
              </div>
              <p className="text-[11px] text-emerald-50 leading-relaxed font-semibold">
                Profitez de performances de scan instantanées, de l'accès direct à l'appareil photo et d'une fluidité parfaite en déplacement.
              </p>
              <a 
                href="/api/download-apk" 
                className="w-full py-2.5 bg-white hover:bg-slate-50 text-emerald-800 dark:text-emerald-900 rounded-xl text-xs font-black transition-all flex items-center justify-center gap-2 shadow-sm cursor-pointer"
                download
              >
                <Download className="w-3.5 h-3.5" />
                Installer l'APK (5.0 MB)
              </a>
            </div>
            )}
            
            {/* Quick shortcuts in a bento card */}
            <div className="hidden lg:block bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 shadow-sm">
                <h3 className="text-xs font-extrabold text-slate-400 uppercase tracking-wider mb-4 flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                  Raccourcis Phares
                </h3>
                <div className="space-y-2">
                    <div className="p-3 bg-slate-50 dark:bg-slate-800 rounded-xl text-xs font-semibold flex justify-between items-center">
                      <span>🇫🇷 Doliprane (Paracétamol)</span>
                      <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
                      <span>🇺🇸 Tylenol (Acetaminophen)</span>
                    </div>
                    <div className="p-3 bg-slate-50 dark:bg-slate-800 rounded-xl text-xs font-semibold flex justify-between items-center">
                      <span>🇫🇷 Nurofen (Ibuprofène)</span>
                      <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
                      <span>🇺🇸 Advil / Motrin</span>
                    </div>
                </div>
            </div>
          </div>

          {/* Main Interactive Workspace (Desktop col 8) */}
          <div className="lg:col-span-8 space-y-4 sm:space-y-6">
            
            {/* Desktop Navigation Tabs (Hidden on mobile where bottom nav is active) */}
            <div className="hidden lg:flex flex-wrap gap-2 bg-white dark:bg-slate-900 p-2 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
                <button onClick={() => setActiveWebTab('catalog')} className={`px-4 py-2.5 text-xs font-black rounded-xl transition-all flex items-center gap-1.5 cursor-pointer ${activeWebTab === 'catalog' ? 'bg-emerald-600 text-white shadow' : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'}`}> <BookOpen className="w-4 h-4" /> Équivalences & Catalogue</button>
                <button onClick={() => setActiveWebTab('symptoms')} className={`px-4 py-2.5 text-xs font-black rounded-xl transition-all flex items-center gap-1.5 cursor-pointer ${activeWebTab === 'symptoms' ? 'bg-emerald-600 text-white shadow' : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'}`}> <Stethoscope className="w-4 h-4" /> Analyseur Symptômes</button>
                <button onClick={() => setActiveWebTab('scanner')} className={`px-4 py-2.5 text-xs font-black rounded-xl transition-all flex items-center gap-1.5 cursor-pointer ${activeWebTab === 'scanner' ? 'bg-emerald-600 text-white shadow' : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'}`}> <Camera className="w-4 h-4" /> Scanner Boîte Photo</button>
                <button onClick={() => setActiveWebTab('prescription')} className={`px-4 py-2.5 text-xs font-black rounded-xl transition-all flex items-center gap-1.5 cursor-pointer ${activeWebTab === 'prescription' ? 'bg-emerald-600 text-white shadow' : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'}`}> <FileText className="w-4 h-4" /> Traducteur Ordonnance</button>
                <button onClick={() => setActiveWebTab('cabinet')} className={`px-4 py-2.5 text-xs font-black rounded-xl transition-all flex items-center gap-1.5 cursor-pointer ${activeWebTab === 'cabinet' ? 'bg-emerald-600 text-white shadow' : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'}`}> <Package className="w-4 h-4" /> Mon Armoire & Suivi</button>
                <button onClick={() => setActiveWebTab('tools')} className={`px-4 py-2.5 text-xs font-black rounded-xl transition-all flex items-center gap-1.5 cursor-pointer ${activeWebTab === 'tools' ? 'bg-emerald-600 text-white shadow' : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'}`}> <Ruler className="w-4 h-4" /> Outils °C/°F</button>
                <button onClick={() => setActiveWebTab('chat')} className={`px-4 py-2.5 text-xs font-black rounded-xl transition-all flex items-center gap-1.5 cursor-pointer ${activeWebTab === 'chat' ? 'bg-emerald-600 text-white shadow' : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'}`}> <MessageSquare className="w-4 h-4" /> Assistant IA</button>
                <button onClick={() => setActiveWebTab('favorites')} className={`px-4 py-2.5 text-xs font-black rounded-xl transition-all flex items-center gap-1.5 cursor-pointer ${activeWebTab === 'favorites' ? 'bg-emerald-600 text-white shadow' : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'}`}> <Heart className="w-4 h-4" /> Favoris ({favorites.length})</button>
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
                  className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-4 sm:p-6 shadow-sm"
                >
                  {activeWebTab === 'catalog' && (<MedicationCatalog activeProfile={activeProfile} favorites={favorites} toggleFavorite={toggleFavorite} onSelectMedication={handleSelectMedicationFromShortcut} />)}
                  {activeWebTab === 'symptoms' && (<SymptomChecker activeProfile={activeProfile} toggleFavorite={toggleFavorite} favorites={favorites} />)}
                  {activeWebTab === 'scanner' && (<CameraScanner activeProfile={activeProfile} toggleFavorite={toggleFavorite} favorites={favorites} />)}
                  {activeWebTab === 'prescription' && (<PrescriptionTranslator activeProfile={activeProfile} />)}
                  {activeWebTab === 'cabinet' && (<MedicineCabinet activeProfile={activeProfile} profiles={profiles} />)}
                  {activeWebTab === 'tools' && (<MedicalTools />)}
                  {activeWebTab === 'chat' && (<AIChat activeProfile={activeProfile} />)}
                  {activeWebTab === 'favorites' && (<FavoritesList favorites={favorites} toggleFavorite={toggleFavorite} activeProfile={activeProfile} onSelectMedication={handleSelectMedicationFromShortcut} />)}
                </motion.div>
              </AnimatePresence>
            </div>
          </div>
        </div>
      </main>

      {/* Native Android Fixed Bottom Navigation */}
      <MobileBottomNav
        activeTab={activeWebTab}
        setActiveTab={setActiveWebTab}
        favoritesCount={favorites.length}
        activeProfile={activeProfile}
        profiles={profiles}
        setActiveProfile={setActiveProfile}
      />

      {/* Profile Modal */}
      {isProfileModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white dark:bg-slate-900 rounded-2xl w-full max-w-sm p-6 shadow-2xl border border-slate-200 dark:border-slate-800">
            <div className="flex justify-between items-center mb-4">
               <h3 className="font-black text-slate-800 dark:text-white">Gestion des profils</h3>
               <button onClick={() => setIsProfileModalOpen(false)} className="p-1 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500">✕</button>
            </div>
            <ProfileSelector
              activeProfile={activeProfile}
              setActiveProfile={setActiveProfile}
              onProfilesChanged={setProfiles}
            />
          </div>
        </div>
      )}

      {/* Footer copyright */}
      <footer className="bg-white dark:bg-slate-900 border-t border-slate-100 dark:border-slate-800 py-8 text-center mt-auto text-xs text-slate-500 dark:text-slate-400 font-medium pb-24 lg:pb-8">
        <div className="max-w-7xl mx-auto px-6 space-y-2">
          <p className="flex items-center justify-center gap-1 font-semibold">
            <HeartHandshake className="w-4 h-4 text-emerald-500" />
            Pharmacie Transatlantique © 2026. Conçu pour les expatriés et voyageurs franco-américains.
          </p>
          <p className="max-w-2xl mx-auto leading-relaxed text-[11px]">
            Clause de non-responsabilité : L'application Pharmacie Transatlantique fournit des équivalences à titre indicatif et éducatif par IA. L'usage de cette application ne remplace pas une consultation médicale, un diagnostic ou l'avis qualifié d'un médecin ou pharmacien compétent. En cas de doute, consultez un professionnel.
          </p>
        </div>
      </footer>
    </div>
  );
}

