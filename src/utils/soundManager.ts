// Non-blocking Sound Manager for GullyTurf
// Uses react-native-sound with fire-and-forget pattern

import Sound from 'react-native-sound';
import { useSettingsStore } from '../store/settingsStore';
import { Platform } from 'react-native';

// Enable playback in silence mode (iOS) and allow mixing
Sound.setCategory('Playback', true);

// Sound file mappings - only include sounds that exist in android/app/src/main/res/raw/
export const SOUND_FILES = {
    // Toss sounds
    coinFlip: 'coin_flip.mp3',
} as const;

export type SoundKey = keyof typeof SOUND_FILES;

class SoundManagerClass {
    private sounds: Map<SoundKey, Sound> = new Map();
    private isLoaded: boolean = false;

    /**
     * Preload all sounds during app startup.
     * Call this in splash screen for fastest first-play response.
     */
    async preload(): Promise<void> {
        if (this.isLoaded) return;

        console.log('[SoundManager] Starting preload...');

        const loadPromises = Object.entries(SOUND_FILES).map(([key, filename]) => {
            return new Promise<void>((resolve) => {
                // For Android, use the filename without extension (raw resource name)
                const loadName = Platform.OS === 'android'
                    ? filename.replace(/\.[^/.]+$/, "")
                    : filename;

                console.log(`[SoundManager] Loading: ${loadName} (from ${filename})`);

                const sound = new Sound(loadName, Sound.MAIN_BUNDLE, (error) => {
                    if (error) {
                        console.warn(`[SoundManager] Failed to load ${loadName}:`, error);
                        resolve();
                        return;
                    }
                    this.sounds.set(key as SoundKey, sound);
                    console.log(`[SoundManager] Successfully loaded: ${loadName}`);
                    resolve();
                });
            });
        });

        await Promise.all(loadPromises);
        this.isLoaded = true;
        console.log('[SoundManager] All sounds preloaded');
    }

    /**
     * Play a sound by key - fire and forget, never blocks UI.
     * Respects global sound settings.
     * Silently ignores missing sounds.
     */
    play(soundKey: SoundKey): void {
        console.log(`[SoundManager] Requesting play: ${soundKey}`);

        // Check if sound is enabled
        const { soundEnabled, soundVolume } = useSettingsStore.getState();
        if (!soundEnabled) {
            console.log('[SoundManager] Sound disabled in settings');
            return;
        }

        const sound = this.sounds.get(soundKey);
        if (!sound) {
            console.warn(`[SoundManager] Sound object not found for: ${soundKey}`);
            return;
        }

        // Fire and forget - stop current playback and play from start
        sound.stop(() => {
            sound.setVolume(soundVolume);
            sound.play((success) => {
                if (success) {
                    console.log(`[SoundManager] Finished playing: ${soundKey}`);
                } else {
                    console.warn(`[SoundManager] Playback failed for: ${soundKey}`);
                    sound.reset();
                }
            });
        });
    }

    /**
     * Play multiple sounds in sequence with delays.
     */
    playSequence(sounds: { key: SoundKey; delay: number }[]): void {
        sounds.forEach(({ key, delay }) => {
            setTimeout(() => this.play(key), delay);
        });
    }

    /**
     * Stop all currently playing sounds.
     */
    stopAll(): void {
        this.sounds.forEach((sound) => {
            sound.stop();
        });
    }

    /**
     * Release all sound resources - call on app cleanup.
     */
    release(): void {
        this.sounds.forEach((sound) => {
            sound.release();
        });
        this.sounds.clear();
        this.isLoaded = false;
    }
}

// Singleton instance
export const SoundManager = new SoundManagerClass();

// Helper hook for components
export const useSound = () => {
    const play = (key: SoundKey) => SoundManager.play(key);
    const playSequence = (sounds: { key: SoundKey; delay: number }[]) =>
        SoundManager.playSequence(sounds);

    return { play, playSequence };
};
