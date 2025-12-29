/* eslint-disable react-refresh/only-export-components */
import { createContext, useContext, useEffect, useState } from 'react';
import type { ReactNode } from 'react';
import type { Team } from '../types/worldcup';

type StoredTeam = Team & { groupName?: string };

type Matchup = {
  slot: string;
  winner: { name: string; flag?: string };
  opponent: { name: string; flag?: string };
};

export type { Matchup };

interface ThirdPlaceContextType {
  draft: StoredTeam[];
  setDraft: (d: StoredTeam[]) => void;
  order: StoredTeam[] | null;
  setOrder: (o: StoredTeam[] | null) => void;
  mapping: Record<string,string> | null;
  setMapping: (m: Record<string,string> | null) => void;
  option: string | null;
  setOption: (s: string | null) => void;
  matchups: Matchup[] | null;
  setMatchups: (m: Matchup[] | null) => void;
}

const ThirdPlaceContext = createContext<ThirdPlaceContextType | undefined>(undefined);

export const useThirdPlace = () => {
  const ctx = useContext(ThirdPlaceContext);
  if (!ctx) throw new Error('useThirdPlace must be used within ThirdPlaceProvider');
  return ctx;
};

export const ThirdPlaceProvider = ({ children }: { children: ReactNode }) => {
  const [draft, setDraft] = useState<StoredTeam[]>(() => {
    try {
      const raw = localStorage.getItem('thirdPlaceDraft');
      return raw ? (JSON.parse(raw) as StoredTeam[]) : [];
    } catch {
      return [];
    }
  });

  const [order, setOrder] = useState<StoredTeam[] | null>(() => {
    try {
      const raw = localStorage.getItem('thirdPlaceOrder');
      return raw ? (JSON.parse(raw) as StoredTeam[]) : null;
    } catch {
      return null;
    }
  });

  const [mapping, setMapping] = useState<Record<string,string> | null>(() => {
    try {
      const raw = localStorage.getItem('round32_mapping');
      return raw ? JSON.parse(raw) as Record<string,string> : null;
    } catch {
      return null;
    }
  });

  const [option, setOption] = useState<string | null>(() => {
    try {
      const raw = localStorage.getItem('round32_option');
      return raw ?? null;
    } catch {
      return null;
    }
  });

  const [matchups, setMatchups] = useState<Matchup[] | null>(() => {
    try {
      const raw = localStorage.getItem('round32_matchups');
      if (!raw) return null;
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) return parsed as Matchup[];
      return (parsed && parsed.matchups) || null;
    } catch {
      return null;
    }
  });

  // persist to localStorage as optional backup (debounce not implemented for brevity)
  useEffect(() => {
    try { localStorage.setItem('thirdPlaceDraft', JSON.stringify(draft)); } catch { /* ignore storage errors */ }
  }, [draft]);

  useEffect(() => {
    try { localStorage.setItem('thirdPlaceOrder', JSON.stringify(order)); } catch { /* ignore storage errors */ }
  }, [order]);

  useEffect(() => {
    try { localStorage.setItem('round32_mapping', JSON.stringify(mapping)); } catch { /* ignore storage errors */ }
  }, [mapping]);

  useEffect(() => {
    try { if (option !== null) localStorage.setItem('round32_option', String(option)); } catch { /* ignore storage errors */ }
  }, [option]);

  useEffect(() => {
    try { localStorage.setItem('round32_matchups', JSON.stringify({ option, mapping, matchups })); } catch { /* ignore storage errors */ }
  }, [matchups, mapping, option]);

  return (
    <ThirdPlaceContext.Provider value={{ draft, setDraft, order, setOrder, mapping, setMapping, option, setOption, matchups, setMatchups }}>
      {children}
    </ThirdPlaceContext.Provider>
  );
};
