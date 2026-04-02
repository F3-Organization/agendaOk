import 'dotenv/config'

export const env = {
    environment: process.env.NODE_ENV || 'development',
    isProduction: () => env.environment === 'production',
    debug: () => env.environment === 'development',
    logLevel: (process.env.LOG_LEVEL || 'info') as 'fatal' | 'error' | 'warn' | 'info' | 'debug' | 'trace',
    port: parseInt(process.env.PORT || '3000'),
    domain: process.env.DOMAIN || 'http://localhost:5173',
    appInternalUrl: process.env.APP_INTERNAL_URL || 'http://api:3000',
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
        systemBotInstance: process.env.SYSTEM_BOT_INSTANCE || 'AgendaOk-Admin',
        webhookUrl: `${process.env.APP_INTERNAL_URL || 'http://api:3000'}/api/webhook/evolution`,
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
    },
    smtp: {
        host: process.env.SMTP_HOST || 'localhost',
        port: parseInt(process.env.SMTP_PORT || '587'),
        user: process.env.SMTP_USER || '',
        pass: process.env.SMTP_PASS || '',
        from: process.env.SMTP_FROM || 'no-reply@agendaok.com.br',
    },
    company: {
        name: process.env.COMPANY_NAME || 'ConfirmaZap',
        cnpj: process.env.COMPANY_CNPJ || '00.000.000/0001-00',
        address: process.env.COMPANY_ADDRESS || 'Rua Exemplo, 123 - São Paulo/SP',
        supportWhatsapp: process.env.SUPPORT_WHATSAPP || '5595981035934',
    }
}