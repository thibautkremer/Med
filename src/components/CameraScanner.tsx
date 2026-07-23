import React, { useState, useRef, useEffect } from 'react';
import { UserProfile, ImageAnalysisResponse, CabinetItem } from '../types';
import { aiService } from '../services/aiService';
import { errorService } from '../services/errorService';
import {
  Camera, Upload, RefreshCw, AlertTriangle, CheckCircle, 
  HelpCircle, Eye, ShoppingBag, ArrowRight, ShieldCheck, Heart, Trash2,
  Calendar, Package, Plus, Sparkles
} from 'lucide-react';

interface CameraScannerProps {
  activeProfile: UserProfile | null;
  toggleFavorite: (id: string) => void;
  favorites: string[];
}

export default function CameraScanner({ activeProfile, toggleFavorite, favorites }: CameraScannerProps) {
  const [streamActive, setStreamActive] = useState(false);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<ImageAnalysisResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [dragActive, setDragActive] = useState(false);

  // States for Adding to Armoire & Secondary Expiration Scan
  const [showAddToCabinet, setShowAddToCabinet] = useState(false);
  const [cabinetStockQty, setCabinetStockQty] = useState(30);
  const [cabinetExpDate, setCabinetExpDate] = useState('');
  const [cabinetAddedSuccess, setCabinetAddedSuccess] = useState<string | null>(null);
  const [scanningExpDate, setScanningExpDate] = useState(false);
  const [expScanSuccess, setExpScanSuccess] = useState<string | null>(null);
  const [expScanError, setExpScanError] = useState<string | null>(null);

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const expFileInputRef = useRef<HTMLInputElement | null>(null);

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

    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      setError("La caméra n'est pas supportée par votre navigateur ou votre connexion n'est pas sécurisée (HTTPS requis).");
      return;
    }

    try {
      // Try back camera first, then generic camera
      let stream: MediaStream;
      try {
        stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } });
      } catch (err) {
        stream = await navigator.mediaDevices.getUserMedia({ video: true });
      }
      
      streamRef.current = stream;
      setStreamActive(true);
    } catch (err: any) {
      console.error(err);
      setError("Impossible d'accéder à la caméra. Vérifiez les autorisations de votre navigateur/système ou importez une image.");
    }
  };

  useEffect(() => {
    if (streamActive && videoRef.current && streamRef.current) {
      videoRef.current.srcObject = streamRef.current;
      videoRef.current.play().catch((playErr) => {
        console.error("Video play failed:", playErr);
        setError("Impossible de démarrer le flux vidéo.");
      });
    }
  }, [streamActive]);

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
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

  // Perform full-stack API image analysis
  const analyzeBoxImage = async (base64WithPrefix: string, mimeType: string, hintPrompt?: string) => {
    errorService.action("Clic sur Analyser la boîte / photo");
    setLoading(true);
    setError(null);

    try {
      const data = await aiService.analyzeMedicineImage(base64WithPrefix, activeProfile);
      setResult(data);

      if (data.detectedMedicine?.expirationDate) {
        setCabinetExpDate(data.detectedMedicine.expirationDate);
      }
    } catch (err: any) {
      console.error(err);
      setError("L'analyse visuelle a échoué. Veuillez réessayer avec un éclairage plus clair ou saisir manuellement.");
    } finally {
      setLoading(false);
    }
  };

  // Secondary photo scan specifically for expiration date
  const handleScanExpirationPhoto = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setScanningExpDate(true);
    setExpScanError(null);
    setExpScanSuccess(null);

    try {
      const reader = new FileReader();
      reader.onload = async () => {
        const base64 = reader.result as string;

        try {
          const data = await aiService.analyzeExpiration(base64);

          if (data.expirationDate) {
            setResult(prev => prev ? {
              ...prev,
              detectedMedicine: {
                ...prev.detectedMedicine,
                expirationDate: data.expirationDate,
                expirationDateFound: true,
                batchNumber: data.batchNumber || prev.detectedMedicine.batchNumber
              }
            } : prev);
            setCabinetExpDate(data.expirationDate);
            setExpScanSuccess(`Date détectée avec succès : ${data.expirationDate} ${data.batchNumber ? `(Lot ${data.batchNumber})` : ''}`);
          } else {
            setExpScanError("Date de péremption introuvable sur cette photo. Entrez-la manuellement ci-dessous.");
          }
        } catch (err: any) {
          console.error(err);
          setExpScanError("Une erreur est survenue lors de l'analyse de la date.");
        } finally {
          setScanningExpDate(false);
        }
      };
      reader.readAsDataURL(file);
    } catch (err: any) {
      setExpScanError("Erreur lors de la lecture de l'image de date.");
    } finally {
      setScanningExpDate(false);
    }
  };

  // Save detected medication directly to user cabinet
  const handleSaveToCabinet = (e: React.FormEvent) => {
    e.preventDefault();
    if (!result || !result.detectedMedicine) return;

    const med = result.detectedMedicine;
    const existingRaw = localStorage.getItem('pharmacie_cabinet');
    let currentCabinet: CabinetItem[] = [];
    if (existingRaw) {
      try { currentCabinet = JSON.parse(existingRaw); } catch(err) {}
    }

    const newItem: CabinetItem = {
      id: `cab-${Date.now()}`,
      medicationName: med.name,
      activeIngredient: med.activeIngredient,
      country: med.countryOfOrigin === 'US' ? 'US' : 'FR',
      stockQuantity: Number(cabinetStockQty),
      initialQuantity: Number(cabinetStockQty),
      expirationDate: cabinetExpDate || med.expirationDate || undefined,
      lowStockAlert: Number(cabinetStockQty) <= 5,
      notes: med.batchNumber ? `N° de lot : ${med.batchNumber}` : undefined
    };

    const updated = [newItem, ...currentCabinet];
    localStorage.setItem('pharmacie_cabinet', JSON.stringify(updated));

    setCabinetAddedSuccess(`"${med.name}" a bien été ajouté à votre armoire à pharmacie !`);
    setShowAddToCabinet(false);
    setTimeout(() => setCabinetAddedSuccess(null), 5000);
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

            {/* Toast notification for adding to cabinet */}
            {cabinetAddedSuccess && (
              <div className="bg-emerald-600 text-white font-semibold text-xs px-4 py-3 rounded-xl shadow-lg border border-emerald-500/10 flex items-center gap-2 animate-bounce-short">
                <CheckCircle className="w-4 h-4 text-emerald-100 shrink-0" />
                <p>{cabinetAddedSuccess}</p>
              </div>
            )}

            {/* Expiration Date Detection Block */}
            <div className="border border-slate-100 rounded-xl p-4 bg-purple-50/20 space-y-3">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div>
                  <h4 className="text-xs font-bold text-purple-900 uppercase tracking-wider flex items-center gap-1.5">
                    <Calendar className="w-4 h-4 text-purple-600" />
                    Date de Péremption & Traçabilité
                  </h4>
                  {result.detectedMedicine.expirationDateFound ? (
                    <p className="text-xs font-semibold text-emerald-700 mt-1 flex items-center gap-1">
                      <CheckCircle className="w-3.5 h-3.5 text-emerald-600" />
                      Date de péremption détectée : <strong>{result.detectedMedicine.expirationDate}</strong>
                      {result.detectedMedicine.batchNumber && (
                        <span className="text-[10px] text-slate-500 font-normal"> (Lot : {result.detectedMedicine.batchNumber})</span>
                      )}
                    </p>
                  ) : (
                    <p className="text-xs text-amber-700 mt-1 font-medium">
                      ⚠️ Date de péremption non lisible sur la face principale. Vous pouvez la photographier spécifiquement ci-dessous.
                    </p>
                  )}
                </div>

                {/* Secondary photo scan button */}
                <div>
                  <input
                    type="file"
                    ref={expFileInputRef}
                    onChange={handleScanExpirationPhoto}
                    accept="image/*"
                    className="hidden"
                  />
                  <button
                    type="button"
                    onClick={() => expFileInputRef.current?.click()}
                    disabled={scanningExpDate}
                    className="px-3 py-2 bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold rounded-xl flex items-center gap-1.5 transition-all cursor-pointer shadow-sm disabled:opacity-50"
                  >
                    <Camera className="w-3.5 h-3.5" />
                    {scanningExpDate ? 'Analyse de la date...' : '📷 Scanner le verso/côté'}
                  </button>
                </div>
              </div>

              {/* Feedback banners for expiration scan */}
              {expScanSuccess && (
                <div className="bg-emerald-50 text-emerald-800 p-2.5 rounded-lg text-xs flex items-center gap-1.5 font-semibold">
                  <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
                  <p>{expScanSuccess}</p>
                </div>
              )}
              {expScanError && (
                <div className="bg-amber-50 text-amber-800 p-2.5 rounded-lg text-xs flex items-center gap-1.5 font-medium">
                  <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
                  <p>{expScanError}</p>
                </div>
              )}
            </div>

            {/* Action Bar: Add to Armoire button */}
            <div className="bg-indigo-50/50 border border-indigo-100 rounded-xl p-4 flex flex-col sm:flex-row items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <Package className="w-5 h-5 text-indigo-600 shrink-0" />
                <div>
                  <h4 className="font-bold text-slate-800 text-xs">Voulez-vous ajouter ce médicament à votre Armoire à Pharmacie ?</h4>
                  <p className="text-[11px] text-slate-500">Suivez le stock restants et recevez des alertes avant péremption.</p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setShowAddToCabinet(!showAddToCabinet)}
                className="w-full sm:w-auto px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl flex items-center justify-center gap-1.5 transition-all shadow-sm cursor-pointer shrink-0"
              >
                <Plus className="w-4 h-4" />
                {showAddToCabinet ? 'Fermer le formulaire' : '➕ Ajouter à mon Armoire'}
              </button>
            </div>

            {/* Expandable Add to Cabinet form */}
            {showAddToCabinet && (
              <form onSubmit={handleSaveToCabinet} className="bg-white rounded-xl border-2 border-indigo-500 p-4 space-y-3 animate-fade-in shadow-md">
                <h4 className="font-bold text-slate-800 text-xs flex items-center gap-1.5 border-b pb-2">
                  <Package className="w-4 h-4 text-indigo-600" />
                  Ajouter "{result.detectedMedicine.name}" à mon Armoire
                </h4>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  <div>
                    <label className="font-bold text-slate-600 block mb-1">Nombre de doses / comprimés en stock :</label>
                    <input
                      type="number"
                      min="1"
                      max="500"
                      required
                      value={cabinetStockQty}
                      onChange={(e) => setCabinetStockQty(Number(e.target.value))}
                      className="w-full p-2 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>

                  <div>
                    <label className="font-bold text-slate-600 block mb-1">Date de péremption :</label>
                    <input
                      type="date"
                      value={cabinetExpDate}
                      onChange={(e) => setCabinetExpDate(e.target.value)}
                      className="w-full p-2 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                    {!cabinetExpDate && (
                      <p className="text-[10px] text-slate-400 mt-0.5">Laissez vide ou utilisez le bouton "Scanner le verso" ci-dessus.</p>
                    )}
                  </div>
                </div>

                <div className="pt-2 text-right">
                  <button
                    type="submit"
                    className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl shadow transition-colors cursor-pointer"
                  >
                    Valider et Enregistrer dans l'Armoire
                  </button>
                </div>
              </form>
            )}

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

                {result.detectedMedicine.unsafeForPregnancy ? (
                  <div className="bg-rose-50 border border-rose-200 text-rose-900 p-2.5 rounded-lg font-semibold flex items-start gap-1.5 mt-2">
                    <span className="text-base">🤰</span>
                    <div>
                      <span className="font-extrabold text-rose-900 block text-xs">⚠️ DÉCONSEILLÉ PENDANT LA GROSSESSE</span>
                      <span className="text-[11px] text-rose-800 font-normal leading-snug block mt-0.5">
                        {result.detectedMedicine.pregnancyWarningFr || "Ce médicament comporte des risques durant la grossesse."}
                      </span>
                    </div>
                  </div>
                ) : (
                  <div className="bg-teal-50 border border-teal-200 text-teal-800 p-2 rounded-lg text-[11px] font-medium flex items-center gap-1.5 mt-2">
                    <span className="text-base">🤰</span>
                    <span>Considéré comme compatible avec la grossesse (selon avis médical).</span>
                  </div>
                )}
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
