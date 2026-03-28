import { FastifyAdapter } from "../adapters/fastfy.adapter";

export class AppController {
    public constructor(private readonly fastify: FastifyAdapter) {
        this.registerRoutes();
    }

    private registerRoutes() {
        this.fastify.addRoute('GET', '/health', async (request, reply) => {
            reply.send({ status: 'ok', timestamp: new Date().toISOString() });
        }, {
            tags: ['System'],
            summary: 'Verifica o status da API',
            response: {
                200: {
                    type: 'object',
                    description: 'Estado atual do sistema',
                    properties: {
                        status: { 
                            type: 'string', 
                            description: 'Status operacional da API',
                            example: 'ok' 
                        },
                        timestamp: { 
                            type: 'string', 
                            format: 'date-time', 
                            description: 'Carimbo de data/hora atual no servidor',
                            example: '2026-03-28T22:00:00.000Z' 
                        }
                    }
                }
            }
        });
    }
}