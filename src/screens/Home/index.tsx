// Home Screen - Match Control Hub
import React, { useState, useCallback, memo, useMemo, useEffect } from 'react';
import {
    View,
    Text,
    TextInput,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    StatusBar,
    Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useIsFocused } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import Ionicons from 'react-native-vector-icons/Ionicons';

import { useMatchStore, TeamColor } from '../../store/matchStore';
import { useSettingsStore } from '../../store/settingsStore';
import { COLORS, SPACING, TYPOGRAPHY, SHADOWS, BORDER_RADIUS, GRADIENTS } from '../../theme';
import { useAppTheme } from '../../hooks/useAppTheme';
import Card from '../../components/Card';
import Button from '../../components/Button';
import ColorPickerModal from '../../components/ColorPickerModal';
import GradientBackground, { GradientVariant } from '../../components/GradientBackground';
import PlayersListCard from '../../components/PlayersListCard';
import ClassicTeamEntry from './TeamEntry';
import { RootStackParamList } from '../../navigation/types';
import ModeInfoModal from '../../components/ModeInfoModal';

type HomeNavigationProp = NativeStackNavigationProp<RootStackParamList, 'Home'>;

// Horizontal Team VS Component - Compact side-by-side layout (Pop Style)
interface HorizontalTeamVSProps {
    teamA: { name: string; color: TeamColor };
    teamB: { name: string; color: TeamColor };
    onTeamANameChange: (name: string) => void;
    onTeamBNameChange: (name: string) => void;
    onTeamAColorPress: () => void;
    onTeamBColorPress: () => void;
}

// Compact Team Entry Component (Pro Mode)
const HorizontalTeamVS: React.FC<HorizontalTeamVSProps> = memo(
    ({ teamA, teamB, onTeamANameChange, onTeamBNameChange, onTeamAColorPress, onTeamBColorPress }) => {
        const theme = useAppTheme();

        return (
            <Card variant="elevated" padding="medium" style={compactVSStyles.container}>
                {/* Team A Row */}
                <View style={compactVSStyles.teamRow}>
                    <TouchableOpacity
                        style={[compactVSStyles.colorBadge, { backgroundColor: teamA.color.primary, borderColor: theme.borderSoft }]}
                        onPress={onTeamAColorPress}
                    />
                    <TextInput
                        style={[compactVSStyles.input, { color: theme.textPrimary }]}
                        value={teamA.name}
                        onChangeText={onTeamANameChange}
                        placeholder="Team A Name"
                        placeholderTextColor={theme.textSecondary}
                        maxLength={25}
                    />
                </View>

                {/* Divider */}
                <View style={compactVSStyles.dividerContainer}>
                    <View style={[compactVSStyles.line, { backgroundColor: theme.borderSoft }]} />
                    <View style={[compactVSStyles.vsBadge, { backgroundColor: theme.backgroundCard, borderColor: theme.borderSoft }]}>
                        <Text style={[compactVSStyles.vsText, { color: theme.textSecondary }]}>VS</Text>
                    </View>
                </View>

                {/* Team B Row */}
                <View style={compactVSStyles.teamRow}>
                    <TouchableOpacity
                        style={[compactVSStyles.colorBadge, { backgroundColor: teamB.color.primary, borderColor: theme.borderSoft }]}
                        onPress={onTeamBColorPress}
                    />
                    <TextInput
                        style={[compactVSStyles.input, { color: theme.textPrimary }]}
                        value={teamB.name}
                        onChangeText={onTeamBNameChange}
                        placeholder="Team B Name"
                        placeholderTextColor={theme.textSecondary}
                        maxLength={25}
                    />
                </View>
            </Card>
        );
    }
);

