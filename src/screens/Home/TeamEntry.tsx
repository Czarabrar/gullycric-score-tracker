import React, { memo } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet } from 'react-native';
import { COLORS, SPACING, TYPOGRAPHY, SHADOWS, BORDER_RADIUS } from '../../theme';
import { TeamColor } from '../../store/matchStore';

interface HorizontalTeamVSProps {
    teamA: { name: string; color: TeamColor };
    teamB: { name: string; color: TeamColor };
    onTeamANameChange: (name: string) => void;
    onTeamBNameChange: (name: string) => void;
    onTeamAColorPress: () => void;
    onTeamBColorPress: () => void;
}
const ClassicTeamEntry: React.FC<HorizontalTeamVSProps> = memo(
    ({ teamA, teamB, onTeamANameChange, onTeamBNameChange, onTeamAColorPress, onTeamBColorPress }) => {
        return (
            <View style={classicStyles.container}>
                {/* Team A Input */}
                <View style={classicStyles.inputRow}>
                    <TouchableOpacity
                        style={[classicStyles.colorButton, { backgroundColor: teamA.color.primary }]}
                        onPress={onTeamAColorPress}
                    />
                    <TextInput
                        style={classicStyles.input}
                        value={teamA.name}
                        onChangeText={onTeamANameChange}
                        placeholder="Team A Name"
                        placeholderTextColor={COLORS.slate}
                        maxLength={25}
                    />
                </View>

                {/* VS Badge */}
                <View style={classicStyles.vsContainer}>
                    <Text style={classicStyles.vsText}>VS</Text>
                </View>

                {/* Team B Input */}
                <View style={classicStyles.inputRow}>
                    <TouchableOpacity
                        style={[classicStyles.colorButton, { backgroundColor: teamB.color.primary }]}
                        onPress={onTeamBColorPress}
                    />
                    <TextInput
                        style={classicStyles.input}
                        value={teamB.name}
                        onChangeText={onTeamBNameChange}
                        placeholder="Team B Name"
                        placeholderTextColor={COLORS.slate}
                        maxLength={25}
                    />
                </View>
            </View>
        );
    }
);

export default ClassicTeamEntry;

const classicStyles = StyleSheet.create({
    container: {
        marginBottom: SPACING.md,
        paddingHorizontal: SPACING.sm,
    },
    inputRow: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: COLORS.white,
        borderRadius: BORDER_RADIUS.md,
        padding: SPACING.sm,
        marginBottom: SPACING.xs,
        ...SHADOWS.soft,
    },
    colorButton: {
        width: 36,
        height: 36,
        borderRadius: BORDER_RADIUS.round,
        marginRight: SPACING.md,
        borderWidth: 2,
        borderColor: COLORS.cloud,
    },
    input: {
        flex: 1,
        ...TYPOGRAPHY.h3,
        color: COLORS.charcoal,
        fontSize: 18,
    },
    vsContainer: {
        alignItems: 'center',
        marginVertical: -10,
        zIndex: 10,
    },
    vsText: {
        ...TYPOGRAPHY.label,
        backgroundColor: COLORS.white,
        paddingHorizontal: SPACING.sm,
        paddingVertical: 2,
        borderRadius: BORDER_RADIUS.round,
        fontSize: 12,
        color: COLORS.slate,
        ...SHADOWS.soft,
    },
});
