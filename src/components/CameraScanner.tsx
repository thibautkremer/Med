import React, { useState, useRef, useEffect } from 'react';
import { UserProfile, ImageAnalysisResponse } from '../types';
import { 
  Camera, Upload, RefreshCw, AlertTriangle, CheckCircle, 
  HelpCircle, Eye, ShoppingBag, ArrowRight, ShieldCheck, Heart, Trash2
} from 'lucide-react';

interface CameraScannerProps {
  activeProfile: UserProfile | null;
  toggleFavorite: (id: string) => void;
  favorites: string[];
}

const MOCK_BOXES = [
  {
    id: 'doliprane',
    name: 'Doliprane 1000mg (Boîte)',
    country: 'FR 🇫🇷',
    imageText: 'DOLIPRANE 1000mg Paracétamol - Sanofi',
    desc: 'Boîte de Doliprane 1000mg comprimés (Sanofi, France).',
    pixelBase64: 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=' // Green 1x1 pixel
  },
  {
    id: 'tylenol',
    name: 'Tylenol Extra Strength 500mg',
    country: 'US 🇺🇸',
    imageText: 'TYLENOL Acetaminophen 500mg Extra Strength',
    desc: 'Boîte de Tylenol 500mg (McNeil, USA).',
    pixelBase64: 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==' // Red 1x1 pixel
  },
  {
    id: 'spasfon',
    name: 'Spasfon Comprimés (Boîte)',
    country: 'FR 🇫🇷',
    imageText: 'SPASFON Phloroglucinol - TEVA / Spasmes',
    desc: 'Boîte de Spasfon comprimés roses (Teva, France).',
    pixelBase64: 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg=='
  },
  {
    id: 'biafine',
    name: 'Biafine Émulsion (Tube)',
    country: 'FR 🇫🇷',
    imageText: 'BIAFINE Émulsion pour brûlures - Johnson & Johnson',
    desc: 'Tube de Biafine vert et blanc pour les brûlures (France).',
    pixelBase64: 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==' // Greenish
  },
  {
    id: 'nyquil',
    name: 'Vicks NyQuil Cold & Flu',
    country: 'US 🇺🇸',
    imageText: 'VICKS NyQuil Cold & Flu Nighttime Relief',
    desc: 'Bouteille de sirop ou boîte de gélules NyQuil (USA).',
    pixelBase64: 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg=='
  }
];

