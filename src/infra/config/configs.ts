import 'dotenv/config'

export const env = {
    environment: process.env.NODE_ENV || 'development',
    debug: () => env.environment === 'development',
    port: parseInt(process.env.PORT || '3000'),
    database: {
        host: process.env.DB_HOST || 'localhost',
        port: parseInt(process.env.DB_PORT || '5432'),
        user: process.env.DB_USER || 'postgres',
        password: process.env.DB_PASSWORD || 'postgres',
        database: process.env.DB_NAME || 'agendaok',
    },
    redis: {
        host: process.env.REDIS_HOST || 'redis',
        port: parseInt(process.env.REDIS_PORT || '6379'),
        password: process.env.REDIS_PASSWORD || '',
    },
    evolution: {
        apiUrl: process.env.EVOLUTION_API_URL || 'http://evolution-api:8080',
        apiKey: process.env.EVO_API_KEY || 'secure_global_key',
        serverUrl: process.env.EVO_SERVER_URL || 'http://localhost:8080',
    },
    google: {
        clientId: process.env.GOOGLE_CLIENT_ID || '',
        clientSecret: process.env.GOOGLE_CLIENT_SECRET || '',
        redirectUri: process.env.GOOGLE_REDIRECT_URI || 'http://localhost:3000/auth/google/callback',
    }
}