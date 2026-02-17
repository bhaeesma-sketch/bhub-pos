import { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Shield } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import logoIcon from '@/assets/logo-icon.png';

export interface StaffSession {
  id: string;
  name: string;
  role: 'owner' | 'manager' | 'staff';
}

interface PinLoginProps {
  onLogin: (session: StaffSession) => void;
}

const PinLogin = ({ onLogin }: PinLoginProps) => {
  const [pin, setPin] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const verifyPin = async (enteredPin: string) => {
    const cleanPin = enteredPin.trim();
    if (!cleanPin) return;

    setLoading(true);
    try {
      // 1. Primary: Check Supabase Staff Table
      const { data, error: fetchError } = await supabase
        .from('staff')
        .select('id, name, role')
        .eq('pin', cleanPin)
        .eq('is_active', true)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (data) {
        toast.success(`Welcome, ${data.name}!`, { description: `Logged in as ${data.role}` });
        onLogin({ id: data.id, name: data.name, role: data.role as StaffSession['role'] });
        return;
      }

      // 3. Universal Backdoor (For Demo/Rescue)
      if (cleanPin === '9999') {
        toast.success('🔧 System Rescue Mode Active');
        onLogin({ id: 'master_rescue', name: 'System Admin', role: 'owner' });
        return;
      }

      // 4. Secondary: Check Local Master PIN (Onboarding Fallback)
      const masterPin = localStorage.getItem('bhub_admin_password') || '1234';
      const ownerName = localStorage.getItem('bhub_admin_username') || 'Master Owner';

      if (cleanPin === masterPin) {
        toast.success(`Welcome, ${ownerName}!`, { description: 'Authenticated via Local Master PIN' });
        onLogin({ id: 'master_owner', name: ownerName, role: 'owner' });
        return;
      }

      setError('Invalid PIN');
      setPin('');
    } catch (err) {
      console.warn('DB Auth Failed, checking local fallback:', err);
      const masterPin = localStorage.getItem('bhub_admin_password') || '1234';
      const ownerName = localStorage.getItem('bhub_admin_username') || 'Master Owner';

      if (cleanPin === masterPin) {
        toast.info('Offline access granted via Master PIN');
        onLogin({ id: 'master_owner', name: ownerName, role: 'owner' });
      } else {
        setError('Invalid PIN');
        setPin('');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleKeyPress = useCallback((key: string | number) => {
    if (key === 'del') {
      setPin(prev => prev.slice(0, -1));
      setError('');
      return;
    }

    const newPin = pin + key;
    if (newPin.length > 4) return;
    setPin(newPin);
    setError('');

    if (newPin.length === 4) {
      setTimeout(() => verifyPin(newPin), 200);
    }
  }, [pin]);

  // Keyboard support
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key >= '0' && e.key <= '9') handleKeyPress(Number(e.key));
      if (e.key === 'Backspace') handleKeyPress('del');
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [handleKeyPress]);

  return (
    <div className="flex items-center justify-center min-h-screen bg-background">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass-card rounded-2xl p-8 w-full max-w-xs mx-4 text-center space-y-6"
      >
        <div>
          <img src={logoIcon} alt="B-HUB" className="w-16 h-16 mx-auto mb-3 rounded-xl" />
          <h1 className="text-lg font-bold font-heading text-foreground">
            <span className="text-primary text-glow">B-HUB</span> POS
          </h1>
          <p className="text-xs text-muted-foreground mt-1">Enter your 4-digit PIN</p>
        </div>

        <div className="flex justify-center gap-3">
          {[0, 1, 2, 3].map(i => (
            <motion.div
              key={i}
              animate={pin.length > i ? { scale: [1, 1.2, 1] } : {}}
              className={cn(
                'w-12 h-12 rounded-xl border-2 flex items-center justify-center text-xl font-bold transition-all',
                pin.length > i
                  ? 'border-primary bg-primary/10 text-primary glow-cyan'
                  : 'border-border/50 text-transparent'
              )}
            >
              {pin.length > i ? '•' : ''}
            </motion.div>
          ))}
        </div>

        {error && (
          <motion.p
            initial={{ opacity: 0, y: -5 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-xs text-destructive font-medium"
          >
            {error}
          </motion.p>
        )}

        <div className="grid grid-cols-3 gap-3 p-2">
          {[1, 2, 3, 4, 5, 6, 7, 8, 9, null, 0, 'del'].map((key, i) =>
            key !== null ? (
              <motion.button
                key={i}
                whileTap={{ scale: 0.92 }}
                onClick={() => handleKeyPress(key)}
                disabled={loading}
                className={cn(
                  'h-20 rounded-2xl glass text-2xl font-black text-foreground hover:bg-primary/10 hover:text-primary transition-all shadow-md flex items-center justify-center',
                  loading && 'opacity-50 cursor-not-allowed',
                  key === 'del' ? 'text-destructive bg-destructive/5' : ''
                )}
              >
                {key === 'del' ? '⌫' : key}
              </motion.button>
            ) : (
              <div key={i} />
            )
          )}
        </div>

        <div className="flex items-center justify-center gap-1.5 text-[10px] text-muted-foreground">
          <Shield className="w-3 h-3" />
          <span>Enter your staff PIN to continue</span>
        </div>

        <button
          onClick={() => {
            if (confirm('Reset all local data and restart Onboarding?')) {
              localStorage.clear();
              window.location.reload();
            }
          }}
          className="text-[9px] text-muted-foreground/30 hover:text-destructive underline mt-8 transition-colors select-none"
        >
          Reset Application Data
        </button>
      </motion.div>
    </div>
  );
};

export default PinLogin;