const compactVSStyles = StyleSheet.create({
    container: {
        marginBottom: SPACING.md,
    },
    teamRow: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: SPACING.xs,
    },
    colorBadge: {
        width: 32,
        height: 32,
        borderRadius: BORDER_RADIUS.round,
        marginRight: SPACING.md,
        borderWidth: 2,
        ...SHADOWS.soft,
    },
    input: {
        flex: 1,
        ...TYPOGRAPHY.h3,
        fontSize: 18,
        paddingVertical: 4,
    },
    dividerContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        marginVertical: SPACING.sm,
    },
    line: {
        flex: 1,
        height: 1,
    },
    vsBadge: {
        position: 'absolute',
        left: '50%',
        marginLeft: -12,
        paddingHorizontal: 6,
        paddingVertical: 2,
        borderRadius: BORDER_RADIUS.round,
        ...SHADOWS.soft,
        borderWidth: 1,
    },
    vsText: {
        ...TYPOGRAPHY.label,
        fontSize: 10,
    },
});

// Match Config Component (Overs & Wickets)
interface MatchConfigProps {
    overs: number;
    wickets: number;
    onOversChange: (overs: number) => void;
    onWicketsChange: (wickets: number) => void;
    isGullyMode: boolean;
}

const MatchConfigSelector: React.FC<MatchConfigProps> = memo(
    ({ overs, wickets, onOversChange, onWicketsChange, isGullyMode }) => {
        const theme = useAppTheme();
        const oversOptions = [2, 3, 4, 5, 6, 8, 10, 12, 15, 20];
        const wicketsOptions = [2, 3, 4, 5, 6, 8, 10];

        // Sporty Refined Styles
        // Active = Accent Primary (Royal Blue) unless Gully Mode overrides

        const getPillStyle = (isSelected: boolean, type: 'overs' | 'wickets') => {
            let activeBg = theme.accentPrimary;
            let activeBorder = theme.accentPrimary;

            if (isGullyMode && isSelected) {
                if (type === 'overs') {
                    activeBg = '#B2F2BB';
                    activeBorder = '#B2F2BB';
                } else {
                    activeBg = '#FFC9C9';
                    activeBorder = '#FFC9C9';
                }
            }

            return [
                matchConfigStyles.pill,
                {
                    backgroundColor: isSelected ? activeBg : theme.surfaceElevated,
                    borderColor: isSelected ? activeBorder : theme.borderSubtle
                }
            ];
        };

        const getPillTextStyle = (isSelected: boolean, type: 'overs' | 'wickets') => {
            let activeColor = COLORS.white;

            if (isGullyMode && isSelected) {
                if (type === 'overs') activeColor = '#2B8A3E';
                else activeColor = '#C92A2A';
            }

            return [
                matchConfigStyles.pillText,
                { color: isSelected ? activeColor : theme.textPrimary }
            ];
        };

        return (
            <Card variant="elevated" padding="small" style={matchConfigStyles.container}>
                <Text style={[matchConfigStyles.title, { color: theme.textPrimary }]}>MATCH SETUP</Text>

                {/* Overs Selector */}
                <View style={matchConfigStyles.row}>
                    <Text style={[matchConfigStyles.label, { color: theme.textPrimary }]}>OVERS</Text>
                    <ScrollView
                        horizontal
                        showsHorizontalScrollIndicator={false}
                        contentContainerStyle={matchConfigStyles.optionsRow}
                    >
                        {oversOptions.map((o) => (
                            <TouchableOpacity
                                key={`over-${o}`}
                                style={getPillStyle(overs === o, 'overs')}
                                onPress={() => onOversChange(o)}
                            >
                                <Text style={getPillTextStyle(overs === o, 'overs')}>{o}</Text>
                            </TouchableOpacity>
                        ))}
                    </ScrollView>
                </View>

                {/* Wickets Selector */}
                <View style={matchConfigStyles.row}>
                    <Text style={[matchConfigStyles.label, { color: theme.textPrimary }]}>WICKETS</Text>
                    <ScrollView
                        horizontal
                        showsHorizontalScrollIndicator={false}
                        contentContainerStyle={matchConfigStyles.optionsRow}
                    >
                        {wicketsOptions.map((w) => (
                            <TouchableOpacity
                                key={`wicket-${w}`}
                                style={getPillStyle(wickets === w, 'wickets')}
                                onPress={() => onWicketsChange(w)}
                            >
                                <Text style={getPillTextStyle(wickets === w, 'wickets')}>{w}</Text>
                            </TouchableOpacity>
                        ))}
                    </ScrollView>
                </View>
            </Card>
        );
    }
);

