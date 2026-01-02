import React, { useEffect } from 'react';
import { StyleSheet, View } from 'react-native';
import { SPLASH_BASE64 } from '../constants/SplashIconBase64';
import Animated, {
    useSharedValue,
    useAnimatedStyle,
    withTiming,
    withSequence,
    withDelay,
    runOnJS,
    Easing
} from 'react-native-reanimated';

// Removed require call to avoid Metro asset bundling issues
const SPLASH_ICON = { uri: SPLASH_BASE64 };

interface AnimatedSplashScreenProps {
    onAnimationFinish: () => void;
}

export default function AnimatedSplashScreen({ onAnimationFinish }: AnimatedSplashScreenProps) {
    const opacity = useSharedValue(1);
    const scale = useSharedValue(1);

    const animatedStyle = useAnimatedStyle(() => {
        return {
            opacity: opacity.value,
            transform: [{ scale: scale.value }]
        };
    });

    const containerStyle = useAnimatedStyle(() => {
        return {
            opacity: opacity.value
        }
    });

    useEffect(() => {
        // Start animation sequence
        // 1. Wait a tiny bit (simulating load or just holding the logo)
        // 2. Scale up slightly (Zoom in effect)
        // 3. Fade out
        scale.value = withDelay(500, withTiming(1.5, { duration: 1000, easing: Easing.out(Easing.exp) }));

        opacity.value = withDelay(
            1000,
            withTiming(0, { duration: 500 }, (finished) => {
                if (finished) {
                    runOnJS(onAnimationFinish)();
                }
            })
        );
    }, []);

    return (
        <Animated.View style={[styles.container, containerStyle]}>
            <Animated.Image
                source={SPLASH_ICON}
                style={[styles.image, animatedStyle]}
                resizeMode="contain"
            />
        </Animated.View>
    );
}

const styles = StyleSheet.create({
    container: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: '#ffffff',
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 99999, // Ensure it sits on top of everything
    },
    image: {
        width: 200, // Matching app.json splash.imageWidth
        height: 200,
    },
});
