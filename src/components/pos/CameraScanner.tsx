import { useState, useEffect, useRef, useCallback } from 'react';
import { Html5Qrcode } from 'html5-qrcode';
import { Camera, X, Zap, FlipHorizontal, Flashlight } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';

interface CameraScannerProps {
  onScan: (barcode: string) => void;
  className?: string;
  /** If true, renders as a large mobile FAB-style button */
  mobileFab?: boolean;
}

const CameraScanner = ({ onScan, className, mobileFab = false }: CameraScannerProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [scanning, setScanning] = useState(false);
  const [lastScanned, setLastScanned] = useState<string | null>(null);
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const readerRef = useRef<HTMLDivElement>(null);
  const cooldownRef = useRef(false);

  const stopScanner = useCallback(async () => {
    if (scannerRef.current) {
      try {
        const state = scannerRef.current.getState();
        if (state === 2) { // SCANNING
          await scannerRef.current.stop();
        }
      } catch {
        // ignore stop errors
      }
      scannerRef.current = null;
    }
    setScanning(false);
  }, []);

  const startScanner = useCallback(async () => {
    setError(null);
    setLastScanned(null);

    // Small delay to ensure DOM is ready
    await new Promise(r => setTimeout(r, 150));

    if (!document.getElementById('bhaees-qr-reader')) {
      setError('Scanner element not ready');
      return;
    }

    try {
      const html5QrCode = new Html5Qrcode('bhaees-qr-reader');
      scannerRef.current = html5QrCode;
      setScanning(true);

      await html5QrCode.start(
        { facingMode: 'environment' },
        {
          fps: 15,
          qrbox: { width: 260, height: 160 },
          aspectRatio: 1.0,
        },
        (decodedText) => {
          // Debounce: ignore rapid duplicate scans
          if (cooldownRef.current) return;
          cooldownRef.current = true;

          const barcode = decodedText.trim();
          setLastScanned(barcode);

          // Vibrate on success
          if (navigator.vibrate) navigator.vibrate([50, 30, 50]);

          onScan(barcode);

          // Close after short delay so user sees the success flash
          setTimeout(() => {
            stopScanner();
            setIsOpen(false);
            cooldownRef.current = false;
          }, 600);
        },
        () => { } // ignore per-frame errors
      );
    } catch (err: any) {
      setScanning(false);
      const msg = err?.message || 'Camera not available';
      if (msg.includes('Permission')) {
        setError('Camera permission denied. Please allow camera access in your browser settings.');
      } else if (msg.includes('NotFound') || msg.includes('no camera')) {
        setError('No camera found on this device.');
      } else {
        setError(msg);
      }
    }
  }, [onScan, stopScanner]);

  useEffect(() => {
    if (isOpen) {
      startScanner();
    } else {
      stopScanner();
    }
    return () => { stopScanner(); };
  }, [isOpen, startScanner, stopScanner]);

  const triggerButton = mobileFab ? (
    // Large mobile FAB button
    <button
      onClick={() => setIsOpen(true)}
      className={cn(
        'flex items-center justify-center gap-2 h-14 px-5 rounded-xl',
        'bg-slate-900 text-white font-black text-sm uppercase tracking-widest',
        'shadow-lg active:scale-95 transition-all border-b-4 border-slate-700',
        className
      )}
      title="Scan Barcode"
    >
      <Camera className="w-5 h-5" />
      <span>SCAN</span>
    </button>
  ) : (
    // Small desktop icon button
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
            className="fixed inset-0 z-[300] flex flex-col bg-black"
          >
            {/* Header */}
            <div className="flex items-center justify-between px-4 pt-safe pt-4 pb-3 bg-black/80 backdrop-blur-sm">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center">
                  <Zap className="w-4 h-4 text-primary" />
                </div>
                <div>
                  <p className="text-white text-sm font-black uppercase tracking-widest">Barcode Scanner</p>
                  <p className="text-slate-400 text-[10px]">Point at any barcode to scan</p>
                </div>
              </div>
              <button
                onClick={() => setIsOpen(false)}
                className="w-9 h-9 rounded-full bg-white/10 flex items-center justify-center text-white hover:bg-white/20 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Camera viewport */}
            <div className="flex-1 relative overflow-hidden">
              {/* The actual scanner div */}
              <div
                id="bhaees-qr-reader"
                ref={readerRef}
                className="w-full h-full"
                style={{ minHeight: '60vh' }}
              />

              {/* Scanning overlay with crosshair */}
              {scanning && !lastScanned && (
                <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
                  {/* Dark overlay with cutout */}
                  <div className="absolute inset-0 bg-black/40" />

                  {/* Scan box */}
                  <div className="relative z-10 w-64 h-40">
                    {/* Corner brackets */}
                    <div className="absolute top-0 left-0 w-8 h-8 border-t-4 border-l-4 border-primary rounded-tl-lg" />
                    <div className="absolute top-0 right-0 w-8 h-8 border-t-4 border-r-4 border-primary rounded-tr-lg" />
                    <div className="absolute bottom-0 left-0 w-8 h-8 border-b-4 border-l-4 border-primary rounded-bl-lg" />
                    <div className="absolute bottom-0 right-0 w-8 h-8 border-b-4 border-r-4 border-primary rounded-br-lg" />

                    {/* Animated scan line */}
                    <motion.div
                      animate={{ y: [0, 120, 0] }}
                      transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
                      className="absolute left-2 right-2 h-0.5 bg-primary shadow-[0_0_8px_2px_rgba(59,130,246,0.6)]"
                    />
                  </div>
                </div>
              )}

              {/* Success flash */}
              <AnimatePresence>
                {lastScanned && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0 }}
                    className="absolute inset-0 flex items-center justify-center bg-black/60 z-20"
                  >
                    <div className="bg-white rounded-2xl p-6 mx-6 text-center shadow-2xl">
                      <div className="w-14 h-14 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-3">
                        <span className="text-3xl">✓</span>
                      </div>
                      <p className="text-xs text-slate-500 font-bold uppercase tracking-widest mb-1">Scanned</p>
                      <p className="text-sm font-black text-slate-900 break-all">{lastScanned}</p>
                      <p className="text-[10px] text-green-600 font-bold mt-2">Adding to cart...</p>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Bottom bar */}
            <div className="bg-black/80 backdrop-blur-sm px-4 pb-safe pb-6 pt-4 space-y-3">
              {error ? (
                <div className="bg-red-900/50 border border-red-500/30 rounded-xl p-3 text-center">
                  <p className="text-red-300 text-xs font-medium">{error}</p>
                  <button
                    onClick={startScanner}
                    className="mt-2 text-xs text-primary font-bold underline"
                  >
                    Try Again
                  </button>
                </div>
              ) : (
                <div className="flex items-center justify-center gap-2">
                  <div className={cn(
                    'w-2 h-2 rounded-full',
                    scanning ? 'bg-green-400 animate-pulse' : 'bg-slate-500'
                  )} />
                  <p className="text-slate-400 text-xs font-medium">
                    {scanning ? 'Camera active — align barcode in the frame' : 'Starting camera...'}
                  </p>
                </div>
              )}

              <button
                onClick={() => setIsOpen(false)}
                className="w-full py-3 rounded-xl bg-white/10 text-white text-sm font-bold uppercase tracking-widest hover:bg-white/20 transition-colors"
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
