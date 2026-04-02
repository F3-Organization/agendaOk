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
    cycle?: 'WEEKLY' | 'MONTHLY' | 'SEMIANNUALLY' | 'ANNUALLY';
}

export interface IPaymentGateway {
    createCustomer(request: CreateCustomerRequest): Promise<{ id: string }>;
    createBilling(request: CreateBillingRequest): Promise<{ id: string, url: string }>;
    findProductByName(name: string): Promise<any | null>;
    createProduct(name: string, price: number, cycle: string): Promise<{ id: string }>;
    createSubscription(customerId: string, productId: string, returnUrl: string): Promise<{ id: string, url: string }>;
    getBilling(id: string): Promise<any>;
}
