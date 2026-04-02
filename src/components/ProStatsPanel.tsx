import React, { memo, useMemo } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Player, Innings } from '../store/matchStore';
import { COLORS, SPACING, TYPOGRAPHY, BORDER_RADIUS, SHADOWS } from '../theme';

interface ProStatsPanelProps {
    striker: Player | null;
    nonStriker: Player | null;
    bowler: Player | null;
    currentBowlerIndex?: number;
    innings: Innings | null;
}

const ProStatsPanel: React.FC<ProStatsPanelProps> = memo(({
    striker,
    nonStriker,
    bowler,
    currentBowlerIndex,
    innings
}) => {
    // Helper to format Overs (e.g. 1.3)
    const getBowlerStats = useMemo(() => {
        if (!bowler || !innings || currentBowlerIndex === undefined) return { overs: '0.0', runs: 0, wickets: 0 };

        let legalBalls = 0;
        let runsConceded = 0;
        let wicketsTaken = 0;

        innings.overs.forEach(over => {
            if (over.bowlerIndex === currentBowlerIndex) {
                over.balls.forEach(ball => {
                    // Count legal balls for overs
                    if (ball.extras !== 'wide' && ball.extras !== 'noball') {
                        legalBalls++;
                    }

                    // Runs Conceded (Bat run + Wide/NB extra)
                    // Note: Byes/Legbyes don't count against bowler, but here we simplify
                    // Store logic: 
                    // const extraRun = (event.extras === 'wide' || event.extras === 'noball') ? (event.isGullyExtra ? 0 : 1) : 0;
                    // stats.runsConceded += event.runs + extraRun;
                    // We should rely on the stored stats if possible, but recalculating ensures sync
                });
            }
        });

        // Use stored stats for reliability if available, else fallback to calc
        if (bowler.stats) {
            runsConceded = bowler.stats.runsConceded;
            wicketsTaken = bowler.stats.wickets;
        }

        const completedOvers = Math.floor(legalBalls / 6);
        const ballsInCurrent = legalBalls % 6;

        return {
            overs: `${completedOvers}.${ballsInCurrent}`,
            runs: runsConceded,
            wickets: wicketsTaken
        };

    }, [bowler, innings, currentBowlerIndex]);


    const renderBatsmanRow = (player: Player | null, isStriker: boolean) => {
        if (!player) return <Text style={styles.placeholderText}>Select Batsman</Text>;

        const runs = player.stats?.runs || 0;
        const balls = player.stats?.balls || 0;
        const sr = balls > 0 ? ((runs / balls) * 100).toFixed(0) : '0';
        const fours = player.stats?.fours || 0;
        const sixes = player.stats?.sixes || 0;

        return (
            <View style={[styles.playerRow, isStriker && styles.activePlayerRow]}>
                <View style={styles.nameContainer}>
                    {isStriker && <Text style={styles.strikerIndicator}>★</Text>}
                    <Text style={[styles.playerName, isStriker && styles.activeText]} numberOfLines={1}>
                        {player.name}
                    </Text>
                </View>
                <View style={styles.battingStats}>
                    <Text style={[styles.statText, isStriker && styles.activeText]}>
                        <Text style={styles.mainStat}>{runs}</Text>
                        <Text style={styles.subStat}>({balls})</Text>
                    </Text>
                    {/* Compact: Hide 4s/6s/SR on very small screens or show lightly */}
                    <View style={styles.secondaryStats}>
                        <Text style={styles.microStat}>Sr:{sr}</Text>
                    </View>
                </View>
            </View>
        );
    };

    if (!striker && !nonStriker && !bowler) return null;

    return (
        <View style={styles.container}>
            {/* Batting Section */}
            <View style={styles.battingSection}>
                {renderBatsmanRow(striker, true)}
                <View style={styles.divider} />
                {renderBatsmanRow(nonStriker, false)}
            </View>

            {/* Bowling Section */}
            <View style={styles.bowlingSection}>
                {bowler ? (
                    <View style={styles.bowlerRow}>
                        <View style={styles.nameContainer}>
                            <Text style={styles.bowlerIcon}>⚾</Text>
                            <Text style={styles.playerName} numberOfLines={1}>{bowler.name}</Text>
                        </View>
                        <View style={styles.bowlingStats}>
                            <Text style={styles.bowlerMainStat}>
                                {getBowlerStats.wickets}-{getBowlerStats.runs}
                            </Text>
                            <Text style={styles.bowlerSubStat}>
                                ({getBowlerStats.overs})
                            </Text>
                        </View>
                    </View>
                ) : (
                    <Text style={styles.placeholderText}>Select Bowler</Text>
                )}
            </View>
        </View>
    );
});

const styles = StyleSheet.create({
    container: {
        backgroundColor: 'rgba(0,0,0,0.4)', // Semi-transparent dark overlay
        borderRadius: BORDER_RADIUS.lg,
        padding: SPACING.sm,
        marginTop: SPACING.sm,
        width: '100%',
    },
    battingSection: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        paddingBottom: SPACING.xs,
        borderBottomWidth: 1,
        borderBottomColor: 'rgba(255,255,255,0.15)',
        marginBottom: SPACING.xs,
    },
    divider: {
        width: 1,
        backgroundColor: 'rgba(255,255,255,0.15)',
        marginHorizontal: SPACING.xs,
    },
    playerRow: {
        flex: 1,
        flexDirection: 'column', // Stack Name and Stats
        alignItems: 'flex-start',
        paddingHorizontal: SPACING.xs,
        opacity: 0.7,
    },
    activePlayerRow: {
        opacity: 1,
    },
    nameContainer: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    strikerIndicator: {
        color: COLORS.popYellow,
        fontSize: 12,
        marginRight: 4,
    },
    playerName: {
        ...TYPOGRAPHY.label,
        color: COLORS.white,
        fontSize: 13,
        fontWeight: '600',
    },
    activeText: {
        color: COLORS.white,
        fontWeight: '800',
    },
    battingStats: {
        flexDirection: 'row',
        alignItems: 'baseline',
        gap: 6,
        marginTop: 2,
    },
    statText: {
        color: COLORS.white,
    },
    mainStat: {
        fontWeight: '900',
        fontSize: 16,
    },
    subStat: {
        fontSize: 12,
        fontWeight: '400',
        color: 'rgba(255,255,255,0.8)',
    },
    secondaryStats: {
        marginLeft: 4,
    },
    microStat: {
        fontSize: 10,
        color: 'rgba(255,255,255,0.6)',
    },

    // Bowler
    bowlingSection: {
        paddingTop: SPACING.xs,
        paddingHorizontal: SPACING.xs,
    },
    bowlerRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    bowlerIcon: {
        fontSize: 12,
        marginRight: 6,
    },
    bowlingStats: {
        flexDirection: 'row',
        alignItems: 'baseline',
        gap: 6,
    },
    bowlerMainStat: {
        ...TYPOGRAPHY.h3,
        color: COLORS.white,
        fontSize: 16,
    },
    bowlerSubStat: {
        fontSize: 12,
        color: 'rgba(255,255,255,0.8)',
    },
    placeholderText: {
        ...TYPOGRAPHY.bodySmall,
        color: 'rgba(255,255,255,0.4)',
        fontStyle: 'italic',
    },
});

export default ProStatsPanel;
