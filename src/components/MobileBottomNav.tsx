import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { UserProfile } from '../types';
import { 
  BookOpen, 
  Stethoscope, 
  Camera, 
  Package, 
  Grid, 
  MessageSquare, 
  FileText, 
  Ruler, 
  Heart, 
  X, 
  User, 
  Check, 
  Sparkles,
  ChevronRight
} from 'lucide-react';

export type TabType = 'catalog' | 'symptoms' | 'scanner' | 'prescription' | 'cabinet' | 'tools' | 'favorites' | 'chat';

interface MobileBottomNavProps {
  activeTab: TabType;
  setActiveTab: (tab: TabType) => void;
  favoritesCount: number;
  activeProfile: UserProfile | null;
  profiles: UserProfile[];
  setActiveProfile: (profile: UserProfile) => void;
  onOpenAddProfile?: () => void;
}

export default function MobileBottomNav({
  activeTab,
  setActiveTab,
  favoritesCount,
  activeProfile,
  profiles,
  setActiveProfile,
  onOpenAddProfile
}: MobileBottomNavProps) {
  const [isMoreOpen, setIsMoreOpen] = useState(false);

  // Check if active tab is in secondary items
  const isSecondaryActive = ['prescription', 'tools', 'favorites', 'cabinet'].includes(activeTab);

  const mainNavItems = [
    { id: 'catalog' as TabType, label: 'Catalogue', icon: BookOpen },
    { id: 'symptoms' as TabType, label: 'Symptômes', icon: Stethoscope },
    { id: 'scanner' as TabType, label: 'Scanner', icon: Camera, highlight: true },
    { 
      id: 'chat' as TabType, 
      label: 'Assistant IA', 
      icon: MessageSquare 
    },
  ];

  const secondaryNavItems = [
    { 
      id: 'cabinet' as TabType, 
      label: 'Armoire', 
      desc: 'Mon Armoire & Suivi', 
      icon: Package, 
      color: 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800' 
    },
    { 
      id: 'prescription' as TabType, 
      label: 'Ordonnance', 
      desc: 'Traducteur Rx FR/US', 
      icon: FileText, 
      color: 'bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 border-blue-200 dark:border-blue-800' 
    },
    { 
      id: 'tools' as TabType, 
      label: 'Convertisseur', 
      desc: 'Outils °C/°F & Doses', 
      icon: Ruler, 
      color: 'bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 border-indigo-200 dark:border-indigo-800' 
    },
    { 
      id: 'favorites' as TabType, 
      label: 'Mes Favoris', 
      desc: `${favoritesCount} médicament${favoritesCount > 1 ? 's' : ''}`, 
      icon: Heart, 
      badge: favoritesCount > 0 ? favoritesCount : undefined,
      color: 'bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 border-rose-200 dark:border-rose-800' 
    },
  ];

  const handleSelectTab = (tab: TabType) => {
    setActiveTab(tab);
    setIsMoreOpen(false);
  };

  return (
    <>
      {/* Fixed Android Bottom Navigation Bar */}
      <div className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/90 dark:bg-slate-900/90 backdrop-blur-xl border-t border-slate-200/80 dark:border-slate-800/80 px-2 py-1.5 shadow-[0_-8px_24px_rgba(0,0,0,0.08)]">
        <nav className="flex items-center justify-around max-w-md mx-auto">
          {mainNavItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => handleSelectTab(item.id)}
                className="relative flex flex-col items-center justify-center py-1 px-3 min-w-[64px] min-h-[48px] rounded-2xl transition-all cursor-pointer group active:scale-95"
              >
                {isActive && (
                  <motion.div
                    layoutId="mobileBottomNavActive"
                    className="absolute inset-0 bg-emerald-100 dark:bg-emerald-950/60 rounded-2xl -z-10"
                    transition={{ type: 'spring', stiffness: 500, damping: 35 }}
                  />
                )}
                
                <div className={`relative p-1 rounded-xl transition-colors ${
                  item.highlight && !isActive ? 'text-emerald-600 dark:text-emerald-400' : ''
                }`}>
                  <Icon className={`w-5 h-5 transition-transform duration-200 ${
                    isActive ? 'scale-110 text-emerald-700 dark:text-emerald-400' : 'text-slate-500 dark:text-slate-400'
                  }`} />
                </div>

                <span className={`text-[11px] font-extrabold tracking-tight transition-colors ${
                  isActive ? 'text-emerald-700 dark:text-emerald-400' : 'text-slate-500 dark:text-slate-400'
                }`}>
                  {item.label}
                </span>
              </button>
            );
          })}

          {/* "Plus" Menu Toggle */}
          <button
            onClick={() => setIsMoreOpen(true)}
            className="relative flex flex-col items-center justify-center py-1 px-3 min-w-[64px] min-h-[48px] rounded-2xl transition-all cursor-pointer group active:scale-95"
          >
            {isSecondaryActive && (
              <motion.div
                layoutId="mobileBottomNavActive"
                className="absolute inset-0 bg-emerald-100 dark:bg-emerald-950/60 rounded-2xl -z-10"
                transition={{ type: 'spring', stiffness: 500, damping: 35 }}
              />
            )}

            <div className="relative p-1">
              <Grid className={`w-5 h-5 transition-transform duration-200 ${
                isSecondaryActive ? 'scale-110 text-emerald-700 dark:text-emerald-400' : 'text-slate-500 dark:text-slate-400'
              }`} />
              
              {favoritesCount > 0 && (
                <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-rose-500 rounded-full ring-2 ring-white dark:ring-slate-900" />
              )}
            </div>

            <span className={`text-[11px] font-extrabold tracking-tight transition-colors ${
              isSecondaryActive ? 'text-emerald-700 dark:text-emerald-400' : 'text-slate-500 dark:text-slate-400'
            }`}>
              Plus
            </span>
          </button>
        </nav>
      </div>

      {/* Android Bottom Sheet Drawer Overlay */}
      <AnimatePresence>
        {isMoreOpen && (
          <div className="lg:hidden fixed inset-0 z-50 flex items-end justify-center">
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsMoreOpen(false)}
              className="absolute inset-0 bg-slate-950/60 backdrop-blur-sm"
            />

            {/* Bottom Sheet Panel */}
            <motion.div
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 28, stiffness: 300 }}
              className="relative w-full max-w-lg bg-white dark:bg-slate-900 rounded-t-[32px] border-t border-slate-200 dark:border-slate-800 p-6 shadow-2xl max-h-[85vh] overflow-y-auto"
            >
              {/* Drag Handle */}
              <div className="w-12 h-1.5 bg-slate-300 dark:bg-slate-700 rounded-full mx-auto mb-5" />

              {/* Sheet Header */}
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="text-lg font-black text-slate-900 dark:text-white flex items-center gap-2">
                    <Sparkles className="w-5 h-5 text-emerald-500" />
                    Menu & Services
                  </h2>
                  <p className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                    Accès rapide aux outils et profils
                  </p>
                </div>
                <button
                  onClick={() => setIsMoreOpen(false)}
                  className="w-9 h-9 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Profile Bar in Bottom Sheet */}
              <div className="mb-6 p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-800">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs font-black uppercase tracking-wider text-slate-400">
                    Profil Actif
                  </span>
                  {onOpenAddProfile && (
                    <button
                      onClick={() => {
                        setIsMoreOpen(false);
                        onOpenAddProfile();
                      }}
                      className="text-xs font-bold text-emerald-600 dark:text-emerald-400 hover:underline"
                    >
                      + Nouveau profil
                    </button>
                  )}
                </div>

                <div className="flex flex-wrap gap-2">
                  {profiles.map((p) => {
                    const isSelected = activeProfile?.id === p.id;
                    return (
                      <button
                        key={p.id}
                        onClick={() => {
                          setActiveProfile(p);
                        }}
                        className={`flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                          isSelected
                            ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/20'
                            : 'bg-white dark:bg-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-600 border border-slate-200 dark:border-slate-600'
                        }`}
                      >
                        <User className="w-3.5 h-3.5" />
                        <span>{p.name}</span>
                        {isSelected && <Check className="w-3.5 h-3.5 ml-0.5" />}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Grid of Secondary Features */}
              <div className="space-y-3 mb-6">
                <h3 className="text-xs font-black uppercase tracking-wider text-slate-400">
                  Fonctionnalités Avancées
                </h3>

                <div className="grid grid-cols-2 gap-3">
                  {secondaryNavItems.map((item) => {
                    const Icon = item.icon;
                    const isActive = activeTab === item.id;
                    return (
                      <button
                        key={item.id}
                        onClick={() => handleSelectTab(item.id)}
                        className={`p-4 rounded-2xl text-left border transition-all cursor-pointer relative flex flex-col justify-between min-h-[105px] group active:scale-95 ${
                          isActive
                            ? 'bg-emerald-600 text-white border-emerald-600 shadow-lg shadow-emerald-600/20'
                            : `${item.color} hover:shadow-md`
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <div className={`p-2 rounded-xl ${
                            isActive ? 'bg-white/20 text-white' : 'bg-white/80 dark:bg-slate-800/80 shadow-sm'
                          }`}>
                            <Icon className="w-5 h-5" />
                          </div>
                          {item.badge && !isActive && (
                            <span className="px-2 py-0.5 text-[10px] font-black bg-rose-500 text-white rounded-full">
                              {item.badge}
                            </span>
                          )}
                          <ChevronRight className={`w-4 h-4 transition-transform group-hover:translate-x-0.5 ${
                            isActive ? 'text-white/80' : 'opacity-40'
                          }`} />
                        </div>

                        <div>
                          <div className={`font-black text-sm tracking-tight ${isActive ? 'text-white' : 'text-slate-900 dark:text-white'}`}>
                            {item.label}
                          </div>
                          <div className={`text-[11px] font-medium leading-tight mt-0.5 ${isActive ? 'text-white/80' : 'text-slate-500 dark:text-slate-400'}`}>
                            {item.desc}
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
}
