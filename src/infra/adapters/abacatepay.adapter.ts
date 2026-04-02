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

        try {
            const logId = Math.random().toString(36).substring(7);
            console.log(`[AbacatePay][${logId}] Request: ${method} ${url}`);
            if (body) {
                console.log(`[AbacatePay][${logId}] Payload: ${JSON.stringify(body, null, 2)}`);
            }
            
            const response = await fetch(url, options);
            const responseText = await response.text();
            
            if (!response.ok) {
                console.error(`[AbacatePay][${logId}] API Error [${response.status}]: ${responseText}`);
                throw new Error(`AbacatePay API Error [${response.status}]: ${responseText}`);
            }

            console.log(`[AbacatePay][${logId}] Success Response: ${responseText}`);
            return JSON.parse(responseText);
        } catch (error: any) {
            console.error(`[AbacatePay] Error: ${error.message}`);
            throw error;
        }
    }

    async createCustomer(request: CreateCustomerRequest): Promise<{ id: string }> {
        try {
            const result: any = await this.request("/customer/create", "POST", request);
            return { id: result.data.id };
        } catch (error: any) {
            console.warn(`[AbacatePay] Customer creation failed or already exists. Attempting to proceed...`);
            throw error; 
        }
    }

    async getCustomer(id: string): Promise<any | null> {
        try {
            // v1 doesn't have a direct get endpoint, search in list
            const result: any = await this.request("/customer/list", "GET");
            if (!result.data || !Array.isArray(result.data)) return null;
            return result.data.find((c: any) => c.id === id) || null;
        } catch (error: any) {
            console.error(`[AbacatePay] Failed to verify customer ${id}:`, error.message);
            return null;
        }
    }


    async createSubscription(customerId: string, name: string, price: number, returnUrl: string, metadata?: Record<string, any>): Promise<{ id: string, url: string }> {
        return this.createBilling({
            customerId,
            name,
            price,
            description: `Assinatura ${name}`,
            externalId: `sub_${Date.now()}`,
            returnUrl,
            completionUrl: returnUrl,
            frequency: 'MULTIPLE_PAYMENTS',
            metadata
        });
    }

    async createBilling(request: CreateBillingRequest): Promise<{ id: string, url: string }> {
        const payload = {
            frequency: request.frequency || "ONE_TIME",
            methods: request.methods || ["PIX", "CARD"],
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
            customerId: request.customerId,
            metadata: request.metadata
        };

        const result: any = await this.request("/billing/create", "POST", payload);
        return { 
            id: result.data.id, 
            url: result.data.url 
        };
    }

    async getBilling(id: string): Promise<any> {
        const result: any = await this.request("/billing/list", "GET");
        if (!result.data || !Array.isArray(result.data)) return null;
        return result.data.find((b: any) => b.id === id) || null;
    }
}
