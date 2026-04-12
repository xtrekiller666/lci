import { create } from 'zustand';

export interface ChemicalState {
  dopamine: number;
  serotonin: number;
  cortisol: number;
  oxytocin: number;
}

export interface MemorySpark {
  id: string;
  title: string;
  type: 'episodic' | 'semantic';
  timestamp: number;
}

export interface RelationshipState {
  trust_score: number;
  closeness_level: number;
}

export interface LCIState {
  // Chemicals
  chemicals: ChemicalState;
  setChemicals: (c: Partial<ChemicalState>) => void;

  // Thoughts
  currentThought: string;
  setCurrentThought: (t: string) => void;

  // Memory sparks
  memorySparks: MemorySpark[];
  addMemorySpark: (m: MemorySpark) => void;
  removeMemorySpark: (id: string) => void;

  // Speaking state
  isSpeaking: boolean;
  setIsSpeaking: (v: boolean) => void;

  // LLM stream
  streamBuffer: string;
  appendStream: (token: string) => void;
  clearStream: () => void;

  // Cerebellum log
  cerebellumLog: string[];
  addCerebellumLog: (entry: string) => void;

  // Relationship
  relationship: RelationshipState;
  setRelationship: (r: Partial<RelationshipState>) => void;

  // Status
  status: 'Awake' | 'Dreaming' | 'Offline';
  persona: string;
  setStatus: (s: 'Awake' | 'Dreaming' | 'Offline') => void;
  setPersona: (p: string) => void;

  // Config panel
  configOpen: boolean;
  toggleConfig: () => void;

  // Connection
  connected: boolean;
  setConnected: (v: boolean) => void;
}

export const useLCIStore = create<LCIState>((set) => ({
  // Mock defaults so UI is visible without WebSocket
  chemicals: { dopamine: 0.55, serotonin: 0.6, cortisol: 0.15, oxytocin: 0.45 },
  setChemicals: (c) => set((s) => ({ chemicals: { ...s.chemicals, ...c } })),

  currentThought: 'Awaiting connection...',
  setCurrentThought: (t) => set({ currentThought: t }),

  memorySparks: [],
  addMemorySpark: (m) => set((s) => ({ memorySparks: [...s.memorySparks.slice(-4), m] })),
  removeMemorySpark: (id) => set((s) => ({ memorySparks: s.memorySparks.filter((x) => x.id !== id) })),

  isSpeaking: false,
  setIsSpeaking: (v) => set({ isSpeaking: v }),

  streamBuffer: '',
  appendStream: (token) => set((s) => ({ streamBuffer: s.streamBuffer + token })),
  clearStream: () => set({ streamBuffer: '' }),

  cerebellumLog: ['[SYSTEM] Cerebellum ready.'],
  addCerebellumLog: (entry) => set((s) => ({ cerebellumLog: [...s.cerebellumLog.slice(-200), entry] })),

  relationship: { trust_score: 10, closeness_level: 5 },
  setRelationship: (r) => set((s) => ({ relationship: { ...s.relationship, ...r } })),

  status: 'Awake',
  persona: 'Assistant',
  setStatus: (s) => set({ status: s }),
  setPersona: (p) => set({ persona: p }),

  configOpen: false,
  toggleConfig: () => set((s) => ({ configOpen: !s.configOpen })),

  connected: false,
  setConnected: (v) => set({ connected: v }),
}));
