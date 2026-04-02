// MVP Selection Screen
import React, { useState, useRef, useCallback } from 'react';
import {
    View,
    Text,
    TextInput,
    StyleSheet,
    Share,
    Platform,
    ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import ViewShot from 'react-native-view-shot';
import RNShare from 'react-native-share';

import { useMatchStore } from '../../store/matchStore';
import { getMatchStats } from '../../utils/statsCalculator'; // IMPORT ADDED
import { COLORS, SPACING, TYPOGRAPHY, BORDER_RADIUS, SHADOWS } from '../../theme';
import Card from '../../components/Card';
import Button from '../../components/Button';
import { useSound } from '../../utils/soundManager';
import { RootStackParamList } from '../../navigation/types';

type MVPNavigationProp = NativeStackNavigationProp<RootStackParamList, 'MVP'>;

export default function MVPScreen() {
    const navigation = useNavigation<MVPNavigationProp>();
    const { play } = useSound();
    const cardRef = useRef<ViewShot>(null);

    // Store
    const currentMatch = useMatchStore((state) => state.currentMatch);
    const setMVP = useMatchStore((state) => state.setMVP);

    // State
    const [mvpName, setMvpName] = useState('');
    const [mvpStats, setMvpStats] = useState('');
    const [mvpTeamIndex, setMvpTeamIndex] = useState<0 | 1>(
        currentMatch?.winner === 0 || currentMatch?.winner === 1

            ? currentMatch.winner
            : 0
    );
    const [isCardReady, setIsCardReady] = useState(false);

    // Auto-calculate MVP on mount
    React.useEffect(() => {
        if (currentMatch) {
            const stats = getMatchStats(currentMatch);
            if (stats && stats.mvp) {
                const mvpPlayer = stats.mvp;
                setMvpName(mvpPlayer.name);

                // Determine team
                const isTeamA = currentMatch.teamA.players.some(p => p.id === mvpPlayer.id);
                setMvpTeamIndex(isTeamA ? 0 : 1);

                // Format Stats
                const parts = [];
                if (mvpPlayer.runs > 0) parts.push(`${mvpPlayer.runs} runs`);
                if (mvpPlayer.wickets > 0) parts.push(`${mvpPlayer.wickets} wkts`);
                if (mvpPlayer.runs === 0 && mvpPlayer.wickets === 0) parts.push('Impact Player');

                setMvpStats(parts.join(' & '));
            }
        }
    }, [currentMatch]);

    // Derived data
    const mvpTeam = currentMatch
        ? mvpTeamIndex === 0
            ? currentMatch.teamA
            : currentMatch.teamB
        : null;

    // Handlers
    const handleConfirmMVP = useCallback(() => {
        if (!mvpName.trim()) return;

        setMVP(mvpName.trim(), mvpTeamIndex, mvpStats.trim() || 'Match MVP');
        setIsCardReady(true);
        // play('successChime');
    }, [mvpName, mvpTeamIndex, mvpStats, setMVP, play]);

    const handleShare = useCallback(async () => {
        try {
            if (cardRef.current?.capture) {
                const uri = await cardRef.current.capture();

                await RNShare.open({
                    url: Platform.OS === 'android' ? `file://${uri}` : uri,
                    type: 'image/png',
                    title: 'MVP of the Match - GullyTurf',
                    message: `🌟 ${mvpName} is the MVP! 🏏`,
                });
            }
        } catch (error) {
            Share.share({
                message: `🌟 MVP of the Match: ${mvpName} (${mvpTeam?.name}) - ${mvpStats || 'Match MVP'} - from GullyTurf`,
            });
        }
    }, [mvpName, mvpTeam, mvpStats]);

    const handleBack = useCallback(() => {
        navigation.goBack();
    }, [navigation]);

    if (!currentMatch) {
        return (
            <SafeAreaView style={styles.container}>
                <Text style={styles.errorText}>No match data</Text>
                <Button
                    title="Go Back"
                    onPress={handleBack}
                    variant="primary"
                />
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
            <View style={styles.header}>
                <Text style={styles.title}>🌟 SELECT MVP 🌟</Text>
            </View>

            <ScrollView
                style={styles.content}
                contentContainerStyle={styles.contentContainer}
                showsVerticalScrollIndicator={false}
            >
                {!isCardReady ? (
                    <>
                        {/* MVP Form */}
                        <Card variant="elevated" padding="large" style={styles.formCard}>
                            <Text style={styles.formLabel}>Player Name</Text>
                            <TextInput
                                style={styles.input}
                                value={mvpName}
                                onChangeText={setMvpName}
                                placeholder="Enter MVP name"
                                placeholderTextColor={COLORS.slate}
                                maxLength={30}
                            />

                            <Text style={styles.formLabel}>Performance (Optional)</Text>
                            <TextInput
                                style={styles.input}
                                value={mvpStats}
                                onChangeText={setMvpStats}
                                placeholder="e.g., 45 runs (22 balls)"
                                placeholderTextColor={COLORS.slate}
                                maxLength={50}
                            />

                            <Text style={styles.formLabel}>Team</Text>
                            <View style={styles.teamSelector}>
                                <Button
                                    title={currentMatch.teamA.name}
                                    onPress={() => setMvpTeamIndex(0)}
                                    variant={mvpTeamIndex === 0 ? 'primary' : 'outline'}
                                    size="medium"
                                    style={{
                                        ...styles.teamButton,
                                        ...(mvpTeamIndex === 0 ? { backgroundColor: currentMatch.teamA.color.primary } : {}),
                                    }}
                                />
                                <Button
                                    title={currentMatch.teamB.name}
                                    onPress={() => setMvpTeamIndex(1)}
                                    variant={mvpTeamIndex === 1 ? 'primary' : 'outline'}
                                    size="medium"
                                    style={{
                                        ...styles.teamButton,
                                        ...(mvpTeamIndex === 1 ? { backgroundColor: currentMatch.teamB.color.primary } : {}),
                                    }}
                                />
                            </View>
                        </Card>

                        <Button
                            title="✨ Create MVP Card"
                            onPress={handleConfirmMVP}
                            variant="primary"
                            size="large"
                            disabled={!mvpName.trim()}
                            style={styles.confirmButton}
                        />
                    </>
                ) : (
                    <>
                        {/* Shareable MVP Card */}
                        <ViewShot
                            ref={cardRef}
                            options={{ format: 'png', quality: 0.9 }}
                        >
                            <Card variant="elevated" padding="large" style={styles.mvpCard}>
                                <Text style={styles.mvpBadge}>🌟 MVP OF THE MATCH 🌟</Text>

                                <View
                                    style={[
                                        styles.mvpNameContainer,
                                        { backgroundColor: mvpTeam?.color.primary },
                                    ]}
                                >
                                    <Text style={styles.mvpName}>{mvpName}</Text>
                                </View>

                                <Text style={styles.mvpTeam}>{mvpTeam?.name}</Text>

                                {mvpStats ? (
                                    <Text style={styles.mvpStatsText}>{mvpStats}</Text>
                                ) : null}

                                <View style={styles.matchContext}>
                                    <Text style={styles.contextText}>
                                        {currentMatch.teamA.name} vs {currentMatch.teamB.name}
                                    </Text>
                                </View>

                                <Text style={styles.branding}>🏏 GullyTurf</Text>
                            </Card>
                        </ViewShot>

                        <Text style={styles.shareHint}>↑ Shareable Card ↑</Text>

                        <View style={styles.actionRow}>
                            <Button
                                title="📤 Share MVP Card"
                                onPress={handleShare}
                                variant="primary"
                                size="large"
                                style={styles.shareButton}
                            />
                        </View>

                        <Button
                            title="← Back to Result"
                            onPress={handleBack}
                            variant="ghost"
                            size="medium"
                        />
                    </>
                )}
            </ScrollView>
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
    header: {
        alignItems: 'center',
        paddingVertical: SPACING.lg,
    },
    title: {
        ...TYPOGRAPHY.h2,
        color: COLORS.charcoal,
    },
    content: {
        flex: 1,
    },
    contentContainer: {
        padding: SPACING.lg,
        alignItems: 'center',
    },
    formCard: {
        width: '100%',
        marginBottom: SPACING.lg,
    },
    formLabel: {
        ...TYPOGRAPHY.label,
        color: COLORS.slate,
        marginBottom: SPACING.xs,
        marginTop: SPACING.md,
    },
    input: {
        borderWidth: 2,
        borderColor: COLORS.powderBlue,
        borderRadius: BORDER_RADIUS.lg,
        paddingVertical: SPACING.md,
        paddingHorizontal: SPACING.lg,
        fontSize: 16,
        color: COLORS.charcoal,
        backgroundColor: COLORS.cloud,
    },
    teamSelector: {
        flexDirection: 'row',
        gap: SPACING.md,
        marginTop: SPACING.sm,
    },
    teamButton: {
        flex: 1,
    },
    confirmButton: {
        width: '100%',
    },
    mvpCard: {
        width: '100%',
        alignItems: 'center',
        backgroundColor: COLORS.white,
    },
    mvpBadge: {
        ...TYPOGRAPHY.h3,
        color: COLORS.charcoal,
        marginBottom: SPACING.lg,
    },
    mvpNameContainer: {
        paddingVertical: SPACING.lg,
        paddingHorizontal: SPACING.xl,
        borderRadius: BORDER_RADIUS.xl,
        marginBottom: SPACING.md,
    },
    mvpName: {
        ...TYPOGRAPHY.h1,
        color: COLORS.white,
        fontWeight: '800',
        textTransform: 'uppercase',
    },
    mvpTeam: {
        ...TYPOGRAPHY.body,
        color: COLORS.slate,
        marginBottom: SPACING.sm,
    },
    mvpStatsText: {
        ...TYPOGRAPHY.h3,
        color: COLORS.charcoal,
        fontWeight: '600',
    },
    matchContext: {
        marginTop: SPACING.lg,
        paddingTop: SPACING.md,
        borderTopWidth: 1,
        borderTopColor: COLORS.cloud,
    },
    contextText: {
        ...TYPOGRAPHY.bodySmall,
        color: COLORS.slate,
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
        marginBottom: SPACING.lg,
    },
    actionRow: {
        width: '100%',
        marginBottom: SPACING.md,
    },
    shareButton: {
        width: '100%',
    },
});
