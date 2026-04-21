import { CreateBillingRequest, CreateCustomerRequest, IPaymentGateway } from "../../usecase/ports/ipayment-gateway";
import { env } from "../config/configs";

export class AbacatePayAdapter implements IPaymentGateway {
    private readonly baseUrl: string;
    private readonly apiToken: string;
    // In-process cache: externalId → Abacate product ID
    private readonly productCache = new Map<string, string>();

    constructor() {
        this.baseUrl = env.abacatePay.baseUrl;
        this.apiToken = env.abacatePay.token;
    }

    private async request(path: string, method: string, body?: any) {
        const url = `${this.baseUrl}${path}`;
        const options: RequestInit = {
            method,
            headers: {
                "accept": "application/json",
                "authorization": `Bearer ${this.apiToken}`,
                "content-type": "application/json",
            },
        };
        if (body) options.body = JSON.stringify(body);

        const logId = Math.random().toString(36).substring(7);
        console.log(`[AbacatePay][${logId}] ${method} ${url}`);
        if (body) console.log(`[AbacatePay][${logId}] Body: ${JSON.stringify(body)}`);

        const response = await fetch(url, options);
        const text = await response.text();

        if (!response.ok) {
            console.error(`[AbacatePay][${logId}] Error [${response.status}]: ${text}`);
            throw new Error(`AbacatePay API Error [${response.status}]: ${text}`);
        }

        console.log(`[AbacatePay][${logId}] OK: ${text}`);
        return JSON.parse(text);
    }

    // ── Products ──────────────────────────────────────────────────────────

    private async getOrCreateProduct(
        externalId: string,
        name: string,
        priceInCents: number,
        cycle: "MONTHLY" | null = "MONTHLY"
    ): Promise<string> {
        if (this.productCache.has(externalId)) {
            return this.productCache.get(externalId)!;
        }

        // Try to find existing product by externalId
        try {
            const result = await this.request(
                `/products/get?externalId=${encodeURIComponent(externalId)}`,
                "GET"
            );
            if (result.data?.id) {
                this.productCache.set(externalId, result.data.id);
                console.log(`[AbacatePay] Reusing product ${result.data.id} for externalId=${externalId}`);
                return result.data.id;
            }
        } catch {
            // Not found or API error — will attempt creation
        }

        // Also try listing products to find by externalId (fallback)
        try {
            const listResult = await this.request(`/products/list?limit=100`, "GET");
            const existing = listResult.data?.find((p: any) => p.externalId === externalId);
            if (existing?.id) {
                this.productCache.set(externalId, existing.id);
                console.log(`[AbacatePay] Found product via list: ${existing.id} for externalId=${externalId}`);
                return existing.id;
            }
        } catch {
            // Ignore list errors
        }

        const created = await this.request("/products/create", "POST", {
            externalId,
            name,
            price: priceInCents,
            currency: "BRL",
            ...(cycle ? { cycle } : {}),
        });

        const productId: string = created.data.id;
        this.productCache.set(externalId, productId);
        console.log(`[AbacatePay] Created product ${productId} for externalId=${externalId}`);
        return productId;
    }

    // ── Customers ─────────────────────────────────────────────────────────

    async createCustomer(request: CreateCustomerRequest): Promise<{ id: string }> {
        const result = await this.request("/customers/create", "POST", {
            name: request.name,
            email: request.email,
            cellphone: request.cellphone,
            taxId: request.taxId,
        });
        return { id: result.data.id };
    }

    async getCustomer(id: string): Promise<any | null> {
        try {
            const result = await this.request(`/customers/get?id=${encodeURIComponent(id)}`, "GET");
            return result.data ?? null;
        } catch (error: any) {
            console.error(`[AbacatePay] Failed to fetch customer ${id}:`, error.message);
            return null;
        }
    }

    // ── Subscriptions (recurring) ─────────────────────────────────────────

    async createSubscription(
        customerId: string,
        name: string,
        price: number,
        returnUrl: string,
        metadata?: Record<string, any>
    ): Promise<{ id: string; url: string }> {
        const productExternalId = `plan-${name.toLowerCase().replace(/\s+/g, "-")}`;
        const productId = await this.getOrCreateProduct(productExternalId, name, price, "MONTHLY");

        const result = await this.request("/subscriptions/create", "POST", {
            items: [{ id: productId, quantity: 1 }],
            customerId,
            methods: ["CARD"],
            returnUrl,
            completionUrl: returnUrl,
            ...(metadata ? { metadata } : {}),
        });

        return { id: result.data.id, url: result.data.url };
    }

    // ── One-time billing (checkouts) ──────────────────────────────────────

    async createBilling(request: CreateBillingRequest): Promise<{ id: string; url: string }> {
        const productId = await this.getOrCreateProduct(
            request.externalId,
            request.name,
            request.price,
            null // one-time has no cycle
        );

        const result = await this.request("/checkouts/create", "POST", {
            items: [{ id: productId, quantity: 1 }],
            customerId: request.customerId,
            methods: request.methods ?? ["PIX", "CARD"],
            returnUrl: request.returnUrl,
            completionUrl: request.completionUrl,
            ...(request.metadata ? { metadata: request.metadata } : {}),
        });

        return { id: result.data.id, url: result.data.url };
    }

    async getBilling(id: string): Promise<any> {
        try {
            const result = await this.request(`/checkouts/get?id=${encodeURIComponent(id)}`, "GET");
            return result.data ?? null;
        } catch {
            return null;
        }
    }
}
