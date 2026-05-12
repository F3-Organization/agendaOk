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
        configUpdated: "Settings updated successfully",
        passwordChanged: "Password changed successfully",
        passwordSet: "Password set successfully",
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
        userNotFound: "User not found",
    },

    notification: {
        configNotFound: "User configuration not found",
    },

    error: {
        internal: "Internal server error",
        companyNotSelected: "Company not selected",
        validationFailed: "Validation failed",
    },

    whatsapp: {
        appointmentReminder:
            "🔔 *Appointment Reminder*\n\n" +
            "Hello, *{clientName}*! You have an appointment scheduled:\n\n" +
            "*{title}*\n" +
            "📅 {date} at {time}\n\n" +
            "Reply *YES* to confirm or *NO* to cancel.",
        confirmSuccess: "✅ Great! Your appointment has been confirmed successfully. We look forward to seeing you!",
        cancelSuccess: "❌ Alright, your appointment has been cancelled. Feel free to contact us to reschedule.",
        activationIntro:
            "🔔 *ConfirmaZap Activation*\n\n" +
            "Hello! To complete your account link and receive appointment alerts here, we need to validate your account.\n\n" +
            "👉 *Copy and send the next message below in this chat:*",
        activationSuccess: "✅ *Account linked successfully!*\n\nYou will now receive notifications directly here.",
        activationInvalid:
            "❌ *Invalid activation code.*\n\n" +
            "No account was found with this code. Please check that you copied it correctly from your dashboard and try again.",
    },

    email: {
        verification: {
            subject: "ConfirmaZap — Your verification code",
            heading: "Email verification",
            body: "Hello! Use the code below to verify your email address and set your password.",
            expiry: "This code is valid for <strong>15 minutes</strong>. If you did not request this, you can ignore this email.",
            support: "If you have any questions, please contact our support.",
        },
        payment: {
            subject: "✅ {planName} subscription activated successfully!",
            heading: "Welcome to {planName}, {userName}!",
            body: "Your payment has been confirmed. Your account now has full access to all plan features.",
            statusLabel: "Status",
            statusValue: "Active ✓",
            cta: "You can now set up your WhatsApp chatbot, add companies, and start automating your service.",
            nfseEmitted: "Your Service Invoice (NFS-e) has been successfully issued and will be sent to your email by the city hall.",
            nfsePending: "Your Service Invoice (NFS-e) is being processed by the city hall and will be sent to your email shortly.",
            button: "Go to dashboard",
            footer: "Thank you for choosing {companyName}. We are here if you need anything.",
        },
        expired: {
            subject: "Your subscription has expired — renew to continue",
            heading: "Hello, {userName}",
            body: "We noticed that your subscription payment deadline has expired or the checkout was cancelled.",
            highlight: "Your access to PRO plan features has been <strong>suspended</strong>. Your data is preserved and can be recovered upon renewal.",
            body2: "To continue automating your service, renew your subscription directly in the dashboard.",
            button: "Renew subscription",
            support: "Questions? Talk to us via WhatsApp support.",
        },
        refund: {
            subject: "Refund processed — confirmation",
            heading: "Hello, {userName}",
            body: "We confirm that your subscription refund has been successfully processed.",
            statusLabel: "Refund status",
            statusValue: "Processed ✓",
            accessLabel: "Premium access",
            accessValue: "Ended",
            warning: "If this action <strong>was not requested by you</strong>, please contact our support immediately via WhatsApp.",
            footer: "Thank you for using {companyName}.",
        },
        trial: {
            subject: "🎉 Your {planName} trial period has been activated!",
            heading: "Hello, {userName}!",
            body: "Your trial period for the <strong>{planName}</strong> plan has been successfully activated!",
            statusLabel: "Status",
            statusValue: "Trial Period",
            durationLabel: "Duration",
            durationValue: "{trialDays} days",
            billingLabel: "Billing",
            billingValue: "None during trial",
            highlight: "You have <strong>{trialDays} days</strong> to explore all features of the {planName} plan at no cost. Set up your bot, connect your WhatsApp, and get started now.",
            button: "Get started",
            nfseNote: "The NFS-e will only be issued after the first payment is confirmed at the end of the trial period.",
        },
        footer: {
            help: "Need help? Talk to us via",
            whatsapp: "WhatsApp",
            rights: "All rights reserved.",
        },
    },
};