const matchConfigStyles = StyleSheet.create({
    container: {
        marginBottom: SPACING.md,
    },
    title: {
        ...TYPOGRAPHY.label,
        marginBottom: SPACING.sm,
        marginLeft: SPACING.xs,
    },
    row: {
        marginBottom: SPACING.md,
    },
    label: {
        ...TYPOGRAPHY.label,
        marginBottom: SPACING.xs,
        marginLeft: SPACING.xs,
    },
    optionsRow: {
        flexDirection: 'row',
        paddingHorizontal: SPACING.xs,
        gap: SPACING.sm,
    },
    pill: {
        paddingVertical: 6,
        paddingHorizontal: 12,
        borderRadius: BORDER_RADIUS.round,
        borderWidth: 1,
        minWidth: 40,
        alignItems: 'center',
        justifyContent: 'center',
    },
    pillText: {
        ...TYPOGRAPHY.bodySmall,
        fontWeight: '600',
    },
});

// Mode Info Modal Component (Inline for simplicity or external file)
// We will use the external one we are about to create, but for now let's ensure the import is used.

// Main Home Screen
export default function HomeScreen() {
    const navigation = useNavigation<HomeNavigationProp>();
    const theme = useAppTheme();
    const styles = useMemo(() => getStyles(theme), [theme]);

    // Store hooks
    const teamA = useMatchStore((state) => state.teamA);
    const teamB = useMatchStore((state) => state.teamB);
    // ... existing ...
    const setTeamA = useMatchStore((state) => state.setTeamA);
    const setTeamB = useMatchStore((state) => state.setTeamB);

    // Pro Mode state hooks
    const teamAPlayers = teamA.players || [];
    const teamBPlayers = teamB.players || [];
    const [teamNameA, setTeamNameA] = useState(teamA.name);
    const [teamNameB, setTeamNameB] = useState(teamB.name);
    const teamColorA = teamA.color;
    const teamColorB = teamB.color;

    const series = useMatchStore((state) => state.series);
    const startSeries = useMatchStore((state) => state.startSeries);
    const endSeries = useMatchStore((state) => state.endSeries);
    const startMatch = useMatchStore((state) => state.startMatch);
    const resetMatch = useMatchStore((state) => state.resetMatch);
    const discardActiveMatch = useMatchStore((state) => state.discardActiveMatch);
    const currentMatch = useMatchStore((state) => state.currentMatch);
    const matchMode = useMatchStore((state) => state.matchMode);
    const setMatchMode = useMatchStore((state) => state.setMatchMode);
    const defaultOvers = useSettingsStore((state) => state.defaultOvers);
    const defaultWickets = useSettingsStore((state) => state.defaultWickets);

    // Theme-aware Background
    const backgroundGradient: GradientVariant | undefined = theme.gradientVariant;

    // Local state for match config
    const [seriesBestOf, setSeriesBestOf] = useState<1 | 3 | 5 | 7>(series?.bestOf ?? 1);
    const [matchOvers, setMatchOvers] = useState(defaultOvers);
    const [matchWickets, setMatchWickets] = useState(defaultWickets);

    // Color modal state
    const [colorModalVisible, setColorModalVisible] = useState(false);
    const [colorModalTeam, setColorModalTeam] = useState<'A' | 'B'>('A');

    // Info Modal State
    const [infoModalVisible, setInfoModalVisible] = useState(false);

    // Focus hook to ensure alert only shows when Home is active
    const isFocused = useIsFocused();

    // RESUME CHECK
    React.useEffect(() => {
        if (!isFocused) return;

        const totalBalls = currentMatch?.innings.reduce((acc, inning) =>
            acc + (inning.overs?.reduce((oAcc, over) => oAcc + over.balls.length, 0) || 0), 0) || 0;

        if (currentMatch && currentMatch.status === 'inProgress' && totalBalls > 0) {
            Alert.alert(
                'Resume Match?',
                'You have an unfinished match. Do you want to continue?',
                [
                    {
                        text: 'Discard',
                        style: 'destructive',
                        onPress: () => discardActiveMatch(),
                    },
                    {
                        text: 'Resume',
                        onPress: () => navigation.navigate('Match'),
                    },
                ]
            );
        }
    }, [currentMatch?.status]);

    // Handlers
    const handleTeamANameChange = useCallback(
        (name: string) => setTeamA({ name }),
        [setTeamA]
    );

    const handleTeamBNameChange = useCallback(
        (name: string) => setTeamB({ name }),
        [setTeamB]
    );

    const handleTeamAColorChange = useCallback(
        (color: TeamColor) => {
            setTeamA({ color });
        },
        [setTeamA]
    );

    const handleTeamBColorChange = useCallback(
        (color: TeamColor) => {
            setTeamB({ color });
        },
        [setTeamB]
    );

    const openColorModalForTeam = useCallback((team: 'A' | 'B') => {
        setColorModalTeam(team);
        setColorModalVisible(true);
    }, []);

    const handleColorSelect = useCallback(
        (color: TeamColor) => {
            if (colorModalTeam === 'A') {
                handleTeamAColorChange(color);
            } else {
                handleTeamBColorChange(color);
            }
        },
        [colorModalTeam, handleTeamAColorChange, handleTeamBColorChange]
    );

    const handleManageSquad = (team: 'A' | 'B') => {
        navigation.navigate('PlayerSelection', { team });
    };

    // Validation for Toss Button
    const canStartToss = () => {
        if (!teamNameA.trim() || !teamNameB.trim()) return false;

        if (matchMode === 'pro') {
            const teamACount = teamAPlayers.length;
            const teamBCount = teamBPlayers.length;
            // Pro Mode: Teams must have equal players and at least 2
            return teamACount >= 2 && teamACount === teamBCount && matchWickets === teamACount;
        } else {
            // Gully Mode: Basic checks
            return true;
        }
    };

    // Auto-update wickets when players change in Pro Mode
    React.useEffect(() => {
        if (matchMode === 'pro') {
            const count = teamAPlayers.length;
            if (teamAPlayers.length === teamBPlayers.length && teamAPlayers.length >= 2) {
                setMatchWickets(teamAPlayers.length);
            }
        }
    }, [matchMode, teamAPlayers.length, teamBPlayers.length, setMatchWickets]);

    const handleStartToss = useCallback(() => {
        // Validate team names
        if (!teamA.name.trim() || !teamB.name.trim()) {
            return;
        }

        // Start series if bestOf > 1 and not already active
        if (seriesBestOf > 1 && !series?.isActive) {
            startSeries(seriesBestOf);
        }

        // Start the match with selected overs and wickets
        startMatch({
            totalOvers: matchOvers,
            totalWickets: matchMode === 'pro' ? teamAPlayers.length - 1 : matchWickets,
        });

        // Navigate to toss
        navigation.navigate('Toss');
    }, [
        teamA.name,
        teamB.name,
        series,
        seriesBestOf,
        startSeries,
        startMatch,
        matchOvers,
        matchWickets,
        navigation,
    ]);

    const handleOpenSettings = useCallback(() => {
        navigation.navigate('Settings');
    }, [navigation]);

    // Mode Toggle Pill
    const ModeToggle = () => {
        const theme = useAppTheme();
        return (
            <View style={[styles.modeToggleContainer, { backgroundColor: theme.backgroundCard, ...SHADOWS.soft }]}>
                <TouchableOpacity
                    style={[
                        styles.modeOption,
                        matchMode === 'gully' && { backgroundColor: theme.accent }
                    ]}
                    onPress={() => setMatchMode('gully')}
                    activeOpacity={0.8}
                >
                    <Text style={[
                        styles.modeText,
                        { color: matchMode === 'gully' ? COLORS.white : theme.textSecondary }
                    ]}>GULLY</Text>
                </TouchableOpacity>
                <TouchableOpacity
                    style={[
                        styles.modeOption,
                        matchMode === 'pro' && { backgroundColor: theme.accent }
                    ]}
                    onPress={() => setMatchMode('pro')}
                    activeOpacity={0.8}
                >
                    <Text style={[
                        styles.modeText,
                        { color: matchMode === 'pro' ? COLORS.white : theme.textSecondary }
                    ]}>PRO</Text>
                </TouchableOpacity>
                <TouchableOpacity
                    style={[styles.infoButton, { backgroundColor: theme.borderSoft }]}
                    onPress={() => setInfoModalVisible(true)}
                >
                    <Ionicons name="information-circle-outline" size={20} color={theme.textPrimary} />
                </TouchableOpacity>
            </View>
        );
    };

    return (
        <GradientBackground variant={backgroundGradient} style={styles.container}>
            <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
                <StatusBar barStyle="dark-content" backgroundColor="transparent" translucent />

                <ModeInfoModal
                    visible={infoModalVisible}
                    onClose={() => setInfoModalVisible(false)}
                />

                <ScrollView
                    contentContainerStyle={styles.scrollContent}
                    showsVerticalScrollIndicator={false}
                    keyboardShouldPersistTaps="handled"
                >
                    {/* Header with Mode Toggle */}
                    <View style={styles.header}>
                        <View style={styles.headerTop}>
                            <Text style={styles.headerTitle}>MATCH SETUP</Text>
                            <View style={styles.headerButtons}>
                                <TouchableOpacity onPress={() => navigation.navigate('History')} style={styles.iconButton}>
                                    <Ionicons name="time-outline" size={22} color={theme.textSecondary} />
                                </TouchableOpacity>
                                <TouchableOpacity onPress={handleOpenSettings} style={styles.iconButton}>
                                    <Ionicons name="settings-outline" size={22} color={theme.textSecondary} />
                                </TouchableOpacity>
                            </View>
                        </View>
                        <ModeToggle />
                    </View>

                    {matchMode === 'pro' ? (
                        <>
                            {/* PRO MODE LAYOUT */}

                            {/* 1. Team Entry Section */}
                            <HorizontalTeamVS
                                teamA={{ name: teamNameA, color: teamColorA }}
                                teamB={{ name: teamNameB, color: teamColorB }}
                                onTeamANameChange={setTeamNameA}
                                onTeamBNameChange={setTeamNameB}
                                onTeamAColorPress={() => openColorModalForTeam('A')}
                                onTeamBColorPress={() => openColorModalForTeam('B')}
                            />

                            {/* 2. Manage Squads Section */}
                            <View style={styles.sectionContainer}>
                                <Text style={styles.sectionTitle}>MANAGE SQUADS</Text>
                                <View style={styles.squadsRow}>
                                    <Button
                                        title={`EDIT ${teamNameA.toUpperCase() || 'TEAM A'}`}
                                        onPress={() => handleManageSquad('A')}
                                        variant="outline"
                                        size="small"
                                        style={styles.squadButton}
                                    />
                                    <View style={styles.squadSpacer} />
                                    <Button
                                        title={`EDIT ${teamNameB.toUpperCase() || 'TEAM B'}`}
                                        onPress={() => handleManageSquad('B')}
                                        variant="outline"
                                        size="small"
                                        style={styles.squadButton}
                                    />
                                </View>
                            </View>

                            {/* 3. Players List Card */}
                            <View style={styles.sectionContainer}>
                                <PlayersListCard
                                    teamAName={teamNameA}
                                    teamBName={teamNameB}
                                    teamAPlayers={teamAPlayers}
                                    teamBPlayers={teamBPlayers}
                                    teamAColor={teamColorA.primary}
                                    teamBColor={teamColorB.primary}
                                />
                            </View>

                            {/* 4. Match Rules (Overs Only - Wickets Auto) */}
                            <View style={styles.sectionContainer}>
                                <Text style={styles.sectionTitle}>MATCH RULES</Text>
                                <Card variant="elevated" padding="medium">
                                    <View style={styles.rulesRow}>
                                        <View style={styles.ruleItem}>
                                            <Text style={styles.ruleLabel}>OVERS</Text>
                                            <View style={[styles.counterControl, { backgroundColor: theme.backgroundPrimary }]}>
                                                <TouchableOpacity onPress={() => setMatchOvers(Math.max(1, matchOvers - 1))} style={[styles.counterBtn, { backgroundColor: theme.backgroundCard }]}>
                                                    <Text style={[styles.counterBtnText, { color: theme.textPrimary }]}>-</Text>
                                                </TouchableOpacity>
                                                <Text style={[styles.counterValue, { color: theme.textPrimary }]}>{matchOvers}</Text>
                                                <TouchableOpacity onPress={() => setMatchOvers(Math.min(50, matchOvers + 1))} style={[styles.counterBtn, { backgroundColor: theme.backgroundCard }]}>
                                                    <Text style={[styles.counterBtnText, { color: theme.textPrimary }]}>+</Text>
                                                </TouchableOpacity>
                                            </View>
                                        </View>

                                        <View style={[styles.ruleItemDivider, { backgroundColor: theme.borderSoft }]} />

                                        <View style={styles.ruleItem}>
                                            <Text style={styles.ruleLabel}>WICKETS</Text>
                                            <View style={[styles.counterControl, { opacity: 0.7, backgroundColor: theme.backgroundPrimary }]}>
                                                {/* Disabled control for Wickets in Pro Mode */}
                                                <Text style={[styles.counterValue, { color: theme.textPrimary }]}>{matchWickets}</Text>
                                                <Text style={[styles.ruleLabel, { fontSize: 10, marginLeft: 4 }]}>
                                                    (Auto)
                                                </Text>
                                            </View>
                                        </View>
                                    </View>


                                </Card>
                            </View>
                        </>
                    ) : (
                        <>
                            {/* GULLY MODE LAYOUT (Original) */}
                            <HorizontalTeamVS
                                teamA={{ name: teamNameA, color: teamColorA }}
                                teamB={{ name: teamNameB, color: teamColorB }}
                                onTeamANameChange={setTeamNameA}
                                onTeamBNameChange={setTeamNameB}
                                onTeamAColorPress={() => openColorModalForTeam('A')}
                                onTeamBColorPress={() => openColorModalForTeam('B')}
                            />

                            <View style={styles.sectionContainer}>
                                <MatchConfigSelector
                                    overs={matchOvers}
                                    wickets={matchWickets}
                                    onOversChange={setMatchOvers}
                                    onWicketsChange={setMatchWickets}
                                    isGullyMode={true}
                                />
                            </View>
                        </>
                    )}

                    {/* Start Button */}
                    <View style={styles.sectionContainer}>
                        <Button
                            title="START TOSS 🪙"
                            onPress={() => {
                                if (canStartToss()) {
                                    handleStartToss();
                                } else {
                                    if (matchMode === 'pro') {
                                        Alert.alert('Setup Incomplete', 'Pro Mode requires team names and equal number of players (min 2) in both squads.');
                                    } else {
                                        Alert.alert('Setup Incomplete', 'Please enter team names.');
                                    }
                                }
                            }}
                            variant="primary"
                            size="large"
                            disabled={!canStartToss()}
                            style={{
                                opacity: canStartToss() ? 1 : 0.6,
                                width: '100%',
                            }}
                        />
                    </View>

                    <View style={styles.footerSpacer} />
                </ScrollView>

                {/* Color Picker Modal */}
                <ColorPickerModal
                    visible={colorModalVisible}
                    onClose={() => setColorModalVisible(false)}
                    onSelectColor={handleColorSelect}
                    selectedColorId={colorModalTeam === 'A' ? teamA.color.id : teamB.color.id}
                    teamLabel={colorModalTeam === 'A' ? teamNameA || 'Team A' : teamNameB || 'Team B'}
                />
            </SafeAreaView>
        </GradientBackground>
    );
}

