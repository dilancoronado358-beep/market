import React, { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import {
  BrowserMultiFormatReader,
  IScannerControls,
} from '@zxing/browser';
import { BarcodeFormat, DecodeHintType } from '@zxing/library';
import { Camera, X, RefreshCw, Volume2, VolumeX, Flashlight, CheckCircle2, Upload } from 'lucide-react';
import { Button } from './Button';
import { toast } from 'sonner';

interface BarcodeScannerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onScan: (barcode: string) => void;
  title?: string;
  continuous?: boolean;
}

// Generador de tono BEEP estilo POS usando Web Audio API estándar
const playBeep = () => {
  try {
    const AudioContextClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (!AudioContextClass) return;
    const ctx = new AudioContextClass();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(1900, ctx.currentTime);
    gain.gain.setValueAtTime(0.2, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.12);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + 0.12);
  } catch {
    // Ignorar si el navegador bloquea audio sin interacción previa
  }
};

export const BarcodeScannerModal: React.FC<BarcodeScannerModalProps> = ({
  isOpen,
  onClose,
  onScan,
  title = 'Escanear Código de Barras con Cámara',
  continuous = false,
}) => {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const readerRef = useRef<BrowserMultiFormatReader | null>(null);
  const controlsRef = useRef<IScannerControls | null>(null);

  const [cameras, setCameras] = useState<MediaDeviceInfo[]>([]);
  const [selectedCameraId, setSelectedCameraId] = useState<string>('');
  const [isScanning, setIsScanning] = useState(false);
  const [hasError, setHasError] = useState<string | null>(null);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [torchEnabled, setTorchEnabled] = useState(false);
  const [hasTorch, setHasTorch] = useState(false);
  const [lastScanned, setLastScanned] = useState<string | null>(null);
  const [scannedCount, setScannedCount] = useState(0);
  const [manualCode, setManualCode] = useState('');
  const isCooldownRef = useRef(false);

  // Inicializar lector y listar cámaras al abrir
  useEffect(() => {
    if (!isOpen) return;

    let isMounted = true;
    setHasError(null);
    setLastScanned(null);
    setScannedCount(0);
    setManualCode('');

    // Configurar formatos y algoritmos de alta sensibilidad (TRY_HARDER para botellas / empaques curvos)
    const hints = new Map();
    hints.set(DecodeHintType.POSSIBLE_FORMATS, [
      BarcodeFormat.EAN_13,
      BarcodeFormat.EAN_8,
      BarcodeFormat.CODE_128,
      BarcodeFormat.CODE_39,
      BarcodeFormat.UPC_A,
      BarcodeFormat.UPC_E,
      BarcodeFormat.QR_CODE,
      BarcodeFormat.ITF,
    ]);
    hints.set(DecodeHintType.TRY_HARDER, true);

    const reader = new BrowserMultiFormatReader(hints, {
      delayBetweenScanAttempts: 60,
      delayBetweenScanSuccess: 1200,
    });
    readerRef.current = reader;

    const initCameras = async () => {
      try {
        // En iOS Safari primero solicitamos permiso básico para que enumerateDevices() liste las etiquetas
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: { ideal: 'environment' } },
        });
        // Detener el stream preliminar
        stream.getTracks().forEach((t) => t.stop());

        const devices = await navigator.mediaDevices.enumerateDevices();
        if (!isMounted) return;

        const videoDevices = devices.filter((d) => d.kind === 'videoinput');
        setCameras(videoDevices);

        // Preferir cámara trasera
        const backCam = videoDevices.find(
          (d) =>
            d.label.toLowerCase().includes('back') ||
            d.label.toLowerCase().includes('trasera') ||
            d.label.toLowerCase().includes('environment') ||
            d.label.toLowerCase().includes('rear')
        );
        const preferredId = backCam ? backCam.deviceId : videoDevices[0]?.deviceId || '';
        setSelectedCameraId(preferredId);

        startScanning(preferredId);
      } catch (err: unknown) {
        if (!isMounted) return;
        const msg = err instanceof Error ? err.message : String(err);
        if (msg.includes('NotAllowedError') || msg.includes('Permission')) {
          setHasError('Permiso de cámara denegado. Habilita el acceso en los ajustes de tu navegador o celular.');
        } else {
          // Intentar iniciar directamente con facingMode 'environment' si falló enumerate
          startScanning('');
        }
      }
    };

    const timer = setTimeout(initCameras, 100);

    return () => {
      isMounted = false;
      clearTimeout(timer);
      stopScanning();
    };
  }, [isOpen]);

  const startScanning = async (deviceId?: string) => {
    try {
      stopScanning();
      if (!videoRef.current || !readerRef.current) return;

      setHasError(null);

      const constraints: MediaStreamConstraints = {
        audio: false,
        video: deviceId
          ? { deviceId: { exact: deviceId } }
          : {
              facingMode: { ideal: 'environment' },
              width: { ideal: 1280 },
              height: { ideal: 720 },
            },
      };

      const controls = await readerRef.current.decodeFromConstraints(
        constraints,
        videoRef.current,
        (result, error) => {
          if (result) {
            handleSuccessfulScan(result.getText());
          }
        }
      );

      controlsRef.current = controls;
      setIsScanning(true);

      // Comprobar soporte de linterna en el stream actual
      try {
        const stream = videoRef.current.srcObject as MediaStream;
        const track = stream?.getVideoTracks()[0];
        const capabilities = track?.getCapabilities?.() as MediaTrackCapabilities & { torch?: boolean };
        if (capabilities && 'torch' in capabilities) {
          setHasTorch(true);
        } else {
          setHasTorch(false);
        }
      } catch {
        setHasTorch(false);
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      setHasError(`No se pudo acceder al video de la cámara: ${msg}`);
      setIsScanning(false);
    }
  };

  const stopScanning = () => {
    try {
      if (controlsRef.current) {
        controlsRef.current.stop();
        controlsRef.current = null;
      }
      if (videoRef.current && videoRef.current.srcObject) {
        const stream = videoRef.current.srcObject as MediaStream;
        stream.getTracks().forEach((track) => track.stop());
        videoRef.current.srcObject = null;
      }
      setIsScanning(false);
      setTorchEnabled(false);
    } catch {
      // Ignorar errores al cerrar
    }
  };

  const handleSuccessfulScan = (code: string) => {
    if (isCooldownRef.current) return;
    const clean = code.trim();
    if (!clean) return;

    // Cooldown para evitar lecturas duplicadas en menos de 1 segundo
    isCooldownRef.current = true;
    setTimeout(() => {
      isCooldownRef.current = false;
    }, 1200);

    // Sonido BEEP
    if (soundEnabled) {
      playBeep();
    }

    // Vibración táctil en móvil
    try {
      if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
        navigator.vibrate([80, 40, 80]);
      }
    } catch {
      // Ignorar
    }

    setLastScanned(clean);
    setScannedCount((c) => c + 1);
    toast.success(`Código escaneado: ${clean}`);
    onScan(clean);

    if (!continuous) {
      stopScanning();
      onClose();
    }
  };

  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualCode.trim()) return;
    handleSuccessfulScan(manualCode.trim());
    setManualCode('');
  };

  const handleImageFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !readerRef.current) return;

    try {
      toast.info('Analizando imagen del código de barras...');
      const url = URL.createObjectURL(file);
      const img = new Image();
      img.src = url;

      img.onload = async () => {
        try {
          if (!readerRef.current) return;
          const result = await readerRef.current.decodeFromImageElement(img);
          if (result) {
            handleSuccessfulScan(result.getText());
          } else {
            toast.error('No se pudo identificar un código de barras en la imagen.');
          }
        } catch {
          toast.error('No se detectó un código legible. Verifica que la imagen sea nítida o ingrésalo manualmente.');
        } finally {
          URL.revokeObjectURL(url);
        }
      };
    } catch {
      toast.error('Error al procesar la imagen seleccionada.');
    } finally {
      e.target.value = '';
    }
  };

  const handleCameraChange = async (newId: string) => {
    setSelectedCameraId(newId);
    await startScanning(newId);
  };

  const toggleTorch = async () => {
    if (!hasTorch || !videoRef.current?.srcObject) return;
    try {
      const stream = videoRef.current.srcObject as MediaStream;
      const track = stream.getVideoTracks()[0];
      const next = !torchEnabled;
      await track.applyConstraints({
        advanced: [{ torch: next } as MediaTrackConstraintSet],
      });
      setTorchEnabled(next);
    } catch {
      toast.error('No se pudo encender la linterna en este lente.');
    }
  };

  if (!isOpen) return null;

  return createPortal(
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-3 sm:p-4 bg-slate-950/80 backdrop-blur-sm animate-fade-in">
      <div className="w-full max-w-lg bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden flex flex-col">
        {/* Modal Header */}
        <div className="px-4 py-3.5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50/50 dark:bg-slate-850/50">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900">
              <Camera className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white leading-tight">
                {title}
              </h3>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                Apunta al código (EAN-13, EAN-8, UPC, Code 128)
              </p>
            </div>
          </div>
          <button
            onClick={() => {
              stopScanning();
              onClose();
            }}
            className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-4 sm:p-5 space-y-4">
          {/* Controles superiores (Cámaras, Linterna, Sonido) */}
          <div className="flex items-center justify-between gap-2 text-xs">
            {cameras.length > 1 ? (
              <div className="flex-1 max-w-[210px]">
                <select
                  value={selectedCameraId}
                  onChange={(e) => handleCameraChange(e.target.value)}
                  className="w-full px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 text-xs font-medium focus:outline-none focus:ring-1 focus:ring-slate-400"
                >
                  {cameras.map((c) => (
                    <option key={c.deviceId} value={c.deviceId}>
                      {c.label || `Lente ${c.deviceId.substring(0, 5)}`}
                    </option>
                  ))}
                </select>
              </div>
            ) : (
              <span className="text-[11px] text-slate-500 font-medium flex items-center gap-1.5">
                <span className={`w-2 h-2 rounded-full ${isScanning ? 'bg-emerald-500 animate-pulse' : 'bg-slate-400'}`} />
                {isScanning ? 'Lector activo y detectando' : 'Iniciando cámara...'}
              </span>
            )}

            <div className="flex items-center gap-1.5 ml-auto">
              {hasTorch && (
                <button
                  type="button"
                  onClick={toggleTorch}
                  className={`p-2 rounded-xl border transition-colors ${
                    torchEnabled
                      ? 'bg-amber-100 text-amber-800 border-amber-300'
                      : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
                  }`}
                  title={torchEnabled ? 'Apagar flash' : 'Encender flash'}
                >
                  <Flashlight className="w-3.5 h-3.5" />
                </button>
              )}

              <button
                type="button"
                onClick={() => setSoundEnabled(!soundEnabled)}
                className={`p-2 rounded-xl border transition-colors ${
                  soundEnabled
                    ? 'border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800'
                    : 'border-rose-200 text-rose-500 bg-rose-50'
                }`}
                title={soundEnabled ? 'Silenciar sonido' : 'Activar sonido'}
              >
                {soundEnabled ? <Volume2 className="w-3.5 h-3.5" /> : <VolumeX className="w-3.5 h-3.5" />}
              </button>

              <button
                type="button"
                onClick={() => startScanning(selectedCameraId)}
                className="p-2 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                title="Reiniciar lector"
              >
                <RefreshCw className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Visor de Cámara con elemento Video nativo (100% compatible con iOS y Android) */}
          <div className="relative w-full h-56 sm:h-64 bg-slate-950 rounded-2xl overflow-hidden border border-slate-800 flex items-center justify-center shadow-inner">
            <video
              ref={videoRef}
              playsInline
              autoPlay
              muted
              className="w-full h-full object-cover"
            />

            {/* Overlay visual de escaneo */}
            {isScanning && !hasError && (
              <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
                <div className="w-[240px] sm:w-[290px] h-[130px] sm:h-[150px] relative rounded-xl border-2 border-white/50 shadow-[0_0_0_9999px_rgba(0,0,0,0.4)]">
                  {/* Esquinas resaltadas */}
                  <div className="absolute -top-1 -left-1 w-5 h-5 border-t-3 border-l-3 border-emerald-400 rounded-tl-lg" />
                  <div className="absolute -top-1 -right-1 w-5 h-5 border-t-3 border-r-3 border-emerald-400 rounded-tr-lg" />
                  <div className="absolute -bottom-1 -left-1 w-5 h-5 border-b-3 border-l-3 border-emerald-400 rounded-bl-lg" />
                  <div className="absolute -bottom-1 -right-1 w-5 h-5 border-b-3 border-r-3 border-emerald-400 rounded-br-lg" />

                  {/* Línea láser animada */}
                  <div className="w-full h-0.5 bg-gradient-to-r from-transparent via-red-500 to-transparent absolute top-0 animate-[scanner_2s_ease-in-out_infinite]" />
                </div>
              </div>
            )}

            {/* Alerta de error */}
            {hasError && (
              <div className="absolute inset-0 bg-slate-900/95 flex flex-col items-center justify-center p-6 text-center text-xs text-rose-300 space-y-3 z-10">
                <p className="font-semibold">{hasError}</p>
                <p className="text-[11px] text-slate-400 max-w-xs">
                  Puedes ingresar los dígitos del código manualmente abajo o tomar una fotografía.
                </p>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => startScanning(selectedCameraId)}
                  className="bg-slate-800 border-slate-700 text-white"
                >
                  <RefreshCw className="w-3.5 h-3.5 mr-1.5" /> Reintentar
                </Button>
              </div>
            )}
          </div>

          {/* Notificación de último escaneado en modo continuo */}
          {lastScanned && (
            <div className="p-2.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/60 flex items-center justify-between text-xs animate-fade-in">
              <div className="flex items-center gap-2 text-emerald-800 dark:text-emerald-300">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                <span className="font-mono font-bold">{lastScanned}</span>
                <span className="text-[11px] text-emerald-600 dark:text-emerald-400 font-semibold">
                  (Leído con éxito)
                </span>
              </div>
              <span className="px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-900 text-emerald-800 dark:text-emerald-200 text-[10px] font-bold">
                Total: {scannedCount}
              </span>
            </div>
          )}

          {/* Formulario alternativo: Ingreso manual */}
          <form onSubmit={handleManualSubmit} className="flex gap-2">
            <input
              type="text"
              placeholder="O ingresa el código numérico..."
              value={manualCode}
              onChange={(e) => setManualCode(e.target.value)}
              className="flex-1 px-3 py-2 text-xs font-mono rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-slate-900 dark:focus:ring-white transition-colors"
            />
            <Button type="submit" size="sm" variant="outline" disabled={!manualCode.trim()}>
              Confirmar
            </Button>
          </form>

          {/* Subir foto de código de barras */}
          <div className="flex items-center justify-between pt-2 border-t border-slate-100 dark:border-slate-800 text-xs">
            <label className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-750 cursor-pointer transition-colors text-[11px] font-semibold active:scale-95">
              <Upload className="w-3.5 h-3.5 text-slate-500" />
              <span>Tomar Foto / Subir Imagen</span>
              <input
                type="file"
                accept="image/*"
                capture="environment"
                onChange={handleImageFileChange}
                className="hidden"
              />
            </label>

            <Button
              size="sm"
              variant="secondary"
              onClick={() => {
                stopScanning();
                onClose();
              }}
            >
              Cerrar Lector
            </Button>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
};
