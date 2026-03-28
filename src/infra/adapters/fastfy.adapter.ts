import Fastify, { FastifyInstance, FastifyReply, FastifyRequest, HTTPMethods } from 'fastify'
import { fastifySwagger } from '@fastify/swagger'
import { fastifySwaggerUi } from '@fastify/swagger-ui'
import { fastifyJwt } from '@fastify/jwt'
import { fastifyCors } from '@fastify/cors'
import { fastifyHelmet } from '@fastify/helmet'
import { fastifyRateLimit } from '@fastify/rate-limit'
import { env } from '../config/configs'

export class FastifyAdapter {
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
            }
        })
    }

    public async setup() {
        // ── Segurança ──────────────────────────────────────────
        await this.app.register(fastifyCors, {
            origin: env.isProduction()
                ? [`https://${env.domain}`]
                : true,
            credentials: true
        });

        await this.app.register(fastifyHelmet, {
            contentSecurityPolicy: false // Desativado para permitir Swagger UI
        });

        await this.app.register(fastifyRateLimit, {
            max: 100,
            timeWindow: '1 minute',
            allowList: ['127.0.0.1'] // Localhost para health checks
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
                    title: 'AgendaOk API',
                    description: 'Solução SaaS pragmática para automação de agendamentos e notificações via WhatsApp integrando Google Calendar e Evolution API.',
                    version: '1.0.0',
                    contact: {
                        name: 'Suporte AgendaOk',
                        email: 'suporte@agendaok.com.br',
                        url: 'https://agendaok.com.br/contato'
                    },
                    license: {
                        name: 'MIT',
                        url: 'https://opensource.org/licenses/MIT'
                    }
                },
                externalDocs: {
                    description: 'Documentação Técnica Completa',
                    url: 'https://docs.agendaok.com.br'
                },
                servers: [
                    { 
                        url: env.isProduction() 
                            ? `https://${env.domain}` 
                            : `http://localhost:${env.port}`,
                        description: env.isProduction() 
                            ? 'Servidor de Produção' 
                            : 'Servidor de Desenvolvimento Local'
                    }
                ],
                tags: [
                    { name: 'Auth', description: 'Gerenciamento de autenticação via Google OAuth2' },
                    { name: 'Calendar', description: 'Operações de sincronização e tarefas de calendário' },
                    { name: 'Webhook', description: 'Receptores de eventos assíncronos (Evolution API)' },
                    { name: 'System', description: 'Monitoramento e status operacional' }
                ],
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
                deepLinking: false
            },
            staticCSP: true,
            transformStaticCSP: (header) => header
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

    public addRoute(
        method: HTTPMethods | HTTPMethods[],
        path: string,
        handler: (request: FastifyRequest, reply: FastifyReply) => void, schema?: any
    ) {
        this.app.route({
            method: method,
            url: `/api${path}`,
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
        const preHandlers = [this.app.authenticate];
        if (preHandler) {
            if (Array.isArray(preHandler)) {
                preHandlers.push(...preHandler);
            } else {
                preHandlers.push(preHandler);
            }
        }

        this.app.route({
            method: method,
            url: `/api${path}`,
            handler: handler,
            schema: {
                ...schema,
                security: [{ bearerAuth: [] }]
            },
            preHandler: preHandlers
        });
    }

    public sign(payload: any): string {
        return (this.app as any).jwt.sign(payload);
    }

    public decorate(name: string, fn: any) {
        this.app.decorate(name, fn);
    }

    public listen() {
        this.app.listen({
            port: env.port as number,
            host: '0.0.0.0'
        })
    }

}