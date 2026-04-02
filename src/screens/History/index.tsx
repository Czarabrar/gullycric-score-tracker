// History Screen - Match History Display
import React, { useCallback, memo } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { FlashList } from '@shopify/flash-list';

import { useMatchStore, Match } from '../../store/matchStore';
import { COLORS, SPACING, TYPOGRAPHY, SHADOWS, BORDER_RADIUS } from '../../theme';
import Card from '../../components/Card';
import Button from '../../components/Button';
import { RootStackParamList } from '../../navigation/types';

type HistoryNavigationProp = NativeStackNavigationProp<RootStackParamList, 'History'>;

// Match Card Component
interface MatchCardProps {
    match: Match;
}

const MatchCard: React.FC<MatchCardProps> = memo(({ match }) => {
    const formatDate = (timestamp: number) => {
        const date = new Date(timestamp);
        return date.toLocaleDateString('en-IN', {
            day: 'numeric',
            month: 'short',
            year: 'numeric',
        });
    };

    const getScoreSummary = () => {
        if (!match.innings || match.innings.length === 0) return 'N/A';

        const firstInnings = match.innings[0];
        const secondInnings = match.innings[1];

        let summary = `${firstInnings.totalRuns}/${firstInnings.wickets}`;
        if (secondInnings) {
            summary += ` vs ${secondInnings.totalRuns}/${secondInnings.wickets}`;
        }
        return summary;
    };

    const getWinnerText = () => {
        if (match.winner === 'tie') return '🤝 Match Tied';
        if (match.winner === 0) return `🏆 ${match.teamA.name} won by ${match.winMargin}`;
        if (match.winner === 1) return `🏆 ${match.teamB.name} won by ${match.winMargin}`;
        return 'Match Incomplete';
    };

    return (
        <Card variant="elevated" padding="medium" style={styles.matchCard}>
            <View style={styles.matchHeader}>
                <Text style={styles.matchDate}>{formatDate(match.createdAt)}</Text>
                <Text style={styles.matchOvers}>{match.totalOvers} overs</Text>
            </View>

            <View style={styles.teamsRow}>
                <View style={[styles.teamBadge, { backgroundColor: match.teamA.color.primary }]}>
                    <Text style={styles.teamBadgeText}>{match.teamA.name}</Text>
                </View>
                <Text style={styles.vsText}>vs</Text>
                <View style={[styles.teamBadge, { backgroundColor: match.teamB.color.primary }]}>
                    <Text style={styles.teamBadgeText}>{match.teamB.name}</Text>
                </View>
            </View>

            <Text style={styles.scoreText}>{getScoreSummary()}</Text>
            <Text style={styles.winnerText}>{getWinnerText()}</Text>
        </Card>
    );
});

// Main History Screen
export default function HistoryScreen() {
    const navigation = useNavigation<HistoryNavigationProp>();
    const matchHistory = useMatchStore((state) => state.matchHistory);
    const clearHistory = useMatchStore((state) => state.clearHistory);

    const handleClearHistory = useCallback(() => {
        clearHistory();
    }, [clearHistory]);

    const handleBack = useCallback(() => {
        navigation.goBack();
    }, [navigation]);

    const renderMatchItem = useCallback(({ item }: { item: Match }) => (
        <MatchCard match={item} />
    ), []);

    // Sort by most recent first
    const sortedHistory = [...matchHistory].sort((a, b) => b.createdAt - a.createdAt);

    return (
        <SafeAreaView style={styles.container} edges={['top']}>
            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity onPress={handleBack} style={styles.backButton}>
                    <Text style={styles.backIcon}>←</Text>
                </TouchableOpacity>
                <Text style={styles.title}>📋 Match History</Text>
                <View style={styles.placeholder} />
            </View>

            {/* Content */}
            {sortedHistory.length === 0 ? (
                <View style={styles.emptyContainer}>
                    <Text style={styles.emptyIcon}>🏏</Text>
                    <Text style={styles.emptyTitle}>No Matches Yet</Text>
                    <Text style={styles.emptySubtitle}>
                        Play your first match to see history here
                    </Text>
                    <Button
                        title="Start Playing"
                        onPress={handleBack}
                        variant="primary"
                        style={styles.startButton}
                    />
                </View>
            ) : (
                <>
                    <FlashList
                        data={sortedHistory}
                        renderItem={renderMatchItem}
                        contentContainerStyle={styles.listContent}
                        keyExtractor={(item) => item.id}
                    />
                    <View style={styles.footer}>
                        <Button
                            title="🗑️ Clear History"
                            onPress={handleClearHistory}
                            variant="ghost"
                            size="medium"
                        />
                    </View>
                </>
            )}
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: COLORS.cream,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: SPACING.md,
        paddingVertical: SPACING.md,
    },
    backButton: {
        padding: SPACING.sm,
    },
    backIcon: {
        fontSize: 24,
        color: COLORS.charcoal,
    },
    title: {
        ...TYPOGRAPHY.h3,
        color: COLORS.charcoal,
    },
    placeholder: {
        width: 40,
    },
    emptyContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: SPACING.xl,
    },
    emptyIcon: {
        fontSize: 64,
        marginBottom: SPACING.md,
    },
    emptyTitle: {
        ...TYPOGRAPHY.h3,
        color: COLORS.charcoal,
        marginBottom: SPACING.sm,
    },
    emptySubtitle: {
        ...TYPOGRAPHY.body,
        color: COLORS.slate,
        textAlign: 'center',
        marginBottom: SPACING.lg,
    },
    startButton: {
        minWidth: 150,
    },
    listContent: {
        padding: SPACING.md,
    },
    matchCard: {
        marginBottom: SPACING.md,
    },
    matchHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: SPACING.sm,
    },
    matchDate: {
        ...TYPOGRAPHY.label,
        color: COLORS.slate,
    },
    matchOvers: {
        ...TYPOGRAPHY.label,
        color: COLORS.slate,
    },
    teamsRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: SPACING.sm,
        gap: SPACING.sm,
    },
    teamBadge: {
        paddingHorizontal: SPACING.md,
        paddingVertical: SPACING.xs,
        borderRadius: BORDER_RADIUS.md,
    },
    teamBadgeText: {
        ...TYPOGRAPHY.body,
        color: COLORS.white,
        fontWeight: '600',
    },
    vsText: {
        ...TYPOGRAPHY.bodySmall,
        color: COLORS.slate,
    },
    scoreText: {
        ...TYPOGRAPHY.body,
        color: COLORS.charcoal,
        textAlign: 'center',
        fontWeight: '600',
        marginBottom: SPACING.xs,
    },
    winnerText: {
        ...TYPOGRAPHY.bodySmall,
        color: COLORS.steelBlue,
        textAlign: 'center',
        fontWeight: '500',
    },
    footer: {
        padding: SPACING.md,
        alignItems: 'center',
    },
});
