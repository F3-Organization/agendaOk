import { FastifyAdapter } from "../adapters/fastfy.adapter";
import { GenerateGoogleAuthUrlUseCase } from "../../usecase/auth/generate-google-auth-url.usecase";
import { ExchangeGoogleCodeUseCase } from "../../usecase/auth/exchange-google-code.usecase";
import { UserRepository } from "../database/repositories/user.repository";
import { User } from "../database/entities/user.entity";

export class AuthController {
    // ID fixo para testes enquanto não temos sistema de login
    private static readonly TEST_USER_ID = "00000000-0000-0000-0000-000000000001";

    constructor(
        private readonly fastify: FastifyAdapter,
        private readonly generateAuthUrl: GenerateGoogleAuthUrlUseCase,
        private readonly exchangeCode: ExchangeGoogleCodeUseCase,
        private readonly userRepo: UserRepository
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
                // Garantir que o usuário de teste existe (Foreign Key constraint)
                await this.ensureTestUserExists();

                // Trocar código por tokens e salvar
                await this.exchangeCode.execute(AuthController.TEST_USER_ID, code);

                reply.send({
                    message: "Autenticação concluída com sucesso!",
                    details: "Os tokens foram salvos e a sincronização está ativa para o usuário de teste."
                });
            } catch (error: any) {
                reply.code(500).send({
                    error: "Falha na troca de tokens",
                    message: error.message
                });
            }
        }, {
            tags: ["Auth"],
            summary: "Callback de autenticação do Google",
            description: "Recebe o código de autorização do Google, troca por tokens de acesso/atualização e sincroniza o perfil do usuário de teste.",
            querystring: {
                type: 'object',
                required: ['code'],
                properties: {
                    code: { 
                        type: 'string', 
                        description: 'O código de autorização gerado pelo Google após o consentimento do usuário',
                        example: '4/0AdqtABC123...'
                    }
                }
            },
            response: {
                200: {
                    type: 'object',
                    description: 'Autenticação bem-sucedida',
                    properties: {
                        message: { 
                            type: 'string', 
                            example: 'Autenticação concluída com sucesso!',
                            description: 'Mensagem de confirmação' 
                        },
                        details: { 
                            type: 'string', 
                            example: 'Os tokens foram salvos...', 
                            description: 'Detalhes sobre o que foi processado' 
                        }
                    }
                },
                400: {
                    type: 'object',
                    description: 'Erro de Requisição (Falta o código)',
                    properties: {
                        error: { 
                            type: 'string', 
                            example: 'Code not provided by Google',
                            description: 'Descrição do erro de entrada'
                        }
                    }
                },
                500: {
                    type: 'object',
                    description: 'Erro Interno',
                    properties: {
                        error: { 
                            type: 'string', 
                            example: 'Falha na troca de tokens',
                            description: 'Categoria do erro'
                        },
                        message: { 
                            type: 'string', 
                            example: 'invalid_grant',
                            description: 'Mensagem técnica detalhada'
                        }
                    }
                }
            }
        });
    }

    private async ensureTestUserExists() {
        const user = await this.userRepo.findById(AuthController.TEST_USER_ID);
        if (!user) {
            const newUser = new User();
            newUser.id = AuthController.TEST_USER_ID;
            newUser.name = "Admin Teste";
            newUser.email = "admin@agendaok.com.br";
            newUser.googleId = "test-google-id";
            await this.userRepo.save(newUser);
        }
    }
}
