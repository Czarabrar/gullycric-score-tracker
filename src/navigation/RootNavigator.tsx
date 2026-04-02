// Navigation setup for GullyTurf
import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { RootStackParamList } from './types';

// Screens
import HomeScreen from '../screens/Home';
import TossScreen from '../screens/Toss';
import MatchScreen from '../screens/Match';
import ResultScreen from '../screens/Result';
import MVPScreen from '../screens/MVP';
import SettingsScreen from '../screens/Settings';
import HistoryScreen from '../screens/History';
import SeriesProgressScreen from '../screens/SeriesProgress';
import SplashScreen from '../screens/Splash';
import PlayerSelectionScreen from '../screens/PlayerSelection';
import ProMatchSetupScreen from '../screens/ProMatchSetup';
import ScorecardScreen from '../screens/Scorecard'; // IMPORT ADDED



const Stack = createNativeStackNavigator<RootStackParamList>();

export default function RootNavigator() {
    return (
        <NavigationContainer>
            <Stack.Navigator
                initialRouteName="Splash"
                screenOptions={{
                    headerShown: false,
                    animation: 'slide_from_right',
                    animationDuration: 200,
                    gestureEnabled: true,
                    gestureDirection: 'horizontal',
                }}
            >
                <Stack.Screen
                    name="Splash"
                    component={SplashScreen}
                    options={{ headerShown: false }}
                />
                <Stack.Screen name="Home" component={HomeScreen} />
                <Stack.Screen
                    name="Toss"
                    component={TossScreen}
                    options={{ animation: 'fade' }}
                />
                <Stack.Screen name="Match" component={MatchScreen} />
                <Stack.Screen
                    name="Result"
                    component={ResultScreen}
                    options={{ animation: 'fade', gestureEnabled: false }}
                />
                <Stack.Screen name="MVP" component={MVPScreen} />
                <Stack.Screen
                    name="Settings"
                    component={SettingsScreen}
                    options={{ animation: 'slide_from_bottom' }}
                />
                <Stack.Screen
                    name="History"
                    component={HistoryScreen}
                    options={{ animation: 'slide_from_right' }}
                />
                <Stack.Screen
                    name="PlayerSelection"
                    component={PlayerSelectionScreen}
                    options={{ animation: 'slide_from_right' }}
                />
                <Stack.Screen
                    name="ProMatchSetup"
                    component={ProMatchSetupScreen}
                    options={{ animation: 'slide_from_bottom', gestureEnabled: false }}
                />
                <Stack.Screen
                    name="Scorecard"
                    component={ScorecardScreen}
                    options={{ animation: 'slide_from_bottom' }}
                />
            </Stack.Navigator>
        </NavigationContainer>
    );
}
