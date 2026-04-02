// Settings Screen
import React from 'react';
import { View, Text, StyleSheet, Switch, ScrollView, Alert, TouchableOpacity } from 'react-native';
import { useSettingsStore } from '../../store/settingsStore';
import { useMatchStore } from '../../store/matchStore';
import { SPACING, TYPOGRAPHY, BORDER_RADIUS } from '../../theme';
import { useAppTheme } from '../../hooks/useAppTheme';
import Button from '../../components/Button';
import Card from '../../components/Card';

const SettingsScreen = () => {
    const theme = useAppTheme();
    const {
        soundEnabled,
        setSoundEnabled,
        defaultOvers,
        setDefaultOvers,
        defaultWickets,
        setDefaultWickets,
        theme: themeMode,
        setTheme,
    } = useSettingsStore();

    const { clearHistory } = useMatchStore();

    const handleResetData = () => {
        Alert.alert(
            'Reset All Data',
            'Are you sure? This will delete all match history and statistics.',
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Delete',
                    style: 'destructive',
                    onPress: () => {
                        clearHistory();
                        Alert.alert('Success', 'All data has been reset.');
                    },
                },
            ]
        );
    };

    const toggleTheme = () => {
        setTheme(themeMode === 'light' ? 'dark' : 'light');
    };

    return (
        <ScrollView style={[styles.container, { backgroundColor: theme.backgroundPrimary }]}>
            <View style={styles.header}>
                <Text style={[styles.title, { color: theme.textPrimary }]}>SETTINGS</Text>
            </View>

            <View style={styles.section}>
                <Text style={[styles.sectionTitle, { color: theme.textSecondary }]}>APPEARANCE</Text>
                <Card style={styles.card}>
                    <View style={styles.row}>
                        <View>
                            <Text style={[styles.label, { color: theme.textPrimary }]}>Dark Mode</Text>
                            <Text style={[styles.subLabel, { color: theme.textSecondary }]}>
                                Switch to dark theme
                            </Text>
                        </View>
                        <Switch
                            value={themeMode === 'dark'}
                            onValueChange={toggleTheme}
                            trackColor={{ false: theme.borderSoft, true: theme.accent }}
                            thumbColor={'#fff'}
                        />
                    </View>
                </Card>
            </View>

            <View style={styles.section}>
                <Text style={[styles.sectionTitle, { color: theme.textSecondary }]}>GAMEPLAY</Text>
                <Card style={styles.card}>
                    <View style={[styles.row, styles.borderBottom, { borderColor: theme.borderSoft }]}>
                        <View>
                            <Text style={[styles.label, { color: theme.textPrimary }]}>Sound Effects</Text>
                            <Text style={[styles.subLabel, { color: theme.textSecondary }]}>
                                Enable match sounds
                            </Text>
                        </View>
                        <Switch
                            value={soundEnabled}
                            onValueChange={setSoundEnabled}
                            trackColor={{ false: theme.borderSoft, true: theme.accent }}
                            thumbColor={'#fff'}
                        />
                    </View>

                    <View style={styles.row}>
                        <View>
                            <Text style={[styles.label, { color: theme.textPrimary }]}>Default Overs</Text>
                            <Text style={[styles.subLabel, { color: theme.textSecondary }]}>
                                {defaultOvers} overs per innings
                            </Text>
                        </View>
                        <View style={styles.counter}>
                            <TouchableOpacity
                                onPress={() => setDefaultOvers(Math.max(1, defaultOvers - 1))}
                                style={[styles.counterBtn, { backgroundColor: theme.borderSoft }]}
                            >
                                <Text style={[styles.counterText, { color: theme.textPrimary }]}>-</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                onPress={() => setDefaultOvers(Math.min(50, defaultOvers + 1))}
                                style={[styles.counterBtn, { backgroundColor: theme.borderSoft }]}
                            >
                                <Text style={[styles.counterText, { color: theme.textPrimary }]}>+</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </Card>
            </View>

            <View style={styles.section}>
                <Text style={[styles.sectionTitle, { color: theme.textSecondary }]}>DATA</Text>
                <Card style={styles.card}>
                    <View style={styles.row}>
                        <View>
                            <Text style={[styles.label, { color: theme.textPrimary }]}>Clear History</Text>
                            <Text style={[styles.subLabel, { color: theme.textSecondary }]}>
                                Delete all match logs
                            </Text>
                        </View>
                        <Button
                            title="Reset"
                            variant="danger"
                            size="small"
                            onPress={handleResetData}
                        />
                    </View>
                </Card>
            </View>

            <View style={styles.footer}>
                <Text style={[styles.footerText, { color: theme.textSecondary }]}>GullyTurf v0.0.1</Text>
            </View>
        </ScrollView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        padding: SPACING.md,
    },
    header: {
        marginBottom: SPACING.lg,
        marginTop: SPACING.sm,
    },
    title: {
        ...TYPOGRAPHY.h1,
    },
    section: {
        marginBottom: SPACING.lg,
    },
    sectionTitle: {
        ...TYPOGRAPHY.label,
        marginBottom: SPACING.sm,
        marginLeft: SPACING.xs,
    },
    card: {
        borderRadius: BORDER_RADIUS.lg,
    },
    row: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: SPACING.sm,
    },
    borderBottom: {
        borderBottomWidth: 1,
        marginBottom: SPACING.sm,
        paddingBottom: SPACING.md,
    },
    label: {
        ...TYPOGRAPHY.body,
        fontWeight: '600',
    },
    subLabel: {
        ...TYPOGRAPHY.bodySmall,
        marginTop: 2,
    },
    counter: {
        flexDirection: 'row',
        gap: SPACING.sm,
    },
    counterBtn: {
        width: 32,
        height: 32,
        borderRadius: BORDER_RADIUS.md,
        justifyContent: 'center',
        alignItems: 'center',
    },
    counterText: {
        fontSize: 18,
        fontWeight: 'bold',
    },
    footer: {
        alignItems: 'center',
        marginTop: SPACING.xl,
        marginBottom: SPACING.xl,
    },
    footerText: {
        ...TYPOGRAPHY.label,
    },
});

export default SettingsScreen;
