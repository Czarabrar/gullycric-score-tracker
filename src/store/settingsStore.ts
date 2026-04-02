// Settings store with AsyncStorage persistence
import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';


export interface SettingsState {
    // Sound settings
    soundEnabled: boolean;
    soundVolume: number; // 0-1
    setSoundEnabled: (enabled: boolean) => void;
    setSoundVolume: (volume: number) => void;

    // Match defaults
    defaultOvers: number;
    defaultWickets: number;
    setDefaultOvers: (overs: number) => void;
    setDefaultWickets: (wickets: number) => void;

    // Feature toggles
    boundaryMappingEnabled: boolean;
    setBoundaryMappingEnabled: (enabled: boolean) => void;

    // Theme
    theme: 'light' | 'dark';
    setTheme: (theme: 'light' | 'dark') => void;
}

export const useSettingsStore = create<SettingsState>()(
    persist(
        (set) => ({
            // Sound - ON by default as per requirements
            soundEnabled: true,
            soundVolume: 0.8,
            setSoundEnabled: (enabled) => set({ soundEnabled: enabled }),
            setSoundVolume: (volume) => set({ soundVolume: Math.max(0, Math.min(1, volume)) }),

            // Match defaults
            defaultOvers: 5,
            defaultWickets: 5,
            setDefaultOvers: (overs) => set({ defaultOvers: overs }),
            setDefaultWickets: (wickets) => set({ defaultWickets: wickets }),

            // Boundary mapping - disabled by default (optional feature)
            boundaryMappingEnabled: false,
            setBoundaryMappingEnabled: (enabled) => set({ boundaryMappingEnabled: enabled }),

            // Theme
            theme: 'light',
            setTheme: (theme) => set({ theme }),
        }),
        {
            name: 'settings-storage',
            storage: createJSONStorage(() => AsyncStorage),
        }
    )
);
