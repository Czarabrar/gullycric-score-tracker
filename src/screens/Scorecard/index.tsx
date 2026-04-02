import React, { useMemo, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Share, Platform, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useRoute } from '@react-navigation/native';
import ViewShot from 'react-native-view-shot';
import RNShare from 'react-native-share';
import { useMatchStore } from '../../store/matchStore';
import { getMatchStats, DetailedPlayerStats, TeamStats } from '../../utils/statsCalculator';
import { COLORS, SPACING, TYPOGRAPHY, BORDER_RADIUS, SHADOWS } from '../../theme';
import GradientBackground from '../../components/GradientBackground';
import Button from '../../components/Button';
import Card from '../../components/Card';

export default function ScorecardScreen() {
    const navigation = useNavigation();
    const route = useRoute();
    const viewShotRef = React.useRef<ViewShot>(null);

    // Support passing match via params (History) or use currentMatch
    const paramsMatch = (route.params as any)?.match;
    const currentMatch = useMatchStore(state => state.currentMatch);
    const match = paramsMatch || currentMatch;

    const [activeTab, setActiveTab] = useState<0 | 1>(0);

    const stats = useMemo(() => {
        if (!match) return null;
        return getMatchStats(match);
    }, [match]);

    if (!match || !stats) {
        return (
            <SafeAreaView style={styles.container}>
                <Text>No match data available</Text>
                <Button title="Back" onPress={() => navigation.goBack()} />
            </SafeAreaView>
        );
    }

    const handleShare = React.useCallback(async () => {
        try {
            if (viewShotRef.current?.capture) {
                const uri = await viewShotRef.current.capture();
                await RNShare.open({
                    url: Platform.OS === 'android' ? `file://${uri}` : uri,
                    type: 'image/png',
                    title: 'Match Scorecard - GullyTurf',
                    message: `Match Result: ${stats.teamA.totalRuns}/${stats.teamA.wicketsLost} vs ${stats.teamB.totalRuns}/${stats.teamB.wicketsLost}`,
                });
            }
        } catch (error) {
            console.log('Share error:', error);
        }
    }, [stats]);

    const activeTeamStats = activeTab === 0 ? stats.teamA : stats.teamB;
    const isTeamA = activeTab === 0;

    const renderBattingTable = (teamStats: TeamStats) => {
        const topScorer = [...teamStats.players].sort((a, b) => b.runs - a.runs)[0];

        return (
            <View style={styles.tableContainer}>
                <View style={styles.tableHeader}>
                    <Text style={[styles.colName, { flex: 3 }]}>BATTER</Text>
                    <Text style={styles.colStat}>R</Text>
                    <Text style={styles.colStat}>B</Text>
                    <Text style={styles.colStat}>4s</Text>
                    <Text style={styles.colStat}>6s</Text>
                    <Text style={[styles.colStat, { flex: 1.5 }]}>SR</Text>
                </View>
                {teamStats.players.filter(p => p.balls > 0 || p.isBatting || p.status === 'out').map((player, index) => {
                    const isTop = topScorer && player.runs === topScorer.runs && player.runs > 0;
                    return (
                        <View key={player.id} style={[styles.tableRow, index % 2 === 1 && styles.tableRowAlt]}>
                            <View style={{ flex: 3 }}>
                                <Text style={[styles.cellName, player.isBatting && styles.activeText]}>
                                    {player.name} {player.isBatting ? '*' : ''} {isTop ? '👑' : ''}
                                </Text>
                                <Text style={styles.cellDesc}>{player.status === 'out' ? player.dismissal : player.status === 'notout' ? 'not out' : ''}</Text>
                            </View>
                            <Text style={[styles.cellStat, styles.boldStat]}>{player.runs}</Text>
                            <Text style={styles.cellStat}>{player.balls}</Text>
                            <Text style={styles.cellStat}>{player.fours}</Text>
                            <Text style={styles.cellStat}>{player.sixes}</Text>
                            <Text style={[styles.cellStat, { flex: 1.5 }]}>{player.strikeRate}</Text>
                        </View>
                    );
                })}
                {/* Extras Row */}
                <View style={styles.extrasRow}>
                    <Text style={styles.extrasLabel}>Extras</Text>
                    <Text style={styles.extrasValue}>{teamStats.extras}</Text>
                </View>
                {/* Total Row */}
                <View style={styles.totalRow}>
                    <Text style={styles.totalLabel}>TOTAL</Text>
                    <Text style={styles.totalValue}>{teamStats.totalRuns}/{teamStats.wicketsLost}</Text>
                    <Text style={styles.totalOvers}>({teamStats.oversPlayed} ov)</Text>
                </View>
            </View>
        );
    };

    const renderBowlingTable = (bowlingTeamStats: TeamStats) => {
        // We need the bowling stats of the ACTIVE tab's opponent.
        // Or rather, we want to show the bowling stats of the team that bowled AGAINST the active batting team.
        // In this screen, Tab A usually shows Team A's batting card.
        // So we show Team B's bowling stats here.

        const opponentStats = isTeamA ? stats!.teamB : stats!.teamA;
        const bestBowler = [...opponentStats.players].sort((a, b) => {
            if (b.wickets !== a.wickets) return b.wickets - a.wickets;
            return a.runsConceded - b.runsConceded; // Fewer runs is better
        })[0];

        return (
            <View style={styles.tableContainer}>
                <View style={[styles.tableHeader, { backgroundColor: COLORS.cloud, borderTopWidth: 1, borderColor: COLORS.white }]}>
                    <Text style={[styles.colName, { flex: 3 }]}>BOWLER</Text>
                    <Text style={styles.colStat}>O</Text>
                    <Text style={styles.colStat}>M</Text>
                    <Text style={styles.colStat}>R</Text>
                    <Text style={styles.colStat}>W</Text>
                    <Text style={[styles.colStat, { flex: 1.5 }]}>ECO</Text>
                </View>
                {opponentStats.players.filter(p => p.ballsBowled > 0).map((player, index) => {
                    const isBest = bestBowler && player.wickets === bestBowler.wickets && player.runsConceded === bestBowler.runsConceded && player.wickets > 0;
                    return (
                        <View key={player.id} style={[styles.tableRow, index % 2 === 1 && styles.tableRowAlt]}>
                            <Text style={[styles.cellName, { flex: 3 }]}>
                                {player.name} {isBest ? '⭐' : ''}
                            </Text>
                            <Text style={styles.cellStat}>{player.overs}</Text>
                            <Text style={styles.cellStat}>{player.maidens}</Text>
                            <Text style={styles.cellStat}>{player.runsConceded}</Text>
                            <Text style={[styles.cellStat, styles.boldStat]}>{player.wickets}</Text>
                            <Text style={[styles.cellStat, { flex: 1.5 }]}>{player.economy}</Text>
                        </View>
                    );
                })}
            </View>
        );
    };

    return (
        <GradientBackground variant="neutral" style={styles.container}>
            <SafeAreaView style={styles.safeArea}>
                {/* Header */}
                <View style={styles.header}>
                    <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                        <Text style={styles.backButtonText}>←</Text>
                    </TouchableOpacity>
                    <Text style={styles.headerTitle}>SCORECARD</Text>
                    <View style={{ width: 40 }} />
                </View>

                {/* Match Result Header */}
                {match.status === 'completed' && match.winner !== undefined && (
                    <View style={styles.resultContainer}>
                        <Text style={styles.resultText}>
                            {match.winner === 'tie'
                                ? "MATCH TIED"
                                : `${match.winner === 0 ? match.teamA.name : match.teamB.name} WON BY ${match.winMargin?.toUpperCase() || ''}`
                            }
                        </Text>
                    </View>
                )}

                {/* Tabs */}
                <View style={styles.tabsContainer}>
                    <TouchableOpacity
                        style={[styles.tab, activeTab === 0 && styles.activeTab]}
                        onPress={() => setActiveTab(0)}
                    >
                        <Text style={[styles.tabText, activeTab === 0 && styles.activeTabText]}>
                            {stats.teamA.teamName.toUpperCase()}
                        </Text>
                        <Text style={[styles.tabScore, activeTab === 0 && styles.activeTabText]}>
                            {stats.teamA.totalRuns}/{stats.teamA.wicketsLost}
                        </Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                        style={[styles.tab, activeTab === 1 && styles.activeTab]}
                        onPress={() => setActiveTab(1)}
                    >
                        <Text style={[styles.tabText, activeTab === 1 && styles.activeTabText]}>
                            {stats.teamB.teamName.toUpperCase()}
                        </Text>
                        <Text style={[styles.tabScore, activeTab === 1 && styles.activeTabText]}>
                            {stats.teamB.totalRuns}/{stats.teamB.wicketsLost}
                        </Text>
                    </TouchableOpacity>
                </View>

                <ScrollView contentContainerStyle={styles.scrollContent}>
                    <ViewShot ref={viewShotRef} options={{ format: 'png', quality: 0.9 }} style={{ backgroundColor: COLORS.white }}>
                        {/* MVP Card */}
                        <Card variant="elevated" padding="medium" style={styles.mvpCard}>
                            <View style={styles.mvpHeader}>
                                <Text style={styles.mvpTitle}>👑 MAN OF THE MATCH</Text>
                            </View>
                            <View style={styles.mvpContent}>
                                <Text style={styles.mvpName}>{stats.mvp.name}</Text>
                                <View style={styles.mvpStatsRow}>
                                    <View style={styles.mvpStatItem}>
                                        <Text style={styles.mvpStatValue}>{stats.mvp.runs}</Text>
                                        <Text style={styles.mvpStatLabel}>RUNS</Text>
                                    </View>
                                    <View style={styles.mvpStatItem}>
                                        <Text style={styles.mvpStatValue}>{stats.mvp.wickets}</Text>
                                        <Text style={styles.mvpStatLabel}>WICKETS</Text>
                                    </View>
                                    <View style={styles.mvpStatItem}>
                                        <Text style={styles.mvpStatValue}>{stats.mvp.mvpPoints}</Text>
                                        <Text style={styles.mvpStatLabel}>POINTS</Text>
                                    </View>
                                </View>
                            </View>
                        </Card>

                        <Card variant="elevated" padding="none" style={styles.card}>
                            {renderBattingTable(activeTeamStats)}
                            {renderBowlingTable(activeTeamStats)}
                        </Card>
                    </ViewShot>

                    <Button
                        title="SHARE MATCH"
                        onPress={handleShare}
                        variant="primary"
                        style={{ marginTop: SPACING.lg }}
                        icon="share"
                    />
                </ScrollView>

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
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: SPACING.md,
        paddingVertical: SPACING.sm,
    },
    headerTitle: {
        ...TYPOGRAPHY.h3,
        color: COLORS.charcoal,
    },
    backButton: {
        padding: SPACING.sm,
    },
    backButtonText: {
        fontSize: 24,
        color: COLORS.charcoal,
    },
    tabsContainer: {
        flexDirection: 'row',
        marginHorizontal: SPACING.md,
        marginBottom: SPACING.md,
        backgroundColor: COLORS.cloud,
        borderRadius: BORDER_RADIUS.md,
        padding: 4,
    },
    tab: {
        flex: 1,
        paddingVertical: SPACING.sm,
        alignItems: 'center',
        borderRadius: BORDER_RADIUS.sm,
    },
    activeTab: {
        backgroundColor: COLORS.white,
        ...SHADOWS.soft,
    },
    tabText: {
        ...TYPOGRAPHY.label,
        color: COLORS.slate,
    },
    tabScore: {
        ...TYPOGRAPHY.h3,
        fontSize: 16,
        color: COLORS.slate,
    },
    activeTabText: {
        color: COLORS.popBlue,
    },
    scrollContent: {
        padding: SPACING.md,
        paddingBottom: SPACING.xl,
    },
    card: {
        overflow: 'hidden',
    },
    tableContainer: {
        paddingBottom: SPACING.md,
    },
    tableHeader: {
        flexDirection: 'row',
        backgroundColor: COLORS.skyBlue, // Or team color?
        paddingVertical: SPACING.sm,
        paddingHorizontal: SPACING.sm,
        borderBottomWidth: 1,
        borderBottomColor: COLORS.white,
    },
    colName: {
        ...TYPOGRAPHY.label,
        color: COLORS.charcoal,
    },
    colStat: {
        ...TYPOGRAPHY.label,
        flex: 1,
        textAlign: 'center',
        color: COLORS.charcoal,
    },
    tableRow: {
        flexDirection: 'row',
        paddingVertical: SPACING.sm,
        paddingHorizontal: SPACING.sm,
        alignItems: 'center',
        borderBottomWidth: 1,
        borderBottomColor: COLORS.cloud,
    },
    tableRowAlt: {
        backgroundColor: 'rgba(0,0,0,0.02)',
    },
    cellName: {
        ...TYPOGRAPHY.bodySmall,
        fontWeight: '600',
        color: COLORS.charcoal,
    },
    cellDesc: {
        fontSize: 10,
        color: COLORS.slate,
    },
    cellStat: {
        ...TYPOGRAPHY.bodySmall,
        flex: 1,
        textAlign: 'center',
        color: COLORS.slate,
    },
    boldStat: {
        fontWeight: 'bold',
        color: COLORS.charcoal,
    },
    activeText: {
        color: COLORS.popBlue,
        fontWeight: 'bold',
    },
    extrasRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        padding: SPACING.sm,
        borderBottomWidth: 1,
        borderBottomColor: COLORS.cloud,
    },
    extrasLabel: {
        ...TYPOGRAPHY.bodySmall,
        fontWeight: 'bold',
    },
    extrasValue: {
        ...TYPOGRAPHY.bodySmall,
    },
    totalRow: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: SPACING.sm,
        backgroundColor: COLORS.cloud,
    },
    totalLabel: {
        ...TYPOGRAPHY.h3,
        fontSize: 16,
        flex: 1,
    },
    totalValue: {
        ...TYPOGRAPHY.h3,
        fontSize: 16,
        marginRight: SPACING.sm,
    },
    totalOvers: {
        ...TYPOGRAPHY.bodySmall,
        color: COLORS.slate,
    },
    mvpCard: {
        marginBottom: SPACING.md,
        backgroundColor: COLORS.cream, // Highlight background
    },
    mvpHeader: {
        alignItems: 'center',
        marginBottom: SPACING.sm,
    },
    mvpTitle: {
        ...TYPOGRAPHY.label,
        color: COLORS.popOrange,
        fontSize: 12,
        letterSpacing: 1.5,
    },
    mvpContent: {
        alignItems: 'center',
    },
    mvpName: {
        ...TYPOGRAPHY.h2,
        color: COLORS.charcoal,
        marginBottom: SPACING.sm,
    },
    mvpStatsRow: {
        flexDirection: 'row',
        gap: SPACING.xl,
    },
    mvpStatItem: {
        alignItems: 'center',
    },
    mvpStatValue: {
        ...TYPOGRAPHY.h3,
        color: COLORS.charcoal,
    },
    mvpStatLabel: {
        ...TYPOGRAPHY.label,
        fontSize: 10,
        color: COLORS.slate,
    },
    resultContainer: {
        alignItems: 'center',
        marginBottom: SPACING.md,
        paddingHorizontal: SPACING.md,
    },
    resultText: {
        ...TYPOGRAPHY.h3,
        color: COLORS.popGreen,
        textAlign: 'center',
        fontSize: 18,
    },
});
