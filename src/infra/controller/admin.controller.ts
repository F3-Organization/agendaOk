import { FastifyReply, FastifyRequest } from "fastify";
import { FastifyAdapter } from "../adapters/fastfy.adapter";
import { adminMiddleware } from "../middleware/admin.middleware";
import { AppDataSource } from "../config/data-source";
import { User } from "../database/entities/user.entity";
import { Company } from "../database/entities/company.entity";
import { Subscription } from "../database/entities/subscription.entity";
import { Professional } from "../database/entities/professional.entity";
import { Schedule } from "../database/entities/schedule.entity";
import { Plan } from "../database/entities/plan.entity";
import { ILike } from "typeorm";
import { env } from "../config/configs";
import { z } from "zod";

export class AdminController {
    constructor(
        private readonly fastify: FastifyAdapter
    ) {
        this.registerRoutes();
    }

    private registerRoutes() {
        // Dashboard Stats
        this.fastify.addAdminRoute(
            "GET",
            "/admin/stats",
            async (request: FastifyRequest, reply: FastifyReply) => {
                const userRepo = AppDataSource.getRepository(User);
                const companyRepo = AppDataSource.getRepository(Company);
                const subRepo = AppDataSource.getRepository(Subscription);
                const professionalRepo = AppDataSource.getRepository(Professional);
                const scheduleRepo = AppDataSource.getRepository(Schedule);

                const [totalUsers, totalCompanies, totalProfessionals, totalAppointments] = await Promise.all([
                    userRepo.count(),
                    companyRepo.count(),
                    professionalRepo.count(),
                    scheduleRepo.count(),
                ]);

                const subscriptionsByPlan = await subRepo
                    .createQueryBuilder("s")
                    .select("s.plan", "plan")
                    .addSelect("s.status", "status")
                    .addSelect("COUNT(*)", "count")
                    .groupBy("s.plan")
                    .addGroupBy("s.status")
                    .getRawMany();

                const thirtyDaysAgo = new Date();
                thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

                const recentUsers: Array<{ date: string; count: string }> = await AppDataSource.query(
                    `SELECT DATE(created_at)::text AS date, COUNT(*) AS count
                     FROM users
                     WHERE created_at >= $1
                     GROUP BY DATE(created_at)
                     ORDER BY DATE(created_at) ASC`,
                    [thirtyDaysAgo]
                );

                const activeProSubs = await subRepo.count({
                    where: { plan: "PRO", status: "ACTIVE" as any }
                });

                return reply.send({
                    totalUsers,
                    totalCompanies,
                    totalProfessionals,
                    totalAppointments,
                    subscriptionsByPlan,
                    recentUsers,
                    activeProSubscriptions: activeProSubs,
                    estimatedMRR: activeProSubs * 10,
                });``
            },
            { tags: ["Admin"], summary: "Get admin dashboard statistics" },
            adminMiddleware
        );

        // List Users
        this.fastify.addAdminRoute(
            "GET",
            "/admin/users",
            async (request: FastifyRequest, reply: FastifyReply) => {
                const query = request.query as any;
                const search = (query.search as string) || "";
                const page = Math.max(1, parseInt(query.page || "1"));
                const limit = Math.min(Math.max(1, parseInt(query.limit || "20")), 50);
                const skip = (page - 1) * limit;

                const userRepo = AppDataSource.getRepository(User);
                const subRepo = AppDataSource.getRepository(Subscription);
                const companyRepo = AppDataSource.getRepository(Company);

                const qb = userRepo.createQueryBuilder("u")
                    .select(["u.id", "u.name", "u.email", "u.role", "u.createdAt", "u.googleId", "u.twoFactorEnabled"])
                    .orderBy("u.createdAt", "DESC")
                    .skip(skip)
                    .take(limit);

                if (search) {
                    qb.where("u.name ILIKE :search OR u.email ILIKE :search", { search: `%${search}%` });
                }

                const [users, total] = await qb.getManyAndCount();

                const enriched = await Promise.all(users.map(async (user) => {
                    const subscription = await subRepo.findOne({ where: { userId: user.id }, order: { createdAt: "DESC" } });
                    const companies = await companyRepo.find({ where: { ownerId: user.id } });
                    return {
                        id: user.id,
                        name: user.name,
                        email: user.email,
                        role: user.role,
                        createdAt: user.createdAt,
                        twoFactorEnabled: user.twoFactorEnabled,
                        subscription: subscription ? { plan: subscription.plan, status: subscription.status } : null,
                        companiesCount: companies.length,
                        companies: companies.map(c => ({ id: c.id, name: c.name })),
                        authMethod: user.googleId ? "google" : "email",
                    };
                }));

                return reply.send({
                    users: enriched,
                    pagination: { page, limit, total, totalPages: Math.ceil(total / limit) }
                });
            },
            { tags: ["Admin"], summary: "List all users" },
            adminMiddleware
        );

        // Get User Details
        this.fastify.addAdminRoute(
            "GET",
            "/admin/users/:id",
            async (request: FastifyRequest, reply: FastifyReply) => {
                const { id } = request.params as any;
                const userRepo = AppDataSource.getRepository(User);
                const subRepo = AppDataSource.getRepository(Subscription);
                const companyRepo = AppDataSource.getRepository(Company);

                const user = await userRepo.findOneBy({ id });
                if (!user) return reply.code(404).send({ error: "Usuário não encontrado" });

                const subscription = await subRepo.findOne({ where: { userId: user.id }, order: { createdAt: "DESC" } });
                const companies = await companyRepo.find({ where: { ownerId: user.id } });

                return reply.send({
                    id: user.id,
                    name: user.name,
                    email: user.email,
                    role: user.role,
                    createdAt: user.createdAt,
                    twoFactorEnabled: user.twoFactorEnabled,
                    authMethod: user.googleId ? "google" : "email",
                    subscription,
                    companies,
                });
            },
            { tags: ["Admin"], summary: "Get user details" },
            adminMiddleware
        );

        // Update User
        this.fastify.addAdminRoute(
            "PATCH",
            "/admin/users/:id",
            async (request: FastifyRequest, reply: FastifyReply) => {
                const { id } = request.params as any;
                const { plan, role } = request.body as any;

                const userRepo = AppDataSource.getRepository(User);
                const subRepo = AppDataSource.getRepository(Subscription);

                const user = await userRepo.findOneBy({ id });
                if (!user) return reply.code(404).send({ error: "Usuário não encontrado" });

                if (role && (role === "ADMIN" || role === "USER")) {
                    await userRepo.update(id, { role: role as "ADMIN" | "USER" });
                }

                if (plan) {
                    let sub = await subRepo.findOne({ where: { userId: id }, order: { createdAt: "DESC" } });
                    if (sub) {
                        sub.plan = plan;
                        sub.status = "ACTIVE" as any;
                        await subRepo.save(sub);
                    } else {
                        await subRepo.save(subRepo.create({
                            userId: id,
                            plan,
                            status: "ACTIVE" as any,
                        }));
                    }
                }

                return reply.send({ success: true });
            },
            { tags: ["Admin"], summary: "Update user role or plan" },
            adminMiddleware
        );

        // Impersonate User
        this.fastify.addAdminRoute(
            "POST",
            "/admin/users/:id/impersonate",
            async (request: FastifyRequest, reply: FastifyReply) => {
                const { id } = request.params as any;
                const userRepo = AppDataSource.getRepository(User);
                const companyRepo = AppDataSource.getRepository(Company);

                const user = await userRepo.findOneBy({ id });
                if (!user) return reply.code(404).send({ error: "Usuário não encontrado" });

                const companies = await companyRepo.find({ where: { ownerId: user.id }, order: { createdAt: "ASC" } });
                const firstCompany = companies[0];

                const payload: any = {
                    id: user.id,
                    email: user.email,
                    name: user.name,
                    role: user.role,
                };
                if (firstCompany) {
                    payload.companyId = firstCompany.id;
                }

                const token = this.fastify.sign(payload, { expiresIn: "2h" });

                return reply.send({
                    token,
                    user: { id: user.id, name: user.name, email: user.email, role: user.role },
                    companies: companies.map(c => ({ id: c.id, name: c.name })),
                });
            },
            { tags: ["Admin"], summary: "Impersonate a user" },
            adminMiddleware
        );

        // List Companies
        this.fastify.addAdminRoute(
            "GET",
            "/admin/companies",
            async (request: FastifyRequest, reply: FastifyReply) => {
                const query = request.query as any;
                const search = (query.search as string) || "";
                const page = Math.max(1, parseInt(query.page || "1"));
                const limit = Math.min(Math.max(1, parseInt(query.limit || "20")), 50);
                const skip = (page - 1) * limit;

                const companyRepo = AppDataSource.getRepository(Company);
                const subRepo = AppDataSource.getRepository(Subscription);
                const professionalRepo = AppDataSource.getRepository(Professional);

                const qb = companyRepo.createQueryBuilder("c")
                    .leftJoinAndSelect("c.owner", "owner")
                    .orderBy("c.createdAt", "DESC")
                    .skip(skip)
                    .take(limit);

                if (search) {
                    qb.where("c.name ILIKE :search OR owner.name ILIKE :search OR owner.email ILIKE :search", { search: `%${search}%` });
                }

                const [companies, total] = await qb.getManyAndCount();

                const enriched = await Promise.all(companies.map(async (company) => {
                    const subscription = await subRepo.findOne({ where: { userId: company.ownerId }, order: { createdAt: "DESC" } });
                    const professionalsCount = await professionalRepo.count({ where: { companyId: company.id } });
                    return {
                        id: company.id,
                        name: company.name,
                        slug: company.slug,
                        createdAt: company.createdAt,
                        owner: { id: company.owner.id, name: company.owner.name, email: company.owner.email },
                        subscription: subscription ? { plan: subscription.plan, status: subscription.status } : null,
                        professionalsCount,
                    };
                }));

                return reply.send({
                    companies: enriched,
                    pagination: { page, limit, total, totalPages: Math.ceil(total / limit) }
                });
            },
            { tags: ["Admin"], summary: "List all companies" },
            adminMiddleware
        );

        // ── Plans CRUD ──────────────────────────────────────────────────────

        const PlanBodySchema = z.object({
            slug: z.string().min(1).max(50).optional(),
            name: z.string().min(1).max(255),
            description: z.string().max(500).optional().nullable(),
            priceInCents: z.number().int().min(0),
            messageLimit: z.number().int().positive().nullable(),
            maxDevices: z.number().int().positive(),
            features: z.array(z.string()),
            isActive: z.boolean(),
            isPurchasable: z.boolean(),
            sortOrder: z.number().int().min(0),
        });

        this.fastify.addAdminRoute(
            "GET",
            "/admin/plans",
            async (_request: FastifyRequest, reply: FastifyReply) => {
                const planRepo = AppDataSource.getRepository(Plan);
                const plans = await planRepo.find({ order: { sortOrder: "ASC" } });
                return reply.send(plans);
            },
            { tags: ["Admin"], summary: "List all plans" },
            adminMiddleware
        );

        this.fastify.addAdminRoute(
            "POST",
            "/admin/plans",
            async (request: FastifyRequest, reply: FastifyReply) => {
                const parseResult = PlanBodySchema.required({ slug: true }).safeParse(request.body);
                if (!parseResult.success) {
                    return reply.code(400).send({ error: "Validation failed", details: parseResult.error.format() });
                }

                const planRepo = AppDataSource.getRepository(Plan);
                const existing = await planRepo.findOne({ where: { slug: parseResult.data.slug } });
                if (existing) return reply.code(409).send({ error: "Plan with this slug already exists" });

                const plan = await planRepo.save(planRepo.create(parseResult.data as any));
                return reply.code(201).send(plan);
            },
            { tags: ["Admin"], summary: "Create a new plan" },
            adminMiddleware
        );

        this.fastify.addAdminRoute(
            "PATCH",
            "/admin/plans/:id",
            async (request: FastifyRequest, reply: FastifyReply) => {
                const { id } = request.params as { id: string };
                const parseResult = PlanBodySchema.partial().safeParse(request.body);
                if (!parseResult.success) {
                    return reply.code(400).send({ error: "Validation failed", details: parseResult.error.format() });
                }

                const planRepo = AppDataSource.getRepository(Plan);
                const plan = await planRepo.findOneBy({ id });
                if (!plan) return reply.code(404).send({ error: "Plan not found" });

                await planRepo.save({ ...plan, ...(parseResult.data as any) });
                return reply.send(await planRepo.findOneBy({ id }));
            },
            { tags: ["Admin"], summary: "Update a plan" },
            adminMiddleware
        );

        this.fastify.addAdminRoute(
            "DELETE",
            "/admin/plans/:id",
            async (request: FastifyRequest, reply: FastifyReply) => {
                const { id } = request.params as { id: string };
                const planRepo = AppDataSource.getRepository(Plan);
                const plan = await planRepo.findOneBy({ id });
                if (!plan) return reply.code(404).send({ error: "Plan not found" });

                await planRepo.remove(plan);
                return reply.code(204).send();
            },
            { tags: ["Admin"], summary: "Delete a plan" },
            adminMiddleware
        );
    }
}
