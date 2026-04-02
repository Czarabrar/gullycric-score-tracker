// Main App Entry Point
import React, { useEffect, useState } from 'react';
import { StatusBar, View, Text, StyleSheet } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import LottieView from 'lottie-react-native';

import RootNavigator from './navigation/RootNavigator';
import { SoundManager } from './utils/soundManager';
import { COLORS, TYPOGRAPHY, SPACING } from './theme';

// Main App Component
export default function App() {
    return (
        <GestureHandlerRootView style={{ flex: 1 }}>
            <SafeAreaProvider>
                <StatusBar
                    barStyle="dark-content"
                    backgroundColor={COLORS.cream}
                    translucent={false}
                />
                <RootNavigator />
            </SafeAreaProvider>
        </GestureHandlerRootView>
    );
}
