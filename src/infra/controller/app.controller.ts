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
                    properties: {
                        status: { type: 'string' },
                        timestamp: { type: 'string', format: 'date-time' }
                    }
                }
            }
        });
    }
}