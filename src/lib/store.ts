import { create } from 'zustand';

export type Role = 'user' | 'admin';

export interface UserSettings {
  puterJsActive: boolean;
  geminiApiKey: string;
  deepseekApiKey: string;
  grokApiKey: string;
}

export interface UserProfile {
  uid: string;
  email: string;
  firstName: string;
  role: Role;
  limitRemaining: number;
  lastLimitReset: number;
  settings?: UserSettings;
  createdAt: number;
  updatedAt: number;
}

interface AppState {
  user: any | null; // Firebase User object
  profile: UserProfile | null;
  setUser: (user: any | null) => void;
  setProfile: (profile: UserProfile | null) => void;
  isLoading: boolean;
  setIsLoading: (isLoading: boolean) => void;
  adminAuthenticated: boolean;
  setAdminAuthenticated: (auth: boolean) => void;
  
  // current chat state
  currentChatId: string | null;
  setCurrentChatId: (id: string | null) => void;
  
  // UI state
  settingsOpen: boolean;
  setSettingsOpen: (open: boolean) => void;
  adminPanelOpen: boolean;
  setAdminPanelOpen: (open: boolean) => void;
}

export const useStore = create<AppState>((set) => ({
  user: null,
  profile: null,
  setUser: (user) => set({ user }),
  setProfile: (profile) => set({ profile }),
  isLoading: true,
  setIsLoading: (isLoading) => set({ isLoading }),
  adminAuthenticated: false,
  setAdminAuthenticated: (auth) => set({ adminAuthenticated: auth }),
  
  currentChatId: null,
  setCurrentChatId: (id) => set({ currentChatId: id }),
  
  settingsOpen: false,
  setSettingsOpen: (open) => set({ settingsOpen: open }),
  adminPanelOpen: false,
  setAdminPanelOpen: (open) => set({ adminPanelOpen: open }),
}));
