import React, { useState, useEffect } from 'react';
import { Download, X, Share, PlusSquare, Smartphone, CheckCircle2, ArrowDown } from 'lucide-react';
import { Button } from './Button';
import { Modal } from './Modal';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed'; platform: string }>;
}

export const PwaInstallPrompt: React.FC = () => {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isIosDevice, setIsIosDevice] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);
  const [isDismissed, setIsDismissed] = useState(false);
  const [isIosModalOpen, setIsIosModalOpen] = useState(false);

  useEffect(() => {
    // 1. Detectar si ya está en modo pantalla completa / app instalada
    const checkStandalone = () => {
      const isStandaloneMode =
        window.matchMedia('(display-mode: standalone)').matches ||
        (window.navigator as unknown as { standalone?: boolean }).standalone === true;
      setIsInstalled(isStandaloneMode);
    };

    checkStandalone();

    // 2. Detectar si el dispositivo es iOS (iPhone o iPad)
    const userAgent = window.navigator.userAgent.toLowerCase();
    const isIos = /iphone|ipad|ipod/.test(userAgent);
    setIsIosDevice(isIos);

    // 3. Escuchar evento de instalación nativo de Android / Chrome
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    // Escuchar trigger manual desde el Sidebar u otros componentes
    const handleManualTrigger = () => {
      setIsDismissed(false);
      if (deferredPrompt) {
        deferredPrompt.prompt();
      } else {
        // En iOS o navegadores de escritorio sin deferredPrompt
        setIsIosModalOpen(true);
      }
    };

    window.addEventListener('open-pwa-install', handleManualTrigger);

    // Escuchar cuando la app sea instalada exitosamente
    window.addEventListener('appinstalled', () => {
      setIsInstalled(true);
      setDeferredPrompt(null);
    });

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('open-pwa-install', handleManualTrigger);
    };
  }, [deferredPrompt]);

  // Manejador para botón de instalación
  const handleInstallClick = async () => {
    if (deferredPrompt) {
      await deferredPrompt.prompt();
      const choiceResult = await deferredPrompt.userChoice;
      if (choiceResult.outcome === 'accepted') {
        setIsInstalled(true);
      }
      setDeferredPrompt(null);
    } else {
      setIsIosModalOpen(true);
    }
  };

  const showFloatingBanner = !isInstalled && !isDismissed && (Boolean(deferredPrompt) || isIosDevice);

  return (
    <>
      {/* Banner flotante discreto y moderno para móviles */}
      {showFloatingBanner && (
        <aside aria-label="Instalar aplicación móvil" className="fixed bottom-4 left-4 right-4 sm:left-auto sm:right-6 sm:w-96 z-50 animate-slide-up">
          <div className="p-4 rounded-2xl bg-slate-900/95 dark:bg-slate-900/95 text-white shadow-2xl border border-slate-700/80 backdrop-blur-md flex items-center justify-between gap-3">
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-brand-500 to-emerald-500 p-0.5 shrink-0 shadow-md">
                <img
                  src="/pwa-icon-192.png"
                  alt="App Icon"
                  className="w-full h-full object-cover rounded-[10px]"
                />
              </div>
              <div className="min-w-0">
                <h4 className="text-xs font-bold leading-tight truncate">
                  Instalar App POS Ecuador
                </h4>
                <p className="text-[11px] text-slate-300 truncate">
                  {isIosDevice ? 'Descarga en iPhone con Safari' : 'Acceso directo en Chrome / Android'}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-1.5 shrink-0">
              <Button
                size="sm"
                onClick={handleInstallClick}
                className="bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold px-3 py-1.5 shadow-sm"
                icon={<Download className="w-3.5 h-3.5" />}
              >
                Instalar
              </Button>
              <button
                onClick={() => setIsDismissed(true)}
                className="p-1.5 text-slate-400 hover:text-white rounded-lg transition-colors"
                title="Cerrar sugerencia"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
        </aside>
      )}

      {/* Modal Instructivo para Celulares (iPhone Safari / Android Chrome) */}
      <Modal
        isOpen={isIosModalOpen}
        onClose={() => setIsIosModalOpen(false)}
        title="Descargar e Instalar en tu Celular"
        subtitle="Aplicación web progresiva lista para Chrome (Android) y Safari (iPhone)"
      >
        <div className="space-y-4 py-2 text-xs">
          {/* Selector de Navegador */}
          <div className="flex rounded-xl bg-slate-100 dark:bg-slate-800 p-1 border border-slate-200 dark:border-slate-700">
            <button
              type="button"
              onClick={() => setIsIosDevice(true)}
              className={`flex-1 py-1.5 px-3 rounded-lg text-xs font-bold transition-all ${
                isIosDevice
                  ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-sm'
                  : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
              }`}
            >
              🍎 iPhone / iPad (Safari)
            </button>
            <button
              type="button"
              onClick={() => setIsIosDevice(false)}
              className={`flex-1 py-1.5 px-3 rounded-lg text-xs font-bold transition-all ${
                !isIosDevice
                  ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-sm'
                  : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
              }`}
            >
              🤖 Android / PC (Chrome)
            </button>
          </div>

          {/* Pasos para iPhone Safari */}
          {isIosDevice ? (
            <div className="space-y-3">
              <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 flex items-start gap-3">
                <div className="p-2 rounded-lg bg-blue-100 dark:bg-blue-950 text-blue-600 dark:text-blue-400 shrink-0">
                  <Share className="w-4 h-4" />
                </div>
                <div className="space-y-0.5">
                  <strong className="block text-slate-900 dark:text-white text-xs">
                    Paso 1: Toca el botón de Compartir
                  </strong>
                  <p className="text-slate-500 dark:text-slate-400 text-[11px]">
                    En la barra inferior de Safari, presiona el botón cuadrado con la flecha hacia arriba (<span className="font-mono">Compartir</span>).
                  </p>
                </div>
              </div>

              <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 flex items-start gap-3">
                <div className="p-2 rounded-lg bg-emerald-100 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400 shrink-0">
                  <PlusSquare className="w-4 h-4" />
                </div>
                <div className="space-y-0.5">
                  <strong className="block text-slate-900 dark:text-white text-xs">
                    Paso 2: Selecciona "Agregar a pantalla de inicio"
                  </strong>
                  <p className="text-slate-500 dark:text-slate-400 text-[11px]">
                    Desliza las opciones y pulsa en <strong className="text-slate-800 dark:text-slate-200">"Agregar a inicio"</strong> (o <span className="italic">"Add to Home Screen"</span>).
                  </p>
                </div>
              </div>

              <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 flex items-start gap-3">
                <div className="p-2 rounded-lg bg-purple-100 dark:bg-purple-950 text-purple-600 dark:text-purple-400 shrink-0">
                  <CheckCircle2 className="w-4 h-4" />
                </div>
                <div className="space-y-0.5">
                  <strong className="block text-slate-900 dark:text-white text-xs">
                    Paso 3: Pulsa "Agregar"
                  </strong>
                  <p className="text-slate-500 dark:text-slate-400 text-[11px]">
                    Toca <strong className="text-slate-800 dark:text-slate-200">"Agregar"</strong> arriba a la derecha. La app se abrirá en pantalla completa como una aplicación instalada.
                  </p>
                </div>
              </div>
            </div>
          ) : (
            /* Pasos para Android Chrome */
            <div className="space-y-3">
              {deferredPrompt && (
                <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-300 dark:border-emerald-800 text-center">
                  <Button
                    size="sm"
                    onClick={handleInstallClick}
                    className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-bold"
                    icon={<Download className="w-4 h-4" />}
                  >
                    Instalar Directamente Ahora
                  </Button>
                </div>
              )}

              <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 flex items-start gap-3">
                <div className="p-2 rounded-lg bg-blue-100 dark:bg-blue-950 text-blue-600 dark:text-blue-400 shrink-0">
                  <Smartphone className="w-4 h-4" />
                </div>
                <div className="space-y-0.5">
                  <strong className="block text-slate-900 dark:text-white text-xs">
                    Opción A: Desde el Menú de Chrome
                  </strong>
                  <p className="text-slate-500 dark:text-slate-400 text-[11px]">
                    Presiona el menú de tres puntos verticales (<strong className="font-mono">⋮</strong>) arriba a la derecha en Google Chrome.
                  </p>
                </div>
              </div>

              <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 flex items-start gap-3">
                <div className="p-2 rounded-lg bg-emerald-100 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400 shrink-0">
                  <Download className="w-4 h-4" />
                </div>
                <div className="space-y-0.5">
                  <strong className="block text-slate-900 dark:text-white text-xs">
                    Opción B: Seleccionar "Instalar aplicación"
                  </strong>
                  <p className="text-slate-500 dark:text-slate-400 text-[11px]">
                    Toca en <strong className="text-slate-800 dark:text-slate-200">"Instalar aplicación"</strong> o <strong className="text-slate-800 dark:text-slate-200">"Agregar a la pantalla principal"</strong> y confirma.
                  </p>
                </div>
              </div>
            </div>
          )}

          <div className="pt-2 flex justify-end">
            <Button onClick={() => setIsIosModalOpen(false)}>
              Cerrar Guía
            </Button>
          </div>
        </div>
      </Modal>
    </>
  );
};
