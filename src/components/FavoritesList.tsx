import React from 'react';
import { Medication, UserProfile } from '../types';
import { MEDICATIONS_DATABASE } from '../data/medications';
import { Heart, Pill, Trash2, ArrowRight } from 'lucide-react';

interface FavoritesListProps {
  favorites: string[];
  toggleFavorite: (id: string) => void;
  activeProfile: UserProfile | null;
  onSelectMedication: (med: Medication) => void;
}

export default function FavoritesList({ favorites, toggleFavorite, activeProfile, onSelectMedication }: FavoritesListProps) {
  // Get favorited medicines from database
  const favoritedMeds = MEDICATIONS_DATABASE.filter(m => favorites.includes(m.id));

  return (
    <div className="space-y-4">
      <div className="bg-white rounded-2xl border border-slate-100 p-5 shadow-sm">
        <div className="flex items-center gap-2">
          <div className="p-2 bg-rose-50 rounded-lg text-rose-500">
            <Heart className="w-5 h-5 fill-rose-500" />
          </div>
          <div>
            <h2 className="font-bold text-slate-800 text-lg">Médicaments Favoris</h2>
            <p className="text-xs text-slate-400">Vos fiches de médicaments enregistrées pour un accès rapide</p>
          </div>
        </div>
      </div>

      {favoritedMeds.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-100 p-10 text-center space-y-3">
          <Heart className="w-12 h-12 text-slate-200 mx-auto" />
          <div>
            <p className="font-semibold text-slate-700">Aucun favori enregistré</p>
            <p className="text-xs text-slate-400 mt-1">
              Cliquez sur l'icône de cœur sur n'importe quel médicament ou fiche d'équivalence pour le retrouver ici.
            </p>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {favoritedMeds.map((med) => (
            <div
              key={med.id}
              onClick={() => onSelectMedication(med)}
              className="bg-white rounded-xl border border-slate-100 p-5 hover:border-emerald-200 hover:shadow-sm transition-all cursor-pointer flex flex-col justify-between group relative"
            >
              {/* Category flag & delete */}
              <div className="flex justify-between items-center">
                <span className="bg-rose-50 text-rose-800 text-[10px] font-bold px-2 py-0.5 rounded-full border border-rose-100 uppercase flex items-center gap-1">
                  <Heart className="w-2.5 h-2.5 fill-rose-500 text-rose-500" /> Enregistré
                </span>

                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    toggleFavorite(med.id);
                  }}
                  className="p-1.5 text-slate-400 hover:text-red-500 rounded-full hover:bg-slate-50 transition-colors cursor-pointer"
                  title="Retirer des favoris"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>

              {/* Med names comparison */}
              <div className="mt-4 space-y-3">
                <div className="grid grid-cols-2 gap-3 border-b border-slate-50 pb-3">
                  <div>
                    <span className="text-[10px] text-slate-400 font-extrabold uppercase">France 🇫🇷</span>
                    <p className="font-extrabold text-slate-800 text-sm truncate mt-0.5">{med.nameFr}</p>
                  </div>
                  <div className="border-l border-slate-100 pl-3">
                    <span className="text-[10px] text-slate-400 font-extrabold uppercase">USA 🇺🇸</span>
                    <p className="font-extrabold text-emerald-700 text-sm truncate mt-0.5">{med.nameUs}</p>
                  </div>
                </div>

                <div className="text-xs text-slate-400">
                  <p className="truncate">Molécule active : {med.activeIngredientFr}</p>
                  {activeProfile && (
                    <p className="text-emerald-600 font-semibold mt-1 text-[10px] uppercase">
                      ✓ Posologie personnalisée prête pour : {activeProfile.name}
                    </p>
                  )}
                </div>
              </div>

              <div className="border-t border-slate-50 pt-3 mt-4 flex items-center justify-between text-[10px] text-slate-400">
                <span className="font-bold uppercase bg-slate-100 px-2 py-0.5 rounded text-slate-500">
                  {med.category === 'pain' ? 'Douleur' : med.category === 'cold' ? 'Rhume' : med.category === 'stomach' ? 'Digestion' : 'Peau'}
                </span>
                <span className="font-semibold text-emerald-600 group-hover:translate-x-1 transition-transform inline-flex items-center gap-0.5">
                  Voir la fiche détaillée <ArrowRight className="w-3 h-3" />
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
