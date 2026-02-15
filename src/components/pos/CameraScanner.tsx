import { useState, useEffect, useRef, useCallback } from 'react';
import { Html5Qrcode } from 'html5-qrcode';
import { Camera, X, Zap } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';

interface CameraScannerProps {
  onScan: (barcode: string) => void;
  className?: string;
}

const CameraScanner = ({ onScan, className }: CameraScannerProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const readerRef = useRef<HTMLDivElement>(null);

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
  }, []);

  const startScanner = useCallback(async () => {
    setError(null);
    
    // Small delay to ensure DOM is ready
    await new Promise(r => setTimeout(r, 100));

    if (!document.getElementById('bhaees-qr-reader')) {
      setError('Scanner element not ready');
      return;
    }

    try {
      const html5QrCode = new Html5Qrcode('bhaees-qr-reader');
      scannerRef.current = html5QrCode;

      await html5QrCode.start(
        { facingMode: 'environment' },
        { fps: 20, qrbox: { width: 250, height: 250 } },
        (decodedText) => {
          onScan(decodedText.trim());
          stopScanner();
          setIsOpen(false);
        },
        () => {} // ignore errors during scanning
      );
    } catch (err: any) {
      setError(err?.message || 'Camera not available');
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

  return (
    <>
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

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm"
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="glass-card rounded-2xl p-6 w-full max-w-sm mx-4 space-y-4"
            >
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold font-heading text-foreground flex items-center gap-2">
                  <Zap className="w-4 h-4 text-primary" />
                  Camera Scanner
                </h3>
                <button
                  onClick={() => setIsOpen(false)}
                  className="p-1.5 rounded-lg hover:bg-muted/50 text-muted-foreground"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div
                id="bhaees-qr-reader"
                ref={readerRef}
                className="w-full rounded-xl overflow-hidden bg-muted/30 min-h-[280px]"
              />

              {error && (
                <p className="text-xs text-destructive text-center">{error}</p>
              )}

              <p className="text-[10px] text-muted-foreground text-center">
                Point camera at barcode • Auto-detects & adds to cart
              </p>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

export default CameraScanner;
