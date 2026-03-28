import Fastify, { FastifyInstance, FastifyReply, FastifyRequest, HTTPMethods } from 'fastify'
import { fastifySwagger } from '@fastify/swagger'
import { fastifySwaggerUi } from '@fastify/swagger-ui'
import { env } from '../config/configs'

export class FastifyAdapter {
    private app: FastifyInstance;

    public constructor() {
        this.app = Fastify({
            logger: true,
        })
        this.registerSwagger()
    }

    private registerSwagger() {
        this.app.register(fastifySwagger, {
            openapi: {
                info: {
                    title: 'AgendaOk API',
                    description: 'Solução SaaS pragmática para automação de agendamentos e notificações via WhatsApp.',
                    version: '1.0.0'
                },
                servers: [{ url: `http://localhost:${env.port}` }],
                tags: [
                    { name: 'Auth', description: 'Endpoints de autenticação com o Google' },
                    { name: 'Calendar', description: 'Endpoints de gerenciamento e sincronização de calendário' },
                    { name: 'Webhook', description: 'Recebimento de notificações da Evolution API' },
                    { name: 'System', description: 'Informações do sistema' }
                ]
            }
        })

        this.app.register(fastifySwaggerUi, {
            routePrefix: '/api/documentation',
            uiConfig: {
                docExpansion: 'list',
                deepLinking: false
            },
            staticCSP: true,
            transformStaticCSP: (header) => header
        })
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

    public listen() {
        this.app.listen({
            port: env.port as number,
        })
    }

}