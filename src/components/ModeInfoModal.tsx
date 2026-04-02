import React from 'react';
import { View, Text, StyleSheet, Modal, TouchableOpacity, ScrollView } from 'react-native';
// import { BlurView } from '@react-native-community/blur'; // Optional, or use semi-transparent view
import { COLORS, SPACING, TYPOGRAPHY, BORDER_RADIUS, SHADOWS } from '../theme';
import { useAppTheme } from '../hooks/useAppTheme';
import Card from './Card';
import Button from './Button';

interface ModeInfoModalProps {
    visible: boolean;
    onClose: () => void;
}

const ModeInfoModal: React.FC<ModeInfoModalProps> = ({ visible, onClose }) => {
    const theme = useAppTheme();

    return (
        <Modal
            visible={visible}
            transparent
            animationType="fade"
            onRequestClose={onClose}
        >
            <View style={styles.overlay}>
                <View style={[styles.container, { backgroundColor: theme.backgroundCard }]}>
                    <Text style={[styles.title, { color: theme.textPrimary }]}>Choose Your Style</Text>

                    <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
                        <View style={styles.section}>
                            <Text style={[styles.modeTitle, { color: theme.accent }]}>PRO MODE</Text>
                            <Text style={[styles.description, { color: theme.textSecondary }]}>
                                For serious tracking. Record individual player stats, manage squads, and track detailed match history.
                            </Text>
                            <View style={styles.bulletList}>
                                <Text style={[styles.bullet, { color: theme.textSecondary }]}>• Manage full squads</Text>
                                <Text style={[styles.bullet, { color: theme.textSecondary }]}>• Track balls faced, 4s, 6s</Text>
                                <Text style={[styles.bullet, { color: theme.textSecondary }]}>• Complete bowler figures</Text>
                            </View>
                        </View>

                        <View style={[styles.divider, { backgroundColor: theme.borderSoft }]} />

                        <View style={styles.section}>
                            <Text style={[styles.modeTitle, { color: theme.accent }]}>GULLY MODE</Text>
                            <Text style={[styles.description, { color: theme.textSecondary }]}>
                                Quick and easy. Just score runs and wickets. No player names required. Perfect for street cricket.
                            </Text>
                            <View style={styles.bulletList}>
                                <Text style={[styles.bullet, { color: theme.textSecondary }]}>• Team names only</Text>
                                <Text style={[styles.bullet, { color: theme.textSecondary }]}>• Quick start</Text>
                                <Text style={[styles.bullet, { color: theme.textSecondary }]}>• Simple scoreboard</Text>
                            </View>
                        </View>
                    </ScrollView>

                    <Button
                        title="Got it!"
                        onPress={onClose}
                        variant="primary"
                        size="medium"
                        style={styles.button}
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
        justifyContent: 'center',
        alignItems: 'center',
        padding: SPACING.lg,
    },
    container: {
        width: '100%',
        maxWidth: 400,
        borderRadius: BORDER_RADIUS.xl,
        padding: SPACING.lg,
        ...SHADOWS.medium,
        maxHeight: '80%',
    },
    title: {
        ...TYPOGRAPHY.h2,
        textAlign: 'center',
        marginBottom: SPACING.lg,
    },
    scrollContent: {
        paddingBottom: SPACING.md,
    },
    section: {
        marginBottom: SPACING.md,
    },
    modeTitle: {
        ...TYPOGRAPHY.h3,
        marginBottom: SPACING.xs,
    },
    description: {
        ...TYPOGRAPHY.body,
        marginBottom: SPACING.sm,
        lineHeight: 20,
    },
    bulletList: {
        marginLeft: SPACING.sm,
    },
    bullet: {
        ...TYPOGRAPHY.bodySmall,
        marginBottom: 2,
    },
    divider: {
        height: 1,
        marginVertical: SPACING.md,
    },
    button: {
        marginTop: SPACING.sm,
    },
});

export default ModeInfoModal;
