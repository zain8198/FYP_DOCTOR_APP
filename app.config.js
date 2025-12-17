module.exports = {
    expo: {
        name: "Doc On Call",
        slug: "doc-on-call",
        version: "1.0.0",
        orientation: "portrait",
        icon: "./assets/images/icon.png",
        scheme: "myapp",
        platforms: ["ios", "android"],
        userInterfaceStyle: "automatic",
        newArchEnabled: true,
        ios: {
            supportsTablet: true
        },
        android: {
            adaptiveIcon: {
                foregroundImage: "./assets/images/adaptive-icon.png",
                backgroundColor: "#ffffff"
            }
        },
        web: {
            bundler: "metro",
            output: "static",
            favicon: "./assets/images/favicon.png"
        },
        plugins: [
            "expo-router",
            [
                "expo-splash-screen",
                {
                    image: "./assets/images/splash-icon.png",
                    imageWidth: 200,
                    resizeMode: "contain",
                    backgroundColor: "#ffffff"
                }
            ]
        ],
        experiments: {
            typedRoutes: true
        },
        extra: {
            EXPO_PUBLIC_GEMINI_API_KEY: process.env.EXPO_PUBLIC_GEMINI_API_KEY,
            EXPO_PUBLIC_GEMINI_API_KEY_1: process.env.EXPO_PUBLIC_GEMINI_API_KEY_1,
            EXPO_PUBLIC_GEMINI_API_KEY_2: process.env.EXPO_PUBLIC_GEMINI_API_KEY_2,
            EXPO_PUBLIC_GEMINI_API_KEY_3: process.env.EXPO_PUBLIC_GEMINI_API_KEY_3,
            EXPO_PUBLIC_GEMINI_API_KEY_4: process.env.EXPO_PUBLIC_GEMINI_API_KEY_4,
            EXPO_PUBLIC_GEMINI_API_KEY_5: process.env.EXPO_PUBLIC_GEMINI_API_KEY_5,
            EXPO_PUBLIC_GEMINI_API_KEY_6: process.env.EXPO_PUBLIC_GEMINI_API_KEY_6,
            EXPO_PUBLIC_GEMINI_API_KEY_7: process.env.EXPO_PUBLIC_GEMINI_API_KEY_7,
            EXPO_PUBLIC_GEMINI_API_KEY_8: process.env.EXPO_PUBLIC_GEMINI_API_KEY_8,
            EXPO_PUBLIC_GEMINI_API_KEY_9: process.env.EXPO_PUBLIC_GEMINI_API_KEY_9,
            EXPO_PUBLIC_GEMINI_API_KEY_10: process.env.EXPO_PUBLIC_GEMINI_API_KEY_10
        }
    }
};
