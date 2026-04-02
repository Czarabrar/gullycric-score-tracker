import { useSettingsStore } from '../store/settingsStore';
import { lightTheme, darkTheme, Theme } from '../theme';

export const useAppTheme = (): Theme => {
    const themeMode = useSettingsStore((state) => state.theme);
    return themeMode === 'dark' ? darkTheme : lightTheme;
};
