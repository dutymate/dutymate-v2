import { ConfigContext, ExpoConfig } from "@expo/config";

export default ({config}: ConfigContext): ExpoConfig => {
    const iosUrlScheme = process.env.EXPO_PUBLIC_GOOGLE_IOS_URL_SCHEME;

    return {
        ...config,
        name: "듀티메이트",
        slug: "dutymate",
        version: "1.0.0",
        orientation: "portrait",
        icon: "./assets/images/icon.png",
        userInterfaceStyle: "light",
        newArchEnabled: true,
        splash: {
            image: "./assets/images/splash-icon.png",
            resizeMode: "contain",
            backgroundColor: "#ffffff"
        },
        ios: {
            supportsTablet: true,
            bundleIdentifier: "net.dutymate.app",
            infoPlist: {
                CFBundleURLTypes: [
                    {
                        CFBundleURLSchemes: [iosUrlScheme]
                    }
                ]
            },
            googleServicesFile: "./GoogleService-Info.plist"
        },
        android: {
            adaptiveIcon: {
                foregroundImage: "./assets/images/adaptive-icon.png",
                backgroundColor: "#ffffff"
            },
            package: "net.dutymate.app",
            googleServicesFile: "./google-services.json"
        },
        extra: {
            url:
                process.env.APP_ENV === "production"
                    ? process.env.EXPO_PUBLIC_PROD_URL
                    : process.env.EXPO_PUBLIC_DEV_URL,
            apiUrl:
                process.env.APP_ENV === "production"
                    ? process.env.EXPO_PUBLIC_PROD_API_URL
                    : process.env.EXPO_PUBLIC_DEV_API_URL,
            tutorialUrl: process.env.EXPO_PUBLIC_TUTORIAL_URL,
            youtubeUrl: process.env.EXPO_PUBLIC_YOUTUBE_URL
        },
        plugins: [
            [
                "expo-build-properties",
                {
                    "android": {
                        "extraMavenRepos": [
                            "https://devrepo.kakao.com/nexus/content/groups/public/"
                        ]
                    }
                }
            ],
            [
                "@react-native-kakao/core",
                {
                    "nativeAppKey": process.env.EXPO_PUBLIC_KAKAO_NATIVE_APP_KEY,
                    "android": {
                        authCodeHandlerActivity: true,
                    },
                    "ios": {
                        handleKakaoOpenUrl: true,
                    },
                }
            ],
            [
                "@react-native-google-signin/google-signin",
                {
                    iosUrlScheme,
                }
            ]
        ],
    };
};
