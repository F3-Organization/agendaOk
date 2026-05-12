export const en = {
    auth: {
        invalidCredentials: "Invalid credentials",
        userAlreadyExists: "User already exists",
        userNotFound: "User not found",
        invalidOrExpiredCode: "Invalid or expired verification code.",
        invalidOrExpiredToken: "Invalid or expired temporary token",
        invalidTokenStructure: "Invalid temporary token structure",
        invalid2FACode: "Invalid 2FA code",
    },

    user: {
        notFound: "User not found",
        twoFactorAlreadyActive: "2FA is already active. Disable it first to reconfigure.",
        currentPasswordRequired: "Current password is required to change the existing password",
        currentPasswordIncorrect: "Current password is incorrect",
        configNotFound: "User configuration not found",
    },

    company: {
        notFound: "Company not found",
        forbidden: "Forbidden",
        nameAlreadyExists: "A company with a similar name already exists",
        limitReached: "Company limit reached. {planName} plan allows up to {maxCompanies} company(ies). Please upgrade your plan.",
        configNotFound: "Company config not found",
    },

    bot: {
        whatsappRequired: "You must configure the company's WhatsApp number before enabling the bot.",
        descriptionRequired: "You must fill in the business description before enabling the bot.",
        defaultGreeting: "Hello! 👋 Welcome! How can I help you today?",
        defaultInstructions: "Be friendly and attentive. Help the customer with information about services, schedules, and appointments.",
    },

    professional: {
        notFound: "Professional not found",
    },

    appointment: {
        noPending: "No pending appointment found for this client",
    },

    subscription: {
        notFound: "No subscription found.",
        notCancellable: "Subscription is not in a cancellable state.",
        alreadyActive: "User already has an active subscription.",
        noPlan: "No purchasable plan available.",
        noCompany: "User has no company configured.",
        missingBillingInfo: "User must configure WhatsApp Number and Tax ID (CPF/CNPJ) before checkout.",
        paymentNotFound: "Payment not found",
    },

    error: {
        internal: "Internal server error",
        companyNotSelected: "Company not selected",
        validationFailed: "Validation failed",
    },
};
