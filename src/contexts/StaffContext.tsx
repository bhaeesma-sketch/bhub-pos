import { createContext, useContext, useState, useEffect, type ReactNode } from 'react';
import type { StaffSession } from '@/components/pos/PinLogin';

interface StaffContextValue {
  staffSession: StaffSession | null;
  setStaffSession: (session: StaffSession | null) => void;
}

const StaffContext = createContext<StaffContextValue>({
  staffSession: null,
  setStaffSession: () => { },
});

export const useStaffSession = () => useContext(StaffContext);

export const StaffProvider = ({ children }: { children: ReactNode }) => {
  const [staffSession, setStaffSession] = useState<StaffSession | null>(() => {
    try {
      const saved = localStorage.getItem('bhub_pos_session');
      return saved ? JSON.parse(saved) : null;
    } catch (e) {
      console.error('Failed to parse staff session:', e);
      localStorage.removeItem('bhub_pos_session');
      return null;
    }
  });

  useEffect(() => {
    if (staffSession) {
      localStorage.setItem('bhub_pos_session', JSON.stringify(staffSession));
    } else {
      localStorage.removeItem('bhub_pos_session');
    }
  }, [staffSession]);

  return (
    <StaffContext.Provider value={{ staffSession, setStaffSession }}>
      {children}
    </StaffContext.Provider>
  );
};
