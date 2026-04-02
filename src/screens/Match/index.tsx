// Match Scoring Screen - One-tap scoring pad with Pop UI
import React, { useState, useCallback, useMemo, memo, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    ScrollView,
    Modal,
    Alert,
    Dimensions
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import Animated, {
    useSharedValue,
    useAnimatedStyle,
    withSpring,
    withSequence,
    withTiming,
} from 'react-native-reanimated';

import { useMatchStore, BallEvent, Player, Innings, Team } from '../../store/matchStore';
import { COLORS, SPACING, TYPOGRAPHY, SHADOWS, BORDER_RADIUS, GRADIENTS } from '../../theme';
import Card from '../../components/Card';
import Button from '../../components/Button';
import GradientBackground, { GradientVariant } from '../../components/GradientBackground';
import PlayerSelectModal from '../../components/PlayerSelectModal';
import { useSound } from '../../utils/soundManager';
import { RootStackParamList } from '../../navigation/types';
// Note: Screen wake lock removed - use native module or expo-keep-awake in future

type MatchNavigationProp = NativeStackNavigationProp<RootStackParamList, 'Match'>;
const { width } = Dimensions.get('window');

// Score Button Component
interface ScoreButtonProps {
    value: string;
    label?: string;
    onPress: () => void;
    variant?: 'default' | 'boundary' | 'wicket' | 'wicketFreeHit' | 'extra';
    size?: 'small' | 'large';
}

import { useAppTheme } from '../../hooks/useAppTheme';

const ScoreButton: React.FC<ScoreButtonProps> = memo(
    ({ value, label, onPress, variant = 'default', size = 'large' }) => {
        const theme = useAppTheme();
        const styles = useMemo(() => getScoreButtonStyles(), []);
        const scale = useSharedValue(1);

        const animatedStyle = useAnimatedStyle(() => ({
            transform: [{ scale: scale.value }],
        }));

        const handlePress = () => {
            scale.value = withSequence(
                withSpring(0.9, { damping: 10 }),
                withSpring(1, { damping: 15 })
            );
            onPress();
        };

        const buttonColors = {
            default: theme.runNeutral,
            boundary: theme.runFour,
            wicket: theme.runWicket,
            wicketFreeHit: theme.noBallColor,
            extra: theme.wideColor,
        };

        return (
            <Animated.View style={animatedStyle}>
                <TouchableOpacity
                    style={[
                        styles.button,
                        size === 'small' && styles.smallButton,
                        { backgroundColor: buttonColors[variant] },
                    ]}
                    onPress={handlePress}
                    activeOpacity={0.8}
                >
                    <Text style={[
                        styles.value,
                        size === 'small' && styles.smallValue,
                        {
                            color: variant === 'default' ? theme.textPrimary : COLORS.white
                        }
                    ]}>
                        {value}
                    </Text>
                    {label && <Text style={[
                        styles.label,
                        { color: variant === 'default' ? theme.textSecondary : 'rgba(255,255,255,0.8)' }
                    ]}>{label}</Text>}
                </TouchableOpacity>
            </Animated.View>
        );
    }
);

function getScoreButtonStyles() {
    return StyleSheet.create({
        button: {
            width: (width - SPACING.lg * 2 - SPACING.md * 3) / 4, // Equal width for 4 buttons
            aspectRatio: 0.85, // Taller buttons
            borderRadius: BORDER_RADIUS.xl,
            justifyContent: 'center',
            alignItems: 'center',
            ...SHADOWS.medium,
        },
        smallButton: {
            width: 120,
            height: 56,
            aspectRatio: undefined, // Allow height to dictate
        },
        value: {
            fontSize: 32,
            fontWeight: '800',
        },
        smallValue: {
            fontSize: 18,
            fontWeight: '700',
        },
        label: {
            fontSize: 10,
            fontWeight: '700',
            textTransform: 'uppercase',
            marginTop: 2,
        },
    });
}

// Current Over Display
interface CurrentOverProps {
    balls: BallEvent[];
    compact?: boolean;
}

const CurrentOver: React.FC<CurrentOverProps> = memo(({ balls, compact }) => {
    const theme = useAppTheme();
    const styles = useMemo(() => getOverStyles(), []);

    const getBallDisplay = (ball: BallEvent) => {
        if (ball.isWicket) {
            const text = ball.runs > 0 ? `${ball.runs}+W` : 'W';
            return { text, color: theme.runWicket, textColor: COLORS.white };
        }
        if (ball.extras === 'wide') {
            const text = ball.isGullyExtra ? 'WD' : `${ball.runs}WD`;
            return { text, color: theme.wideColor, textColor: COLORS.white };
        }
        if (ball.extras === 'noball') {
            const text = ball.isGullyExtra ? 'NB' : `${ball.runs}NB`;
            return { text, color: theme.noBallColor, textColor: COLORS.white };
        }
        if (ball.runs === 4) return { text: '4', color: theme.runFour, textColor: COLORS.white };
        if (ball.runs === 6) return { text: '6', color: theme.runSix, textColor: COLORS.white };
        if (ball.runs === 0) return { text: '0', color: theme.runNeutral, textColor: theme.textSecondary }; // Dot ball

        return { text: String(ball.runs), color: theme.surfaceElevated, textColor: theme.textPrimary };
    };

    return (
        <View style={compact ? styles.compactContainer : styles.container}>
            {compact && <Text style={styles.compactTitle}>THIS OVER</Text>}
            {!compact && <Text style={styles.title}>THIS OVER</Text>}

            <View style={compact ? styles.compactBallsContainer : styles.ballsContainer}>
                {balls.map((ball, index) => {
                    const display = getBallDisplay(ball);
                    return (
                        <View
                            key={ball.id || index}
                            style={[
                                compact ? styles.compactBall : styles.ball,
                                { backgroundColor: display.color }
                            ]}
                        >
                            {!compact && <Text style={[
                                styles.ballText,
                                { color: display.textColor },
                                display.text.length > 2 && { fontSize: 12 }
                            ]}>{display.text}</Text>}

                            {/* Pro Mode: Show Text explicitly */}
                            {compact && <Text style={[
                                styles.compactBallText,
                                { color: display.textColor }
                            ]}>{display.text}</Text>}
                        </View>
                    );
                })}
                {/* Empty slots */}
                {Array.from({ length: Math.max(0, 6 - balls.filter(b => b.extras !== 'wide' && b.extras !== 'noball').length) }).map((_, i) => (
                    <View key={`empty-${i}`} style={[
                        compact ? styles.compactBall : styles.ball,
                        compact ? styles.compactEmptyBall : styles.emptyBall
                    ]}>
                        {!compact && <Text style={styles.ballText}></Text>}
                    </View>
                ))}
            </View>
        </View>
    );
});

function getOverStyles() {
    return StyleSheet.create({
        container: {
            marginBottom: SPACING.md,
            alignItems: 'center',
        },
        title: {
            ...TYPOGRAPHY.label,
            color: 'rgba(255,255,255,0.7)',
            marginBottom: SPACING.sm,
        },
        ballsContainer: {
            flexDirection: 'row',
            gap: SPACING.sm,
            flexWrap: 'wrap',
            justifyContent: 'center',
        },
        ball: {
            width: 40,
            height: 40,
            borderRadius: BORDER_RADIUS.round,
            justifyContent: 'center',
            alignItems: 'center',
            ...SHADOWS.soft,
        },
        emptyBall: {
            backgroundColor: 'rgba(255,255,255,0.2)',
            borderWidth: 1,
            borderColor: 'rgba(255,255,255,0.3)',
        },
        ballText: {
            fontSize: 16,
            fontWeight: '800',
        },
        // Compact Styles
        compactContainer: {
            marginBottom: SPACING.xs,
            alignItems: 'flex-start', // Align left for pro mode
            width: '100%',
            paddingHorizontal: SPACING.md,
        },
        compactBallsContainer: {
            flexDirection: 'row',
            gap: 4,
            flexWrap: 'wrap',
        },
        compactBall: {
            width: 24,
            height: 24, // Square for text
            borderRadius: 6,
            justifyContent: 'center',
            alignItems: 'center',
            shadowColor: 'transparent',
            shadowOpacity: 0,
            elevation: 0,
        },
        compactEmptyBall: {
            backgroundColor: 'rgba(255,255,255,0.15)',
            borderWidth: 0,
        },
        compactBallText: {
            fontSize: 10,
            fontWeight: 'bold',
            // Color handled inline
        },
        compactTitle: {
            fontSize: 10,
            fontWeight: '700',
            color: 'rgba(255,255,255,0.6)',
            marginBottom: 4,
            textTransform: 'uppercase',
        },
    });
}

// --- COMPACT PRO HEADER ---
interface CompactProHeaderProps {
    innings: Innings;
    battingTeam: Team;
    striker: Player | null;
    nonStriker: Player | null;
    bowler: Player | null;
    currentBowlerIndex?: number;
    oversDisplay: string;
    runRate: string;
    target: number | null;
    isFreeHit: boolean;
}

const CompactProHeader = memo(({
    innings,
    battingTeam,
    striker,
    nonStriker,
    bowler,
    currentBowlerIndex,
    oversDisplay,
    runRate,
    target,
    isFreeHit
}: CompactProHeaderProps) => {
    const theme = useAppTheme();
    const styles = useMemo(() => getCompactStyles(), []);

    // Bowler Stats Calculation
    const bowlerStats = useMemo(() => {
        if (!bowler || !innings || currentBowlerIndex === undefined) return { overs: '0.0', runs: 0, wickets: 0 };
        if (bowler.stats) {
            return {
                overs: `${bowler.stats.overs}.${(bowler.stats.balls || 0) % 6}`,
                runs: bowler.stats.runsConceded,
                wickets: bowler.stats.wickets
            };
        }
        // Fallback calc omitted for brevity, assumed similar
        let legalBalls = 0;
        let runsConceded = 0;
        let wicketsTaken = 0;
        innings.overs.forEach(over => {
            if (over.bowlerIndex === currentBowlerIndex) {
                over.balls.forEach(ball => {
                    if (ball.extras !== 'wide' && ball.extras !== 'noball') legalBalls++;
                    const extraRun = (ball.extras === 'wide' || ball.extras === 'noball') ? (ball.isGullyExtra ? 0 : 1) : 0;
                    runsConceded += ball.runs + extraRun;
                    if (ball.isWicket && ball.wicketType !== 'runout') wicketsTaken++;
                });
            }
        });
        const completedOvers = Math.floor(legalBalls / 6);
        const ballsInCurrent = legalBalls % 6;
        return {
            overs: `${completedOvers}.${ballsInCurrent}`,
            runs: runsConceded,
            wickets: wicketsTaken
        };
    }, [bowler, innings, currentBowlerIndex]);

    const getStrikerRuns = (p: Player | null) => `${p?.stats?.runs || 0}(${p?.stats?.balls || 0})`;

    return (
        <View style={styles.container}>
            {/* ROW 1: Score & Overs */}
            <View style={styles.row1}>
                {/* Team Pill & Score */}
                <View style={styles.scoreContainer}>
                    <View style={[styles.teamPill, { backgroundColor: battingTeam.color.primary }]}>
                        <Text style={styles.teamPillText}>{battingTeam.name.substring(0, 3).toUpperCase()}</Text>
                    </View>
                    <Text style={[
                        styles.scoreText,
                        {
                            textShadowColor: battingTeam.color.primary,
                            textShadowOffset: { width: 0, height: 4 },
                            textShadowRadius: 12,
                        }
                    ]}>
                        {innings.totalRuns}/{innings.wickets}
                    </Text>
                    {isFreeHit && <Text style={[styles.freeHitBadge, { backgroundColor: theme.noBallColor }]}>FH</Text>}
                </View>
                <View style={styles.metaContainer}>
                    <Text style={styles.oversText}>O {oversDisplay}</Text>
                    {target && <Text style={styles.targetText}>T: {target}</Text>}
                </View>
            </View>

            {/* ROW 2: Batsmen */}
            <View style={styles.row2}>
                <View style={styles.batsmanLeft}>
                    <Text style={[styles.batsmanName, styles.activeText]} numberOfLines={1}>
                        <Text style={{ color: battingTeam.color.primary }}>★</Text> {striker?.name || 'Ids'} {getStrikerRuns(striker)}
                    </Text>
                </View>
                <View style={styles.batsmanRight}>
                    <Text style={styles.batsmanName} numberOfLines={1}>
                        {nonStriker?.name || 'Ids'} {getStrikerRuns(nonStriker)}
                    </Text>
                </View>
            </View>

            {/* ROW 3: Bowler */}
            <View style={styles.row3}>
                <Text style={styles.bowlerText}>
                    🎯 {bowler?.name || 'Bowler'}  {bowlerStats.overs}-{bowlerStats.runs}-{bowlerStats.wickets}
                </Text>
            </View>
        </View>
    );
});

function getCompactStyles() {
    return StyleSheet.create({
        container: {
            width: '100%',
            paddingHorizontal: SPACING.md,
            paddingTop: SPACING.md,
            paddingBottom: SPACING.sm,
        },
        row1: {
            flexDirection: 'row',
            justifyContent: 'space-between',
            alignItems: 'center', // Changed from flex-end to center for pill alignment
            marginBottom: 8,
        },
        scoreContainer: {
            flexDirection: 'row',
            alignItems: 'center',
            gap: 8,
        },
        teamPill: {
            paddingHorizontal: 8,
            paddingVertical: 4,
            borderRadius: 12,
            marginRight: 4,
        },
        teamPillText: {
            fontSize: 12,
            fontWeight: 'bold',
            color: COLORS.white,
        },
        scoreText: {
            ...TYPOGRAPHY.h1, // Use h1, but override size
            fontSize: 48,
            lineHeight: 52,
            color: COLORS.white,
            fontWeight: '700',
        },
        freeHitBadge: {
            paddingHorizontal: 6,
            paddingVertical: 2,
            borderRadius: 4,
            fontSize: 10,
            fontWeight: 'bold',
            color: COLORS.white,
        },
        metaContainer: {
            alignItems: 'flex-end',
        },
        oversText: {
            fontSize: 18,
            fontWeight: '700',
            color: 'rgba(255,255,255,0.9)',
        },
        targetText: {
            fontSize: 12,
            color: 'rgba(255,255,255,0.7)',
            marginTop: 2,
        },
        row2: {
            flexDirection: 'row',
            justifyContent: 'space-between',
            marginTop: 6,
        },
        batsmanLeft: {
            flex: 1,
            marginRight: 8,
        },
        batsmanRight: {
            flex: 1,
            alignItems: 'flex-end',
        },
        batsmanName: {
            ...TYPOGRAPHY.body,
            fontSize: 15,
            color: 'rgba(255,255,255,0.7)',
            fontWeight: '500',
        },
        activeText: {
            color: COLORS.white,
            fontWeight: '700',
        },
        row3: {
            marginTop: 6,
        },
        bowlerText: {
            fontSize: 13,
            color: 'rgba(255,255,255,0.8)',
            fontWeight: '500',
        },
    });
}

// Extras Modal (Wide/No Ball with additional runs)
interface ExtrasModalProps {
    visible: boolean;
    extraType: 'wide' | 'noball' | null;
    onClose: () => void;
    onConfirm: (runs: number, isGullyExtra: boolean) => void;
}

const ExtrasModal: React.FC<ExtrasModalProps> = memo(
    ({ visible, extraType, onClose, onConfirm }) => {
        const theme = useAppTheme();
        const styles = useMemo(() => getExtrasModalStyles(theme), [theme]);
        const runOptions = [0, 1, 2, 3, 4, 6];
        const title = extraType === 'wide' ? '🔴 WIDE' : '🟡 NO BALL';
        const subtitle = 'Select runs (Local vs Standard rules)';

        return (
            <Modal
                visible={visible}
                transparent
                animationType="fade"
                onRequestClose={onClose}
            >
                <View style={styles.overlay}>
                    <Card variant="elevated" padding="large" style={styles.modal}>
                        <Text style={styles.title}>{title}</Text>
                        <Text style={styles.subtitle}>{subtitle}</Text>

                        <View style={styles.options}>
                            {/* Gully Rule: NONE (Total 0 runs) */}
                            <TouchableOpacity
                                style={[styles.option, styles.noneOption]}
                                onPress={() => onConfirm(0, true)}
                            >
                                <Text style={styles.noneOptionText}>NONE</Text>
                                <Text style={[styles.ruleHint, { color: COLORS.white }]}>GULLY</Text>
                            </TouchableOpacity>

                            {/* Standard Rules: 0, 1, 2... (+1 extra run added automatically) */}
                            {runOptions.map((runs) => (
                                <TouchableOpacity
                                    key={runs}
                                    style={styles.option}
                                    onPress={() => onConfirm(runs, false)}
                                >
                                    <Text style={styles.optionText}>
                                        {runs === 0 ? '0' : `+${runs}`}
                                    </Text>
                                    <Text style={styles.ruleHint}>STD</Text>
                                </TouchableOpacity>
                            ))}
                        </View>

                        <Button
                            title="CANCEL"
                            onPress={onClose}
                            variant="ghost"
                            size="medium"
                        />
                    </Card>
                </View>
            </Modal>
        );
    }
);

function getExtrasModalStyles(theme: any) {
    return StyleSheet.create({
        overlay: {
            flex: 1,
            backgroundColor: 'rgba(0,0,0,0.6)',
            justifyContent: 'center',
            alignItems: 'center',
            padding: SPACING.lg,
        },
        modal: {
            width: '100%',
            maxWidth: 340,
            backgroundColor: theme.surface,
        },
        title: {
            ...TYPOGRAPHY.h2,
            color: theme.textPrimary,
            textAlign: 'center',
            marginBottom: SPACING.xs,
        },
        subtitle: {
            ...TYPOGRAPHY.body,
            color: theme.textSecondary,
            textAlign: 'center',
            marginBottom: SPACING.lg,
        },
        options: {
            flexDirection: 'row',
            flexWrap: 'wrap',
            justifyContent: 'center',
            gap: SPACING.sm,
            marginBottom: SPACING.lg,
        },
        option: {
            width: 56,
            height: 56,
            backgroundColor: theme.surfaceElevated,
            borderRadius: BORDER_RADIUS.xl,
            justifyContent: 'center',
            alignItems: 'center',
            borderWidth: 1,
            borderColor: theme.borderSubtle,
        },
        optionText: {
            ...TYPOGRAPHY.h3,
            color: theme.textPrimary,
        },
        noneOption: {
            backgroundColor: theme.runWicket || '#EF4444',
            width: 80,
            borderWidth: 0,
        },
        noneOptionText: {
            ...TYPOGRAPHY.h3,
            color: COLORS.white,
            fontWeight: '900',
        },
        ruleHint: {
            fontSize: 8,
            fontWeight: '900',
            color: theme.textSecondary,
            position: 'absolute',
            bottom: 4,
        },
    });
}

// Overthrow Modal
interface OverthrowModalProps {
    visible: boolean;
    onClose: () => void;
    onConfirm: (runs: number) => void;
}

const OverthrowModal: React.FC<OverthrowModalProps> = memo(
    ({ visible, onClose, onConfirm }) => {
        const theme = useAppTheme();
        const styles = useMemo(() => getWicketModalStyles(theme), [theme]);
        const runOptions = [1, 2, 3, 4, 5, 6];

        return (
            <Modal
                visible={visible}
                transparent
                animationType="fade"
                onRequestClose={onClose}
            >
                <View style={styles.overlay}>
                    <Card variant="elevated" padding="large" style={styles.modal}>
                        <Text style={styles.title}>OVERTHROW</Text>
                        <Text style={styles.subtitle}>Additional runs from overthrow?</Text>
                        <View style={styles.runsOptions}>
                            {runOptions.map((runs) => (
                                <TouchableOpacity
                                    key={runs}
                                    style={styles.runsOption}
                                    onPress={() => onConfirm(runs)}
                                >
                                    <Text style={styles.runsText}>+{runs}</Text>
                                </TouchableOpacity>
                            ))}
                        </View>
                        <Button
                            title="CANCEL"
                            onPress={onClose}
                            variant="ghost"
                            size="medium"
                        />
                    </Card>
                </View>
            </Modal>
        );
    }
);

// Next Over Modal - Pause between overs
interface NextOverModalProps {
    visible: boolean;
    overNumber: number;
    runsInOver: number;
    onConfirm: () => void;
}

const NextOverModal: React.FC<NextOverModalProps> = memo(
    ({ visible, overNumber, runsInOver, onConfirm }) => {
        const theme = useAppTheme();
        const styles = useMemo(() => getNextOverModalStyles(theme), [theme]);
        const slideAnim = useSharedValue(50);
        const opacityAnim = useSharedValue(0);

        useEffect(() => {
            if (visible) {
                slideAnim.value = withSpring(0, { damping: 15 });
                opacityAnim.value = withTiming(1, { duration: 300 });
            } else {
                slideAnim.value = 50;
                opacityAnim.value = 0;
            }
        }, [visible]);

        const animatedStyle = useAnimatedStyle(() => ({
            transform: [{ translateY: slideAnim.value }],
            opacity: opacityAnim.value,
        }));

        return (
            <Modal
                visible={visible}
                transparent
                animationType="none"
                onRequestClose={() => { }}
            >
                <View style={styles.overlay}>
                    <Animated.View style={[styles.modalContainer, animatedStyle]}>
                        <Card variant="elevated" padding="large" style={styles.modal}>
                            <Text style={styles.emoji}>🏏</Text>
                            <Text style={styles.title}>OVER {overNumber} COMPLETE</Text>
                            <View style={styles.summaryRow}>
                                <Text style={styles.summaryLabel}>Runs in Over</Text>
                                <Text style={styles.summaryValue}>{runsInOver}</Text>
                            </View>
                            <Button
                                title="➡️ NEXT OVER"
                                onPress={onConfirm}
                                variant="primary"
                                size="large"
                                style={styles.button}
                            />
                        </Card>
                    </Animated.View>
                </View>
            </Modal>
        );
    }
);

function getNextOverModalStyles(theme: any) {
    return StyleSheet.create({
        overlay: {
            flex: 1,
            backgroundColor: 'rgba(0,0,0,0.6)',
            justifyContent: 'center',
            alignItems: 'center',
            padding: SPACING.lg,
        },
        modalContainer: {
            width: '100%',
            alignItems: 'center',
        },
        modal: {
            width: '100%',
            maxWidth: 320,
            alignItems: 'center',
        },
        emoji: {
            fontSize: 48,
            marginBottom: SPACING.md,
        },
        title: {
            ...TYPOGRAPHY.h2,
            color: theme.textPrimary,
            textAlign: 'center',
            marginBottom: SPACING.lg,
        },
        summaryRow: {
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
            width: '100%',
            backgroundColor: theme.surfaceElevated,
            paddingVertical: SPACING.md,
            paddingHorizontal: SPACING.lg,
            borderRadius: BORDER_RADIUS.lg,
            marginBottom: SPACING.lg,
            borderWidth: 1,
            borderColor: theme.borderSubtle,
        },
        summaryLabel: {
            ...TYPOGRAPHY.body,
            color: theme.textSecondary,
        },
        summaryValue: {
            ...TYPOGRAPHY.h2,
            color: theme.runFour || '#22C55E',
        },
        button: {
            width: '100%',
        },
    });
}

// Wicket Modal with runs before wicket
interface WicketModalProps {
    visible: boolean;
    onClose: () => void;
    onSelect: (type: string, runsBeforeWicket: number, who?: 'striker' | 'nonStrkr') => void;
    isFreeHit?: boolean;
}

const WicketModal: React.FC<WicketModalProps> = memo(
    ({ visible, onClose, onSelect, isFreeHit = false }) => {
        const theme = useAppTheme();
        const styles = useMemo(() => getWicketModalStyles(theme), [theme]);
        const [step, setStep] = useState<'type' | 'runs' | 'who'>('type');
        const [selectedType, setSelectedType] = useState<string | null>(null);
        const [selectedRuns, setSelectedRuns] = useState<number>(0);

        const allWicketTypes = [
            { id: 'bowled', label: 'Bowled', emoji: '🎯', canHaveRuns: false },
            { id: 'caught', label: 'Caught', emoji: '🙌', canHaveRuns: false },
            { id: 'lbw', label: 'LBW', emoji: '🦵', canHaveRuns: false },
            { id: 'runout', label: 'Run Out', emoji: '🏃', canHaveRuns: true },
            { id: 'stumped', label: 'Stumped', emoji: '🧤', canHaveRuns: false },
            { id: 'hitwicket', label: 'Hit Wkt', emoji: '💥', canHaveRuns: false },
        ];

        const wicketTypes = isFreeHit
            ? allWicketTypes.filter(t => t.id === 'runout')
            : allWicketTypes;

        const handleTypeSelect = (type: string) => {
            const wicketType = allWicketTypes.find(t => t.id === type);
            setSelectedType(type);
            if (wicketType?.canHaveRuns) {
                setStep('runs');
            } else {
                // No runs possible -> Striker is out
                onSelect(type, 0, 'striker');
                resetModal();
            }
        };

        const handleRunsSelect = (runs: number) => {
            if (selectedType === 'runout') {
                setSelectedRuns(runs);
                setStep('who');
            } else {
                if (selectedType) {
                    onSelect(selectedType, runs, 'striker');
                }
                resetModal();
            }
        };

        const handleWhoSelect = (who: 'striker' | 'nonStrkr') => {
            if (selectedType) {
                onSelect(selectedType, selectedRuns, who);
            }
            resetModal();
        };

        const resetModal = () => {
            setStep('type');
            setSelectedType(null);
            setSelectedRuns(0);
        };

        const handleClose = () => {
            resetModal();
            onClose();
        };

        return (
            <Modal
                visible={visible}
                transparent
                animationType="fade"
                onRequestClose={handleClose}
            >
                <View style={styles.overlay}>
                    <Card variant="elevated" padding="large" style={styles.modal}>
                        {step === 'type' ? (
                            <>
                                <Text style={styles.title}>
                                    {isFreeHit ? '🔥 FREE HIT - OUT?' : 'HOW OUT?'}
                                </Text>
                                <View style={styles.options}>
                                    {wicketTypes.map((type) => (
                                        <TouchableOpacity
                                            key={type.id}
                                            style={styles.option}
                                            onPress={() => handleTypeSelect(type.id)}
                                        >
                                            <Text style={styles.optionEmoji}>{type.emoji}</Text>
                                            <Text style={styles.optionLabel}>{type.label}</Text>
                                        </TouchableOpacity>
                                    ))}
                                </View>
                            </>
                        ) : step === 'runs' ? (
                            <>
                                <Text style={styles.title}>HOW MANY RUNS?</Text>
                                <Text style={styles.subtitle}>Before the wicket fell</Text>
                                <View style={styles.runsOptions}>
                                    {[0, 1, 2, 3, 4, 5, 6].map((runs) => (
                                        <TouchableOpacity
                                            key={runs}
                                            style={styles.runsOption}
                                            onPress={() => handleRunsSelect(runs)}
                                        >
                                            <Text style={styles.runsText}>{runs}</Text>
                                        </TouchableOpacity>
                                    ))}
                                </View>
                            </>
                        ) : (
                            <>
                                <Text style={styles.title}>🤔 WHO IS OUT?</Text>
                                <View style={styles.runsOptions}>
                                    <TouchableOpacity
                                        style={styles.runsOption}
                                        onPress={() => handleWhoSelect('striker')}
                                    >
                                        <Text style={styles.runsText}>Striker</Text>
                                    </TouchableOpacity>
                                    <TouchableOpacity
                                        style={styles.runsOption}
                                        onPress={() => handleWhoSelect('nonStrkr')}
                                    >
                                        <Text style={styles.runsText}>Non-Str</Text>
                                    </TouchableOpacity>
                                </View>
                            </>
                        )}
                        <Button
                            title={step === 'type' ? 'CANCEL' : 'BACK'}
                            onPress={step === 'runs' ? () => setStep('type') : handleClose}
                            variant="ghost"
                            size="medium"
                        />
                    </Card>
                </View>
            </Modal>
        );
    }
);

function getWicketModalStyles(theme: any) {
    return StyleSheet.create({
        overlay: {
            flex: 1,
            backgroundColor: 'rgba(0,0,0,0.6)',
            justifyContent: 'center',
            alignItems: 'center',
            padding: SPACING.lg,
        },
        modal: {
            width: '100%',
            maxWidth: 360,
            backgroundColor: theme.surface,
        },
        title: {
            ...TYPOGRAPHY.h2,
            color: theme.textPrimary,
            textAlign: 'center',
            marginBottom: SPACING.sm,
        },
        subtitle: {
            ...TYPOGRAPHY.body,
            color: theme.textSecondary,
            textAlign: 'center',
            marginBottom: SPACING.lg,
        },
        options: {
            flexDirection: 'row',
            flexWrap: 'wrap',
            gap: SPACING.md,
            justifyContent: 'center',
            marginBottom: SPACING.lg,
        },
        option: {
            width: '28%',
            aspectRatio: 1,
            backgroundColor: theme.surfaceElevated,
            borderRadius: BORDER_RADIUS.xl,
            justifyContent: 'center',
            alignItems: 'center',
            borderWidth: 1,
            borderColor: theme.borderSubtle,
        },
        optionEmoji: {
            fontSize: 32,
            marginBottom: SPACING.xs,
        },
        optionLabel: {
            ...TYPOGRAPHY.label,
            color: theme.textSecondary,
            textAlign: 'center',
        },
        runsOptions: {
            flexDirection: 'row',
            flexWrap: 'wrap',
            justifyContent: 'center',
            gap: SPACING.md,
            marginBottom: SPACING.lg,
        },
        runsOption: {
            width: 64,
            height: 64,
            backgroundColor: theme.surfaceElevated,
            borderRadius: BORDER_RADIUS.xl,
            justifyContent: 'center',
            alignItems: 'center',
            borderWidth: 1,
            borderColor: theme.borderSubtle,
        },
        runsText: {
            ...TYPOGRAPHY.h2,
            color: theme.textPrimary,
        },
    });
}

// Main Match Screen
export default function MatchScreen() {
    const navigation = useNavigation<MatchNavigationProp>();
    const { play } = useSound();
    const theme = useAppTheme();
    const styles = useMemo(() => getMatchScreenStyles(theme), [theme]);
    // Reuse wicketModalStyles for consistent modal look, or merge
    const wicketModalStyles = useMemo(() => getWicketModalStyles(theme), [theme]);

    // TODO: Add screen wake lock using native module or expo-keep-awake

    // Store
    const currentMatch = useMatchStore((state) => state.currentMatch);
    const addBall = useMatchStore((state) => state.addBall);
    const undoLastBall = useMatchStore((state) => state.undoLastBall);
    const endInnings = useMatchStore((state) => state.endInnings);
    const endMatch = useMatchStore((state) => state.endMatch);
    const addOverthrowRuns = useMatchStore((state) => state.addOverthrowRuns);
    const resetMatch = useMatchStore((state) => state.resetMatch);
    const confirmNextOver = useMatchStore((state) => state.confirmNextOver);
    const setNewBatsman = useMatchStore((state) => state.setNewBatsman);
    const series = useMatchStore((state) => state.series);

    const [wicketModalVisible, setWicketModalVisible] = useState(false);
    const [extrasModalVisible, setExtrasModalVisible] = useState(false);
    const [overthrowModalVisible, setOverthrowModalVisible] = useState(false);
    const [pendingExtraType, setPendingExtraType] = useState<'wide' | 'noball' | null>(null);

    // Pro Mode Modals State
    const [playerSelectVisible, setPlayerSelectVisible] = useState(false);
    const [playerSelectType, setPlayerSelectType] = useState<'batsman' | 'bowler' | null>(null);
    const [pendingBatsmanPosition, setPendingBatsmanPosition] = useState<'striker' | 'nonStrkr'>('striker');

    // Win Modal State (Pro Mode)
    const [winModalVisible, setWinModalVisible] = useState(false);
    const [matchResult, setMatchResult] = useState<{ winner: string; margin: string } | null>(null);




    // Prevent accidental exit
    React.useEffect(() => {
        const unsubscribe = navigation.addListener('beforeRemove', (e) => {
            // Allow programmatic reset (our exit action)
            if (e.data.action.type === 'RESET') return;

            // Allow navigation to Result or MVP
            const actionName = (e.data.action.payload as any)?.name;
            if (actionName === 'Result' || actionName === 'MVP') {
                return;
            }

            // If match is not active, allow
            if (!currentMatch) return;

            e.preventDefault();

            Alert.alert(
                'Exit Match?',
                'If you exit now, this match progress will be lost. Are you sure?',
                [
                    { text: 'No', style: 'cancel', onPress: () => { } },
                    {
                        text: 'Yes, Exit',
                        style: 'destructive',
                        onPress: () => {
                            // First remove listener to avoid interference?
                            // Actually RESET check handles it.
                            resetMatch();
                            navigation.reset({
                                index: 0,
                                routes: [{ name: 'Home' }],
                            });
                        },
                    },
                ]
            );
        });

        return unsubscribe;
    }, [navigation, currentMatch, resetMatch]);

    // Derived data
    const innings = useMemo(() => {
        if (!currentMatch) return null;
        return currentMatch.innings[currentMatch.currentInnings];
    }, [currentMatch]);

    const currentOver = useMemo(() => {
        if (!innings) return [];
        return innings.overs[innings.overs.length - 1]?.balls || [];
    }, [innings]);

    const oversDisplay = useMemo(() => {
        if (!innings) return '0.0';
        const completedOvers = innings.overs.length - 1;
        const ballsInCurrentOver = currentOver.filter(
            (b) => b.extras !== 'wide' && b.extras !== 'noball'
        ).length;
        return `${completedOvers}.${ballsInCurrentOver}`;
    }, [innings, currentOver]);

    const battingTeam = useMemo(() => {
        if (!currentMatch || !innings) return null;
        return innings.battingTeamIndex === 0 ? currentMatch.teamA : currentMatch.teamB;
    }, [currentMatch, innings]);

    const bowlingTeam = useMemo(() => {
        if (!currentMatch || !innings) return null;
        return innings.battingTeamIndex === 0 ? currentMatch.teamB : currentMatch.teamA;
    }, [currentMatch, innings]);

    // -- Derived State for Pro Mode --
    const battingTeamPlayers = useMemo(() => {
        if (currentMatch?.mode !== 'pro' || !battingTeam) return [];
        return battingTeam.players.filter((p, i) => i !== innings?.currentBatsmanIndex && i !== innings?.nonStrikerIndex);
    }, [currentMatch?.mode, battingTeam, innings?.currentBatsmanIndex, innings?.nonStrikerIndex]);

    const bowlingTeamPlayers = useMemo(() => {
        if (currentMatch?.mode !== 'pro' || !bowlingTeam) return [];
        return bowlingTeam.players;
    }, [currentMatch?.mode, bowlingTeam]);

    // Current Players for Stats Panel
    const striker = useMemo(() => {
        if (!battingTeam || !innings) return null;
        return battingTeam.players[innings.currentBatsmanIndex];
    }, [battingTeam, innings?.currentBatsmanIndex]);

    const nonStriker = useMemo(() => {
        if (!battingTeam || !innings) return null;
        return battingTeam.players[innings.nonStrikerIndex];
    }, [battingTeam, innings?.nonStrikerIndex]);

    const currentBowler = useMemo(() => {
        if (!bowlingTeam || !innings) return null;
        const currentOver = innings.overs[innings.overs.length - 1];
        if (currentOver?.bowlerIndex !== undefined) {
            return bowlingTeam.players[currentOver.bowlerIndex];
        }
        return null;
    }, [bowlingTeam, innings?.overs]);

    const currentBowlerIndex = useMemo(() => {
        if (!innings) return undefined;
        return innings.overs[innings.overs.length - 1]?.bowlerIndex;
    }, [innings]);

    // Calculate Out Players (to filter from selection)
    const outPlayerIds = useMemo(() => {
        if (!innings || !battingTeam) return [];
        return innings.overs.flatMap(over =>
            over.balls
                .filter(b => b.isWicket)
                .map(b => {
                    if (b.playerOutIndex !== undefined) return battingTeam.players[b.playerOutIndex]?.id;
                    // Fallback for wickets where playerOutIndex wasn't set (e.g. old data or simple cases)
                    if (b.wicketType !== 'runout' && b.strikerIndexSnapshot !== undefined) {
                        return battingTeam.players[b.strikerIndexSnapshot]?.id;
                    }
                    return null;
                })
        ).filter(Boolean) as string[];
    }, [innings, battingTeam]);

    // Live Bowling Stats Map
    const liveBowlingStats = useMemo(() => {
        const stats: Record<string, { runs: number; wickets: number; balls: number }> = {};

        if (!innings || !currentMatch) return stats;

        // Initialize with base stats if available, or 0
        const bowlingTeam = innings.battingTeamIndex === 0 ? currentMatch.teamB : currentMatch.teamA;
        bowlingTeam.players.forEach(p => {
            stats[p.id] = { runs: 0, wickets: 0, balls: 0 };
        });

        // Toggle strict mode for stats calculation?
        // We really should just aggregate from the current innings only for "This Match" stats.
        // If we want career stats, we'd add base. But for "This Match", start at 0.

        innings.overs.forEach(over => {
            if (over.bowlerIndex !== undefined) {
                const bowler = bowlingTeam.players[over.bowlerIndex];
                if (bowler) {
                    const s = stats[bowler.id];
                    over.balls.forEach(ball => {
                        // Legal balls count
                        if (ball.extras !== 'wide' && ball.extras !== 'noball') {
                            s.balls += 1;
                        }

                        // Runs Conceded
                        const extraRuns = (ball.extras === 'wide' || ball.extras === 'noball')
                            ? (ball.isGullyExtra ? 0 : 1)
                            : 0;
                        s.runs += ball.runs + extraRuns;

                        // Wickets
                        if (ball.isWicket && ball.wicketType !== 'runout') {
                            s.wickets += 1;
                        }
                    });
                }
            }
        });

        return stats;
    }, [innings, currentMatch]);

    // Helper to format stats for modal
    const getFormattedBowlingStats = useCallback((playerId: string) => {
        // We will calculate this inside the modal or pass a map
        // For now, let's pass a map of stats to the modal
        return null;
    }, []);

    // Dynamic Gradient based on batting team color ID
    const gradientVariant: GradientVariant = useMemo(() => {
        if (!battingTeam) return 'darkPage';
        // Try to find matching gradient key
        if ((GRADIENTS as any)[battingTeam.color.id]) {
            return battingTeam.color.id as GradientVariant;
        }
        return 'darkPage'; // Fallback
    }, [battingTeam]);

    const target = useMemo(() => {
        if (!currentMatch || currentMatch.currentInnings === 0) return null;
        return currentMatch.innings[0].totalRuns + 1;
    }, [currentMatch]);

    const runRate = useMemo(() => {
        if (!innings) return '0.00';
        const totalBalls = innings.overs.reduce(
            (acc, over) => acc + over.balls.filter((b) => b.extras !== 'wide' && b.extras !== 'noball').length,
            0
        );
        if (totalBalls === 0) return '0.00';
        return ((innings.totalRuns / totalBalls) * 6).toFixed(2);
    }, [innings]);

    const isFreeHit = useMemo(() => {
        return innings?.isNextBallFreeHit ?? false;
    }, [innings]);

    // Over pending state (for Next Over modal)
    const isOverPending = useMemo(() => {
        return innings?.isOverPending ?? false;
    }, [innings]);

    const lastOverRuns = useMemo(() => {
        return innings?.lastOverRuns ?? 0;
    }, [innings]);

    const completedOverNumber = useMemo(() => {
        if (!innings) return 0;
        return innings.overs.length;
    }, [innings]);

    // Handler for confirming next over
    const handleConfirmNextOver = useCallback(() => {
        if (currentMatch?.mode === 'pro') {
            setPlayerSelectType('bowler');
            setPlayerSelectVisible(true);
        } else {
            confirmNextOver();
        }
    }, [confirmNextOver, currentMatch?.mode]);

    const handlePlayerSelect = useCallback((player: Player) => {
        if (playerSelectType === 'bowler') {
            if (!bowlingTeam) return;
            const index = bowlingTeam.players.findIndex(p => p.id === player.id);
            if (index !== -1) {
                confirmNextOver(index);
                setPlayerSelectVisible(false);
                setPlayerSelectType(null);
            }
        } else if (playerSelectType === 'batsman') {
            if (!battingTeam) return;
            const index = battingTeam.players.findIndex(p => p.id === player.id);
            if (index !== -1) {
                setNewBatsman(index, pendingBatsmanPosition);
                setPlayerSelectVisible(false);
                setPlayerSelectType(null);
            }
        }
    }, [bowlingTeam, battingTeam, confirmNextOver, setNewBatsman, pendingBatsmanPosition, playerSelectType]);


    // Handlers (kept same logic, removed sound calls as previously requested)
    const handleScore = useCallback(
        (runs: number) => {
            addBall({
                runs,
                extras: null,
                isWicket: false,
                batsmanIndex: innings?.currentBatsmanIndex || 0,
            });
            // checkMatchEnd is now handled by useEffect
        },
        [innings, addBall]
    );

    const handleExtra = useCallback(
        (type: 'wide' | 'noball') => {
            setPendingExtraType(type);
            setExtrasModalVisible(true);
        },
        []
    );

    const handleExtraConfirm = useCallback(
        (additionalRuns: number, isGullyExtra: boolean) => {
            setExtrasModalVisible(false);
            if (pendingExtraType) {
                addBall({
                    runs: additionalRuns,
                    extras: pendingExtraType,
                    isWicket: false,
                    isGullyExtra: isGullyExtra,
                    batsmanIndex: innings?.currentBatsmanIndex || 0,
                });
            }
            setPendingExtraType(null);
        },
        [innings, addBall, pendingExtraType]
    );

    const handleExtraCancel = useCallback(() => {
        setExtrasModalVisible(false);
        setPendingExtraType(null);
    }, []);

    const handleWicket = useCallback(() => {
        setWicketModalVisible(true);
    }, []);

    const handleWicketType = useCallback(
        (type: string, runsBeforeWicket: number, who: 'striker' | 'nonStrkr' = 'striker') => {
            setWicketModalVisible(false);

            // Determine who is out for Store tracking
            const playerOutIndex = who === 'striker'
                ? innings?.currentBatsmanIndex
                : innings?.nonStrikerIndex;

            // setPendingBatsmanPosition logic for Pro Mode
            if (currentMatch?.mode === 'pro') {
                // GUARD: Check if this was the last wicket
                const currentWickets = innings?.wickets || 0;
                const maxWickets = currentMatch.totalWickets;
                const teamSize = battingTeam?.players.length || 11;
                const maxPossibleWickets = Math.min(maxWickets, teamSize - 1);

                // If wickets + 1 < maxPossibleWickets, then we need a new batsman.
                // Otherwise, innings is over immediately, do NOT show selector.
                if (currentWickets + 1 < maxPossibleWickets) {
                    setPendingBatsmanPosition(who);
                    setTimeout(() => {
                        setPlayerSelectType('batsman');
                        setPlayerSelectVisible(true);
                    }, 500);
                }
            }

            addBall({
                runs: runsBeforeWicket,
                extras: null,
                isWicket: true,
                wicketType: type as BallEvent['wicketType'],
                batsmanIndex: innings?.currentBatsmanIndex || 0,
                playerOutIndex, // Pass the dismissed player index
            });
            // checkMatchEnd is now handled by useEffect
        },
        [innings, addBall, currentMatch?.mode, currentMatch?.totalWickets]
    );

    const handleUndo = useCallback(() => {
        undoLastBall();
    }, [undoLastBall]);

    const handleOverthrow = useCallback(() => {
        setOverthrowModalVisible(true);
    }, []);

    const handleOverthrowConfirm = useCallback((runs: number) => {
        addOverthrowRuns(runs);
        setOverthrowModalVisible(false);
    }, [addOverthrowRuns]);

    // Store action for super over
    const startSuperOver = useMatchStore((state) => state.startSuperOver);

    // Reactive check for match/innings end conditions
    React.useEffect(() => {
        if (!currentMatch || !innings) return;

        const maxWickets = currentMatch.totalWickets;
        const maxOvers = currentMatch.totalOvers;
        const totalBalls = innings.overs.reduce(
            (acc, over) => acc + over.balls.filter((b) => b.extras !== 'wide' && b.extras !== 'noball').length,
            0
        );
        const oversCompleted = totalBalls >= maxOvers * 6;
        // Check if wickets reached OR if we ran out of players (team size - 1)
        const teamSize = battingTeam?.players.length || 11;
        const allOut = innings.wickets >= maxWickets || innings.wickets >= teamSize - 1;

        // Prevent re-triggering if match already completed
        if (currentMatch.status === 'completed') return;

        // Check if target chased
        if (target && innings.totalRuns >= target) {
            const winner = innings.battingTeamIndex;
            const wicketsRemaining = maxWickets - innings.wickets;
            // Determine result type (Normal vs Super Over Win)
            const resultType = currentMatch.isSuperOver ? 'super_over' : 'normal';
            endMatch(winner, `${wicketsRemaining} wickets`, resultType);

            if (currentMatch.mode === 'pro') {
                const winnerName = winner === 0 ? currentMatch.teamA.name : currentMatch.teamB.name;
                setMatchResult({ winner: winnerName, margin: `${wicketsRemaining} wickets` });
                setWinModalVisible(true);
            } else {
                navigation.navigate('Result');
            }
            return;
        }

        // Check innings end conditions
        if (allOut || oversCompleted) {
            // Check if this is the FIRST innings of the CURRENT PHASE
            // If it's normal match: currentInnings === 0
            // If it's Super Over: currentInnings === 2 (since 0,1 are main match)

            const isFirstInningsOfPhase = currentMatch.isSuperOver
                ? currentMatch.currentInnings === 2
                : currentMatch.currentInnings === 0;

            if (isFirstInningsOfPhase) {
                const targetRuns = innings.totalRuns + 1;
                Alert.alert(
                    '🏏 INNINGS COMPLETE',
                    `${battingTeam?.name} scored ${innings.totalRuns}/${innings.wickets}\n\n🎯 Target: ${targetRuns} runs in ${currentMatch.totalOvers} overs`,
                    [
                        {
                            text: 'Start 2nd Innings',
                            onPress: () => endInnings(),
                        },
                    ]
                );
            } else {
                // SECOND INNINGS COMPLETE (Result Time)
                // Normal Match: currentInnings === 1
                // Super Over: currentInnings === 3

                // Calculate runs for the RELEVANT innings pairs
                // Normal: 0 vs 1
                // Super Over: 2 vs 3
                const firstInningsIndex = currentMatch.isSuperOver ? 2 : 0;
                const secondInningsIndex = currentMatch.isSuperOver ? 3 : 1;

                const firstInningsRuns = currentMatch.innings[firstInningsIndex].totalRuns;
                const secondInningsRuns = innings.totalRuns; // This is the second innings

                let winner: 0 | 1 | 'tie';
                let margin: string;
                let resultType: 'normal' | 'super_over' | 'tie' = currentMatch.isSuperOver ? 'super_over' : 'normal';

                if (secondInningsRuns > firstInningsRuns) {
                    winner = innings.battingTeamIndex; // Should be impossible here as handled by 'target chased' logic usually, but strict check keeps it safe
                    margin = `${maxWickets - innings.wickets} wickets`;
                } else if (firstInningsRuns > secondInningsRuns) {
                    winner = innings.battingTeamIndex === 0 ? 1 : 0;
                    margin = `${firstInningsRuns - secondInningsRuns} runs`;
                } else {
                    winner = 'tie';
                    margin = 'Match Tied';
                    resultType = 'tie';
                }

                if (winner === 'tie') {
                    if (currentMatch.isSuperOver) {
                        // Double Tie! End it.
                        endMatch('tie', 'Match Tied (Super Over)', 'tie');
                        if (currentMatch.mode === 'pro') {
                            setMatchResult({ winner: 'Match Tied', margin: '(Super Over)' });
                            setWinModalVisible(true);
                        } else {
                            navigation.navigate('Result');
                        }
                    } else {
                        // Normal Match Tie - Offer Super Over
                        Alert.alert(
                            '😲 MATCH TIED!',
                            'Draft a Super Over or End as Tie?',
                            [
                                {
                                    text: 'End as Tie',
                                    style: 'cancel',
                                    onPress: () => {
                                        endMatch('tie', 'Match Tied', 'tie');
                                        if (currentMatch.mode === 'pro') {
                                            setMatchResult({ winner: 'Match Tied', margin: '' });
                                            setWinModalVisible(true);
                                        } else {
                                            navigation.navigate('Result');
                                        }
                                    }
                                },
                                {
                                    text: '🔥 SUPER OVER',
                                    onPress: () => {
                                        startSuperOver();
                                    }
                                }
                            ]
                        );
                    }
                } else {
                    // Normal Win
                    endMatch(winner, margin, resultType);
                    if (currentMatch.mode === 'pro') {
                        const winnerName = winner === 0 ? currentMatch.teamA.name : currentMatch.teamB.name;
                        setMatchResult({ winner: winnerName, margin });
                        setWinModalVisible(true);
                    } else {
                        navigation.navigate('Result');
                    }
                }
            }
        }
    }, [currentMatch, innings, target, endMatch, endInnings, navigation, battingTeam, startSuperOver]);

    // --- ANIMATIONS ---
    const scoreScale = useSharedValue(1);

    const animatedScoreStyle = useAnimatedStyle(() => ({
        transform: [{ scale: scoreScale.value }],
    }));

    // Trigger pop animation on score change
    useEffect(() => {
        if (innings?.totalRuns === 0 && innings?.wickets === 0) return; // Skip initial mount/reset

        scoreScale.value = withSequence(
            withSpring(1.1, { damping: 10, stiffness: 400 }),
            withSpring(1, { damping: 15, stiffness: 300 })
        );
    }, [innings?.totalRuns, innings?.wickets]);

    if (!currentMatch || !innings || !battingTeam || !bowlingTeam) {
        return (
            <SafeAreaView style={styles.container}>
                <Text style={styles.errorText}>No active match</Text>
                <Button
                    title="Go Home"
                    onPress={() => navigation.navigate('Home')}
                    variant="primary"
                />
            </SafeAreaView>
        );
    }

    return (
        <GradientBackground variant={gradientVariant} style={styles.container}>
            <SafeAreaView style={styles.safeArea} edges={['top']}>

                {/* Conditional Header Rendering */}
                {currentMatch?.mode === 'pro' ? (
                    <>
                        <CompactProHeader
                            innings={innings}
                            battingTeam={battingTeam}
                            striker={striker}
                            nonStriker={nonStriker}
                            bowler={currentBowler}
                            currentBowlerIndex={currentBowlerIndex}
                            oversDisplay={oversDisplay}
                            runRate={runRate}
                            target={target}
                            isFreeHit={isFreeHit}
                        />
                        <CurrentOver balls={currentOver} compact={true} />
                    </>
                ) : (
                    /* ORIGINAL GULLY SCOREBOARD */
                    <View style={styles.scoreboardContainer}>
                        {/* Header Info */}
                        <TouchableOpacity onPress={() => navigation.navigate('Scorecard', { match: currentMatch })}>
                            <Text style={[styles.headerTitle, { color: theme.textPrimary }]}>
                                {(currentMatch.currentInnings % 2 === 0) ? "1st INNINGS" : "2nd INNINGS"}
                            </Text>
                        </TouchableOpacity>

                        {/* Series Indicator */}
                        {series && series.isActive && (
                            <View style={{ marginBottom: 12, backgroundColor: 'rgba(0,0,0,0.05)', paddingHorizontal: 12, paddingVertical: 4, borderRadius: 12 }}>
                                <Text style={{ fontSize: 12, fontWeight: '700', color: theme.textSecondary }}>
                                    SERIES: MATCH {series.matchIds.length + 1} OF {series.bestOf}
                                </Text>
                            </View>
                        )}

                        {/* BATTING TEAM BADGE */}
                        <View style={styles.battingBadge}>
                            <Text style={styles.battingText}>{battingTeam.name.toUpperCase()} BATTING</Text>
                        </View>

                        {/* MAIN SCORE */}
                        <View style={styles.scoreDisplay}>
                            <Animated.Text style={[styles.scoreMain, animatedScoreStyle]}>
                                {innings.totalRuns}/{innings.wickets}
                            </Animated.Text>
                            <Text style={styles.oversSub}>
                                OVERS {oversDisplay}
                            </Text>
                        </View>

                        {/* Stats Row */}
                        <View style={styles.statsRow}>
                            <View style={styles.statItem}>
                                <Text style={styles.statValue}>{runRate}</Text>
                                <Text style={styles.statLabel}>CRR</Text>
                            </View>
                            {target && (
                                <>
                                    <View style={styles.statDivider} />
                                    <View style={styles.statItem}>
                                        <Text style={styles.statValue}>{target - innings.totalRuns}</Text>
                                        <Text style={styles.statLabel}>NEED</Text>
                                    </View>
                                    <View style={styles.statDivider} />
                                    <View style={styles.statItem}>
                                        <Text style={styles.statValue}>{target}</Text>
                                        <Text style={styles.statLabel}>TARGET</Text>
                                    </View>
                                </>
                            )}
                        </View>

                        {isFreeHit && (
                            <View style={styles.freeHitContainer}>
                                <Text style={styles.freeHitText}>🔥 FREE HIT ACTIVE 🔥</Text>
                            </View>
                        )}

                        <View style={styles.spacer} />
                        <CurrentOver balls={currentOver} />
                    </View>
                )}

                {/* BOTTOM CONTROLS */}
                <Card variant="elevated" padding="medium" style={styles.controlsCard}>
                    {/* Runs */}
                    <View style={[styles.buttonRow, isOverPending && { opacity: 0.5 }]}>
                        <ScoreButton value="0" onPress={() => !isOverPending && handleScore(0)} />
                        <ScoreButton value="1" onPress={() => !isOverPending && handleScore(1)} />
                        <ScoreButton value="2" onPress={() => !isOverPending && handleScore(2)} />
                        <ScoreButton value="3" onPress={() => !isOverPending && handleScore(3)} />
                    </View>
                    <View style={[styles.buttonRow, { justifyContent: 'center', gap: SPACING.md }, isOverPending && { opacity: 0.5 }]}>
                        <ScoreButton value="4" onPress={() => !isOverPending && handleScore(4)} variant="boundary" />
                        <ScoreButton value="6" onPress={() => !isOverPending && handleScore(6)} variant="boundary" />
                        <ScoreButton
                            value={isFreeHit ? 'R/O' : 'W'}
                            label={isFreeHit ? 'ONLY' : undefined}
                            onPress={() => !isOverPending && handleWicket()}
                            variant={isFreeHit ? 'wicketFreeHit' : 'wicket'}
                        />
                    </View>

                    {/* Extras & Actions Grid */}
                    <View style={styles.extrasGrid}>
                        <View style={[styles.extrasRow, isOverPending && { opacity: 0.5 }]}>
                            <Button
                                title="WIDE"
                                onPress={() => !isOverPending && handleExtra('wide')}
                                variant="primary"
                                style={[styles.actionButton, { backgroundColor: theme.wideColor }]}
                                textStyle={styles.actionButtonText}
                            />
                            <Button
                                title="NO BALL"
                                onPress={() => !isOverPending && handleExtra('noball')}
                                variant="primary"
                                style={[styles.actionButton, { backgroundColor: theme.noBallColor }]}
                                textStyle={styles.actionButtonText}
                            />
                        </View>
                        <View style={styles.extrasRow}>
                            <Button
                                title="OVERTHROW"
                                onPress={() => !isOverPending && handleOverthrow()}
                                variant="secondary"
                                style={[styles.actionButton, { backgroundColor: theme.overthrowColor }, isOverPending && { opacity: 0.5 }]}
                                textStyle={styles.actionButtonText}
                            />
                            <Button
                                title="UNDO"
                                onPress={() => !isOverPending && handleUndo()}
                                variant="primary"
                                style={[styles.actionButton, { backgroundColor: theme.undoColor }, isOverPending && { opacity: 0.5 }]}
                                textStyle={styles.actionButtonText}
                            />
                        </View>
                    </View>
                </Card>

                {/* Wicket Modal */}
                <WicketModal
                    visible={wicketModalVisible}
                    onClose={() => setWicketModalVisible(false)}
                    onSelect={handleWicketType}
                    isFreeHit={isFreeHit}
                />

                {/* Extras Modal (Wide/No Ball with runs) */}
                <ExtrasModal
                    visible={extrasModalVisible}
                    extraType={pendingExtraType}
                    onClose={handleExtraCancel}
                    onConfirm={handleExtraConfirm}
                />

                {/* Overthrow Modal */}
                <OverthrowModal
                    visible={overthrowModalVisible}
                    onClose={() => setOverthrowModalVisible(false)}
                    onConfirm={handleOverthrowConfirm}
                />

                {/* Next Over Modal */}
                <NextOverModal
                    visible={isOverPending}
                    overNumber={completedOverNumber}
                    runsInOver={lastOverRuns}
                    onConfirm={handleConfirmNextOver}
                />

                {/* Pro Mode: Player Select Modals */}
                <PlayerSelectModal
                    visible={playerSelectVisible}
                    title={playerSelectType === 'bowler' ? "Select Next Bowler" : "Select Batsman"}
                    players={playerSelectType === 'bowler' ? bowlingTeamPlayers : battingTeamPlayers}
                    onSelect={handlePlayerSelect}
                    onClose={() => setPlayerSelectVisible(false)}
                    // Exclude current bowler for consecutive overs rule, and active batsmen for batsman selection
                    excludePlayerIds={playerSelectType === 'bowler'
                        ? (currentBowler ? [currentBowler.id] : [])
                        : [...outPlayerIds, striker?.id, nonStriker?.id].filter(Boolean) as string[]
                    }
                    // Pass live stats for bowlers
                    liveStats={playerSelectType === 'bowler' ? liveBowlingStats : undefined}
                />

                {/* Win Modal (Pro Mode) */}
                <Modal
                    visible={winModalVisible}
                    transparent
                    animationType="fade"
                >
                    <View style={wicketModalStyles.overlay}>
                        <Card variant="elevated" padding="large" style={wicketModalStyles.modal}>
                            <Text style={wicketModalStyles.title}>🏆 MATCH COMPLETE</Text>
                            <Text style={[wicketModalStyles.subtitle, { color: theme.runFour || '#22C55E', fontSize: 18, fontWeight: 'bold', marginBottom: SPACING.xs }]}>
                                {matchResult?.winner} WON
                            </Text>
                            <Text style={wicketModalStyles.subtitle}>{matchResult?.margin}</Text>

                            <Button
                                title="VIEW SCORECARD"
                                onPress={() => {
                                    setWinModalVisible(false);
                                    if (currentMatch) {
                                        navigation.navigate('Scorecard', { match: currentMatch });
                                    }
                                }}
                                variant="primary"
                                size="large"
                            />
                        </Card>
                    </View>
                </Modal>
            </SafeAreaView>
        </GradientBackground>
    );
}

function getMatchScreenStyles(theme: any) {
    return StyleSheet.create({
        container: {
            flex: 1,
        },
        safeArea: {
            flex: 1,
            justifyContent: 'space-between',
        },
        errorText: {
            ...TYPOGRAPHY.h3,
            color: theme.textPrimary,
            textAlign: 'center',
            margin: SPACING.lg,
        },
        scoreboardContainer: {
            alignItems: 'center',
            paddingTop: SPACING.md,
        },
        headerTitle: {
            ...TYPOGRAPHY.h1,
            color: theme.textPrimary,
            fontSize: 32,
            marginBottom: SPACING.md,
            textShadowColor: theme.shadowColor,
            textShadowOffset: { width: 0, height: 2 },
            textShadowRadius: 4,
        },
        battingBadge: {
            backgroundColor: theme.surfaceElevated,
            paddingHorizontal: SPACING.md,
            paddingVertical: SPACING.xs,
            borderRadius: BORDER_RADIUS.round,
            marginBottom: SPACING.sm,
            borderWidth: 1,
            borderColor: theme.borderSubtle,
        },
        battingText: {
            ...TYPOGRAPHY.label,
            color: theme.textPrimary,
            fontWeight: '900',
            letterSpacing: 1,
        },
        scoreDisplay: {
            alignItems: 'center',
            marginBottom: SPACING.md,
        },
        scoreMain: {
            ...TYPOGRAPHY.score, // Use updated score variant
            fontSize: 80,
            lineHeight: 80,
            color: theme.scoreTextColor, // Always white
            textShadowColor: theme.shadowColor,
            textShadowOffset: { width: 0, height: 4 },
            textShadowRadius: 8,
        },
        oversSub: {
            ...TYPOGRAPHY.h3,
            color: theme.textSecondary,
            marginTop: SPACING.xs,
        },
        statsRow: {
            flexDirection: 'row',
            alignItems: 'center',
            backgroundColor: theme.surfaceElevated,
            borderRadius: BORDER_RADIUS.lg,
            padding: SPACING.md,
            gap: SPACING.lg,
        },
        statItem: {
            alignItems: 'center',
        },
        statValue: {
            ...TYPOGRAPHY.h2,
            color: theme.textPrimary,
            lineHeight: 32,
        },
        statLabel: {
            ...TYPOGRAPHY.label,
            color: theme.textSecondary,
        },
        statDivider: {
            width: 1,
            height: 30,
            backgroundColor: theme.borderSubtle,
        },
        freeHitContainer: {
            marginTop: SPACING.md,
            backgroundColor: theme.noBallColor, // Use theme color
            paddingHorizontal: SPACING.lg,
            paddingVertical: SPACING.xs,
            borderRadius: BORDER_RADIUS.md,
            ...SHADOWS.medium,
        },
        freeHitText: {
            color: COLORS.white, // Always white on red/accent
            fontWeight: '900',
            textTransform: 'uppercase',
        },
        spacer: {
            flex: 1,
        },
        controlsCard: {
            backgroundColor: theme.surfaceElevated,
            borderTopLeftRadius: BORDER_RADIUS.xxl,
            borderTopRightRadius: BORDER_RADIUS.xxl,
            borderBottomLeftRadius: 0,
            borderBottomRightRadius: 0,
            paddingBottom: SPACING.xl,
            ...SHADOWS.medium,
        },
        buttonRow: {
            flexDirection: 'row',
            justifyContent: 'space-between',
            marginBottom: SPACING.md,
        },
        extrasGrid: {
            marginTop: SPACING.lg,
            gap: SPACING.md,
        },
        extrasRow: {
            flexDirection: 'row',
            gap: SPACING.md,
        },
        actionButton: {
            flex: 1,
            height: 48,
            borderRadius: 12,
            paddingHorizontal: SPACING.sm,
            ...SHADOWS.soft,
        },
        actionButtonText: {
            fontSize: 12,
            fontWeight: '800',
            color: theme.buttonTextOnPastel, // Dark text for pastel buttons
            letterSpacing: 0.5,
        },
    });
}
