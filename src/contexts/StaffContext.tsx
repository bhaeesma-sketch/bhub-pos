import { createContext, useContext, useState, type ReactNode } from 'react';
import type { StaffSession } from '@/components/pos/PinLogin';

interface StaffContextValue {
  staffSession: StaffSession | null;
  setStaffSession: (session: StaffSession | null) => void;
}

const StaffContext = createContext<StaffContextValue>({
  staffSession: null,
  setStaffSession: () => {},
});

export const useStaffSession = () => useContext(StaffContext);

export const StaffProvider = ({ children }: { children: ReactNode }) => {
  const [staffSession, setStaffSession] = useState<StaffSession | null>(null);
  return (
    <StaffContext.Provider value={{ staffSession, setStaffSession }}>
      {children}
    </StaffContext.Provider>
  );
};
