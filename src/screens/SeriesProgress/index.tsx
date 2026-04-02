import React, { useCallback } from 'react';
import { View, Text, StyleSheet, Image, BackHandler, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import LottieView from 'lottie-react-native';

import { useMatchStore } from '../../store/matchStore';
import { COLORS, SPACING, TYPOGRAPHY, BORDER_RADIUS } from '../../theme';
import Card from '../../components/Card';
import Button from '../../components/Button';
import { RootStackParamList } from '../../navigation/types';

type SeriesProgressNavigationProp = NativeStackNavigationProp<RootStackParamList, 'SeriesProgress'>;

export default function SeriesProgressScreen() {
    const navigation = useNavigation<SeriesProgressNavigationProp>();

    // Store
    const series = useMatchStore((state) => state.series);
    const splitSeriesMatch = useMatchStore((state) => state.startNextSeriesMatch);
    const endSeries = useMatchStore((state) => state.endSeries);
    const teamA = useMatchStore((state) => state.teamA);
    const teamB = useMatchStore((state) => state.teamB);
    const currentMatch = useMatchStore((state) => state.currentMatch);

    // Prevent back button
    useFocusEffect(
        useCallback(() => {
            const onBackPress = () => {
                Alert.alert(
                    'Exit Series?',
                    'If you leave now, the current series progress will be lost.',
                    [
                        { text: 'Stay', style: 'cancel', onPress: () => { } },
                        {
                            text: 'Exit',
                            style: 'destructive',
                            onPress: () => {
                                endSeries();
                                navigation.navigate('Home');
                            }
                        }
                    ]
                );
                return true;
            };

            const subscription = BackHandler.addEventListener('hardwareBackPress', onBackPress);
            return () => subscription.remove();
        }, [endSeries, navigation])
    );

    const handleStartNextMatch = useCallback(() => {
        splitSeriesMatch();
        navigation.navigate('Toss');
    }, [splitSeriesMatch, navigation]);

    const handleGoHome = useCallback(() => {
        endSeries();
        navigation.navigate('Home');
    }, [endSeries, navigation]);

    if (!series) {
        return (
            <SafeAreaView style={styles.container}>
                <Text style={styles.errorText}>No active series</Text>
                <Button title="Go Home" onPress={handleGoHome} variant="primary" />
            </SafeAreaView>
        );
    }

    // Determine series status
    const matchesPlayed = series.matchIds.length + (currentMatch ? 1 : 0);
    const winsNeeded = Math.ceil(series.bestOf / 2);
    const isSeriesWon = series.teamAWins >= winsNeeded || series.teamBWins >= winsNeeded;
    const isSeriesComplete = matchesPlayed >= series.bestOf || isSeriesWon;

    // Determine winner if complete
    const seriesWinner = series.teamAWins > series.teamBWins ? teamA :
        series.teamBWins > series.teamAWins ? teamB : null;

    return (
        <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
            {isSeriesComplete && seriesWinner && (
                <LottieView
                    source={require('../../assets/lottie/celebration.json')}
                    autoPlay
                    loop={false}
                    style={styles.celebration}
                />
            )}

            <View style={styles.header}>
                <Text style={styles.title}>SERIES PROGRESS</Text>
                <Text style={styles.subtitle}>Best of {series.bestOf}</Text>
            </View>

            <View style={styles.content}>
                <Card variant="elevated" padding="large" style={styles.scoreCard}>
                    {/* Team A */}
                    <View style={styles.teamColumn}>
                        <View style={[styles.teamColorDot, { backgroundColor: teamA.color.primary }]} />
                        <Text style={styles.teamName}>{teamA.name}</Text>
                        <Text style={styles.teamWins}>{series.teamAWins}</Text>
                    </View>

                    {/* VS / Divider */}
                    <View style={styles.divider}>
                        <Text style={styles.vsText}>VS</Text>
                    </View>

                    {/* Team B */}
                    <View style={styles.teamColumn}>
                        <View style={[styles.teamColorDot, { backgroundColor: teamB.color.primary }]} />
                        <Text style={styles.teamName}>{teamB.name}</Text>
                        <Text style={styles.teamWins}>{series.teamBWins}</Text>
                    </View>
                </Card>

                {/* Match Status */}
                <View style={styles.statusContainer}>
                    {!isSeriesComplete ? (
                        <>
                            <Text style={styles.statusLabel}>NEXT UP</Text>
                            <Text style={styles.matchNumber}>Match {matchesPlayed + 1} of {series.bestOf}</Text>

                            {/* Previous Match Result Summary */}
                            {currentMatch && currentMatch.winner !== undefined && (
                                <Text style={styles.lastResult}>
                                    Last match won by {currentMatch.winner === 0 ? teamA.name : (currentMatch.winner === 1 ? teamB.name : 'Tie')}
                                </Text>
                            )}
                        </>
                    ) : (
                        <>
                            <Text style={styles.winnerLabel}>SERIES WINNER</Text>
                            {seriesWinner ? (
                                <Text style={[styles.winnerName, { color: seriesWinner.color.primary }]}>
                                    {seriesWinner.name}
                                </Text>
                            ) : (
                                <Text style={styles.winnerName}>SERIES DRAWN</Text>
                            )}
                            <Text style={styles.finalScore}>
                                Final Score: {series.teamAWins} - {series.teamBWins}
                            </Text>
                        </>
                    )}
                </View>
            </View>

            <View style={styles.footer}>
                {!isSeriesComplete ? (
                    <Button
                        title={`START MATCH ${matchesPlayed + 1}`}
                        onPress={handleStartNextMatch}
                        variant="primary"
                        size="large"
                        style={styles.mainButton}
                    />
                ) : (
                    <Button
                        title="🏆 RETURN TO HOME"
                        onPress={handleGoHome}
                        variant="primary"
                        size="large"
                        style={styles.mainButton}
                    />
                )}
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
        textAlign: 'center',
        margin: SPACING.lg,
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
        marginBottom: SPACING.xs,
    },
    subtitle: {
        ...TYPOGRAPHY.label,
        color: COLORS.slate,
        fontSize: 14,
    },
    content: {
        flex: 1,
        paddingHorizontal: SPACING.lg,
        alignItems: 'center',
        justifyContent: 'center',
    },
    scoreCard: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        width: '100%',
        backgroundColor: COLORS.white,
        borderRadius: BORDER_RADIUS.xl,
        marginBottom: SPACING.xl,
    },
    teamColumn: {
        flex: 1,
        alignItems: 'center',
        paddingVertical: SPACING.md,
    },
    teamColorDot: {
        width: 12,
        height: 12,
        borderRadius: 6,
        marginBottom: SPACING.sm,
    },
    teamName: {
        ...TYPOGRAPHY.bodySmall,
        fontWeight: '700',
        color: COLORS.slate,
        marginBottom: SPACING.xs,
        textAlign: 'center',
    },
    teamWins: {
        ...TYPOGRAPHY.h1,
        fontSize: 42,
        color: COLORS.charcoal,
    },
    divider: {
        paddingHorizontal: SPACING.md,
    },
    vsText: {
        ...TYPOGRAPHY.label,
        color: COLORS.cloud,
        fontWeight: '900',
        fontSize: 18,
    },
    statusContainer: {
        alignItems: 'center',
        marginTop: SPACING.lg,
    },
    statusLabel: {
        ...TYPOGRAPHY.label,
        color: COLORS.slate,
        marginBottom: SPACING.sm,
    },
    matchNumber: {
        ...TYPOGRAPHY.h1,
        color: COLORS.popBlue,
        marginBottom: SPACING.md,
    },
    lastResult: {
        ...TYPOGRAPHY.body,
        color: COLORS.charcoal,
        textAlign: 'center',
        opacity: 0.8,
    },
    winnerLabel: {
        ...TYPOGRAPHY.label,
        color: COLORS.slate,
        marginBottom: SPACING.sm,
    },
    winnerName: {
        ...TYPOGRAPHY.h1,
        fontSize: 32,
        textAlign: 'center',
        marginBottom: SPACING.sm,
    },
    finalScore: {
        ...TYPOGRAPHY.h3,
        color: COLORS.slate,
    },
    footer: {
        padding: SPACING.lg,
        paddingBottom: SPACING.xl,
    },
    mainButton: {
        width: '100%',
    },
});
