export interface IEvolutionService {
    createInstance(instanceName: string): Promise<void>;
    sendText(instanceName: string, number: string, text: string): Promise<void>;
    setWebhook(instanceName: string, url: string): Promise<void>;
    logoutInstance(instanceName: string): Promise<void>;
    deleteInstance(instanceName: string): Promise<void>;
}
