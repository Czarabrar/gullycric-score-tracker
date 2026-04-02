// Toss Screen - 3D Coin Flip with Pop UI
import React, { useState, useCallback, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    Image,
    Dimensions,
    StatusBar,
    TouchableOpacity,
    Vibration,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import Animated, {
    useSharedValue,
    useAnimatedStyle,
    withTiming,
    withSequence,
    Easing,
    runOnJS,
    withSpring,
    withDelay,
    interpolate,
    Extrapolation,
} from 'react-native-reanimated';
import { GestureDetector, Gesture } from 'react-native-gesture-handler';
import LottieView from 'lottie-react-native';

import { useMatchStore } from '../../store/matchStore';
import { COLORS, SPACING, TYPOGRAPHY, SHADOWS, BORDER_RADIUS } from '../../theme';
import Button from '../../components/Button';
import GradientBackground from '../../components/GradientBackground';
import Card from '../../components/Card';
import { useSound } from '../../utils/soundManager';
import { RootStackParamList } from '../../navigation/types';

type TossNavigationProp = NativeStackNavigationProp<RootStackParamList, 'Toss'>;
const { width } = Dimensions.get('window');
const COIN_SIZE = 300; // Large coin for impact

type TossChoice = 'heads' | 'tails';

export default function TossScreen() {
    const navigation = useNavigation<TossNavigationProp>();
    const { play } = useSound();

    // Store
    const teamA = useMatchStore((state) => state.teamA);
    const teamB = useMatchStore((state) => state.teamB);
    const setTossResult = useMatchStore((state) => state.setTossResult);
    const matchMode = useMatchStore((state) => state.matchMode);

    // State
    const [tossState, setTossState] = useState<'calling' | 'ready' | 'flipping' | 'result' | 'choosing'>('calling');
    const [callingTeam, setCallingTeam] = useState<0 | 1>(() => Math.random() > 0.5 ? 0 : 1); // Random team calls
    const [callerChoice, setCallerChoice] = useState<TossChoice | null>(null);
    const [tossResultLocal, setTossResultLocal] = useState<TossChoice | null>(null);
    const [winner, setWinner] = useState<0 | 1 | null>(null);

    // Animations
    const coinTranslateY = useSharedValue(0);
    const coinRotation = useSharedValue(0);
    const coinScale = useSharedValue(1);
    const resultOpacity = useSharedValue(0);
    const resultScale = useSharedValue(0.5);

    // Front side style (Heads - Ashoka emblem)
    const frontAnimatedStyle = useAnimatedStyle(() => {
        const normalizedRotation = coinRotation.value % 360;
        const rotateX = normalizedRotation;
        const isVisible = normalizedRotation <= 90 || normalizedRotation >= 270;
        return {
            transform: [
                { translateY: coinTranslateY.value },
                { scale: coinScale.value },
                { rotateX: `${rotateX}deg` },
            ],
            backfaceVisibility: 'hidden',
            opacity: isVisible ? 1 : 0,
            zIndex: isVisible ? 1 : 0,
        };
    });

    // Back side style (Tails - Value)
    const backAnimatedStyle = useAnimatedStyle(() => {
        const normalizedRotation = coinRotation.value % 360;
        // Offset by 180 degrees
        const rotateX = normalizedRotation + 180;
        const isVisible = normalizedRotation > 90 && normalizedRotation < 270;
        return {
            transform: [
                { translateY: coinTranslateY.value },
                { scale: coinScale.value },
                { rotateX: `${rotateX}deg` },
            ],
            backfaceVisibility: 'hidden',
            opacity: isVisible ? 1 : 0,
            zIndex: isVisible ? 1 : 0,
        };
    });

    const resultAnimatedStyle = useAnimatedStyle(() => ({
        opacity: resultOpacity.value,
        transform: [{ scale: resultScale.value }],
    }));

    // Handle call selection
    const handleCallSelection = useCallback((call: TossChoice) => {
        setCallerChoice(call);
        setTossState('ready');
    }, []);

    // Perform the toss animation
    const performToss = useCallback(() => {
        if (tossState !== 'ready') return;

        setTossState('flipping');
        play('coinFlip');

        // Logic: 50/50 chance
        const result: TossChoice = Math.random() > 0.5 ? 'heads' : 'tails';

        // Animation params
        const flips = 12;
        const duration = 4500;
        const jumpHeight = -400;

        // Animate Jump
        coinTranslateY.value = withSequence(
            withTiming(jumpHeight, { duration: duration / 2, easing: Easing.out(Easing.quad) }),
            withTiming(0, { duration: duration / 2, easing: Easing.in(Easing.quad) })
        );

        // Animate Scale (depth effect)
        coinScale.value = withSequence(
            withTiming(1.4, { duration: duration / 2 }),
            withTiming(1, { duration: duration / 2 })
        );

        // Animate Rotation
        const finalRotation = flips * 360 + (result === 'heads' ? 0 : 180);
        // Ensure result matches the random 'result' variable, NOT controlled by user
        coinRotation.value = withTiming(finalRotation, {
            duration: duration,
            easing: Easing.bezier(0.25, 0.1, 0.25, 1),
        }, (finished) => {
            if (finished) {
                runOnJS(handleTossComplete)(result);
            }
        });

    }, [tossState, play, coinTranslateY, coinScale, coinRotation]);

    const handleTossComplete = useCallback((result: TossChoice) => {
        setTossResultLocal(result);

        // Haptic feedback on result
        Vibration.vibrate(100); // Short vibration

        // Determine winner
        const callerWins = result === callerChoice;
        const tossWinner = callerWins ? callingTeam : (callingTeam === 0 ? 1 : 0);
        setWinner(tossWinner);

        // Reveal result
        setTossState('result');
        resultOpacity.value = withTiming(1, { duration: 500 });
        resultScale.value = withSpring(1);

        // Auto move to choice after delay
        setTimeout(() => {
            setTossState('choosing');
        }, 2000);
    }, [callingTeam, callerChoice, resultOpacity, resultScale]);

    // Swipe gesture
    const swipeGesture = Gesture.Pan()
        .onUpdate(() => {
            // Can add haptics/sound here if desired
        })
        .onEnd((event) => {
            if (tossState === 'ready' && event.translationY < -100) {
                runOnJS(performToss)();
            }
        });

    // Final choice handler
    const handleChoice = useCallback(
        (choice: 'bat' | 'bowl') => {
            if (winner === null) return;
            setTossResult(winner, choice);

            // Navigate based on mode
            // We need to access the store state directly or via the hook outside
            // Since we can't efficiently change hook rules here, let's assume matchMode is available
            // Refactor: Get matchMode from store at top level
            if (matchMode === 'pro') {
                navigation.navigate('ProMatchSetup');
            } else {
                navigation.navigate('Match');
            }
        },
        [winner, setTossResult, navigation, matchMode]
    );

    const winnerTeam = winner === 0 ? teamA : teamB;
    const callerName = callingTeam === 0 ? teamA.name : teamB.name;

    return (
        <GradientBackground variant="darkPage" style={styles.container}>
            <SafeAreaView style={styles.safeArea}>

                {/* Header Phase */}
                <View style={styles.header}>
                    <Text style={styles.headerSubtitle}>MATCH TOSS</Text>
                    {tossState === 'calling' && (
                        <Text style={styles.headerTitle}>{callerName.toUpperCase()} CALLS</Text>
                    )}
                    {(tossState === 'ready' || tossState === 'flipping') && callerChoice && (
                        <Text style={styles.headerTitle}>{callerName.toUpperCase()} SELECTED {callerChoice.toUpperCase()}</Text>
                    )}
                    {(tossState === 'result' || tossState === 'choosing') && winnerTeam && (
                        <Text style={styles.headerTitle}>{winnerTeam.name} have won the toss</Text>
                    )}
                </View>

                {/* Main Content */}
                <GestureDetector gesture={swipeGesture}>
                    <View style={styles.content}>

                        {/* 3D Coin Area */}
                        <View style={styles.coinArea}>
                            {/* Result Text Behind the coin initially? No, overlay */}

                            <Animated.View style={[styles.coinFace, frontAnimatedStyle]}>
                                <Image source={require('../../assets/images/coin_heads.png')} style={styles.coinImageHeads} />
                            </Animated.View>
                            <Animated.View style={[styles.coinFace, backAnimatedStyle]}>
                                <Image source={require('../../assets/images/coin_tails.png')} style={styles.coinImageTails} />
                            </Animated.View>

                            {/* Swipe Hint Arrow - Removed */}
                        </View>

                        {/* Result Overlay */}
                        {tossState === 'result' && tossResultLocal && (
                            <Animated.View style={[styles.resultOverlay, resultAnimatedStyle]}>
                                <LottieView
                                    source={require('../../assets/lottie/celebration.json')}
                                    autoPlay
                                    loop={false}
                                    style={styles.resultLottie}
                                />
                                <View style={styles.resultTextContainer}>
                                    <Text style={styles.resultText}>{tossResultLocal.toUpperCase()}</Text>
                                    <View style={[styles.resultUnderline, { backgroundColor: winnerTeam?.color.primary || COLORS.royalBlue }]} />
                                </View>
                            </Animated.View>
                        )}

                    </View>
                </GestureDetector>

                {/* Footer Controls */}
                <View style={styles.footer}>
                    {tossState === 'ready' && (
                        <View style={styles.instructionContainer}>
                            <Text style={styles.instructionIcon}>👆</Text>
                            <Text style={styles.instructionText}>Swipe up to toss</Text>
                        </View>
                    )}

                    {tossState === 'calling' && (
                        <View style={styles.buttonRow}>
                            <TouchableOpacity
                                style={[styles.callButtonMinimal, callerChoice === 'heads' && styles.callButtonSelected]}
                                onPress={() => handleCallSelection('heads')}
                            >
                                <View style={[styles.iconContainer, callerChoice === 'heads' && styles.iconContainerSelected]}>
                                    <Image source={require('../../assets/images/coin_heads.png')} style={styles.miniCoin} />
                                </View>
                                <Text style={styles.callButtonTextMinimal}>HEADS</Text>
                            </TouchableOpacity>

                            <TouchableOpacity
                                style={[styles.callButtonMinimal, callerChoice === 'tails' && styles.callButtonSelected]}
                                onPress={() => handleCallSelection('tails')}
                            >
                                <View style={[styles.iconContainer, callerChoice === 'tails' && styles.iconContainerSelected]}>
                                    <Image source={require('../../assets/images/coin_tails.png')} style={styles.miniCoin} />
                                </View>
                                <Text style={styles.callButtonTextMinimal}>TAILS</Text>
                            </TouchableOpacity>
                        </View>
                    )}

                    {tossState === 'choosing' && (
                        <View style={styles.choosingContainer}>
                            <Text style={styles.choosingText}>What would you like to do?</Text>
                            <View style={styles.buttonRow}>
                                <Button
                                    title="🏏 BAT"
                                    onPress={() => handleChoice('bat')}
                                    variant="primary"
                                    style={styles.choiceButton}
                                    size="large"
                                />
                                <Button
                                    title="⚾ BOWL"
                                    onPress={() => handleChoice('bowl')}
                                    variant="secondary"
                                    style={styles.choiceButton}
                                    size="large"
                                />
                            </View>
                        </View>
                    )}

                    {/* caller info footer */}

                </View>

            </SafeAreaView>
        </GradientBackground>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    safeArea: {
        flex: 1,
    },
    header: {
        alignItems: 'center',
        paddingTop: SPACING.xl,
        paddingBottom: SPACING.lg,
    },
    headerSubtitle: {
        ...TYPOGRAPHY.label,
        color: 'rgba(255,255,255,0.6)',
        marginBottom: SPACING.xs,
    },
    headerTitle: {
        ...TYPOGRAPHY.h2,
        color: COLORS.white,
        textAlign: 'center',
    },
    content: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 10,
    },
    coinArea: {
        width: COIN_SIZE,
        height: COIN_SIZE,
        justifyContent: 'center',
        alignItems: 'center',
    },
    coinFace: {
        position: 'absolute',
        width: COIN_SIZE,
        height: COIN_SIZE,
        backfaceVisibility: 'hidden',
        borderRadius: COIN_SIZE / 2,
        overflow: 'hidden', // Clip the square image to circle
        backgroundColor: 'transparent',
    },
    coinImageHeads: {
        width: '100%',
        height: '100%',
        resizeMode: 'contain',
    },
    coinImageTails: {
        width: '100%',
        height: '100%',
        resizeMode: 'cover',
        transform: [{ scale: 1.15 }], // Slight zoom for correct fit
    },
    swipeHint: {
        position: 'absolute',
        bottom: -60,
        backgroundColor: 'rgba(255,255,255,0.2)',
        width: 60,
        height: 60,
        borderRadius: BORDER_RADIUS.round,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 2,
        borderColor: 'rgba(255,255,255,0.5)',
    },
    swipeText: {
        fontSize: 32,
        color: COLORS.white,
        fontWeight: 'bold',
    },
    swipeInstruction: {
        ...TYPOGRAPHY.label,
        color: COLORS.white,
        marginTop: 4,
        textAlign: 'center',
    },
    resultOverlay: {
        position: 'absolute',
        alignItems: 'center',
        backgroundColor: 'rgba(0,0,0,0.7)',
        paddingVertical: SPACING.md,
        paddingHorizontal: SPACING.xl,
        borderRadius: BORDER_RADIUS.xl,
        borderWidth: 2,
        borderColor: COLORS.white,
    },
    resultEmoji: {
        fontSize: 48,
        marginBottom: SPACING.sm,
    },
    resultTextContainer: {
        alignItems: 'center',
    },
    resultText: {
        ...TYPOGRAPHY.h1,
        color: COLORS.white,
        letterSpacing: 2,
    },
    resultUnderline: {
        height: 4,
        width: '80%',
        marginTop: SPACING.xs,
        borderRadius: 2,
    },
    footer: {
        padding: SPACING.lg,
        paddingBottom: SPACING.xxl,
        minHeight: 180,
        justifyContent: 'flex-end',
    },
    buttonRow: {
        flexDirection: 'row',
        gap: SPACING.md,
        justifyContent: 'center',
    },
    callButtonMinimal: {
        flex: 1, // Fill container
        alignItems: 'center',
        padding: SPACING.sm,
    },
    callButtonSelected: {
        // Handled by iconContainerSelected
    },
    iconContainer: {
        width: 100, // Bigger
        height: 100,
        justifyContent: 'center',
        alignItems: 'center',
        borderRadius: 50, // Circular
        marginBottom: SPACING.sm,
        backgroundColor: 'rgba(255,255,255,0.05)',
        overflow: 'hidden', // Clip coin to circle
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.1)',
    },
    iconContainerSelected: {
        backgroundColor: 'rgba(37, 99, 235, 0.2)', // Royal Blue tint
        borderWidth: 3,
        borderColor: COLORS.royalBlue,
    },
    callButtonTextMinimal: {
        ...TYPOGRAPHY.label,
        color: COLORS.white,
        fontWeight: 'bold',
        fontSize: 16,
        marginTop: SPACING.xs,
    },
    miniCoin: {
        width: '100%',
        height: '100%',
        resizeMode: 'cover',
    },
    choosingContainer: {
        gap: SPACING.md,
    },
    choosingText: {
        ...TYPOGRAPHY.h3,
        color: COLORS.white,
        textAlign: 'center',
        marginBottom: SPACING.sm,
    },
    choiceButton: {
        flex: 1,
    },
    statusCard: {
        backgroundColor: 'rgba(255,255,255,0.9)',
        alignItems: 'center',
    },
    statusText: {
        ...TYPOGRAPHY.h3,
        color: COLORS.lightTextPrimary,
    },
    resultLottie: {
        width: 150,
        height: 150,
        marginBottom: SPACING.md,
    },
    instructionContainer: {
        alignItems: 'center',
        marginBottom: SPACING.lg,
    },
    instructionText: {
        ...TYPOGRAPHY.label,
        color: COLORS.lightTextSecondary,
        textAlign: 'center',
        marginTop: SPACING.xs,
    },
    instructionIcon: {
        fontSize: 24,
        color: COLORS.lightTextSecondary,
    },
});
