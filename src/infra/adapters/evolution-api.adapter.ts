import { 
    IEvolutionService, 
    EvolutionConnectResponse, 
    EvolutionInstanceResponse 
} from "../../usecase/ports/ievolution-service";
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
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 15000);

        const options: RequestInit = {
            method,
            headers: {
                "Content-Type": "application/json",
                "apikey": this.apiKey
            },
            signal: controller.signal
        };

        if (body) {
            options.body = JSON.stringify(body);
        }

        try {
            const response = await fetch(url, options);

            if (!response.ok) {
                const errorBody = await response.text();
                throw new Error(`Evolution API Error [${response.status}]: ${errorBody}`);
            }

            return await response.json() as T;
        } catch (error: any) {
            if (error.name === "AbortError") {
                throw new Error(`Evolution API Timeout (15s) calling ${path}`);
            }
            throw error;
        } finally {
            clearTimeout(timeoutId);
        }
    }

    async createInstance(instanceName: string): Promise<EvolutionInstanceResponse> {
        return await this.request<EvolutionInstanceResponse>("/instance/create", "POST", {
            instanceName,
            token: "",
            qrcode: true,
            integration: "WHATSAPP-BAILEYS"
        });
    }

    async fetchInstance(instanceName: string): Promise<{ instance: { status: string } }> {
        const response = await this.request<any>(`/instance/connectionState/${instanceName}`, "GET");
        return {
            instance: {
                status: response.instance.state || response.instance.status
            }
        };
    }

    async connectInstance(instanceName: string): Promise<EvolutionConnectResponse> {
        let retries = 3;
        
        while (retries > 0) {
            const response = await this.request<any>(`/instance/connect/${instanceName}`, "GET");

            if (response && response.count === 0 && !response.base64 && !response.code?.base64) {
                await new Promise(resolve => setTimeout(resolve, 2000));
                retries--;
                continue;
            }

            const base64 = response.base64 || response.code?.base64;
            const code = response.code?.code || response.code;

            if (base64) {
                return {
                    instance: instanceName,
                    base64,
                    code: typeof code === "string" ? code : JSON.stringify(code)
                };
            }

            break;
        }

        throw new Error("Não foi possível obter o QR Code da instância após várias tentativas.");
    }

    async sendText(instanceName: string, number: string, text: string): Promise<void> {
        const sanitizedNumber = this.sanitizeNumber(number);
        await this.request(`/message/sendText/${instanceName}`, "POST", {
            number: sanitizedNumber,
            text
        });
    }

    private sanitizeNumber(number: string): string {
        let cleaned = number.replace(/\D/g, "");
        
        // If it's a Brazilian number missing the country code (DDD + Number)
        if (cleaned.length >= 10 && cleaned.length <= 11 && !cleaned.startsWith("55")) {
            cleaned = `55${cleaned}`;
        }
        
        return cleaned;
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

    async health(): Promise<boolean> {
        try {
            // A basic check to see if the server responds
            await this.request("/instance/fetchInstances", "GET");
            return true;
        } catch (error) {
            return false;
        }
    }
}

