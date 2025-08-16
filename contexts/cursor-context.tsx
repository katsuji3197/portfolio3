'use client';

import {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from 'react';

interface CursorContextType {
  isCustomCursorEnabled: boolean;
  toggleCustomCursor: () => void;
}

const CursorContext = createContext<CursorContextType | undefined>(undefined);

export function CursorProvider({ children }: { children: ReactNode }) {
  const [isCustomCursorEnabled, setIsCustomCursorEnabled] = useState(true);

  // ローカルストレージから設定を読み込み
  useEffect(() => {
    const saved = localStorage.getItem('customCursorEnabled');
    if (saved !== null) {
      setIsCustomCursorEnabled(JSON.parse(saved));
    }
  }, []);

  // 設定をローカルストレージに保存
  useEffect(() => {
    localStorage.setItem(
      'customCursorEnabled',
      JSON.stringify(isCustomCursorEnabled)
    );
  }, [isCustomCursorEnabled]);

  const toggleCustomCursor = () => {
    setIsCustomCursorEnabled(!isCustomCursorEnabled);
  };

  return (
    <CursorContext.Provider
      value={{ isCustomCursorEnabled, toggleCustomCursor }}
    >
      {children}
    </CursorContext.Provider>
  );
}

export function useCursor() {
  const context = useContext(CursorContext);
  if (context === undefined) {
    throw new Error('useCursor must be used within a CursorProvider');
  }
  return context;
}
