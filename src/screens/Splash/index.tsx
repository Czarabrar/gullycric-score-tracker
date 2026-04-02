import React, { useCallback } from 'react';
import { StyleSheet, StatusBar, View, Dimensions, Text } from 'react-native';
import Video from 'react-native-video';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import Animated, {
    useSharedValue,
    useAnimatedStyle,
    withTiming,
    withDelay
} from 'react-native-reanimated';
import { RootStackParamList } from '../../navigation/types';
import { COLORS, TYPOGRAPHY, SPACING } from '../../theme';
import { SoundManager } from '../../utils/soundManager';

type SplashNavigationProp = NativeStackNavigationProp<RootStackParamList, 'Splash'>;

const { width } = Dimensions.get('window');

export default function SplashScreen() {
    const navigation = useNavigation<SplashNavigationProp>();

    const opacity = useSharedValue(0);

    React.useEffect(() => {
        SoundManager.preload();
    }, []);

    const animatedTextStyle = useAnimatedStyle(() => ({
        opacity: opacity.value,
        transform: [{ translateY: withTiming(opacity.value * 0, { duration: 1000 }) }] // Placeholder for future motion
    }));

    const handleVideoLoad = useCallback(() => {
        opacity.value = withDelay(500, withTiming(1, { duration: 1000 }));
    }, [opacity]);

    const handleVideoEnd = useCallback(() => {
        // Navigate to Home and reset stack so user can't go back to splash
        navigation.reset({
            index: 0,
            routes: [{ name: 'Home' }],
        });
    }, [navigation]);

    const handleError = useCallback((e: any) => {
        console.warn('Splash Video Error:', e);
        // Fallback to Home if video fails
        navigation.reset({
            index: 0,
            routes: [{ name: 'Home' }],
        });
    }, [navigation]);

    return (
        <View style={styles.container}>
            <StatusBar hidden />
            <View style={styles.videoWrapper}>
                <Video
                    source={require('../../assets/video/splash.mp4')}
                    style={styles.backgroundVideo}
                    resizeMode="contain"
                    onLoad={handleVideoLoad}
                    onEnd={handleVideoEnd}
                    onError={handleError}
                    ignoreSilentSwitch="ignore"
                    playInBackground={false}
                    playWhenInactive={false}
                    controls={false}
                    repeat={false}
                />
            </View>
            <Animated.View style={[styles.brandingContainer, animatedTextStyle]}>
                <Text style={styles.brandingText}>GullyTurf</Text>
                <Text style={styles.brandingSubtext}>CRICKET SCORING MADE EASY</Text>
            </Animated.View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#fff',
        justifyContent: 'center',
        alignItems: 'center',
    },
    videoWrapper: {
        width: '100%',
        aspectRatio: 9 / 16, // Typical mobile video aspect
        transform: [{ scale: 0.9 }], // Zoom out by 30-40%
    },
    backgroundVideo: {
        flex: 1,
        backgroundColor: '#fff',
    },
    brandingContainer: {
        position: 'absolute',
        bottom: SPACING.xxl,
        alignItems: 'center',
    },
    brandingText: {
        ...TYPOGRAPHY.h1,
        color: COLORS.charcoal,
        letterSpacing: 2,
        fontSize: 32,
    },
    brandingSubtext: {
        ...TYPOGRAPHY.label,
        color: COLORS.slate,
        marginTop: SPACING.xs,
        letterSpacing: 4,
    },
});
