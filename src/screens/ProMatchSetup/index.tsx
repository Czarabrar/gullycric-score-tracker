
import React, { useState, useMemo } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    Modal,
    FlatList,
    Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';

import { useMatchStore, Player } from '../../store/matchStore';
import { COLORS, SPACING, TYPOGRAPHY, BORDER_RADIUS, SHADOWS } from '../../theme';
import Button from '../../components/Button';
import GradientBackground from '../../components/GradientBackground';
import Card from '../../components/Card';
import { RootStackParamList } from '../../navigation/types';
import { useAppTheme } from '../../hooks/useAppTheme';

type ProMatchSetupNavigationProp = NativeStackNavigationProp<RootStackParamList, 'ProMatchSetup'>;

export default function ProMatchSetupScreen() {
    const navigation = useNavigation<ProMatchSetupNavigationProp>();

    // Store
    const currentMatch = useMatchStore((state) => state.currentMatch);
    const setInningsPlayers = useMatchStore((state) => state.setInningsPlayers);

    // Derived State
    const battingTeamIndex = currentMatch?.innings[0]?.battingTeamIndex;
    const bowlingTeamIndex = battingTeamIndex === 0 ? 1 : 0;

    const battingTeam = battingTeamIndex === 0 ? currentMatch?.teamA : currentMatch?.teamB;
    const bowlingTeam = bowlingTeamIndex === 0 ? currentMatch?.teamA : currentMatch?.teamB;

    // Local State
    const [striker, setStriker] = useState<Player | null>(null);
    const [nonStriker, setNonStriker] = useState<Player | null>(null);
    const [bowler, setBowler] = useState<Player | null>(null);

    const [modalVisible, setModalVisible] = useState(false);
    const [modalType, setModalType] = useState<'striker' | 'nonStriker' | 'bowler' | null>(null);

    // Filter available players for selection
    const availableStrikers = useMemo(() => {
        if (!battingTeam) return [];
        return battingTeam.players.filter(p => p.id !== nonStriker?.id);
    }, [battingTeam, nonStriker]);

    const availableNonStrikers = useMemo(() => {
        if (!battingTeam) return [];
        return battingTeam.players.filter(p => p.id !== striker?.id);
    }, [battingTeam, striker]);

    const availableBowlers = useMemo(() => {
        if (!bowlingTeam) return [];
        return bowlingTeam.players;
    }, [bowlingTeam]);

    const handleSelectPlayer = (player: Player) => {
        if (modalType === 'striker') setStriker(player);
        if (modalType === 'nonStriker') setNonStriker(player);
        if (modalType === 'bowler') setBowler(player);
        setModalVisible(false);
        setModalType(null);
    };

    const openModal = (type: 'striker' | 'nonStriker' | 'bowler') => {
        setModalType(type);
        setModalVisible(true);
    };

    const handleStartMatch = () => {
        if (!stackCheck()) return;

        // Find indices in the ORIGINAL team arrays from the match object
        // We must ensure we pass the correct INDICES to the store, as it uses indices currently
        // But wait, the Store might use indices into the `team.players` array.
        // Yes, `BallEvent` uses `strikerIndex`.

        if (!battingTeam || !bowlingTeam || !striker || !nonStriker || !bowler) return;

        const strikerIndex = battingTeam.players.findIndex(p => p.id === striker.id);
        const nonStrikerIndex = battingTeam.players.findIndex(p => p.id === nonStriker.id);
        const bowlerIndex = bowlingTeam.players.findIndex(p => p.id === bowler.id);

        if (strikerIndex === -1 || nonStrikerIndex === -1 || bowlerIndex === -1) {
            Alert.alert("Error", "Selected players not found in team data.");
            return;
        }

        setInningsPlayers(strikerIndex, nonStrikerIndex, bowlerIndex);
        navigation.navigate('Match');
    };

    const stackCheck = () => {
        if (!striker || !nonStriker || !bowler) {
            Alert.alert("Incomplete", "Please select all players to start.");
            return false;
        }
        return true;
    };

    // Render Modal Item
    const renderPlayerItem = ({ item }: { item: Player }) => (
        <TouchableOpacity
            style={styles.modalItem}
            onPress={() => handleSelectPlayer(item)}
        >
            <Text style={styles.modalItemText}>{item.name}</Text>
        </TouchableOpacity>
    );

    const getListData = () => {
        if (modalType === 'striker') return availableStrikers;
        if (modalType === 'nonStriker') return availableNonStrikers;
        if (modalType === 'bowler') return availableBowlers;
        return [];
    };

    // Theme
    const theme = useAppTheme();
    const styles = useMemo(() => getStyles(theme), [theme]);

    if (!currentMatch || !battingTeam || !bowlingTeam) {
        return (
            <View style={styles.container}><Text style={{ color: theme.textPrimary }}>Loading...</Text></View>
        );
    }

    return (
        <GradientBackground variant="dark" style={styles.container}>
            <SafeAreaView style={styles.safeArea}>
                <View style={styles.header}>
                    <Text style={styles.headerTitle}>MATCH SETUP</Text>
                </View>

                <View style={styles.content}>
                    {/* Batting Team Section */}
                    <Card variant="elevated" padding="medium" style={styles.sectionCard}>
                        <Text style={styles.sectionTitle}>
                            🏏 {battingTeam.name} (Batting)
                        </Text>

                        <View style={styles.inputGroup}>
                            <Text style={styles.label}>Striker</Text>
                            <TouchableOpacity
                                style={[styles.selector, !striker && styles.selectorPlaceholder]}
                                onPress={() => openModal('striker')}
                            >
                                <Text style={styles.selectorText}>
                                    {striker ? striker.name : 'Select Striker'}
                                </Text>
                            </TouchableOpacity>
                        </View>

                        <View style={styles.inputGroup}>
                            <Text style={styles.label}>Non-Striker</Text>
                            <TouchableOpacity
                                style={[styles.selector, !nonStriker && styles.selectorPlaceholder]}
                                onPress={() => openModal('nonStriker')}
                            >
                                <Text style={styles.selectorText}>
                                    {nonStriker ? nonStriker.name : 'Select Non-Striker'}
                                </Text>
                            </TouchableOpacity>
                        </View>
                    </Card>

                    {/* Bowling Team Section */}
                    <Card variant="elevated" padding="medium" style={styles.sectionCard}>
                        <Text style={styles.sectionTitle}>
                            ⚾ {bowlingTeam.name} (Bowling)
                        </Text>

                        <View style={styles.inputGroup}>
                            <Text style={styles.label}>Opening Bowler</Text>
                            <TouchableOpacity
                                style={[styles.selector, !bowler && styles.selectorPlaceholder]}
                                onPress={() => openModal('bowler')}
                            >
                                <Text style={styles.selectorText}>
                                    {bowler ? bowler.name : 'Select Bowler'}
                                </Text>
                            </TouchableOpacity>
                        </View>
                    </Card>
                </View>

                <View style={styles.footer}>
                    <Button
                        title="START MATCH"
                        onPress={handleStartMatch}
                        variant="primary"
                        size="large"
                        disabled={!striker || !nonStriker || !bowler}
                        style={styles.startBtn}
                    />
                </View>

                {/* Selection Modal */}
                <Modal
                    visible={modalVisible}
                    transparent={true}
                    animationType="slide"
                    onRequestClose={() => setModalVisible(false)}
                >
                    <View style={styles.modalOverlay}>
                        <View style={styles.modalContent}>
                            <View style={styles.modalHeader}>
                                <Text style={styles.modalTitle}>
                                    Select {modalType === 'bowler' ? 'Bowler' : 'Batsman'}
                                </Text>
                                <TouchableOpacity onPress={() => setModalVisible(false)}>
                                    <Text style={styles.closeText}>✕</Text>
                                </TouchableOpacity>
                            </View>
                            <FlatList
                                data={getListData()}
                                keyExtractor={(item) => item.id}
                                renderItem={renderPlayerItem}
                                contentContainerStyle={styles.modalList}
                                ListEmptyComponent={
                                    <Text style={styles.emptyText}>No players available</Text>
                                }
                            />
                        </View>
                    </View>
                </Modal>

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
        padding: SPACING.lg,
        alignItems: 'center',
    },
    headerTitle: {
        ...TYPOGRAPHY.h2,
        color: COLORS.white,
    },
    content: {
        flex: 1,
        padding: SPACING.md,
        gap: SPACING.lg,
    },
    sectionCard: {
        backgroundColor: theme.surface,
        borderRadius: BORDER_RADIUS.lg,
        ...SHADOWS.medium,
    },
    sectionTitle: {
        ...TYPOGRAPHY.h3,
        color: theme.textPrimary,
        marginBottom: SPACING.md,
        borderBottomWidth: 1,
        borderBottomColor: theme.borderSubtle,
        paddingBottom: SPACING.xs,
    },
    inputGroup: {
        marginBottom: SPACING.md,
    },
    label: {
        ...TYPOGRAPHY.label,
        color: theme.textSecondary,
        marginBottom: SPACING.xs,
    },
    selector: {
        backgroundColor: theme.backgroundGradientStart, // Slight contrast from surface
        padding: SPACING.md,
        borderRadius: BORDER_RADIUS.md,
        borderWidth: 1,
        borderColor: theme.borderSubtle,
    },
    selectorPlaceholder: {
        borderColor: theme.accentPrimary,
        borderStyle: 'dashed',
        backgroundColor: 'rgba(37, 99, 235, 0.05)',
    },
    selectorText: {
        ...TYPOGRAPHY.body,
        fontWeight: '600',
        color: theme.textPrimary,
    },
    footer: {
        padding: SPACING.lg,
    },
    startBtn: {
        width: '100%',
    },
    // Modal Styles
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'flex-end',
    },
    modalContent: {
        backgroundColor: theme.surfaceElevated,
        borderTopLeftRadius: BORDER_RADIUS.xl,
        borderTopRightRadius: BORDER_RADIUS.xl,
        maxHeight: '70%',
        ...SHADOWS.medium,
    },
    modalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: SPACING.md,
        borderBottomWidth: 1,
        borderBottomColor: theme.borderSubtle,
    },
    modalTitle: {
        ...TYPOGRAPHY.h3,
        color: theme.textPrimary,
    },
    closeText: {
        fontSize: 24,
        color: theme.textSecondary,
        padding: SPACING.sm,
    },
    modalList: {
        padding: SPACING.md,
    },
    modalItem: {
        paddingVertical: SPACING.md,
        borderBottomWidth: 1,
        borderBottomColor: theme.borderSubtle,
    },
    modalItemText: {
        ...TYPOGRAPHY.bodyLarge,
        color: theme.textPrimary,
    },
    emptyText: {
        textAlign: 'center',
        padding: SPACING.xl,
        color: theme.textSecondary,
    },
});
