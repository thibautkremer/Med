import React, { useState } from 'react';
import { Ruler, Activity, HelpCircle, CheckCircle, Flame, ArrowRight } from 'lucide-react';

export default function MedicalTools() {
  // Fahrenheit to Celsius
  const [fVal, setFVal] = useState('100.4');
  const [cVal, setCVal] = useState('38');

  // Lbs to Kg
  const [lbsVal, setLbsVal] = useState('30');
  const [kgVal, setKgVal] = useState('13.6');

  // Quick fever diagnostics
  const [feverTemp, setFeverTemp] = useState('38.5');

  const handleFToC = (f: string) => {
    setFVal(f);
    if (!isNaN(Number(f))) {
      const c = ((Number(f) - 32) * 5) / 9;
      setCVal(c.toFixed(1));
    } else {
      setCVal('');
    }
  };

  const handleCToF = (c: string) => {
    setCVal(c);
    if (!isNaN(Number(c))) {
      const f = (Number(c) * 9) / 5 + 32;
      setFVal(f.toFixed(1));
    } else {
      setFVal('');
    }
  };

  const handleLbsToKg = (lbs: string) => {
    setLbsVal(lbs);
    if (!isNaN(Number(lbs))) {
      const kg = Number(lbs) * 0.45359237;
      setKgVal(kg.toFixed(1));
    } else {
      setKgVal('');
    }
  };

  const handleKgToLbs = (kg: string) => {
    setKgVal(kg);
    if (!isNaN(Number(kg))) {
      const lbs = Number(kg) / 0.45359237;
      setLbsVal(lbs.toFixed(1));
    } else {
      setLbsVal('');
    }
  };

  // Fever diagnostics text
  const getFeverStatus = (tempCelsius: number) => {
    if (isNaN(tempCelsius)) return { text: "Entrez une valeur valide", color: "text-slate-400 bg-slate-50 border-slate-200" };
    if (tempCelsius < 35.0) return { text: "Hypothermie (< 35°C / 95°F) - Danger !", color: "text-blue-700 bg-blue-50 border-blue-200" };
    if (tempCelsius < 37.5) return { text: "Température normale (~36.5°C - 37.2°C)", color: "text-emerald-700 bg-emerald-50 border-emerald-200" };
    if (tempCelsius < 38.5) return { text: "Fébricule ou fièvre légère (37.5°C - 38.4°C)", color: "text-amber-700 bg-amber-50 border-amber-200" };
    return { text: "Fièvre élevée (≥ 38.5°C / 101.3°F) - Surveiller et hydrater !", color: "text-red-700 bg-red-50 border-red-200" };
  };

  const activeStatus = getFeverStatus(Number(feverTemp));

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-2xl border border-slate-100 p-5 shadow-sm space-y-4">
        
        {/* Title */}
        <div className="flex items-center gap-2">
          <div className="p-2 bg-pink-50 rounded-lg text-pink-600">
            <Ruler className="w-5 h-5" />
          </div>
          <div>
            <h2 className="font-bold text-slate-800 text-lg">Convertisseur de Mesures Médicales</h2>
            <p className="text-xs text-slate-400">Évitez les erreurs de dosage lors de vos séjours à l'étranger</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          
          {/* Temperature widget */}
          <div className="bg-slate-50/50 p-4 rounded-xl border border-slate-100 space-y-3">
            <h3 className="text-xs font-black text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
              <Flame className="w-4 h-4 text-red-500" /> Convertisseur Température (°C ⇄ °F)
            </h3>
            
            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="space-y-1">
                <label className="font-bold text-slate-600 block">Celsius (°C) :</label>
                <div className="relative">
                  <input
                    type="number"
                    step="0.1"
                    value={cVal}
                    onChange={(e) => {
                      handleCToF(e.target.value);
                      setFeverTemp(e.target.value);
                    }}
                    className="w-full p-2.5 bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500 text-sm font-bold text-slate-800"
                  />
                  <span className="absolute right-3 top-2.5 text-xs text-slate-400 font-bold">°C</span>
                </div>
              </div>

              <div className="space-y-1">
                <label className="font-bold text-slate-600 block">Fahrenheit (°F) :</label>
                <div className="relative">
                  <input
                    type="number"
                    step="0.1"
                    value={fVal}
                    onChange={(e) => {
                      handleFToC(e.target.value);
                      if (!isNaN(Number(e.target.value))) {
                        const calculatedC = ((Number(e.target.value) - 32) * 5) / 9;
                        setFeverTemp(calculatedC.toFixed(1));
                      }
                    }}
                    className="w-full p-2.5 bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500 text-sm font-bold text-slate-800"
                  />
                  <span className="absolute right-3 top-2.5 text-xs text-slate-400 font-bold">°F</span>
                </div>
              </div>
            </div>

            {/* Diagnostics indicator */}
            <div className={`p-3 rounded-lg border text-xs font-bold text-center transition-all ${activeStatus.color}`}>
              {activeStatus.text}
            </div>
          </div>

          {/* Mass/Weight widget */}
          <div className="bg-slate-50/50 p-4 rounded-xl border border-slate-100 space-y-3">
            <h3 className="text-xs font-black text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
              <Ruler className="w-4 h-4 text-pink-500" /> Convertisseur Masse (kg ⇄ lbs)
            </h3>

            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="space-y-1">
                <label className="font-bold text-slate-600 block">Kilogrammes (kg) :</label>
                <div className="relative">
                  <input
                    type="number"
                    step="0.1"
                    value={kgVal}
                    onChange={(e) => handleKgToLbs(e.target.value)}
                    className="w-full p-2.5 bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500 text-sm font-bold text-slate-800"
                  />
                  <span className="absolute right-3 top-2.5 text-xs text-slate-400 font-bold">kg</span>
                </div>
              </div>

              <div className="space-y-1">
                <label className="font-bold text-slate-600 block">Livres (lbs) :</label>
                <div className="relative">
                  <input
                    type="number"
                    step="0.1"
                    value={lbsVal}
                    onChange={(e) => handleLbsToKg(e.target.value)}
                    className="w-full p-2.5 bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500 text-sm font-bold text-slate-800"
                  />
                  <span className="absolute right-3 top-2.5 text-xs text-slate-400 font-bold">lbs</span>
                </div>
              </div>
            </div>

            <div className="p-3 bg-pink-50 border border-pink-100 text-[10px] text-pink-800 font-medium rounded-lg leading-relaxed">
              💡 Le saviez-vous ? Les dosages pédiatriques en France sont calculés strictement en kg, tandis qu'aux USA les emballages (comme Tylenol) utilisent les livres (lbs). Utilisez cet outil pour éviter tout risque de surdosage !
            </div>
          </div>
        </div>

        {/* Informational table */}
        <div className="border border-slate-100 rounded-xl p-4 bg-white space-y-2">
          <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider">Tableau de correspondance rapide</h4>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-[11px]">
            <div className="bg-slate-50 p-2 rounded-lg text-center">
              <p className="text-slate-400 uppercase font-extrabold text-[9px]">37°C</p>
              <p className="font-black text-slate-800 mt-0.5">98.6°F</p>
              <span className="text-[9px] text-emerald-600 font-bold">Normal</span>
            </div>
            <div className="bg-slate-50 p-2 rounded-lg text-center">
              <p className="text-slate-400 uppercase font-extrabold text-[9px]">38°C</p>
              <p className="font-black text-slate-800 mt-0.5">100.4°F</p>
              <span className="text-[9px] text-amber-600 font-bold">Fébricule</span>
            </div>
            <div className="bg-slate-50 p-2 rounded-lg text-center">
              <p className="text-slate-400 uppercase font-extrabold text-[9px]">39°C</p>
              <p className="font-black text-slate-800 mt-0.5">102.2°F</p>
              <span className="text-[9px] text-red-600 font-bold">Fièvre</span>
            </div>
            <div className="bg-slate-50 p-2 rounded-lg text-center">
              <p className="text-slate-400 uppercase font-extrabold text-[9px]">40°C</p>
              <p className="font-black text-slate-800 mt-0.5">104.0°F</p>
              <span className="text-[9px] text-red-700 font-bold">Très élevée</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
