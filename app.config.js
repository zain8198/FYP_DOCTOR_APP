module.exports = {
    expo: {
        name: "Doc On Call",
        slug: "doc-on-call",
        owner: "saxaco4508",
        version: "1.0.0",
        orientation: "portrait",
        icon: "./assets/images/icon.png",
        scheme: "myapp",
        platforms: ["ios", "android"],
        userInterfaceStyle: "automatic",
        newArchEnabled: true,
        ios: {
            supportsTablet: true,
            infoPlist: {
                NSCameraUsageDescription: "Allow $(PRODUCT_NAME) to access your camera for video consultations.",
                NSMicrophoneUsageDescription: "Allow $(PRODUCT_NAME) to access your microphone for video consultations."
            }
        },
        android: {
            package: "com.yovari9016.doconcall",
            adaptiveIcon: {
                foregroundImage: "./assets/images/adaptive-icon.png",
                backgroundColor: "#ffffff"
            },
            permissions: [
                "android.permission.CAMERA",
                "android.permission.RECORD_AUDIO",
                "android.permission.MODIFY_AUDIO_SETTINGS",
                "android.permission.ACCESS_NETWORK_STATE",
                "android.permission.INTERNET"
            ],
            googleServicesFile: "./google-services.json"
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
                    image: "./assets/images/s.png",
                    imageWidth: 200,
                    resizeMode: "contain",
                    backgroundColor: "#ffffff"
                }
            ],
            [
                "expo-notifications",
                {
                    "icon": "./assets/images/icon.png",
                    "color": "#ffffff",
                    "defaultChannel": "default"
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
            EXPO_PUBLIC_GEMINI_API_KEY_10: process.env.EXPO_PUBLIC_GEMINI_API_KEY_10,
            EXPO_PUBLIC_AGORA_APP_ID: "851a46a007a44b14ad9bd64dcffee372",
            eas: {
                projectId: "7fc0ddc8-b5a3-4efb-8220-dbe05cd9c241"
            }
        }
    }
};
