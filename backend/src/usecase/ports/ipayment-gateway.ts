export interface CreateCustomerRequest {
    name: string;
    email: string;
    cellphone: string;
    taxId: string;
}

export interface CreateBillingRequest {
    customerId: string;
    externalId: string;
    name: string;
    description: string;
    price: number;
    returnUrl: string;
    completionUrl: string;
    methods?: ('PIX' | 'CARD')[];
    metadata?: Record<string, any> | undefined;
    frequency?: 'ONE_TIME' | 'MULTIPLE_PAYMENTS';
}

export interface CreateTransparentPixRequest {
    amount: number;
    description?: string;
    expiresIn?: number;
    customer?: {
        name?: string;
        email?: string;
        taxId?: string;
        cellphone?: string;
    };
    metadata?: Record<string, any>;
}

export interface TransparentPixResponse {
    id: string;
    brCode: string;
    brCodeBase64: string;
    amount: number;
    status: string;
    expiresAt?: string;
}

export interface IPaymentGateway {
    createCustomer(request: CreateCustomerRequest): Promise<{ id: string }>;
    getCustomer(id: string): Promise<any | null>;
    createBilling(request: CreateBillingRequest): Promise<{ id: string, url: string }>;
    createSubscription(customerId: string, name: string, price: number, returnUrl: string, metadata?: Record<string, any>, gatewayProductId?: string | null): Promise<{ id: string, url: string, productId: string }>;
    getBilling(id: string): Promise<any>;
    createTransparentPix(request: CreateTransparentPixRequest): Promise<TransparentPixResponse>;
    getTransparentPix(id: string): Promise<{ id: string; status: string } | null>;
    cancelSubscription(billingId: string): Promise<void>;
}
