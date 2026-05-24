module.exports = {
    // Editor UI port
    uiPort: process.env.PORT || 1880,

    // Encrypt flow credentials using the secret from the environment
    credentialSecret: process.env.NODE_RED_CREDENTIAL_SECRET,

    // Admin auth — requires NODE_RED_ADMIN_USERNAME and NODE_RED_ADMIN_PASSWORD_HASH in .env
    adminAuth: {
        type: "credentials",
        users: [
            {
                username: process.env.NODE_RED_ADMIN_USERNAME || "admin",
                password: process.env.NODE_RED_ADMIN_PASSWORD_HASH,
                permissions: "*"
            }
        ]
    },

    // Dashboard path
    ui: { path: "ui" },

    // Context storage — keep in memory (default); flows and global context do not persist restarts
    contextStorage: {
        default: { module: "memory" }
    },

    // Log level: fatal, error, warn, info, debug, trace
    logging: {
        console: {
            level: "info",
            metrics: false,
            audit: false
        }
    },

    // Editor theme
    editorTheme: {
        projects: {
            enabled: false
        }
    }
};
