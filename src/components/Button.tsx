// Reusable Button Component with haptic feedback
import React, { memo, useCallback } from 'react';
import {
    TouchableOpacity,
    Text,
    StyleSheet,
    StyleProp,
    ViewStyle,
    TextStyle,
    ActivityIndicator,
    View,
} from 'react-native';
import Animated, {
    useSharedValue,
    useAnimatedStyle,
    withSpring,
} from 'react-native-reanimated';
import { COLORS, SHADOWS, SPACING, BORDER_RADIUS, TYPOGRAPHY } from '../theme';
import { useSound } from '../utils/soundManager';
import { useAppTheme } from '../hooks/useAppTheme';

interface ButtonProps {
    title: string;
    onPress: () => void;
    variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger';
    size?: 'small' | 'medium' | 'large';
    disabled?: boolean;
    loading?: boolean;
    icon?: React.ReactNode;
    iconPosition?: 'left' | 'right';
    style?: StyleProp<ViewStyle>;
    textStyle?: StyleProp<TextStyle>;
    withSound?: boolean;
}

const AnimatedTouchable = Animated.createAnimatedComponent(TouchableOpacity);

const Button: React.FC<ButtonProps> = ({
    title,
    onPress,
    variant = 'primary',
    size = 'medium',
    disabled = false,
    loading = false,
    icon,
    iconPosition = 'left',
    style,
    textStyle,
    withSound = false, // Disabled: no sound file available
    ...props
}) => {
    const theme = useAppTheme();
    const scale = useSharedValue(1);
    const { play } = useSound();

    const animatedStyle = useAnimatedStyle(() => ({
        transform: [{ scale: scale.value }],
    }));

    const handlePressIn = useCallback(() => {
        scale.value = withSpring(0.96, { damping: 20, stiffness: 300 });
    }, [scale]);

    const handlePressOut = useCallback(() => {
        scale.value = withSpring(1, { damping: 20, stiffness: 300 });
    }, [scale]);

    const handlePress = useCallback(() => {
        // if (withSound) {
        //    play('tapClick');
        // }
        onPress();
    }, [onPress]);

    // Size Styles
    const paddingVertical = size === 'small' ? 8 : size === 'large' ? 16 : 12;
    const paddingHorizontal = size === 'small' ? 16 : size === 'large' ? 32 : 24;
    const fontSize = size === 'small' ? 14 : size === 'large' ? 18 : 16;

    // Variant Styles
    const getVariantStyles = () => {
        switch (variant) {
            case 'secondary':
                return {
                    backgroundColor: theme.surfaceElevated, // Was backgroundCard
                    borderWidth: 1,
                    borderColor: theme.borderSubtle,
                    textColor: theme.textSecondary,
                    // Shadow?
                };
            case 'outline':
                return {
                    backgroundColor: 'transparent',
                    borderWidth: 1.5,
                    borderColor: theme.accentPrimary,
                    textColor: theme.accentPrimary,
                };
            case 'ghost':
                return {
                    backgroundColor: 'transparent',
                    textColor: theme.textSecondary,
                };
            case 'danger':
                return {
                    backgroundColor: theme.runWicket, // Use error/wicket color
                    textColor: COLORS.white,
                };
            case 'primary':
            default:
                return {
                    backgroundColor: theme.accentPrimary,
                    textColor: COLORS.white, // Always white on accent
                };
        }
    };

    const variantStyle = getVariantStyles();

    return (
        <AnimatedTouchable
            style={[
                styles.button,
                {
                    paddingVertical,
                    paddingHorizontal,
                    backgroundColor: disabled ? COLORS.lightBorder : variantStyle.backgroundColor,
                    borderColor: variantStyle.borderColor,
                    borderWidth: variantStyle.borderWidth || 0,
                    opacity: disabled ? 0.7 : 1,
                },
                style,
                animatedStyle,
            ]}
            onPress={handlePress}
            onPressIn={handlePressIn}
            onPressOut={handlePressOut}
            disabled={disabled || loading}
            activeOpacity={0.9}
        >
            {loading ? (
                <ActivityIndicator
                    size="small"
                    color={variant === 'primary' ? COLORS.white : theme.accentPrimary}
                />
            ) : (
                <View style={styles.contentContainer}>
                    {icon && iconPosition === 'left' && <Text style={[styles.icon, { color: variantStyle.textColor, fontSize }]}>{icon}</Text>}
                    <Text
                        style={[
                            styles.text,
                            {
                                color: disabled ? COLORS.lightTextSecondary : variantStyle.textColor,
                                fontSize,
                            },
                            textStyle,
                        ]}
                    >
                        {title}
                    </Text>
                    {icon && iconPosition === 'right' && <Text style={[styles.icon, { color: variantStyle.textColor, fontSize }]}>{icon}</Text>}
                </View>
            )}
        </AnimatedTouchable>
    );
};

const styles = StyleSheet.create({
    button: { // Renamed from base
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        borderRadius: BORDER_RADIUS.xxl,
        gap: SPACING.sm,
    },
    contentContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: SPACING.sm,
    },
    icon: {
        fontWeight: 'bold',
    },

    // Variants
    primary: {
        backgroundColor: COLORS.royalBlue,
        ...SHADOWS.medium,
    },
    secondary: {
        backgroundColor: COLORS.runNeutral,
        ...SHADOWS.soft,
    },
    outline: {
        backgroundColor: 'transparent',
        borderWidth: 2,
        borderColor: COLORS.royalBlue,
    },
    ghost: {
        backgroundColor: 'transparent',
    },

    // Sizes
    smallSize: {
        paddingVertical: SPACING.sm,
        paddingHorizontal: SPACING.md,
        minHeight: 36,
    },
    mediumSize: {
        paddingVertical: SPACING.md,
        paddingHorizontal: SPACING.lg,
        minHeight: 48,
    },
    largeSize: {
        paddingVertical: SPACING.lg,
        paddingHorizontal: SPACING.xl,
        minHeight: 56,
    },

    // States
    disabled: {
        backgroundColor: COLORS.lightBorder,
        opacity: 0.6,
    },

    // Text styles
    text: {
        ...TYPOGRAPHY.body,
        fontWeight: '600',
        textAlign: 'center',
    },
    primaryText: {
        color: COLORS.white,
    },
    secondaryText: {
        color: COLORS.lightTextPrimary,
    },
    outlineText: {
        color: COLORS.royalBlue,
    },
    ghostText: {
        color: COLORS.royalBlue,
    },

    smallText: {
        fontSize: 14,
    },
    mediumText: {
        fontSize: 16,
    },
    largeText: {
        fontSize: 18,
    },

    disabledText: {
        color: COLORS.lightTextSecondary,
    },
});

export default memo(Button);
