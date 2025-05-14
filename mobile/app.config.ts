import { ExpoConfig, ConfigContext } from "@expo/config";

export default ({ config }: ConfigContext): ExpoConfig => {
    return {
        ...config,
        name: "dutymate-mobile",
        slug: "dutymate-mobile",
        version: "1.0.0",
        orientation: "portrait",
        icon: "./assets/icon.png",
        userInterfaceStyle: "light",
        newArchEnabled: true,
        splash: {
            image: "./assets/splash-icon.png",
            resizeMode: "contain",
            backgroundColor: "#ffffff"
        },
        ios: {
            supportsTablet: true
        },
        android: {
            adaptiveIcon: {
                foregroundImage: "./assets/adaptive-icon.png",
                backgroundColor: "#ffffff"
            }
        },
        web: {
            favicon: "./assets/favicon.png"
        },
        extra: {
            url:
                process.env.APP_ENV === "production"
                    ? "https://dutymate.net"
                    : "http://localhost:5173",
            tutorialUrl: process.env.EXPO_PUBLIC_TUTORIAL_URL,
            youtubeUrl: process.env.EXPO_PUBLIC_YOUTUBE_URL,
        },
    };
};
