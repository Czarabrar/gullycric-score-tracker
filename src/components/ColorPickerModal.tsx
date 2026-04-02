// Color Picker Modal - IPL Team Color Selection
import React, { memo } from 'react';
import {
    View,
    Text,
    StyleSheet,
    Modal,
    TouchableOpacity,
    ScrollView,
} from 'react-native';
import { COLORS, SPACING, TYPOGRAPHY, SHADOWS, BORDER_RADIUS } from '../theme';
import Card from './Card';

// IPL Team Colors (matching Home screen)
export const IPL_COLORS = [
    { id: 'mi', name: 'Mumbai', primary: '#004BA0', secondary: '#D1AB3E' },
    { id: 'csk', name: 'Chennai', primary: '#F9CD05', secondary: '#0081E9' },
    { id: 'rcb', name: 'Bangalore', primary: '#EC1C24', secondary: '#2B2A29' },
    { id: 'kkr', name: 'Kolkata', primary: '#3A225D', secondary: '#B3A123' },
    { id: 'dc', name: 'Delhi', primary: '#0078BC', secondary: '#EF1B23' },
    { id: 'pbks', name: 'Punjab', primary: '#DD1F2D', secondary: '#A7A9AC' },
    { id: 'rr', name: 'Rajasthan', primary: '#EA1A85', secondary: '#254AA5' },
    { id: 'srh', name: 'Hyderabad', primary: '#FF822A', secondary: '#000000' },
    { id: 'gt', name: 'Gujarat', primary: '#1C1C1C', secondary: '#A7894E' },
    { id: 'lsg', name: 'Lucknow', primary: '#A72056', secondary: '#FFCC00' },
    { id: 'black', name: 'Classic Black', primary: '#1C1C1C', secondary: '#FFFFFF' },
    { id: 'white', name: 'Classic White', primary: '#FFFFFF', secondary: '#1C1C1C' },
];

export interface TeamColor {
    id: string;
    name: string;
    primary: string;
    secondary: string;
}

interface ColorPickerModalProps {
    visible: boolean;
    onClose: () => void;
    onSelectColor: (color: TeamColor) => void;
    selectedColorId?: string;
    disabledColorId?: string;
    teamLabel?: string;
}

const ColorPickerModal: React.FC<ColorPickerModalProps> = memo(
    ({ visible, onClose, onSelectColor, selectedColorId, disabledColorId, teamLabel = 'Team' }) => {
        return (
            <Modal
                visible={visible}
                transparent
                animationType="fade"
                onRequestClose={onClose}
            >
                <View style={styles.overlay}>
                    <Card variant="elevated" padding="large" style={styles.modal}>
                        <Text style={styles.title}>🎨 Select {teamLabel} Color</Text>
                        <ScrollView
                            contentContainerStyle={styles.colorGrid}
                            showsVerticalScrollIndicator={false}
                        >
                            {IPL_COLORS.map((color) => {
                                const isSelected = color.id === selectedColorId;
                                const isDisabled = color.id === disabledColorId;

                                return (
                                    <TouchableOpacity
                                        key={color.id}
                                        style={[
                                            styles.colorOption,
                                            isSelected && styles.colorOptionSelected,
                                            isDisabled && styles.colorOptionDisabled,
                                        ]}
                                        onPress={() => {
                                            if (!isDisabled) {
                                                onSelectColor(color);
                                                onClose();
                                            }
                                        }}
                                        disabled={isDisabled}
                                    >
                                        <View style={styles.colorSwatchContainer}>
                                            <View
                                                style={[
                                                    styles.colorSwatch,
                                                    { backgroundColor: color.primary },
                                                ]}
                                            />
                                            <View
                                                style={[
                                                    styles.colorSwatchSecondary,
                                                    { backgroundColor: color.secondary },
                                                ]}
                                            />
                                        </View>
                                        <Text
                                            style={[
                                                styles.colorName,
                                                isDisabled && styles.colorNameDisabled,
                                            ]}
                                            numberOfLines={1}
                                        >
                                            {color.name}
                                        </Text>
                                        {isSelected && (
                                            <Text style={styles.checkMark}>✓</Text>
                                        )}
                                    </TouchableOpacity>
                                );
                            })}
                        </ScrollView>
                        <TouchableOpacity style={styles.closeButton} onPress={onClose}>
                            <Text style={styles.closeText}>Close</Text>
                        </TouchableOpacity>
                    </Card>
                </View>
            </Modal>
        );
    }
);

const styles = StyleSheet.create({
    overlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'center',
        alignItems: 'center',
        padding: SPACING.lg,
    },
    modal: {
        width: '100%',
        maxHeight: '80%',
    },
    title: {
        ...TYPOGRAPHY.h3,
        color: COLORS.charcoal,
        textAlign: 'center',
        marginBottom: SPACING.md,
    },
    colorGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'center',
        gap: SPACING.sm,
        paddingBottom: SPACING.md,
    },
    colorOption: {
        width: '45%',
        flexDirection: 'row',
        alignItems: 'center',
        padding: SPACING.sm,
        borderRadius: BORDER_RADIUS.md,
        backgroundColor: COLORS.cloud,
        gap: SPACING.sm,
    },
    colorOptionSelected: {
        backgroundColor: COLORS.mint,
        borderWidth: 2,
        borderColor: COLORS.steelBlue,
    },
    colorOptionDisabled: {
        opacity: 0.4,
    },
    colorSwatchContainer: {
        flexDirection: 'row',
        borderRadius: BORDER_RADIUS.sm,
        overflow: 'hidden',
    },
    colorSwatch: {
        width: 20,
        height: 28,
    },
    colorSwatchSecondary: {
        width: 10,
        height: 28,
    },
    colorName: {
        ...TYPOGRAPHY.bodySmall,
        color: COLORS.charcoal,
        flex: 1,
        fontWeight: '500',
    },
    colorNameDisabled: {
        color: COLORS.slate,
    },
    checkMark: {
        ...TYPOGRAPHY.body,
        color: COLORS.steelBlue,
        fontWeight: '700',
    },
    closeButton: {
        padding: SPACING.md,
        alignItems: 'center',
    },
    closeText: {
        ...TYPOGRAPHY.body,
        color: COLORS.slate,
    },
});

export default ColorPickerModal;
