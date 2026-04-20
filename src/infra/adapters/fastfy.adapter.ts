import Fastify, { FastifyInstance, FastifyReply, FastifyRequest, HTTPMethods } from 'fastify'
import { fastifySwagger } from '@fastify/swagger'
import { fastifySwaggerUi } from '@fastify/swagger-ui'
import { fastifyJwt } from '@fastify/jwt'
import { fastifyCors } from '@fastify/cors'
import { fastifyHelmet } from '@fastify/helmet'
import { fastifyRateLimit } from '@fastify/rate-limit'
import { env } from '../config/configs'
import { ITokenService } from '../../usecase/ports/itoken-service'

export class FastifyAdapter implements ITokenService {
    private app: FastifyInstance;

    public constructor() {
        this.app = Fastify({
            logger: {
                level: env.logLevel
            },
            ajv: {
                customOptions: {
                    keywords: ['example']
                }
            },
            bodyLimit: 1048576 // 1MB
        })
    }

    public async setup() {
        // ── Segurança ──────────────────────────────────────────
        await this.app.register(fastifyCors, {
            origin: env.isProduction() 
                ? [`https://${env.domain}`] 
                : true, // Em dev, reflete a origem. Fundamental para CORS com credentials.
            methods: ['GET', 'PUT', 'POST', 'DELETE', 'OPTIONS', 'PATCH'],
            allowedHeaders: ['Content-Type', 'Authorization', 'apikey'],
            credentials: true
        });

        if (env.isProduction()) {
            await this.app.register(fastifyHelmet, {
                contentSecurityPolicy: false,
                crossOriginResourcePolicy: { policy: "same-origin" }
            });
        }

        await this.app.register(fastifyRateLimit, {
            max: 60,
            timeWindow: '1 minute',
            allowList: ['127.0.0.1']
        });

        await this.app.register(fastifyJwt, {
            secret: env.jwt.secret
        });

        this.app.decorate("authenticate", async (request: any, reply: any) => {
            try {
                await request.jwtVerify();
            } catch (err) {
                reply.send(err);
            }
        });

        // ── Documentação ───────────────────────────────────────
        await this.app.register(fastifySwagger, {
            mode: 'dynamic',
            openapi: {
                openapi: '3.0.0',
                info: {
                    title: 'ConfirmaZap API',
                    description: 'Solução SaaS pragmática para automação de agendamentos e notificações via WhatsApp integrando Google Calendar e Evolution API.',
                    version: '1.0.0',
                },
                components: {
                    securitySchemes: {
                        bearerAuth: {
                            type: 'http',
                            scheme: 'bearer',
                            bearerFormat: 'JWT'
                        }
                    }
                }
            }
        })

        await this.app.register(fastifySwaggerUi, {
            routePrefix: '/api/documentation',
            uiConfig: {
                docExpansion: 'list',
                deepLinking: false,
                validatorUrl: null
            },
            staticCSP: false
        })

        // ── Error Handler Global ───────────────────────────────
        this.app.setErrorHandler((error: any, request, reply) => {
            const statusCode = error.statusCode || 500;

            request.log.error({
                err: error,
                req: { method: request.method, url: request.url }
            });

            reply.code(statusCode).send({
                error: statusCode >= 500 ? 'Erro interno do servidor' : error.message,
                statusCode,
                ...(env.debug() && { stack: error.stack })
            });
        });

        await this.app.after();
    }

    public logInfo(msg: string, obj?: any) {
        this.app.log.info(obj ? { ...obj, msg } : msg);
    }

    public addRoute(
        method: HTTPMethods | HTTPMethods[],
        path: string,
        handler: (request: FastifyRequest, reply: FastifyReply) => void, schema?: any
    ) {
        const url = `/api${path}`;
        this.app.log.info({ method, url }, "[FastifyAdapter] Registering route");
        this.app.route({
            method: method,
            url: url,
            handler: handler,
            schema: schema
        });
    }

    public addProtectedRoute(
        method: HTTPMethods | HTTPMethods[],
        path: string,
        handler: (request: FastifyRequest, reply: FastifyReply) => void,
        schema?: any,
        preHandler?: any
    ) {
        const url = `/api${path}`;
        this.app.log.info({ method, url }, "[FastifyAdapter] Registering protected route");
        const preHandlers = [(this.app as any).authenticate];
        if (preHandler) {
            if (Array.isArray(preHandler)) {
                preHandlers.push(...preHandler);
            } else {
                preHandlers.push(preHandler);
            }
        }

        this.app.route({
            method: method,
            url: url,
            handler: handler,
            schema: {
                ...schema,
                security: [{ bearerAuth: [] }]
            },
            preHandler: preHandlers
        });
    }

    public addAdminRoute(
        method: HTTPMethods | HTTPMethods[],
        path: string,
        handler: (request: FastifyRequest, reply: FastifyReply) => void,
        schema?: any,
        additionalPreHandler?: any
    ) {
        const url = `/api${path}`;
        this.app.log.info({ method, url }, "[FastifyAdapter] Registering admin route");
        const preHandlers: any[] = [(this.app as any).authenticate];
        // adminMiddleware will be added by the controller
        if (additionalPreHandler) {
            if (Array.isArray(additionalPreHandler)) {
                preHandlers.push(...additionalPreHandler);
            } else {
                preHandlers.push(additionalPreHandler);
            }
        }

        this.app.route({
            method: method,
            url: url,
            handler: handler,
            schema: {
                ...schema,
                security: [{ bearerAuth: [] }]
            },
            preHandler: preHandlers
        });
    }

    public sign(payload: any, options?: any): string {
        return (this.app as any).jwt.sign(payload, options);
    }

    public signWithCompany(payload: { id: string; companyId: string }): string {
        return (this.app as any).jwt.sign(payload, { expiresIn: "7d" });
    }

    public verify(token: string): any {
        return (this.app as any).jwt.verify(token);
    }

    public decorate(name: string, fn: any) {
        this.app.decorate(name, fn);
    }

    public async listen(): Promise<string> {
        return this.app.listen({
            port: env.port as number,
            host: "0.0.0.0"
        });
    }
}