import React from 'react';
import { StyleSheet, ViewStyle, StatusBar, View, Platform } from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import { GRADIENTS } from '../theme';

export type GradientVariant = keyof typeof GRADIENTS;

interface GradientBackgroundProps {
    variant?: GradientVariant;
    colors?: string[]; // Custom override
    style?: ViewStyle;
    children: React.ReactNode;
    start?: { x: number; y: number };
    end?: { x: number; y: number };
}

import { useAppTheme } from '../hooks/useAppTheme';

const GradientBackground: React.FC<GradientBackgroundProps> = ({
    variant,
    colors,
    style,
    children,
    start = { x: 0, y: 0 },
    end = { x: 1, y: 1 },
}) => {
    const theme = useAppTheme();

    // Determine colors
    // Priority: 
    // 1. Explicit 'colors' prop
    // 2. Explicit 'variant' prop -> GRADIENTS[variant]
    // 3. Theme default gradient fields

    let gradientColors = colors;

    if (!gradientColors) {
        if (variant) {
            const baseColors = GRADIENTS[variant];
            // Dark Mode Override for colored gradients (Team Colors, etc.)
            // Checks if we are in Dark Mode (gradientVariant === 'darkPage')
            if (theme.gradientVariant === 'darkPage' && variant !== 'dark' && variant !== 'neutral' && variant !== 'darkPage' && baseColors) {
                // Create a Dark + Color gradient (Black to Primary Color)
                // Using hardcoded Black for deep contrast as requested
                gradientColors = ['#000000', baseColors[0]];
            } else {
                gradientColors = baseColors;
            }
        } else {
            gradientColors = [theme.backgroundGradientStart, theme.backgroundGradientEnd];
        }
    }

    if (!gradientColors) gradientColors = GRADIENTS.neutral;

    return (
        <View style={[styles.container, style]}>
            <StatusBar
                translucent
                backgroundColor="transparent"
                barStyle={theme.statusBar}
            />
            <LinearGradient
                colors={gradientColors}
                start={start}
                end={end}
                style={styles.gradient}
            >
                {children}
            </LinearGradient>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    gradient: {
        flex: 1,
    },
});

export default GradientBackground;
