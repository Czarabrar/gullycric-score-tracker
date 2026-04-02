import React, { memo } from 'react';
import { View, StyleSheet, ViewStyle, TouchableOpacity } from 'react-native';
import { COLORS, SHADOWS, SPACING, BORDER_RADIUS } from '../theme';
import { useAppTheme } from '../hooks/useAppTheme';

interface CardProps {
    children: React.ReactNode;
    variant?: 'default' | 'elevated' | 'outlined' | 'flat';
    padding?: 'none' | 'small' | 'medium' | 'large';
    style?: ViewStyle;
    onPress?: () => void;
}

const Card: React.FC<CardProps> = ({
    children,
    variant = 'elevated',
    padding = 'large',
    style,
    onPress,
}) => {
    const theme = useAppTheme();

    const paddingStyle =
        padding === 'none' ? 0 :
            padding === 'small' ? SPACING.sm :
                padding === 'large' ? SPACING.lg :
                    SPACING.md;

    const shadowStyle =
        variant === 'elevated' ? { ...SHADOWS.soft, shadowColor: theme.shadowColor } :
            variant === 'outlined' ? {} :
                {};

    const borderStyle = variant === 'outlined' ? {
        borderWidth: 1,
        borderColor: theme.borderSoft,
    } : {};

    const containerStyles = [
        styles.container,
        {
            backgroundColor: variant === 'flat' ? 'transparent' : theme.backgroundCard,
            padding: paddingStyle,
            ...shadowStyle,
            ...borderStyle,
        },
        style,
    ];

    if (onPress) {
        return (
            <TouchableOpacity style={containerStyles} onPress={onPress} activeOpacity={0.8}>
                {children}
            </TouchableOpacity>
        );
    }

    return <View style={containerStyles}>{children}</View>;
};

const styles = StyleSheet.create({
    container: {
        borderRadius: BORDER_RADIUS.xl,
    },
});

export default memo(Card);
