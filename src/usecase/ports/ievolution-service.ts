export interface IEvolutionService {
    createInstance(instanceName: string): Promise<void>;
    connectInstance(instanceName: string): Promise<{ base64: string }>;
    sendText(instanceName: string, number: string, text: string): Promise<void>;
    setWebhook(instanceName: string, url: string): Promise<void>;
    logoutInstance(instanceName: string): Promise<void>;
    deleteInstance(instanceName: string): Promise<void>;
}
