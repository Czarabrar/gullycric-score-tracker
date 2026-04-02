
import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { COLORS, SPACING, TYPOGRAPHY, BORDER_RADIUS } from '../theme';
import Card from './Card';
import { Player } from '../store/matchStore';
import { useAppTheme } from '../hooks/useAppTheme';

interface PlayersListCardProps {
    teamAName: string;
    teamBName: string;
    teamAPlayers: Player[];
    teamBPlayers: Player[];
    teamAColor: string;
    teamBColor: string;
}

const PlayersListCard: React.FC<PlayersListCardProps> = ({
    teamAName,
    teamBName,
    teamAPlayers,
    teamBPlayers,
    teamAColor,
    teamBColor,
}) => {
    const theme = useAppTheme();

    // Determine max length to align rows
    const maxLength = Math.max(teamAPlayers.length, teamBPlayers.length);
    const rows = Array.from({ length: maxLength }, (_, i) => i);

    return (
        <Card variant="elevated" padding="medium" style={styles.container}>
            <View style={[styles.headerRow, { borderBottomColor: theme.borderSubtle }]}>
                <View style={styles.teamHeader}>
                    {/* Team Color Dot */}
                    <View style={{ width: 12, height: 12, borderRadius: 6, backgroundColor: teamAColor, marginRight: 6 }} />
                    <Text style={[styles.teamName, { color: theme.textPrimary }]} numberOfLines={1}>
                        {teamAName}
                    </Text>
                    <Text style={[styles.playerCount, { color: theme.textSecondary, backgroundColor: theme.runNeutral }]}>{teamAPlayers.length}</Text>
                </View>
                <View style={[styles.divider, { backgroundColor: theme.borderSubtle }]} />
                <View style={styles.teamHeader}>
                    {/* Team Color Dot */}
                    <View style={{ width: 12, height: 12, borderRadius: 6, backgroundColor: teamBColor, marginRight: 6 }} />
                    <Text style={[styles.teamName, { color: theme.textPrimary }]} numberOfLines={1}>
                        {teamBName}
                    </Text>
                    <Text style={[styles.playerCount, { color: theme.textSecondary, backgroundColor: theme.runNeutral }]}>{teamBPlayers.length}</Text>
                </View>
            </View>

            <ScrollView style={styles.scrollContainer} nestedScrollEnabled>
                {rows.map((rowIndex) => {
                    const playerA = teamAPlayers[rowIndex];
                    const playerB = teamBPlayers[rowIndex];

                    return (
                        <View key={rowIndex} style={styles.playerRow}>
                            <View style={styles.playerCell}>
                                {playerA && (
                                    <Text style={[styles.playerName, { color: theme.textPrimary }]} numberOfLines={1}>
                                        {rowIndex + 1}. {playerA.name}
                                    </Text>
                                )}
                            </View>
                            <View style={[styles.centerDivider, { backgroundColor: theme.borderSubtle }]} />
                            <View style={styles.playerCell}>
                                {playerB && (
                                    <Text style={[styles.playerName, { color: theme.textPrimary }]} numberOfLines={1}>
                                        {rowIndex + 1}. {playerB.name}
                                    </Text>
                                )}
                            </View>
                        </View>
                    );
                })}
                {rows.length === 0 && (
                    <Text style={[styles.emptyText, { color: theme.textSecondary }]}>No players added yet</Text>
                )}
            </ScrollView>
        </Card>
    );
};

const styles = StyleSheet.create({
    container: {
        maxHeight: 250, // Limit height
        width: '100%',
    },
    headerRow: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingBottom: SPACING.sm,
        borderBottomWidth: 1,
        borderBottomColor: COLORS.lightBorder, // Fallback
        marginBottom: SPACING.xs,
    },
    teamHeader: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: SPACING.xs,
    },
    divider: {
        width: 1,
        height: '100%',
        backgroundColor: COLORS.lightBorder, // Fallback
    },
    teamName: {
        ...TYPOGRAPHY.label,
        fontWeight: 'bold',
        maxWidth: '70%',
    },
    playerCount: {
        ...TYPOGRAPHY.label,
        color: COLORS.lightTextSecondary, // Fallback
        backgroundColor: COLORS.lightBorder, // Fallback
        paddingHorizontal: 6,
        paddingVertical: 2,
        borderRadius: 8,
        fontSize: 10,
        overflow: 'hidden',
    },
    scrollContainer: {
        maxHeight: 180,
    },
    playerRow: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 4,
    },
    playerCell: {
        flex: 1,
        paddingHorizontal: SPACING.xs,
    },
    centerDivider: {
        width: 1,
        height: '100%',
        backgroundColor: COLORS.lightBorder, // Fallback
    },
    playerName: {
        ...TYPOGRAPHY.bodySmall,
        color: COLORS.lightTextPrimary, // Fallback
        fontSize: 12,
    },
    emptyText: {
        ...TYPOGRAPHY.bodySmall,
        color: COLORS.lightTextSecondary, // Fallback
        textAlign: 'center',
        padding: SPACING.md,
        fontStyle: 'italic',
    },
});

export default PlayersListCard;
