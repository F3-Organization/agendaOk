import Fastify, { FastifyInstance, FastifyReply, FastifyRequest, HTTPMethods } from 'fastify'
import { fastifySwagger } from '@fastify/swagger'
import { fastifySwaggerUi } from '@fastify/swagger-ui'
import { env } from '../config/configs'

export class FastifyAdapter {
    private app: FastifyInstance;

    public constructor() {
        this.app = Fastify({
            logger: true,
            ajv: {
                customOptions: {
                    keywords: ['example']
                }
            }
        })
    }

    public async setup() {
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
                        url: `http://localhost:${env.port}`,
                        description: 'Servidor de Desenvolvimento Local' 
                    }
                ],
                tags: [
                    { name: 'Auth', description: 'Gerenciamento de autenticação via Google OAuth2' },
                    { name: 'Calendar', description: 'Operações de sincronização e tarefas de calendário' },
                    { name: 'Webhook', description: 'Receptores de eventos assíncronos (Evolution API)' },
                    { name: 'System', description: 'Monitoramento e status operacional' }
                ]
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

    // Remove the redundant ready method as it's part of the async setup

    public listen() {
        this.app.listen({
            port: env.port as number,
            host: '0.0.0.0'
        })
    }

}