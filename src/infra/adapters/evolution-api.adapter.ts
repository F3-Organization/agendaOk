import { IEvolutionService } from "../../usecase/ports/ievolution-service";
import { env } from "../config/configs";

export class EvolutionApiAdapter implements IEvolutionService {
    private readonly baseUrl: string;
    private readonly apiKey: string;

    constructor() {
        this.baseUrl = env.evolution.apiUrl;
        this.apiKey = env.evolution.apiKey;
    }

    private async request<T = any>(path: string, method: string, body?: any): Promise<T> {
        const url = `${this.baseUrl}${path}`;
        
        const options: RequestInit = {
            method,
            headers: {
                "Content-Type": "application/json",
                "apikey": this.apiKey
            }
        };

        if (body) {
            options.body = JSON.stringify(body);
        }

        const response = await fetch(url, options);

        if (!response.ok) {
            const error = await response.text();
            throw new Error(`Evolution API Error [${response.status}]: ${error}`);
        }

        return await response.json() as T;
    }

    async createInstance(instanceName: string): Promise<void> {
        await this.request("/instance/create", "POST", {
            instanceName,
            token: "",
            integration: "WHATSAPP-BAILEYS"
        });
    }

    async connectInstance(instanceName: string): Promise<{ base64: string }> {
        const response = await this.request(`/instance/connect/${instanceName}`, "GET");
        return { base64: response.base64 || response.code }; 
    }

    async sendText(instanceName: string, number: string, text: string): Promise<void> {
        await this.request(`/message/sendText/${instanceName}`, "POST", {
            number,
            text
        });
    }

    async setWebhook(instanceName: string, url: string): Promise<void> {
        await this.request(`/webhook/set/${instanceName}`, "POST", {
            webhook: {
                enabled: true,
                url,
                events: [
                    "MESSAGES_UPSERT",
                    "MESSAGES_UPDATE"
                ]
            }
        });
    }

    async logoutInstance(instanceName: string): Promise<void> {
        await this.request(`/instance/logout/${instanceName}`, "DELETE");
    }

    async deleteInstance(instanceName: string): Promise<void> {
        await this.request(`/instance/delete/${instanceName}`, "DELETE");
    }
}
