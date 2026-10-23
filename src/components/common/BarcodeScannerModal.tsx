import React, { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { Html5Qrcode, Html5QrcodeSupportedFormats } from 'html5-qrcode';
import { Camera, X, RefreshCw, Volume2, VolumeX, Flashlight, CheckCircle2 } from 'lucide-react';
import { Button } from './Button';
import { toast } from 'sonner';

interface BarcodeScannerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onScan: (barcode: string) => void;
  title?: string;
  continuous?: boolean;
}

// Generador de sonido BEEP usando Web Audio API estándar (no requiere archivos externos)
const playBeep = () => {
  try {
    const AudioContextClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (!AudioContextClass) return;
    const ctx = new AudioContextClass();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(1800, ctx.currentTime); // 1800 Hz tono POS
    gain.gain.setValueAtTime(0.15, ctx.currentTime);
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
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const containerId = useRef(`barcode-reader-${Math.random().toString(36).substring(2, 9)}`);
  const [cameras, setCameras] = useState<{ id: string; label: string }[]>([]);
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

  // Inicializar escáner al abrir
  useEffect(() => {
    if (!isOpen) return;

    let mounted = true;
    setHasError(null);
    setLastScanned(null);
    setScannedCount(0);
    setManualCode('');

    const initScanner = async () => {
      try {
        const devices = await Html5Qrcode.getCameras();
        if (!mounted) return;

        if (!devices || devices.length === 0) {
          setHasError('No se detectaron cámaras en este dispositivo.');
          return;
        }

        setCameras(devices);

        // Preferir cámara trasera (back/environment) si existe
        const backCam = devices.find(
          (d) =>
            d.label.toLowerCase().includes('back') ||
            d.label.toLowerCase().includes('trasera') ||
            d.label.toLowerCase().includes('environment') ||
            d.label.toLowerCase().includes('rear')
        );
        const preferredId = backCam ? backCam.id : devices[0].id;
        setSelectedCameraId(preferredId);

        startCamera(preferredId);
      } catch (err: unknown) {
        if (!mounted) return;
        const msg = err instanceof Error ? err.message : String(err);
        if (msg.includes('NotAllowedError') || msg.includes('Permission')) {
          setHasError('Permiso de cámara denegado. Permite el acceso a la cámara en los permisos de tu navegador.');
        } else {
          setHasError(`Error al inicializar cámara: ${msg}`);
        }
      }
    };

    // Pequeño timeout para asegurar que el DOM del modal esté montado
    const timer = setTimeout(initScanner, 150);

    return () => {
      mounted = false;
      clearTimeout(timer);
      stopCamera();
    };
  }, [isOpen]);

  const startCamera = async (cameraId: string) => {
    try {
      if (scannerRef.current) {
        await stopCamera();
      }

      const scanner = new Html5Qrcode(containerId.current);
      scannerRef.current = scanner;

      const config = {
        fps: 15,
        qrbox: { width: 280, height: 160 },
        formatsToSupport: [
          Html5QrcodeSupportedFormats.EAN_13,
          Html5QrcodeSupportedFormats.EAN_8,
          Html5QrcodeSupportedFormats.CODE_128,
          Html5QrcodeSupportedFormats.CODE_39,
          Html5QrcodeSupportedFormats.UPC_A,
          Html5QrcodeSupportedFormats.UPC_E,
          Html5QrcodeSupportedFormats.QR_CODE,
          Html5QrcodeSupportedFormats.ITF,
        ],
      };

      await scanner.start(
        cameraId,
        config,
        (decodedText) => {
          handleSuccessfulScan(decodedText);
        },
        () => {
          // Ignorar frames no decodificados
        }
      );

      setIsScanning(true);

      // Comprobar soporte para linterna / torch
      try {
        const capabilities = scanner.getRunningTrackCapabilities();
        if (capabilities && 'torch' in capabilities) {
          setHasTorch(true);
        }
      } catch {
        setHasTorch(false);
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      setHasError(`No se pudo iniciar la transmisión de video: ${msg}`);
      setIsScanning(false);
    }
  };

  const stopCamera = async () => {
    try {
      if (scannerRef.current && scannerRef.current.isScanning) {
        await scannerRef.current.stop();
        scannerRef.current.clear();
      }
      scannerRef.current = null;
      setIsScanning(false);
      setTorchEnabled(false);
    } catch {
      // Ignorar errores al detener
    }
  };

  const handleSuccessfulScan = (code: string) => {
    if (isCooldownRef.current) return;
    const clean = code.trim();
    if (!clean) return;

    // Cooldown para evitar disparar decenas de veces en 1 segundo
    isCooldownRef.current = true;
    setTimeout(() => {
      isCooldownRef.current = false;
    }, 1200);

    if (soundEnabled) {
      playBeep();
    }

    setLastScanned(clean);
    setScannedCount((c) => c + 1);
    toast.success(`Código escaneado: ${clean}`);
    onScan(clean);

    if (!continuous) {
      stopCamera();
      onClose();
    }
  };

  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualCode.trim()) return;
    handleSuccessfulScan(manualCode.trim());
    setManualCode('');
  };

  const handleCameraChange = async (newId: string) => {
    setSelectedCameraId(newId);
    await startCamera(newId);
  };

  const toggleTorch = async () => {
    if (!scannerRef.current || !hasTorch) return;
    try {
      const next = !torchEnabled;
      await scannerRef.current.applyVideoConstraints({
        advanced: [{ torch: next } as MediaTrackConstraintSet],
      });
      setTorchEnabled(next);
    } catch {
      toast.error('No se pudo activar la linterna en este dispositivo.');
    }
  };

  if (!isOpen) return null;

  return createPortal(
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fade-in">
      <div className="w-full max-w-lg bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden flex flex-col">
        {/* Modal Header */}
        <div className="px-5 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50/50 dark:bg-slate-850/50">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900">
              <Camera className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white leading-tight">
                {title}
              </h3>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                Apunta la cámara al código (EAN-13, EAN-8, UPC, Code 128)
              </p>
            </div>
          </div>
          <button
            onClick={() => {
              stopCamera();
              onClose();
            }}
            className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-5 space-y-4">
          {/* Controles superiores (Cámaras, Flashlight, Sonido) */}
          <div className="flex items-center justify-between gap-2 text-xs">
            {cameras.length > 1 ? (
              <div className="flex-1 max-w-[220px]">
                <select
                  value={selectedCameraId}
                  onChange={(e) => handleCameraChange(e.target.value)}
                  className="w-full px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 text-xs font-medium focus:outline-none focus:ring-1 focus:ring-slate-400"
                >
                  {cameras.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.label || `Cámara ${c.id.substring(0, 5)}`}
                    </option>
                  ))}
                </select>
              </div>
            ) : (
              <span className="text-[11px] text-slate-500 font-medium flex items-center gap-1.5">
                <span className={`w-2 h-2 rounded-full ${isScanning ? 'bg-emerald-500 animate-pulse' : 'bg-slate-400'}`} />
                {isScanning ? 'Cámara activa y detectando' : 'Iniciando cámara...'}
              </span>
            )}

            <div className="flex items-center gap-1.5 ml-auto">
              {hasTorch && (
                <button
                  type="button"
                  onClick={toggleTorch}
                  className={`p-1.5 rounded-lg border transition-colors ${
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
                className={`p-1.5 rounded-lg border transition-colors ${
                  soundEnabled
                    ? 'border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800'
                    : 'border-rose-200 text-rose-500 bg-rose-50'
                }`}
                title={soundEnabled ? 'Silenciar sonido de escaneo' : 'Activar sonido'}
              >
                {soundEnabled ? <Volume2 className="w-3.5 h-3.5" /> : <VolumeX className="w-3.5 h-3.5" />}
              </button>

              <button
                type="button"
                onClick={() => selectedCameraId && startCamera(selectedCameraId)}
                className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                title="Reiniciar lector"
              >
                <RefreshCw className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Visor de Cámara */}
          <div className="relative w-full h-52 sm:h-64 bg-slate-950 rounded-xl overflow-hidden border border-slate-800 flex items-center justify-center">
            <div id={containerId.current} className="w-full h-full object-cover" />

            {/* Overlay visual de escaneo */}
            {isScanning && !hasError && (
              <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
                {/* Cuadro de enfoque de código de barras */}
                <div className="w-[230px] sm:w-[280px] h-[120px] sm:h-[150px] relative rounded-lg border-2 border-white/40 shadow-[0_0_0_9999px_rgba(0,0,0,0.45)]">
                  {/* Esquinas resaltadas */}
                  <div className="absolute -top-1 -left-1 w-4 h-4 border-t-3 border-l-3 border-blue-400 rounded-tl" />
                  <div className="absolute -top-1 -right-1 w-4 h-4 border-t-3 border-r-3 border-blue-400 rounded-tr" />
                  <div className="absolute -bottom-1 -left-1 w-4 h-4 border-b-3 border-l-3 border-blue-400 rounded-bl" />
                  <div className="absolute -bottom-1 -right-1 w-4 h-4 border-b-3 border-r-3 border-blue-400 rounded-br" />

                  {/* Línea láser de escaneo animada */}
                  <div className="w-full h-0.5 bg-gradient-to-r from-transparent via-red-500 to-transparent absolute top-0 animate-[scanner_2s_ease-in-out_infinite]" />
                </div>
              </div>
            )}

            {/* Alerta de error */}
            {hasError && (
              <div className="absolute inset-0 bg-slate-900/90 flex flex-col items-center justify-center p-6 text-center text-xs text-rose-300 space-y-3">
                <p className="font-semibold">{hasError}</p>
                <p className="text-[11px] text-slate-400 max-w-xs">
                  Puedes escribir el código de barras en el campo manual inferior o conectar una cámara externa.
                </p>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => selectedCameraId && startCamera(selectedCameraId)}
                  className="bg-slate-800 border-slate-700 text-white"
                >
                  <RefreshCw className="w-3.5 h-3.5 mr-1.5" /> Reintentar
                </Button>
              </div>
            )}
          </div>

          {/* Notificación de último escaneado en modo continuo */}
          {lastScanned && (
            <div className="p-2.5 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/60 flex items-center justify-between text-xs animate-fade-in">
              <div className="flex items-center gap-2 text-emerald-800 dark:text-emerald-300">
                <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600 dark:text-emerald-400" />
                <span>
                  Último código detectado: <strong className="font-mono text-sm">{lastScanned}</strong>
                </span>
              </div>
              {continuous && (
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-200/70 dark:bg-emerald-900 text-emerald-900 dark:text-emerald-200">
                  {scannedCount} items
                </span>
              )}
            </div>
          )}

          {/* Entrada manual de código (por si la cámara no enfoca o código dañado) */}
          <form onSubmit={handleManualSubmit} className="pt-2 border-t border-slate-100 dark:border-slate-800 flex gap-2">
            <input
              type="text"
              value={manualCode}
              onChange={(e) => setManualCode(e.target.value)}
              placeholder="O ingresa el código numérico manualmente..."
              className="flex-1 px-3 py-2 text-xs font-mono rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-slate-400"
            />
            <Button type="submit" size="sm" variant="secondary" disabled={!manualCode.trim()}>
              Confirmar
            </Button>
          </form>
        </div>

        {/* Modal Footer */}
        <div className="px-5 py-3 border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-850/50 flex items-center justify-between text-xs">
          <span className="text-[11px] text-slate-500">
            {continuous ? 'Modo continuo: Sigue escaneando sin cerrar la ventana' : 'Al detectar el código se cerrará automáticamente'}
          </span>
          <Button
            size="sm"
            variant="secondary"
            onClick={() => {
              stopCamera();
              onClose();
            }}
          >
            Cerrar
          </Button>
        </div>
      </div>
    </div>,
    document.body
  );
};
