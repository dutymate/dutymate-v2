export default ({ config }) => {
    return {
        ...config,
        extra: {
            url:
                process.env.APP_ENV === "production"
                    ? "https://dutymate.net"
                    : "http://localhost:5173",
        },
    };
};
