import { errorResponse } from "./_common.swagger";

export const listPlansSchema = {
    tags: ["Subscription"],
    summary: "Lists all active plans",
    response: {
        200: {
            type: "array" as const,
            items: {
                type: "object" as const,
                properties: {
                    id: { type: "string" as const },
                    slug: { type: "string" as const },
                    name: { type: "string" as const },
                    description: { type: "string" as const, nullable: true },
                    priceInCents: { type: "number" as const },
                    messageLimit: { type: "number" as const, nullable: true },
                    maxDevices: { type: "number" as const },
                    features: { type: "array" as const, items: { type: "string" as const } },
                    isPurchasable: { type: "boolean" as const },
                    sortOrder: { type: "number" as const }
                }
            }
        }
    }
};

export const listPaymentMethodsSchema = {
    tags: ["Subscription"],
    summary: "Lists all active payment methods",
    response: {
        200: {
            type: "array" as const,
            items: {
                type: "object" as const,
                properties: {
                    id: { type: "string" as const },
                    code: { type: "string" as const },
                    name: { type: "string" as const },
                    description: { type: "string" as const, nullable: true },
                    isActive: { type: "boolean" as const }
                }
            }
        }
    }
};

export const createPixSchema = {
    tags: ["Subscription"],
    summary: "Creates a transparent PIX QR code for PRO subscription payment",
    response: {
        200: {
            type: "object" as const,
            properties: {
                id: { type: "string" as const },
                brCode: { type: "string" as const },
                brCodeBase64: { type: "string" as const },
                amount: { type: "number" as const },
                status: { type: "string" as const },
                expiresAt: { type: "string" as const, nullable: true },
                planName: { type: "string" as const },
            }
        },
        400: { type: "object" as const, properties: { error: { type: "string" as const }, message: { type: "string" as const } } }
    }
};

export const getPixStatusSchema = {
    tags: ["Subscription"],
    summary: "Checks the payment status of a transparent PIX",
    params: {
        type: "object" as const,
        required: ["id"] as const,
        properties: { id: { type: "string" as const } }
    },
    response: {
        200: {
            type: "object" as const,
            properties: {
                id: { type: "string" as const },
                status: { type: "string" as const }
            }
        }
    }
};

export const cancelSubscriptionSchema = {
    tags: ["Subscription"],
    summary: "Cancels the current active subscription",
    response: {
        200: { type: "object" as const, properties: { status: { type: "string" as const } } },
        400: { type: "object" as const, properties: { error: { type: "string" as const }, message: { type: "string" as const } } }
    }
};

export const createCheckoutSchema = {
    tags: ["Subscription"],
    summary: "Creates a payment link for PRO subscription",
    response: {
        200: {
            type: "object" as const,
            properties: {
                url: { type: "string" as const },
                planName: { type: "string" as const },
                amount: { type: "number" as const }
            }
        },
        500: errorResponse("Checkout creation failed")
    }
};

export const getSubscriptionStatusSchema = {
    tags: ["Subscription"],
    summary: "Gets the current subscription status of the user",
    response: {
        200: {
            type: "object" as const,
            properties: {
                status: { type: "string" as const, enum: ["active", "inactive", "pending"] },
                plan: { type: "string" as const },
                currentPeriodEnd: { type: "string" as const, format: "date-time" },
                checkoutUrl: { type: "string" as const },
                amount: { type: "number" as const },
                planName: { type: "string" as const },
                taxId: { type: "string" as const, nullable: true },
                whatsappNumber: { type: "string" as const, nullable: true }
            }
        },
        500: errorResponse("Status retrieval failed")
    }
};

export const getPaymentHistorySchema = {
    tags: ["Subscription"],
    summary: "Gets the payment history of the user's subscription",
    response: {
        200: {
            type: "array" as const,
            items: {
                type: "object" as const,
                properties: {
                    id: { type: "string" as const },
                    status: { type: "string" as const },
                    amount: { type: "number" as const },
                    paidAt: { type: "string" as const, format: "date-time", nullable: true },
                    createdAt: { type: "string" as const, format: "date-time" },
                    checkoutUrl: { type: "string" as const },
                    paymentMethod: { type: "string" as const, nullable: true }
                }
            }
        },
        500: errorResponse("History retrieval failed")
    }
};

export const downloadInvoicePdfSchema = {
    tags: ["Subscription"],
    summary: "Downloads a PDF invoice for a specific payment",
    params: {
        type: "object" as const,
        required: ["id"] as const,
        properties: { id: { type: "string" as const } }
    },
    response: {
        200: { type: "string" as const, format: "binary" },
        500: errorResponse("PDF generation failed")
    }
};

export const abacatePayWebhookSchema = {
    tags: ["Webhook"],
    summary: "Abacate Pay event receiver",
    body: {
        type: "object" as const,
        required: ["event", "data"],
        properties: {
            event: { type: "string" as const },
            data: {
                type: "object" as const,
                required: ["id"],
                properties: { id: { type: "string" as const } }
            }
        }
    },
    response: {
        200: { type: "object" as const, properties: { status: { type: "string" as const } } },
        401: { type: "object" as const, properties: { error: { type: "string" as const } } }
    }
};