export default function CameraScanner({ activeProfile, toggleFavorite, favorites }: CameraScannerProps) {
  const [streamActive, setStreamActive] = useState(false);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<ImageAnalysisResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [dragActive, setDragActive] = useState(false);

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  // Stop video stream on unmount
  useEffect(() => {
    return () => {
      stopCamera();
    };
  }, []);

  const startCamera = async () => {
    setError(null);
    setCapturedImage(null);
    setResult(null);

    try {
      const constraints = {
        video: { facingMode: 'environment' } // Prefer back camera
      };
      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
        setStreamActive(true);
      }
    } catch (err: any) {
      console.error(err);
      setError("Impossible d'accéder à la caméra. Veuillez autoriser l'accès ou téléverser un fichier.");
    }
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    setStreamActive(false);
  };

  const capturePhoto = () => {
    if (videoRef.current && canvasRef.current) {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      const context = canvas.getContext('2d');

      if (context) {
        // Set canvas dimensions to match video stream
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        context.drawImage(video, 0, 0, canvas.width, canvas.height);

        // Export as base64 jpeg
        const base64Data = canvas.toDataURL('image/jpeg', 0.8);
        setCapturedImage(base64Data);
        stopCamera();
        analyzeBoxImage(base64Data, 'image/jpeg');
      }
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
      setError("Le fichier doit être une image.");
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      const base64 = reader.result as string;
      setCapturedImage(base64);
      setResult(null);
      setError(null);
      
      // Extract clean raw base64 data and call endpoint
      analyzeBoxImage(base64, file.type);
    };
    reader.onerror = () => {
      setError("Erreur de lecture du fichier.");
    };
    reader.readAsDataURL(file);
  };

  // Drag and drop event handlers
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

  // Quick simulation helper
  const handleSimulate = (box: typeof MOCK_BOXES[0]) => {
    setError(null);
    setResult(null);
    
    // Set a neat mockup canvas text so user sees they are scanning
    const simBase64 = `data:image/png;base64,${box.pixelBase64}`;
    setCapturedImage(simBase64);
    
    setLoading(true);
    
    // Simulate API call with target item name as prompt hint
    analyzeBoxImage(simBase64, 'image/png', box.imageText);
  };

  // Perform full-stack API image analysis
  const analyzeBoxImage = async (base64WithPrefix: string, mimeType: string, hintPrompt?: string) => {
    setLoading(true);
    setError(null);

    try {
      // Strip base64 data prefix (e.g., "data:image/jpeg;base64,")
      const rawBase64 = base64WithPrefix.split(',')[1];

      const response = await fetch('/api/image/analyze', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          imageBase64: rawBase64,
          mimeType: mimeType,
          profile: activeProfile,
          hintPrompt: hintPrompt // To help mock simulation align perfectly
        })
      });

      if (!response.ok) {
        throw new Error("Erreur serveur lors de l'analyse visuelle.");
      }

      const data = await response.json();
      setResult(data);
    } catch (err: any) {
      console.error(err);
      setError("L'analyse visuelle a échoué. Veuillez réessayer avec un éclairage plus clair ou saisir manuellement.");
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setCapturedImage(null);
    setResult(null);
    setError(null);
    stopCamera();
  };

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-2xl border border-slate-100 p-5 shadow-sm space-y-4">
        <div className="flex items-center gap-2">
          <div className="p-2 bg-emerald-50 rounded-lg text-emerald-600">
            <Camera className="w-5 h-5" />
          </div>
          <div>
            <h2 className="font-bold text-slate-800 text-lg">Scanner de Boîte de Médicament</h2>
            <p className="text-xs text-slate-400">Prenez une boîte en photo pour l'identifier et trouver son équivalent</p>
          </div>
        </div>

        {activeProfile && (
          <div className="bg-emerald-50/50 rounded-xl p-2 px-3 border border-emerald-100 text-xs text-emerald-800">
            ✓ Posologie calculée pour le patient actif : <strong>{activeProfile.name}</strong> ({activeProfile.age} ans, {activeProfile.weight} kg).
          </div>
        )}

        {/* Camera Stage / Placeholder Area */}
        {!capturedImage && !streamActive && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* Real Actions Panel */}
            <div className="space-y-3">
              <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Outils de capture réels</h3>
              
              <div 
                onDragEnter={handleDrag}
                onDragLeave={handleDrag}
                onDragOver={handleDrag}
                onDrop={handleDrop}
                className={`border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-all flex flex-col items-center justify-center gap-2 ${
                  dragActive 
                    ? 'border-emerald-500 bg-emerald-50/50' 
                    : 'border-slate-200 bg-slate-50 hover:bg-slate-100/50'
                }`}
                onClick={() => document.getElementById('camera-file-input')?.click()}
              >
                <Upload className="w-8 h-8 text-slate-400" />
                <div>
                  <p className="text-sm font-semibold text-slate-700">Déposer l'image de la boîte ici</p>
                  <p className="text-xs text-slate-400 mt-1">Glissez un fichier ou cliquez pour parcourir</p>
                </div>
                <input
                  id="camera-file-input"
                  type="file"
                  accept="image/*"
                  onChange={handleFileUpload}
                  className="hidden"
                />
              </div>

              <button
                onClick={startCamera}
                className="w-full py-3.5 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-sm rounded-xl flex items-center justify-center gap-2 shadow-sm transition-all cursor-pointer"
              >
                <Camera className="w-4 h-4" /> Activer la Webcam
              </button>
            </div>

            {/* Simulation Shortcuts (Highly Useful!) */}
            <div className="space-y-3 bg-slate-50/70 p-4 rounded-xl border border-slate-100">
              <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Simulateur de Boîtes (Test instantané)</h3>
              <p className="text-[10px] text-slate-400">Parfait pour tester l'analyse sans boîte réelle sous la main :</p>
              
              <div className="space-y-2">
                {MOCK_BOXES.map((box) => (
                  <button
                    key={box.id}
                    onClick={() => handleSimulate(box)}
                    className="w-full text-left bg-white hover:bg-emerald-50 hover:border-emerald-200 border border-slate-200 p-2.5 rounded-lg flex items-center justify-between transition-all cursor-pointer text-xs"
                  >
                    <div>
                      <p className="font-extrabold text-slate-700">{box.name}</p>
                      <p className="text-[10px] text-slate-400 italic mt-0.5">{box.desc}</p>
                    </div>
                    <span className="shrink-0 bg-slate-100 group-hover:bg-emerald-100 text-[10px] font-bold px-2 py-0.5 rounded text-slate-500">
                      Simuler →
                    </span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Active Webcam Feed */}
        {streamActive && (
          <div className="relative bg-slate-900 rounded-xl overflow-hidden aspect-video max-w-xl mx-auto border border-slate-800">
            <video
              ref={videoRef}
              className="w-full h-full object-cover"
              playsInline
              muted
            />
            
            {/* Guide frame layout overlay */}
            <div className="absolute inset-0 border-4 border-dashed border-white/20 m-6 rounded-lg pointer-events-none flex items-center justify-center">
              <span className="bg-black/45 text-[10px] font-bold text-white px-3 py-1.5 rounded-full backdrop-blur-sm uppercase tracking-wider">
                Alignez la boîte de médicament ici
              </span>
            </div>

            <div className="absolute bottom-4 inset-x-0 flex items-center justify-center gap-3">
              <button
                onClick={capturePhoto}
                className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs px-5 py-2.5 rounded-full shadow-lg flex items-center gap-1.5 transition-all cursor-pointer"
              >
                <Camera className="w-4 h-4" /> Prendre en photo
              </button>
              <button
                onClick={stopCamera}
                className="bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs px-4 py-2.5 rounded-full shadow-lg transition-all cursor-pointer"
              >
                Annuler
              </button>
            </div>
          </div>
        )}

        {/* Captured image display & Analyzing loaders */}
        {capturedImage && (
          <div className="relative max-w-xl mx-auto border border-slate-100 bg-slate-50 p-4 rounded-xl flex items-center gap-4">
            <img
              src={capturedImage}
              alt="Scan"
              className="w-24 h-24 object-cover rounded-lg border border-slate-200"
            />
            <div className="flex-1 space-y-1">
              <h4 className="font-bold text-slate-700 text-sm">Image de boîte chargée</h4>
              <p className="text-xs text-slate-400">Analyse de la molécule en cours avec Gemini...</p>
              
              <div className="flex items-center gap-2 pt-2">
                <button
                  onClick={handleReset}
                  disabled={loading}
                  className="px-3 py-1 text-xs font-bold text-red-600 bg-red-50 hover:bg-red-100 rounded transition-all cursor-pointer disabled:opacity-50"
                >
                  Effacer / Nouveau scan
                </button>
              </div>
            </div>

            {loading && (
              <div className="p-3 bg-emerald-50 rounded-full text-emerald-600 animate-spin">
                <RefreshCw className="w-5 h-5" />
              </div>
            )}
          </div>
        )}

        {/* Invisible canvas for taking screenshots */}
        <canvas ref={canvasRef} className="hidden" />

        {/* Error message */}
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-800 p-4 rounded-xl text-xs flex gap-2">
            <AlertTriangle className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
            <p>{error}</p>
          </div>
        )}
      </div>

      {/* Analysis Output Result Cards */}
      {result && result.detectedMedicine && (
        <div className="bg-white rounded-2xl border border-slate-100 shadow-md overflow-hidden space-y-0 animate-fade-in">
          {/* Header block */}
          <div className="bg-slate-800 text-white p-5 flex justify-between items-center">
            <div>
              <span className="text-[10px] uppercase font-bold tracking-widest bg-emerald-500/20 text-emerald-400 border border-emerald-500/20 px-2.5 py-1 rounded-full">
                ✓ Identification Réussie par IA
              </span>
              <h3 className="text-lg font-black mt-2 text-slate-100">{result.detectedMedicine.name}</h3>
              <p className="text-xs text-slate-400 italic">
                Molécule détectée : {result.detectedMedicine.activeIngredient}
              </p>
            </div>
            
            {/* Origin indicator flag */}
            <div className="text-center">
              <p className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">Origine Boîte</p>
              <span className="text-3xl inline-block mt-1">
                {result.detectedMedicine.countryOfOrigin === 'FR' ? '🇫🇷 France' : 
                 result.detectedMedicine.countryOfOrigin === 'US' ? '🇺🇸 USA' : '❓ Inconnu'}
              </span>
            </div>
          </div>

          <div className="p-6 space-y-6">
            {/* Usage indication split */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 text-xs">
                <p className="font-bold text-slate-500 mb-1">INDICATION (FR) :</p>
                <p className="text-slate-700 leading-relaxed font-medium">{result.detectedMedicine.purposeFr}</p>
              </div>
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 text-xs">
                <p className="font-bold text-slate-500 mb-1">INDICATION (US) :</p>
                <p className="text-slate-700 leading-relaxed font-medium">{result.detectedMedicine.purposeUs}</p>
              </div>
            </div>

            {/* Smart Cross-Border Equivalences */}
            <div className="border border-slate-100 rounded-xl p-4 bg-emerald-50/20">
              <h4 className="text-xs font-bold text-emerald-800 uppercase tracking-wider mb-2">Équivalences Internationales Recommandées</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-white p-3 rounded-lg border border-slate-100 text-xs">
                  <p className="font-bold text-slate-400 uppercase text-[9px]">Équivalent France 🇫🇷 :</p>
                  <p className="font-extrabold text-slate-800 mt-1">{result.detectedMedicine.equivalentFr || "N/A"}</p>
                </div>
                <div className="bg-white p-3 rounded-lg border border-slate-100 text-xs">
                  <p className="font-bold text-slate-400 uppercase text-[9px]">Équivalent États-Unis 🇺🇸 :</p>
                  <p className="font-extrabold text-emerald-700 mt-1">{result.detectedMedicine.equivalentUs || "N/A"}</p>
                </div>
              </div>
            </div>

            {/* Dosage recommendations based on profile */}
            <div className="border border-slate-100 rounded-xl p-4 bg-blue-50/30">
              <div className="flex items-center justify-between mb-3 text-xs">
                <h4 className="font-bold text-slate-700 flex items-center gap-1">
                  <ShieldCheck className="w-4 h-4 text-emerald-600" />
                  Dose Recommandée & Posologie
                </h4>
                {activeProfile && (
                  <span className="bg-blue-100 text-blue-800 text-[10px] font-bold px-2 py-0.5 rounded">
                    Patient : {activeProfile.name} ({activeProfile.age} ans, {activeProfile.weight} kg)
                  </span>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                <div className="bg-white p-3 rounded-lg border border-slate-100 space-y-1">
                  <p className="font-bold text-slate-500 uppercase text-[9px]">Instructions en Français :</p>
                  <p className="text-slate-700 font-medium leading-relaxed">{result.detectedMedicine.dosageInfoFr}</p>
                </div>
                <div className="bg-white p-3 rounded-lg border border-slate-100 space-y-1">
                  <p className="font-bold text-slate-500 uppercase text-[9px]">Instructions in English :</p>
                  <p className="text-slate-700 font-medium leading-relaxed">{result.detectedMedicine.dosageInfoUs}</p>
                </div>
              </div>
            </div>

            {/* Regulation & Prescription details */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
              <div className="border border-slate-100 rounded-xl p-4">
                <h5 className="font-bold text-slate-700 mb-2">Statut Ordonnance / Prescription</h5>
                <div className="flex gap-4">
                  <div className="flex-1 text-center p-2 bg-slate-50 rounded-lg">
                    <p className="text-slate-400 text-[9px] font-bold">FRANCE</p>
                    <p className={`font-extrabold text-xs mt-1 ${result.detectedMedicine.requiresPrescriptionFr ? "text-amber-600" : "text-emerald-600"}`}>
                      {result.detectedMedicine.requiresPrescriptionFr ? "Sur ordonnance" : "Vente libre (OTC)"}
                    </p>
                  </div>
                  <div className="flex-1 text-center p-2 bg-slate-50 rounded-lg">
                    <p className="text-slate-400 text-[9px] font-bold">USA</p>
                    <p className={`font-extrabold text-xs mt-1 ${result.detectedMedicine.requiresPrescriptionUs ? "text-amber-600" : "text-emerald-600"}`}>
                      {result.detectedMedicine.requiresPrescriptionUs ? "Prescription (Rx)" : "Over-The-Counter"}
                    </p>
                  </div>
                </div>
              </div>

              <div className="border border-slate-100 rounded-xl p-4 text-xs space-y-1.5">
                <h5 className="font-bold text-slate-700">Mises en Garde importantes</h5>
                <p className="text-amber-950 bg-amber-50 p-2.5 rounded-lg font-medium leading-relaxed">
                  <strong>FR :</strong> {result.detectedMedicine.precautionsFr}<br/>
                  <strong className="block mt-1">US :</strong> {result.detectedMedicine.precautionsUs}
                </p>
              </div>
            </div>

            {/* Reset control */}
            <div className="pt-2 text-right">
              <button
                onClick={handleReset}
                className="bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs px-5 py-2.5 rounded-xl transition-all cursor-pointer"
              >
                Faire un autre scan
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
