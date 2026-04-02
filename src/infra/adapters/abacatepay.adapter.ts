import { CreateBillingRequest, CreateCustomerRequest, IPaymentGateway } from "../../usecase/ports/ipayment-gateway";
import { env } from "../config/configs";

export class AbacatePayAdapter implements IPaymentGateway {
    private readonly baseUrl: string;
    private readonly apiToken: string;

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
                "content-type": "application/json"
            }
        };

        if (body) {
            options.body = JSON.stringify(body);
        }

        const response = await fetch(url, options);
        if (!response.ok) {
            const error = await response.text();
            throw new Error(`AbacatePay API Error [${response.status}]: ${error}`);
        }

        return await response.json();
    }

    async createCustomer(request: CreateCustomerRequest): Promise<{ id: string }> {
        const result: any = await this.request("/customers/create", "POST", request);
        return { id: result.data.id };
    }

    async findProductByName(name: string): Promise<any | null> {
        const result: any = await this.request("/products/list", "GET");
        return result.data.find((p: any) => p.name === name) || null;
    }

    async createProduct(name: string, price: number, cycle: string): Promise<{ id: string }> {
        const payload = {
            name,
            description: `Assinatura ${name}`,
            price,
            cycle, // WEEKLY, MONTHLY, SEMIANNUALLY, ANNUALLY
            externalId: `plan_${name.toLowerCase().replace(/\s/g, '_')}`
        };
        const result: any = await this.request("/products/create", "POST", payload);
        return { id: result.data.id };
    }

    async createSubscription(customerId: string, productId: string, returnUrl: string): Promise<{ id: string, url: string }> {
        const payload = {
            customerId,
            productId,
            methods: ["PIX", "CREDIT_CARD", "DEBIT_CARD"],
            returnUrl
        };
        const result: any = await this.request("/subscriptions/create", "POST", payload);
        return { 
            id: result.data.id, 
            url: result.data.url 
        };
    }

    async createBilling(request: CreateBillingRequest): Promise<{ id: string, url: string }> {
        // Fallback for one-off billing using v2
        const payload = {
            frequency: request.cycle ? "SUBSCRIPTION" : "ONE_TIME",
            methods: ["PIX", "CREDIT_CARD", "DEBIT_CARD"],
            products: [
                {
                    externalId: request.externalId,
                    name: request.name,
                    description: request.description,
                    quantity: 1,
                    price: request.price
                }
            ],
            returnUrl: request.returnUrl,
            completionUrl: request.completionUrl,
            customerId: request.customerId
        };

        const result: any = await this.request("/billing/create", "POST", payload);
        return { 
            id: result.data.id, 
            url: result.data.url 
        };
    }

    async getBilling(id: string): Promise<any> {
        const result: any = await this.request(`/billing/get?id=${id}`, "GET");
        return result.data;
    }
}
