import { FastifyAdapter } from "../adapters/fastfy.adapter";
import { GenerateGoogleAuthUrlUseCase } from "../../usecase/auth/generate-google-auth-url.usecase";
import { ExchangeGoogleCodeUseCase } from "../../usecase/auth/exchange-google-code.usecase";
import { UserRepository } from "../database/repositories/user.repository";
import { User } from "../database/entities/user.entity";
import { IGoogleCalendarService } from "../../usecase/ports/igoogle-calendar-service";
import { z } from "zod";
import { AuthMeResponseSchema, LoginResponseSchema } from "@shared/schemas/auth.schema";

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
        this.fastify.addRoute("GET", "/auth/google", async (request, reply) => {
            const url = this.generateAuthUrl.execute();
            reply.redirect(url);
        }, {
            tags: ["Auth"],
            summary: "Starts the Google authentication flow",
            description: "Redirects the user to the Google OAuth2 consent page.",
            response: {
                302: {
                    type: 'object',
                    description: 'Redirect to Google'
                }
            }
        });

        this.fastify.addRoute("GET", "/auth/google/callback", async (request, reply) => {
            const callbackSchema = z.object({
                code: z.string().min(1)
            });

            const parseResult = callbackSchema.safeParse(request.query);
            
            if (!parseResult.success) {
                return reply.code(400).send({ 
                    error: "Invalid request", 
                    details: parseResult.error.format() 
                });
            }

            const { code } = parseResult.data;

            try {
                const tokens = await this.googleService.getTokens(code);
                
                const profile = await this.googleService.getUserProfile(tokens.access_token);

                let user = await this.userRepo.findByGoogleId(profile.id);
                if (!user) {
                    user = new User();
                    user.googleId = profile.id;
                    user.email = profile.email;
                    user.name = profile.name;
                    user = await this.userRepo.save(user);
                }

                await this.exchangeCode.execute(user.id, tokens);

                const token = this.fastify.sign({ 
                    id: user.id, 
                    email: user.email, 
                    name: user.name,
                    role: user.role 
                });

                reply.send({
                    message: "Authentication successful!",
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
                    error: "Authentication failure",
                    message: error.message
                });
            }
        }, {
            tags: ["Auth"],
            summary: "Google authentication callback",
            description: "Receives the code from Google, creates/finds the user, saves tokens, and returns a JWT for future sessions.",
            querystring: {
                type: 'object',
                required: ['code'],
                properties: {
                    code: { type: 'string' }
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
            summary: "Obtém dados do usuário autenticado"
        });
    }
}
