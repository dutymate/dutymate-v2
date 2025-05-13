export default ({ config }) => {
    return {
        ...config,
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
