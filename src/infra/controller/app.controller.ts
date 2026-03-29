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
            summary: 'Checks the API status',
            response: {
                200: {
                    type: 'object',
                    description: 'Current system state',
                    properties: {
                        status: { 
                            type: 'string', 
                            description: 'API operational status',
                            example: 'ok' 
                        },
                        timestamp: { 
                            type: 'string', 
                            format: 'date-time', 
                            description: 'Current server timestamp',
                            example: '2026-03-28T22:00:00.000Z' 
                        }
                    }
                }
            }
        });
    }
}