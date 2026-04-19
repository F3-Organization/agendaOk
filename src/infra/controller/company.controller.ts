import { FastifyReply, FastifyRequest } from "fastify";
import { FastifyAdapter } from "../adapters/fastfy.adapter";
import { ListCompaniesUseCase } from "../../usecase/company/list-companies.usecase";
import { CreateCompanyUseCase } from "../../usecase/company/create-company.usecase";
import { SelectCompanyUseCase } from "../../usecase/company/select-company.usecase";
import { UpdateCompanyUseCase } from "../../usecase/company/update-company.usecase";
import { DeleteCompanyUseCase } from "../../usecase/company/delete-company.usecase";
import { AuthUserPayload } from "../types/auth.types";
import { z } from "zod";

export class CompanyController {
    constructor(
        private readonly fastify: FastifyAdapter,
        private readonly listCompanies: ListCompaniesUseCase,
        private readonly createCompany: CreateCompanyUseCase,
        private readonly selectCompany: SelectCompanyUseCase,
        private readonly updateCompany: UpdateCompanyUseCase,
        private readonly deleteCompanyUc: DeleteCompanyUseCase
    ) {
        this.fastify.logInfo("[CompanyController] Initializing...");
        this.registerRoutes();
    }

    private registerRoutes() {
        // GET /companies - List user's companies
        this.fastify.addProtectedRoute("GET", "/companies", async (request: FastifyRequest, reply: FastifyReply) => {
            const user = request.user as AuthUserPayload;

            try {
                const result = await this.listCompanies.execute(user.id);
                reply.send(result);
            } catch (error: any) {
                reply.code(500).send({ error: "Failed to list companies", message: error.message });
            }
        });

        // POST /companies - Create a new company
        this.fastify.addProtectedRoute("POST", "/companies", async (request: FastifyRequest, reply: FastifyReply) => {
            const user = request.user as AuthUserPayload;
            const schema = z.object({
                name: z.string().min(1)
            });

            const parseResult = schema.safeParse(request.body);
            if (!parseResult.success) {
                return reply.code(400).send({ error: "Validation failed", details: parseResult.error.format() });
            }

            try {
                const company = await this.createCompany.execute({
                    ownerId: user.id,
                    name: parseResult.data.name
                });
                reply.code(201).send(company);
            } catch (error: any) {
                reply.code(400).send({ error: "Failed to create company", message: error.message });
            }
        });

        // POST /companies/:id/select - Select a company context
        this.fastify.addProtectedRoute("POST", "/companies/:id/select", async (request: FastifyRequest, reply: FastifyReply) => {
            const user = request.user as AuthUserPayload;
            const { id } = request.params as { id: string };

            try {
                const result = await this.selectCompany.execute({
                    userId: user.id,
                    companyId: id
                });
                reply.send(result);
            } catch (error: any) {
                if (error.message === "Forbidden") {
                    return reply.code(403).send({ error: "Forbidden", message: "You don't have access to this company" });
                }
                if (error.message === "Company not found") {
                    return reply.code(404).send({ error: "Company not found" });
                }
                reply.code(500).send({ error: "Failed to select company", message: error.message });
            }
        });

        // PATCH /companies/:id - Update company
        this.fastify.addProtectedRoute("PATCH", "/companies/:id", async (request: FastifyRequest, reply: FastifyReply) => {
            const user = request.user as AuthUserPayload;
            const { id } = request.params as { id: string };
            const schema = z.object({
                name: z.string().min(1)
            });

            const parseResult = schema.safeParse(request.body);
            if (!parseResult.success) {
                return reply.code(400).send({ error: "Validation failed", details: parseResult.error.format() });
            }

            try {
                await this.updateCompany.execute({
                    userId: user.id,
                    companyId: id,
                    name: parseResult.data.name
                });
                reply.send({ message: "Company updated successfully" });
            } catch (error: any) {
                if (error.message === "Forbidden") {
                    return reply.code(403).send({ error: "Forbidden", message: "You don't have access to this company" });
                }
                if (error.message === "Company not found") {
                    return reply.code(404).send({ error: "Company not found" });
                }
                reply.code(400).send({ error: "Failed to update company", message: error.message });
            }
        });

        // DELETE /companies/:id - Delete company
        this.fastify.addProtectedRoute("DELETE", "/companies/:id", async (request: FastifyRequest, reply: FastifyReply) => {
            const user = request.user as AuthUserPayload;
            const { id } = request.params as { id: string };

            try {
                await this.deleteCompanyUc.execute({
                    userId: user.id,
                    companyId: id
                });
                reply.send({ message: "Company deleted successfully" });
            } catch (error: any) {
                if (error.message === "Forbidden") {
                    return reply.code(403).send({ error: "Forbidden", message: "You don't have access to this company" });
                }
                if (error.message === "Company not found") {
                    return reply.code(404).send({ error: "Company not found" });
                }
                reply.code(400).send({ error: "Failed to delete company", message: error.message });
            }
        });
    }
}