const getStyles = (theme: any) => StyleSheet.create({
    container: {
        flex: 1,
    },
    scrollContent: {
        paddingVertical: 24,
        paddingHorizontal: 20,
    },
    header: {
        marginBottom: SPACING.md,
    },
    headerTop: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: SPACING.lg,
        marginBottom: SPACING.md,
    },
    headerTitle: {
        ...TYPOGRAPHY.h2,
        color: theme.textPrimary,
    },
    headerButtons: {
        flexDirection: 'row',
        gap: SPACING.sm,
    },
    iconButton: {
        padding: SPACING.sm,
        backgroundColor: theme.surface,
        borderRadius: BORDER_RADIUS.round,
        ...SHADOWS.soft,
        width: 40,
        height: 40,
        justifyContent: 'center',
        alignItems: 'center',
    },
    iconText: {
        display: 'none',
    },
    modeToggleContainer: {
        flexDirection: 'row',
        backgroundColor: theme.surface,
        borderRadius: BORDER_RADIUS.round,
        padding: 4,
        marginHorizontal: SPACING.lg,
        ...SHADOWS.soft,
        alignItems: 'center',
    },
    modeOption: {
        flex: 1,
        paddingVertical: 10,
        alignItems: 'center',
        justifyContent: 'center',
        borderRadius: BORDER_RADIUS.round,
    },
    modeOptionActive: {
        backgroundColor: theme.accentPrimary,
    },
    modeText: {
        ...TYPOGRAPHY.label,
        color: theme.textSecondary,
        fontWeight: '700',
    },
    modeTextActive: {
        color: COLORS.white,
    },
    infoButton: {
        width: 32,
        height: 32,
        borderRadius: 16,
        justifyContent: 'center',
        alignItems: 'center',
        marginLeft: 4,
        marginRight: 4,
        backgroundColor: theme.runNeutral,
    },
    infoIcon: {
        fontSize: 16,
        color: theme.textPrimary,
    },
    sectionContainer: {
        marginTop: SPACING.lg,
    },
    sectionTitle: {
        ...TYPOGRAPHY.label,
        color: theme.textSecondary,
        marginBottom: SPACING.sm,
        marginLeft: SPACING.sm,
    },
    squadsRow: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    squadButton: {
        flex: 1,
    },
    squadSpacer: {
        width: SPACING.md,
    },
    rulesRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: SPACING.sm,
    },
    ruleItem: {
        alignItems: 'center',
        flex: 1,
    },
    ruleItemDivider: {
        width: 1,
        height: 40,
        backgroundColor: theme.runNeutral,
    },
    counterControl: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: theme.runNeutral,
        borderRadius: BORDER_RADIUS.lg,
        padding: 2,
        marginTop: 4,
    },
    counterBtn: {
        width: 32,
        height: 32,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: theme.surface,
        borderRadius: BORDER_RADIUS.md,
        ...SHADOWS.soft,
    },
    counterBtnText: {
        fontSize: 18,
        fontWeight: 'bold',
        color: theme.textPrimary,
    },
    counterValue: {
        width: 40,
        textAlign: 'center',
        fontSize: 16,
        fontWeight: '700',
        color: theme.textPrimary, // Ensure visible in Dark Mode
    },
    ruleLabel: {
        ...TYPOGRAPHY.label,
        color: theme.textSecondary,
        marginBottom: 4,
    },
    footerSpacer: {
        height: 100, // Extra space for bottom tab bar or safe area
    },
});

