
import React, { useState, useCallback, useMemo } from 'react';
import {
    View,
    Text,
    StyleSheet,
    FlatList,
    TextInput,
    TouchableOpacity,
    Alert,
    KeyboardAvoidingView,
    Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import Ionicons from 'react-native-vector-icons/Ionicons';

import { useMatchStore, Player } from '../../store/matchStore';
import { COLORS, SPACING, TYPOGRAPHY, BORDER_RADIUS, SHADOWS } from '../../theme';
import { useAppTheme } from '../../hooks/useAppTheme';
import GradientBackground from '../../components/GradientBackground';
import Card from '../../components/Card';
import { RootStackParamList } from '../../navigation/types';

type PlayerSelectionRouteProp = RouteProp<RootStackParamList, 'PlayerSelection'>;

export default function PlayerSelectionScreen() {
    const navigation = useNavigation();
    const route = useRoute<PlayerSelectionRouteProp>();
    const { team } = route.params;

    const theme = useAppTheme();
    const styles = useMemo(() => getStyles(theme), [theme]);

    const teamData = useMatchStore((state) => (team === 'A' ? state.teamA : state.teamB));
    const setTeam = useMatchStore((state) => (team === 'A' ? state.setTeamA : state.setTeamB));

    const [newPlayerName, setNewPlayerName] = useState('');

    const handleAddPlayer = useCallback(() => {
        if (!newPlayerName.trim()) return;

        const newPlayer: Player = {
            id: Date.now().toString(),
            name: newPlayerName.trim(),
            isCaptain: false,
            isWicketKeeper: false,
            stats: {
                runs: 0,
                balls: 0,
                fours: 0,
                sixes: 0,
                wickets: 0,
                overs: 0,
                maidens: 0,
                runsConceded: 0,
            },
        };

        const updatedPlayers = [...teamData.players, newPlayer];
        setTeam({ players: updatedPlayers });
        setNewPlayerName('');
    }, [newPlayerName, teamData.players, setTeam]);

    const handleDeletePlayer = useCallback((playerId: string) => {
        Alert.alert(
            'Remove Player',
            'Are you sure you want to remove this player?',
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Remove',
                    style: 'destructive',
                    onPress: () => {
                        const updatedPlayers = teamData.players.filter((p) => p.id !== playerId);
                        setTeam({ players: updatedPlayers });
                    },
                },
            ]
        );
    }, [teamData.players, setTeam]);

    const renderPlayerItem = ({ item, index }: { item: Player; index: number }) => (
        <Card variant="elevated" padding="small" style={styles.playerCard}>
            <View style={styles.playerInfo}>
                <Text style={styles.playerIndex}>{index + 1}.</Text>
                <Text style={styles.playerName}>{item.name}</Text>
            </View>
            <TouchableOpacity
                onPress={() => handleDeletePlayer(item.id)}
                style={styles.deleteButton}
            >
                <Ionicons name="close" size={18} color={theme.runWicket} />
            </TouchableOpacity>
        </Card>
    );

    return (
        <GradientBackground variant={theme.gradientVariant} style={styles.container}>
            <SafeAreaView style={styles.safeArea}>
                <KeyboardAvoidingView
                    behavior={Platform.OS === 'ios' ? 'padding' : undefined}
                    style={{ flex: 1 }}
                >
                    <View style={styles.header}>
                        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                            <Ionicons name="arrow-back" size={24} color={theme.textPrimary} />
                        </TouchableOpacity>
                        <Text style={styles.title}>Manage {teamData.name}</Text>
                        <View style={{ width: 40 }} />
                    </View>

                    <View style={styles.content}>
                        <View style={styles.inputContainer}>
                            <TextInput
                                style={styles.input}
                                placeholder="Enter player name"
                                placeholderTextColor={theme.textSecondary}
                                value={newPlayerName}
                                onChangeText={setNewPlayerName}
                                onSubmitEditing={handleAddPlayer}
                                returnKeyType="done"
                            />
                        </View>

                        <FlatList
                            data={teamData.players}
                            keyExtractor={(item) => item.id}
                            renderItem={renderPlayerItem}
                            contentContainerStyle={styles.listContent}
                            style={{ flex: 1 }}
                            ListEmptyComponent={
                                <Text style={styles.emptyText}>No players added yet.</Text>
                            }
                        />
                    </View>

                    {/* Bottom Action Row */}
                    <View style={styles.bottomRow}>
                        <TouchableOpacity
                            style={[styles.actionButton, styles.doneButton]}
                            onPress={() => navigation.goBack()}
                        >
                            <Text style={[styles.actionButtonText, { color: COLORS.white }]}>Done</Text>
                        </TouchableOpacity>

                        <View style={{ width: SPACING.md }} />

                        <TouchableOpacity
                            style={[styles.actionButton, styles.addButton, !newPlayerName.trim() && { opacity: 0.6 }]}
                            onPress={handleAddPlayer}
                            disabled={!newPlayerName.trim()}
                        >
                            <Ionicons name="add" size={20} color="#2B8A3E" />
                            <Text style={[styles.actionButtonText, { color: '#2B8A3E' }]}>Add</Text>
                        </TouchableOpacity>
                    </View>
                </KeyboardAvoidingView>
            </SafeAreaView>
        </GradientBackground>
    );
}

const getStyles = (theme: any) => StyleSheet.create({
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
        padding: SPACING.md,
    },
    backButton: {
        padding: SPACING.sm,
    },
    title: {
        ...TYPOGRAPHY.h2,
        color: theme.textPrimary,
    },
    content: {
        flex: 1,
        padding: SPACING.md,
    },
    inputContainer: {
        marginBottom: SPACING.md,
    },
    input: {
        backgroundColor: theme.surface,
        borderRadius: BORDER_RADIUS.md,
        paddingHorizontal: SPACING.md,
        height: 50,
        fontSize: 16,
        color: theme.textPrimary,
        ...SHADOWS.soft,
    },
    listContent: {
        paddingBottom: SPACING.xl,
        gap: SPACING.sm,
    },
    playerCard: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        backgroundColor: theme.surface,
    },
    playerInfo: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: SPACING.sm,
    },
    playerIndex: {
        ...TYPOGRAPHY.label,
        color: theme.textSecondary,
        width: 24,
    },
    playerName: {
        ...TYPOGRAPHY.body,
        fontWeight: '600',
        color: theme.textPrimary,
    },
    deleteButton: {
        padding: SPACING.sm,
    },
    emptyText: {
        ...TYPOGRAPHY.body,
        color: theme.textSecondary,
        textAlign: 'center',
        opacity: 0.7,
        marginTop: SPACING.xl,
    },
    bottomRow: {
        flexDirection: 'row',
        padding: SPACING.md,
        paddingBottom: Platform.OS === 'ios' ? SPACING.md : SPACING.md,
        backgroundColor: theme.surface, // Or transparent if preferred, but surface is safer for reading
        borderTopWidth: 1,
        borderTopColor: theme.borderSubtle,
    },
    actionButton: {
        flex: 1,
        flexDirection: 'row',
        height: 48,
        borderRadius: 20, // Requested
        justifyContent: 'center',
        alignItems: 'center',
        ...SHADOWS.soft,
    },
    addButton: {
        backgroundColor: '#D3F9D8', // Requested
    },
    doneButton: {
        backgroundColor: theme.accentPrimary,
    },
    actionButtonText: {
        ...TYPOGRAPHY.h3,
        fontSize: 16,
        fontWeight: '600',
        marginLeft: 4,
    },
});
