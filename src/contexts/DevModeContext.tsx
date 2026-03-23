import { createContext, useContext, useState } from 'react';

interface DevModeContextType {
  isDevMode: boolean;
  toggleDevMode: () => void;
}

const DevModeContext = createContext<DevModeContextType>({
  isDevMode: false,
  toggleDevMode: () => {},
});

export const DevModeProvider = ({ children }: { children: React.ReactNode }) => {
  const [isDevMode, setIsDevMode] = useState<boolean>(() => {
    return localStorage.getItem('nexus_dev_mode') === 'true';
  });

  const toggleDevMode = () => {
    setIsDevMode((prev) => {
      const next = !prev;
      localStorage.setItem('nexus_dev_mode', String(next));
      return next;
    });
  };

  return (
    <DevModeContext.Provider value={{ isDevMode, toggleDevMode }}>
      {children}
    </DevModeContext.Provider>
  );
};

export const useDevMode = () => useContext(DevModeContext);
