import 'dotenv/config'

export const env = {
    environment: process.env.NODE_ENV || 'development',
    isProduction: () => env.environment === 'production',
    debug: () => env.environment === 'development',
    logLevel: (process.env.LOG_LEVEL || 'info') as 'fatal' | 'error' | 'warn' | 'info' | 'debug' | 'trace',
    port: parseInt(process.env.PORT || '3000'),
    domain: process.env.DOMAIN || 'localhost',
    jwt: {
        secret: process.env.JWT_SECRET!,
        expiresIn: process.env.JWT_EXPIRES_IN || '7d',
    },
    database: {
        host: process.env.DB_HOST || 'localhost',
        port: parseInt(process.env.DB_PORT || '5432'),
        user: process.env.DB_USER || 'postgres',
        password: process.env.DB_PASSWORD!,
        database: process.env.DB_NAME || 'agendaok',
    },
    redis: {
        host: process.env.REDIS_HOST || 'redis',
        port: parseInt(process.env.REDIS_PORT || '6379'),
        password: process.env.REDIS_PASSWORD || '',
    },
    evolution: {
        apiUrl: process.env.EVOLUTION_API_URL || 'http://evolution-api:8080',
        apiKey: process.env.EVO_API_KEY!,
        serverUrl: process.env.EVO_SERVER_URL || 'http://localhost:8080',
    },
    google: {
        clientId: process.env.GOOGLE_CLIENT_ID || '',
        clientSecret: process.env.GOOGLE_CLIENT_SECRET || '',
        redirectUri: process.env.GOOGLE_REDIRECT_URI || 'http://localhost:5173/auth/google/callback',
    },
    abacatePay: {
        token: process.env.ABACATE_PAY_TOKEN || '',
        baseUrl: process.env.ABACATE_PAY_URL || 'https://api.abacatepay.com/v1',
        planName: process.env.PLAN_NAME || 'ConfirmaZap Pro',
        planPrice: parseInt(process.env.PLAN_PRICE_CENTS || '4990'),
        webhookSecret: process.env.ABACATE_WEBHOOK_SECRET || '',
    }
}