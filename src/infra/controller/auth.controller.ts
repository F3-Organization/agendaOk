import { FastifyAdapter } from "../adapters/fastfy.adapter";
import { GenerateGoogleAuthUrlUseCase } from "../../usecase/auth/generate-google-auth-url.usecase";
import { ExchangeGoogleCodeUseCase } from "../../usecase/auth/exchange-google-code.usecase";
import { UserRepository } from "../database/repositories/user.repository";
import { User } from "../database/entities/user.entity";
import { IGoogleCalendarService } from "../../usecase/ports/igoogle-calendar-service";

export class AuthController {
    constructor(
        private readonly fastify: FastifyAdapter,
        private readonly generateAuthUrl: GenerateGoogleAuthUrlUseCase,
        private readonly exchangeCode: ExchangeGoogleCodeUseCase,
        private readonly userRepo: UserRepository,
        private readonly googleService: IGoogleCalendarService
    ) {
        this.registerRoutes();
    }

    private registerRoutes() {
        // 1. Rota para iniciar o fluxo
        this.fastify.addRoute("GET", "/auth/google", async (request, reply) => {
            const url = this.generateAuthUrl.execute();
            reply.redirect(url);
        }, {
            tags: ["Auth"],
            summary: "Inicia o fluxo de autenticação com o Google",
            description: "Redireciona o usuário para a página de consentimento do Google OAuth2.",
            response: {
                302: {
                    type: 'object',
                    description: 'Redirecionamento para o Google'
                }
            }
        });

        // 2. Rota de callback do Google
        this.fastify.addRoute("GET", "/auth/google/callback", async (request, reply) => {
            const { code } = request.query as { code: string };

            if (!code) {
                return reply.code(400).send({ error: "Code not provided by Google" });
            }

            try {
                // Trocar código por tokens
                const tokens = await this.googleService.getTokens(code);
                
                // Buscar perfil do usuário no Google
                const profile = await this.googleService.getUserProfile(tokens.access_token);

                // Buscar ou criar o usuário local
                let user = await this.userRepo.findByGoogleId(profile.id);
                if (!user) {
                    user = new User();
                    user.googleId = profile.id;
                    user.email = profile.email;
                    user.name = profile.name;
                    user = await this.userRepo.save(user);
                }

                // Salvar os tokens do Google para o usuário (UserConfig)
                await this.exchangeCode.execute(user.id, code);

                // Gerar JWT do AgendaOk
                const token = this.fastify.sign({ 
                    id: user.id, 
                    email: user.email, 
                    name: user.name,
                    role: user.role 
                });

                reply.send({
                    message: "Autenticação concluída com sucesso!",
                    token,
                    user: {
                        id: user.id,
                        name: user.name,
                        email: user.email,
                        role: user.role
                    }
                });
            } catch (error: any) {
                console.error("[AuthController] Authentication failed:", error);
                reply.code(500).send({
                    error: "Falha na autenticação",
                    message: error.message
                });
            }
        }, {
            tags: ["Auth"],
            summary: "Callback de autenticação do Google",
            description: "Recebe o código do Google, cria/busca o usuário, salva os tokens e retorna um JWT para sessões futuras.",
            querystring: {
                type: 'object',
                required: ['code'],
                properties: {
                    code: { type: 'string' }
                }
            },
            response: {
                200: {
                    type: 'object',
                    properties: {
                        message: { type: 'string' },
                        token: { type: 'string' },
                        user: {
                            type: 'object',
                            properties: {
                                id: { type: 'string' },
                                name: { type: 'string' },
                                email: { type: 'string' },
                                role: { type: 'string' }
                            }
                        }
                    }
                }
            }
        });

        // 3. Rota para pegar dados do usuário logado
        this.fastify.addProtectedRoute("GET", "/auth/me", async (request, reply) => {
            const userId = (request.user as any).id;
            const user = await this.userRepo.findById(userId);
            
            if (!user) {
                return reply.code(404).send({ error: "User not found" });
            }

            reply.send({
                id: user.id,
                name: user.name,
                email: user.email,
                role: user.role
            });
        }, {
            tags: ["Auth"],
            summary: "Obtém dados do usuário autenticado",
            response: {
                200: {
                    type: 'object',
                    properties: {
                        id: { type: 'string' },
                        name: { type: 'string' },
                        email: { type: 'string' },
                        role: { type: 'string' }
                    }
                }
            }
        });
    }
}
