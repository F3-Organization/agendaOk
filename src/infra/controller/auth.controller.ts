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
