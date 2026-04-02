
import React from 'react';
import {
    Modal,
    View,
    Text,
    StyleSheet,
    FlatList,
    TouchableOpacity,
    Dimensions,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { COLORS, SPACING, TYPOGRAPHY, BORDER_RADIUS, SHADOWS } from '../theme';
import { Player } from '../store/matchStore';

interface PlayerSelectModalProps {
    visible: boolean;
    title: string;
    players: Player[];
    onSelect: (player: Player) => void;
    onClose?: () => void;
    excludePlayerIds?: string[];
    liveStats?: Record<string, { runs: number; wickets: number; balls: number }>; // NEW PROP
}

const { height } = Dimensions.get('window');

const PlayerSelectModal: React.FC<PlayerSelectModalProps> = ({
    visible,
    title,
    players,
    onSelect,
    onClose,
    excludePlayerIds = [],
    liveStats,
}) => {
    const insets = useSafeAreaInsets();

    const filteredPlayers = players.filter(p => !excludePlayerIds.includes(p.id));

    const renderItem = ({ item }: { item: Player }) => {
        // Stats Display Logic
        let statsDisplay = '';
        if (liveStats && liveStats[item.id]) {
            const s = liveStats[item.id];
            const overs = Math.floor(s.balls / 6);
            const balls = s.balls % 6;
            statsDisplay = `${overs}.${balls} ov | ${s.runs}R | ${s.wickets}W`; // Fixed typo 'wicket' -> 'wickets'
        } else if (item.stats) {
            // Fallback (batting or career)
            statsDisplay = `Runs: ${item.stats.runs} | Wkts: ${item.stats.wickets}`;
        } else {
            // Default for fresh bowler
            statsDisplay = `0.0 ov | 0R | 0W`;
        }

        return (
            <TouchableOpacity
                style={styles.playerItem}
                onPress={() => onSelect(item)}
                activeOpacity={0.7}
            >
                <View style={styles.avatar}>
                    <Text style={styles.avatarText}>{item.name.charAt(0).toUpperCase()}</Text>
                </View>
                <View style={styles.info}>
                    <Text style={styles.name}>{item.name}</Text>
                    <Text style={styles.stats}>{statsDisplay}</Text>
                </View>
                <Text style={styles.selectText}>SELECT</Text>
            </TouchableOpacity>
        );
    };

    return (
        <Modal
            visible={visible}
            transparent
            animationType="slide"
            onRequestClose={onClose}
        >
            <View style={styles.overlay}>
                <View style={[styles.container, { paddingBottom: insets.bottom + SPACING.md }]}>
                    <View style={styles.header}>
                        <Text style={styles.title}>{title}</Text>
                        {onClose && (
                            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
                                <Text style={styles.closeText}>✕</Text>
                            </TouchableOpacity>
                        )}
                    </View>

                    <FlatList
                        data={filteredPlayers}
                        keyExtractor={(item) => item.id}
                        renderItem={renderItem}
                        contentContainerStyle={styles.listContent}
                        ListEmptyComponent={
                            <View style={styles.emptyContainer}>
                                <Text style={styles.emptyText}>No players available</Text>
                            </View>
                        }
                    />
                </View>
            </View>
        </Modal>
    );
};

const styles = StyleSheet.create({
    overlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'flex-end',
    },
    container: {
        backgroundColor: COLORS.white,
        borderTopLeftRadius: BORDER_RADIUS.xl,
        borderTopRightRadius: BORDER_RADIUS.xl,
        maxHeight: height * 0.7,
        ...SHADOWS.strong,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        padding: SPACING.md,
        borderBottomWidth: 1,
        borderBottomColor: COLORS.cloud,
        position: 'relative',
    },
    title: {
        ...TYPOGRAPHY.h3,
        color: COLORS.charcoal,
    },
    closeButton: {
        position: 'absolute',
        right: SPACING.md,
        padding: SPACING.sm,
    },
    closeText: {
        fontSize: 20,
        color: COLORS.slate,
        fontWeight: 'bold',
    },
    listContent: {
        padding: SPACING.md,
    },
    playerItem: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: SPACING.md,
        borderBottomWidth: 1,
        borderBottomColor: COLORS.cloud,
    },
    avatar: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: COLORS.popBlue,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: SPACING.md,
    },
    avatarText: {
        color: COLORS.white,
        fontWeight: 'bold',
        fontSize: 16,
    },
    info: {
        flex: 1,
    },
    name: {
        ...TYPOGRAPHY.bodyLarge,
        fontWeight: '600',
        color: COLORS.charcoal,
    },
    stats: {
        ...TYPOGRAPHY.label,
        color: COLORS.slate,
        marginTop: 2,
    },
    selectText: {
        ...TYPOGRAPHY.label,
        color: COLORS.popBlue,
        fontWeight: '700',
    },
    emptyContainer: {
        padding: SPACING.xl,
        alignItems: 'center',
    },
    emptyText: {
        ...TYPOGRAPHY.body,
        color: COLORS.slate,
    },
});

export default PlayerSelectModal;
