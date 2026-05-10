export interface EvolutionInstanceResponse {
    instance: {
        instanceName: string;
        instanceId: string;
        status: string;
    };
    hash: {
        apikey: string;
    };
    qrcode?: {
        code: string;
        base64: string;
    };
}

export interface EvolutionConnectResponse {
    instance: string;
    base64: string;
    code: string;
}

export interface IEvolutionService {
    createInstance(instanceName: string): Promise<EvolutionInstanceResponse>;
    connectInstance(instanceName: string): Promise<EvolutionConnectResponse>;
    fetchInstance(instanceName: string): Promise<{ instance: { status: string } }>;
    sendText(instanceName: string, number: string, text: string): Promise<string>;
    fetchInstanceToken(instanceName: string): Promise<string | null>;
    setWebhook(instanceName: string, url: string): Promise<void>;
    logoutInstance(instanceName: string): Promise<void>;
    deleteInstance(instanceName: string): Promise<void>;
    health(): Promise<boolean>;
}

