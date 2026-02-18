import { useState, useEffect, useRef, useCallback } from 'react';
import { Html5Qrcode } from 'html5-qrcode';
import { Camera, X, Zap } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';

interface CameraScannerProps {
  onScan: (barcode: string) => void;
  className?: string;
  mobileFab?: boolean;
}

const READER_ID = 'bhaees-qr-reader';

const CameraScanner = ({ onScan, className, mobileFab = false }: CameraScannerProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [scanning, setScanning] = useState(false);
  const [lastScanned, setLastScanned] = useState<string | null>(null);
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const cooldownRef = useRef(false);

  const stopScanner = useCallback(async () => {
    if (scannerRef.current) {
      try {
        const state = scannerRef.current.getState();
        if (state === 2) {
          await scannerRef.current.stop();
        }
        scannerRef.current.clear();
      } catch {
        // ignore
      }
      scannerRef.current = null;
    }
    setScanning(false);
  }, []);

  const startScanner = useCallback(async () => {
    setError(null);
    setLastScanned(null);
    cooldownRef.current = false;

    // Wait for DOM element to be mounted
    await new Promise(r => setTimeout(r, 300));

    const el = document.getElementById(READER_ID);
    if (!el) {
      setError('Scanner element not found. Please try again.');
      return;
    }

    try {
      const scanner = new Html5Qrcode(READER_ID, { verbose: false });
      scannerRef.current = scanner;

      await scanner.start(
        { facingMode: 'environment' },
        {
          fps: 10,
          qrbox: (w, h) => {
            // Scan box = 80% of the shorter dimension
            const size = Math.min(w, h) * 0.8;
            return { width: Math.floor(size), height: Math.floor(size * 0.6) };
          },
          aspectRatio: 1.777, // 16:9
          disableFlip: false,
        },
        (decodedText) => {
          if (cooldownRef.current) return;
          cooldownRef.current = true;

          const barcode = decodedText.trim();
          setLastScanned(barcode);
          setScanning(false);

          if (navigator.vibrate) navigator.vibrate([60, 40, 60]);

          onScan(barcode);

          setTimeout(async () => {
            await stopScanner();
            setIsOpen(false);
          }, 800);
        },
        () => {
          // per-frame error — ignore
        }
      );

      setScanning(true);
    } catch (err: any) {
      setScanning(false);
      const msg: string = err?.message ?? String(err);
      if (msg.toLowerCase().includes('permission') || msg.toLowerCase().includes('denied')) {
        setError('Camera permission denied.\nPlease allow camera access in your browser settings and try again.');
      } else if (msg.toLowerCase().includes('notfound') || msg.toLowerCase().includes('no camera')) {
        setError('No camera found on this device.');
      } else {
        setError(`Camera error: ${msg}`);
      }
    }
  }, [onScan, stopScanner]);

  useEffect(() => {
    if (isOpen) {
      startScanner();
    } else {
      stopScanner();
    }
    return () => {
      stopScanner();
    };
  }, [isOpen]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleClose = useCallback(() => {
    setIsOpen(false);
  }, []);

  const triggerButton = mobileFab ? (
    <button
      onClick={() => setIsOpen(true)}
      className={cn(
        'flex items-center justify-center gap-2 h-14 px-5 rounded-xl',
        'bg-slate-900 text-white font-black text-sm uppercase tracking-widest',
        'shadow-lg active:scale-95 transition-all border-b-4 border-slate-700',
        className
      )}
    >
      <Camera className="w-5 h-5" />
      <span>SCAN</span>
    </button>
  ) : (
    <button
      onClick={() => setIsOpen(true)}
      className={cn(
        'p-2.5 rounded-lg glass border border-input text-muted-foreground hover:text-primary hover:border-primary/50 transition-all',
        className
      )}
      title="Camera Scan"
    >
      <Camera className="w-4 h-4" />
    </button>
  );

  return (
    <>
      {triggerButton}

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[300] bg-black flex flex-col"
            style={{ touchAction: 'none' }}
          >
            {/* Top bar */}
            <div
              className="flex items-center justify-between px-4 py-3 bg-black/90 flex-shrink-0"
              style={{ paddingTop: 'max(12px, env(safe-area-inset-top))' }}
            >
              <div className="flex items-center gap-2">
                <Zap className="w-4 h-4 text-primary" />
                <div>
                  <p className="text-white text-sm font-black uppercase tracking-widest">Barcode Scanner</p>
                  <p className="text-slate-400 text-[10px]">Point camera at any barcode</p>
                </div>
              </div>
              <button
                onClick={handleClose}
                className="w-9 h-9 rounded-full bg-white/10 flex items-center justify-center text-white active:bg-white/30 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Scanner area — let html5-qrcode own this completely */}
            <div className="flex-1 relative overflow-hidden bg-black">
              {/* html5-qrcode mounts its video here — NO overlays on top */}
              <div
                id={READER_ID}
                className="w-full h-full"
                style={{ minHeight: 0 }}
              />

              {/* Corner bracket overlay — pointer-events:none so it doesn't block camera */}
              {scanning && !lastScanned && (
                <div
                  className="absolute inset-0 flex items-center justify-center pointer-events-none"
                  style={{ zIndex: 10 }}
                >
                  <div className="relative w-64 h-40">
                    <div className="absolute top-0 left-0 w-8 h-8 border-t-4 border-l-4 border-primary rounded-tl-lg" />
                    <div className="absolute top-0 right-0 w-8 h-8 border-t-4 border-r-4 border-primary rounded-tr-lg" />
                    <div className="absolute bottom-0 left-0 w-8 h-8 border-b-4 border-l-4 border-primary rounded-bl-lg" />
                    <div className="absolute bottom-0 right-0 w-8 h-8 border-b-4 border-r-4 border-primary rounded-br-lg" />
                    <motion.div
                      animate={{ y: [0, 110, 0] }}
                      transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
                      className="absolute left-2 right-2 h-0.5 bg-primary"
                      style={{ boxShadow: '0 0 8px 2px rgba(59,130,246,0.7)' }}
                    />
                  </div>
                </div>
              )}

              {/* Success flash */}
              <AnimatePresence>
                {lastScanned && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.85 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0 }}
                    className="absolute inset-0 flex items-center justify-center bg-black/70 pointer-events-none"
                    style={{ zIndex: 20 }}
                  >
                    <div className="bg-white rounded-2xl p-6 mx-8 text-center shadow-2xl">
                      <div className="w-14 h-14 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-3">
                        <span className="text-3xl">✓</span>
                      </div>
                      <p className="text-xs text-slate-500 font-bold uppercase tracking-widest mb-1">Scanned!</p>
                      <p className="text-sm font-black text-slate-900 break-all">{lastScanned}</p>
                      <p className="text-[10px] text-green-600 font-bold mt-2">Adding to cart...</p>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Bottom bar */}
            <div
              className="bg-black/90 px-4 pt-3 flex-shrink-0 space-y-3"
              style={{ paddingBottom: 'max(16px, env(safe-area-inset-bottom))' }}
            >
              {error ? (
                <div className="bg-red-900/60 border border-red-500/40 rounded-xl p-3 text-center">
                  <p className="text-red-300 text-xs font-medium whitespace-pre-line">{error}</p>
                  <button
                    onClick={startScanner}
                    className="mt-2 text-xs text-primary font-black underline"
                  >
                    Try Again
                  </button>
                </div>
              ) : (
                <div className="flex items-center justify-center gap-2">
                  <div className={cn(
                    'w-2 h-2 rounded-full flex-shrink-0',
                    scanning ? 'bg-green-400 animate-pulse' : 'bg-slate-500'
                  )} />
                  <p className="text-slate-400 text-xs font-medium">
                    {scanning
                      ? 'Camera active — align barcode in the frame'
                      : lastScanned
                        ? 'Scanned successfully!'
                        : 'Starting camera...'
                    }
                  </p>
                </div>
              )}

              <button
                onClick={handleClose}
                className="w-full py-3 rounded-xl bg-white/10 text-white text-sm font-bold uppercase tracking-widest active:bg-white/20 transition-colors"
              >
                Cancel
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

export default CameraScanner;
