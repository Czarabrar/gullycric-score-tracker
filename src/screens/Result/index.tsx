import React, { useRef, useCallback, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    Share,
    Platform,
    Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import ViewShot from 'react-native-view-shot';
import RNShare from 'react-native-share';
import LottieView from 'lottie-react-native';

import { useMatchStore } from '../../store/matchStore';
import { COLORS, SPACING, TYPOGRAPHY, SHADOWS, BORDER_RADIUS } from '../../theme';
import Card from '../../components/Card';
import Button from '../../components/Button';
import { useSound } from '../../utils/soundManager';
import { RootStackParamList } from '../../navigation/types';

type ResultNavigationProp = NativeStackNavigationProp<RootStackParamList, 'Result'>;

export default function ResultScreen() {
    const navigation = useNavigation<ResultNavigationProp>();
    const { play } = useSound();
    const cardRef = useRef<ViewShot>(null);
    const lottieRef = useRef<LottieView>(null);

    // Store
    const currentMatch = useMatchStore((state) => state.currentMatch);
    const series = useMatchStore((state) => state.series);

    // Play win sound on mount
    useEffect(() => {
        // play('matchWin');
    }, [play]);

    // Clean up lottie on unmount
    useEffect(() => {
        return () => {
            // LottieView cleanup is handled internally, but we reset ref
            if (lottieRef.current) {
                lottieRef.current.reset();
            }
        };
    }, []);

    // Derived data
    const winnerTeam = React.useMemo(() => {
        if (!currentMatch || currentMatch.winner === 'tie' || currentMatch.winner === undefined) {
            return null;
        }
        return currentMatch.winner === 0 ? currentMatch.teamA : currentMatch.teamB;
    }, [currentMatch]);

    const getScoreDisplay = useCallback((inningsIndex: number) => {
        if (!currentMatch || !currentMatch.innings[inningsIndex]) return '';
        const innings = currentMatch.innings[inningsIndex];
        const oversCompleted = innings.overs.length - 1;
        const ballsInLastOver = innings.overs[innings.overs.length - 1]?.balls.filter(
            (b) => b.extras !== 'wide' && b.extras !== 'noball'
        ).length || 0;
        return `${innings.totalRuns}/${innings.wickets} (${oversCompleted}.${ballsInLastOver} ov)`;
    }, [currentMatch]);

    // Share handler
    const handleShare = useCallback(async () => {
        try {
            if (cardRef.current?.capture) {
                const uri = await cardRef.current.capture();

                await RNShare.open({
                    url: Platform.OS === 'android' ? `file://${uri}` : uri,
                    type: 'image/png',
                    title: 'Match Result - GullyTurf',
                    message: winnerTeam
                        ? `${winnerTeam.name} won the match! 🏏`
                        : 'Match Tied! 🏏',
                });
            }
        } catch (error) {
            // Fallback to basic share
            Share.share({
                message: winnerTeam
                    ? `🏆 ${winnerTeam.name} won by ${currentMatch?.winMargin}! - from GullyTurf`
                    : '🏏 Match Tied! - from GullyTurf',
            });
        }
    }, [winnerTeam, currentMatch]);

    const handleMVP = useCallback(() => {
        navigation.navigate('MVP');
    }, [navigation]);

    const handleAction = useCallback(() => {
        // If part of a series (even if just completed), go to series progress
        if (series) {
            navigation.navigate('SeriesProgress');
        } else {
            navigation.navigate('Home');
        }
    }, [navigation, series]);

    if (!currentMatch) {
        return (
            <SafeAreaView style={styles.container}>
                <Text style={styles.errorText}>No match data</Text>
                <Button title="Go Home" onPress={handleAction} variant="primary" />
            </SafeAreaView>
        );
    }

    const isTie = currentMatch.winner === 'tie';
    const isSeries = !!series;
    const isSeriesActive = series?.isActive;

    return (
        <SafeAreaView style={styles.container} edges={['top', 'bottom']}>

            <LottieView
                ref={lottieRef}
                source={require('../../assets/lottie/celebration.json')}
                autoPlay
                loop={false}
                style={styles.celebration}
                onAnimationFinish={() => {
                    // Safe callback to prevent destroy error
                }}
            />

            <View style={styles.header}>
                <Text style={styles.title}>MATCH COMPLETED</Text>
            </View>

            <View style={styles.content}>
                {/* Shareable Result Card */}
                <ViewShot
                    ref={cardRef}
                    options={{ format: 'png', quality: 0.9 }}
                >
                    <Card variant="elevated" padding="large" style={styles.resultCard}>
                        {/* Gradient background simulation */}
                        <View style={styles.cardGradient} />

                        {/* Trophy Background */}
                        <Image
                            source={require('../../assets/images/trophy_bg.png')}
                            style={styles.trophyBackground}
                            resizeMode="contain"
                        />

                        {!isTie && winnerTeam && (
                            <>
                                <Text style={styles.winnerEmoji}>🎉</Text>
                                <Text
                                    style={[
                                        styles.winnerName,
                                        { color: winnerTeam.color.primary },
                                    ]}
                                >
                                    "{winnerTeam.name}"
                                </Text>
                                <Text style={styles.wonBy}>WON BY</Text>
                                <Text style={styles.margin}>{currentMatch.winMargin}</Text>
                            </>
                        )}

                        {isTie && (
                            <>
                                <Text style={styles.winnerEmoji}>🤝</Text>
                                <Text style={styles.tieText}>MATCH TIED</Text>
                            </>
                        )}

                        <View style={styles.scoresSummary}>
                            <View style={styles.teamScore}>
                                <Text style={styles.teamScoreName}>{currentMatch.teamA.name}</Text>
                                <Text style={styles.teamScoreValue}>{getScoreDisplay(0)}</Text>
                            </View>
                            <Text style={styles.vsText}>vs</Text>
                            <View style={styles.teamScore}>
                                <Text style={styles.teamScoreName}>{currentMatch.teamB.name}</Text>
                                <Text style={styles.teamScoreValue}>
                                    {currentMatch.innings[1] ? getScoreDisplay(1) : '-'}
                                </Text>
                            </View>
                        </View>

                        {/* Series status */}
                        {series && (
                            <View style={styles.seriesStatus}>
                                <Text style={styles.seriesText}>
                                    📊 Series: {series.teamAWins} - {series.teamBWins}
                                </Text>
                            </View>
                        )}

                        <Text style={styles.branding}>🏏 GullyTurf</Text>
                    </Card>
                </ViewShot>

                <Text style={styles.shareHint}>↑ Shareable Card ↑</Text>
            </View>

            {/* Action Buttons */}
            <View style={styles.footer}>
                <View style={styles.actionRow}>
                    <Button
                        title="📤 SHARE"
                        onPress={handleShare}
                        variant="primary"
                        size="large"
                        style={styles.actionButton}
                    />
                    <Button
                        title="🌟 MVP"
                        onPress={handleMVP}
                        variant="secondary"
                        size="large"
                        style={styles.actionButton}
                    />
                </View>

                <Button
                    title={isSeries ? (isSeriesActive ? "➡️ CONTINUE SERIES" : "🏆 SERIES RESULT") : "🏠 Back to Home"}
                    onPress={handleAction}
                    variant="ghost"
                    size="medium"
                    style={styles.homeButton}
                />
            </View>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: COLORS.cream,
    },
    errorText: {
        ...TYPOGRAPHY.h3,
        color: COLORS.charcoal,
        textAlign: 'center',
        marginBottom: SPACING.lg,
    },
    celebration: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        height: 300,
        zIndex: 10,
        pointerEvents: 'none',
    },
    header: {
        alignItems: 'center',
        paddingVertical: SPACING.xl,
    },
    title: {
        ...TYPOGRAPHY.h1,
        color: COLORS.charcoal,
    },
    content: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        paddingHorizontal: SPACING.lg,
    },
    resultCard: {
        width: '100%',
        alignItems: 'center',
        backgroundColor: COLORS.white,
        overflow: 'hidden',
        // 3D Effect
        elevation: 12,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.25,
        shadowRadius: 16,
        borderRadius: BORDER_RADIUS.xl,
        borderWidth: 1,
        borderColor: 'rgba(0,0,0,0.05)',
    },
    trophyBackground: {
        position: 'absolute',
        width: 250,
        height: 250,
        opacity: 0.12,
        top: 60,
        alignSelf: 'center',
    },
    cardGradient: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        height: 120,
        backgroundColor: COLORS.skyBlue,
        opacity: 0.3,
    },
    winnerEmoji: {
        fontSize: 48,
        marginBottom: SPACING.sm,
    },
    winnerName: {
        ...TYPOGRAPHY.h1,
        fontWeight: '800',
        textAlign: 'center',
    },
    wonBy: {
        ...TYPOGRAPHY.label,
        color: COLORS.slate,
        marginTop: SPACING.sm,
    },
    margin: {
        ...TYPOGRAPHY.h2,
        color: COLORS.charcoal,
        fontWeight: '700',
    },
    tieText: {
        ...TYPOGRAPHY.h1,
        color: COLORS.charcoal,
        fontWeight: '700',
    },
    scoresSummary: {
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: SPACING.xl,
        gap: SPACING.md,
    },
    teamScore: {
        alignItems: 'center',
    },
    teamScoreName: {
        ...TYPOGRAPHY.bodySmall,
        color: COLORS.slate,
        marginBottom: SPACING.xs,
    },
    teamScoreValue: {
        ...TYPOGRAPHY.body,
        fontWeight: '600',
        color: COLORS.charcoal,
    },
    vsText: {
        ...TYPOGRAPHY.bodySmall,
        color: COLORS.slate,
    },
    seriesStatus: {
        marginTop: SPACING.lg,
        backgroundColor: COLORS.mint,
        paddingVertical: SPACING.sm,
        paddingHorizontal: SPACING.md,
        borderRadius: BORDER_RADIUS.lg,
    },
    seriesText: {
        ...TYPOGRAPHY.body,
        fontWeight: '600',
        color: COLORS.charcoal,
    },
    branding: {
        ...TYPOGRAPHY.label,
        color: COLORS.slate,
        marginTop: SPACING.lg,
    },
    shareHint: {
        ...TYPOGRAPHY.bodySmall,
        color: COLORS.slate,
        marginTop: SPACING.sm,
    },
    footer: {
        padding: SPACING.lg,
        paddingBottom: SPACING.xl,
    },
    actionRow: {
        flexDirection: 'row',
        gap: SPACING.md,
        marginBottom: SPACING.md,
    },
    actionButton: {
        flex: 1,
    },
    homeButton: {
        alignSelf: 'center',
    },
});
