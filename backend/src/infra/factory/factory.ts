import { FastifyAdapter } from "../adapters/fastfy.adapter";
import { EvolutionApiAdapter } from "../adapters/evolution-api.adapter";
import { GoogleAuthAdapter } from "../adapters/google-auth.adapter";
import { AbacatePayAdapter } from "../adapters/abacatepay.adapter";
import { BrasilNFeAdapter } from "../adapters/brasil-nfe.adapter";
import { GeminiAdapter } from "../adapters/gemini.adapter";
import { adminMiddleware } from "../middleware/admin.middleware";
import { AppController } from "../controller/app.controller";
import { AdminController } from "../controller/admin.controller";
import { AuthController } from "../controller/auth.controller";
import { CompanyController } from "../controller/company.controller";
import { EvolutionWebhookController } from "../controller/evolution-webhook.controller";
import { SubscriptionController } from "../controller/subscription.controller";
import { ProfessionalController } from "../controller/professional.controller";
import { AppointmentController } from "../controller/appointment.controller";
import { GetUserConfigUseCase } from "../../usecase/user/get-user-config.usecase";
import { UpdateUserConfigUseCase } from "../../usecase/user/update-user-config.usecase";
import { ChangePasswordUseCase } from "../../usecase/user/change-password.usecase";
import { SetPasswordUseCase } from "../../usecase/user/set-password.usecase";
import { Toggle2FAUseCase } from "../../usecase/user/toggle-2fa.usecase";
import { Verify2FAUseCase } from "../../usecase/user/verify-2fa.usecase";
import { Validate2FAUseCase } from "../../usecase/user/validate-2fa.usecase";
import { UserController } from "../controller/user.controller";
import { UserRepository } from "../database/repositories/user.repository";
import { CompanyRepository } from "../database/repositories/company.repository";
import { CompanyConfigRepository } from "../database/repositories/company-config.repository";
import { ClientRepository } from "../database/repositories/client.repository";
import { ScheduleRepository } from "../database/repositories/schedule.repository";
import { UserConfigRepository } from "../database/repositories/user-config.repository";
import { SubscriptionRepository } from "../database/repositories/subscription.repository";
import { SubscriptionPaymentRepository } from "../database/repositories/subscription-payment.repository";
import { ProfessionalRepository } from "../database/repositories/professional.repository";
import { PlanRepository } from "../database/repositories/plan.repository";
import { PaymentMethodRepository } from "../database/repositories/payment-method.repository";
import { WebhookAuditLogRepository } from "../database/repositories/webhook-audit-log.repository";
import { GenerateGoogleAuthUrlUseCase } from "../../usecase/auth/generate-google-auth-url.usecase";
import { HandleEvolutionWebhookUseCase } from "../../usecase/notification/handle-evolution-webhook.usecase";
import { CreateSubscriptionCheckoutUseCase } from "../../usecase/subscription/create-checkout.usecase";
import { HandleAbacatePayWebhookUseCase } from "../../usecase/subscription/handle-abacate-webhook.usecase";
import { GetSubscriptionPaymentHistoryUseCase } from "../../usecase/subscription/get-payment-history.usecase";
import { GenerateInvoicePdfUseCase } from "../../usecase/subscription/generate-invoice-pdf.usecase";
import { ConnectWhatsappUseCase } from "../../usecase/notification/connect-whatsapp.usecase";
import { DisconnectWhatsappUseCase } from "../../usecase/notification/disconnect-whatsapp.usecase";
import { GetWhatsappStatusUseCase } from "../../usecase/notification/get-whatsapp-status.usecase";
import { WhatsappController } from "../controller/whatsapp.controller";
import { DashboardController } from "../controller/dashboard.controller";
import { GetDashboardStatsUseCase } from "../../usecase/dashboard/get-dashboard-stats.usecase";
import { GetAppointmentsUseCase } from "../../usecase/appointment/get-appointments.usecase";
import { CreateAppointmentUseCase } from "../../usecase/appointment/create-appointment.usecase";
import { UpdateAppointmentUseCase } from "../../usecase/appointment/update-appointment.usecase";
import { DeleteAppointmentUseCase } from "../../usecase/appointment/delete-appointment.usecase";
import { ConfirmAppointmentUseCase } from "../../usecase/appointment/confirm-appointment.usecase";
import { CancelAppointmentUseCase } from "../../usecase/appointment/cancel-appointment.usecase";
import { NotifyUpcomingAppointmentsUseCase } from "../../usecase/appointment/notify-upcoming-appointments.usecase";
import { RegisterUserUseCase } from "../../usecase/auth/register-user.usecase";
import { LoginUseCase } from "../../usecase/auth/login.usecase";
import { AuthenticateGoogleUseCase } from "../../usecase/auth/authenticate-google.usecase";
import { LoginVerify2FAUseCase } from "../../usecase/auth/login-verify-2fa.usecase";
import { GetSubscriptionStatusUseCase } from "../../usecase/subscription/get-subscription-status.usecase";
import { CheckUsageLimitUseCase } from "../../usecase/subscription/check-usage-limit.usecase";
import { CreateCompanyUseCase } from "../../usecase/company/create-company.usecase";
import { ListCompaniesUseCase } from "../../usecase/company/list-companies.usecase";
import { SelectCompanyUseCase } from "../../usecase/company/select-company.usecase";
import { UpdateCompanyUseCase } from "../../usecase/company/update-company.usecase";
import { DeleteCompanyUseCase } from "../../usecase/company/delete-company.usecase";
import { ManageProfessionalsUseCase } from "../../usecase/company/manage-professionals.usecase";
import { ManageBotConfigUseCase } from "../../usecase/company/manage-bot-config.usecase";
import { ConversationService } from "../../usecase/chatbot/conversation.service";

import { NotifyQueue } from "../queue/notify.queue";
import { NotifyWorker } from "../queue/notify.worker";
import { SubscriptionQueue } from "../queue/subscription.queue";
import { SubscriptionWorker } from "../queue/subscription.worker";
import { subscriptionMiddleware } from "../middleware/subscription.middleware";
import { usageLimitMiddleware } from "../middleware/usage-limit.middleware";
import { NodemailerAdapter } from "../adapters/nodemailer.adapter";
import { RedisService } from "../database/redis.service";
import { SendEmailVerificationUseCase } from "../../usecase/auth/send-email-verification.usecase";
import { VerifyEmailSetPasswordUseCase } from "../../usecase/auth/verify-email-set-password.usecase";
import { GetHealthStatusUseCase } from "../../usecase/system/get-health-status.usecase";
import { SubscriptionNotificationService } from "../../usecase/subscription/subscription-notification.service";
import { FiscalService } from "../../usecase/subscription/fiscal.service";
import { CheckExpiredSubscriptionsUseCase } from "../../usecase/subscription/check-expired-subscriptions.usecase";
import { AppDataSource } from "../config/data-source";

// Singletons (non-TypeORM dependent)
const adapterInstance = new FastifyAdapter();
const evolutionAdapter = new EvolutionApiAdapter();
const googleAuthAdapter = new GoogleAuthAdapter();
const abacatePayAdapter = new AbacatePayAdapter();
const brasilNFeAdapter = new BrasilNFeAdapter();
const fiscalService = new FiscalService(brasilNFeAdapter);
const geminiAdapter = new GeminiAdapter();
const mailAdapter = new NodemailerAdapter();
const redisService = new RedisService();
const conversationService = new ConversationService(redisService);

// Lazy Instances
let userRepository: UserRepository;
let companyRepository: CompanyRepository;
let companyConfigRepository: CompanyConfigRepository;
let clientRepository: ClientRepository;
let scheduleRepository: ScheduleRepository;
let userConfigRepository: UserConfigRepository;
let subscriptionRepository: SubscriptionRepository;
let subscriptionPaymentRepository: SubscriptionPaymentRepository;
let professionalRepository: ProfessionalRepository;
let planRepository: PlanRepository;
let paymentMethodRepository: PaymentMethodRepository;
let webhookAuditLogRepository: WebhookAuditLogRepository;

let notifyQueue: NotifyQueue;
let subscriptionQueue: SubscriptionQueue;

const getRepo = {
    user: () => userRepository || (userRepository = new UserRepository()),
    company: () => companyRepository || (companyRepository = new CompanyRepository()),
    companyConfig: () => companyConfigRepository || (companyConfigRepository = new CompanyConfigRepository()),
    client: () => clientRepository || (clientRepository = new ClientRepository()),
    schedule: () => scheduleRepository || (scheduleRepository = new ScheduleRepository()),
    userConfig: () => userConfigRepository || (userConfigRepository = new UserConfigRepository()),
    subscription: () => subscriptionRepository || (subscriptionRepository = new SubscriptionRepository()),
    subscriptionPayment: () => subscriptionPaymentRepository || (subscriptionPaymentRepository = new SubscriptionPaymentRepository()),
    professional: () => professionalRepository || (professionalRepository = new ProfessionalRepository()),
    plan: () => planRepository || (planRepository = new PlanRepository()),
    paymentMethod: () => paymentMethodRepository || (paymentMethodRepository = new PaymentMethodRepository()),
    webhookAuditLog: () => webhookAuditLogRepository || (webhookAuditLogRepository = new WebhookAuditLogRepository()),
};

const getUseCase = {
    getHealthStatus: () => new GetHealthStatusUseCase(AppDataSource, redisService, evolutionAdapter),

    generateGoogleAuthUrl: () => new GenerateGoogleAuthUrlUseCase(googleAuthAdapter),

    checkUsageLimit: () => new CheckUsageLimitUseCase(
        getRepo.subscription(),
        getRepo.company(),
        getRepo.plan()
    ),

    confirmAppointment: () => new ConfirmAppointmentUseCase(getRepo.schedule()),
    cancelAppointment: () => new CancelAppointmentUseCase(getRepo.schedule()),
    getAppointments: () => new GetAppointmentsUseCase(getRepo.schedule()),
    createAppointment: () => new CreateAppointmentUseCase(getRepo.schedule()),
    updateAppointment: () => new UpdateAppointmentUseCase(getRepo.schedule()),
    deleteAppointment: () => new DeleteAppointmentUseCase(getRepo.schedule()),

    notifyUpcomingAppointments: () => new NotifyUpcomingAppointmentsUseCase(
        getRepo.schedule(),
        getRepo.companyConfig(),
        evolutionAdapter
    ),

    handleEvolutionWebhook: () => new HandleEvolutionWebhookUseCase(
        getRepo.companyConfig(),
        getUseCase.confirmAppointment(),
        getUseCase.cancelAppointment(),
        evolutionAdapter,
        getUseCase.checkUsageLimit(),
        geminiAdapter,
        conversationService,
        getRepo.professional(),
        getRepo.company()
    ),

    createSubscriptionCheckout: () => new CreateSubscriptionCheckoutUseCase(
        getRepo.user(),
        getRepo.subscription(),
        getRepo.companyConfig(),
        getRepo.company(),
        abacatePayAdapter,
        getRepo.subscriptionPayment(),
        getRepo.plan()
    ),
    handleAbacatePayWebhook: () => new HandleAbacatePayWebhookUseCase(
        getRepo.subscription(),
        getRepo.subscriptionPayment(),
        getRepo.user(),
        getRepo.companyConfig(),
        new SubscriptionNotificationService(mailAdapter),
        fiscalService,
        getRepo.webhookAuditLog(),
        getRepo.paymentMethod(),
        getRepo.plan()
    ),
    getSubscriptionPaymentHistory: () => new GetSubscriptionPaymentHistoryUseCase(
        getRepo.subscription(),
        getRepo.subscriptionPayment()
    ),
    generateInvoicePdf: () => new GenerateInvoicePdfUseCase(
        getRepo.subscriptionPayment(),
        getRepo.user(),
        getRepo.companyConfig()
    ),
    connectWhatsapp: () => new ConnectWhatsappUseCase(getRepo.companyConfig(), evolutionAdapter),
    disconnectWhatsapp: () => new DisconnectWhatsappUseCase(getRepo.companyConfig(), evolutionAdapter),
    getWhatsappStatus: () => new GetWhatsappStatusUseCase(getRepo.companyConfig(), evolutionAdapter),

    sendEmailVerification: () => new SendEmailVerificationUseCase(mailAdapter, redisService),
    verifyEmailSetPassword: () => new VerifyEmailSetPasswordUseCase(getRepo.user(), redisService),

    getUserConfig: () => new GetUserConfigUseCase(getRepo.user(), getRepo.company(), getRepo.companyConfig()),
    updateUserConfig: () => new UpdateUserConfigUseCase(getRepo.user(), getRepo.companyConfig(), evolutionAdapter),
    changePassword: () => new ChangePasswordUseCase(getRepo.user()),
    setPassword: () => new SetPasswordUseCase(getRepo.user()),
    toggle2FA: () => new Toggle2FAUseCase(getRepo.user()),
    verify2FA: () => new Verify2FAUseCase(getRepo.user()),
    validate2FA: () => new Validate2FAUseCase(getRepo.user()),

    getDashboardStats: () => new GetDashboardStatsUseCase(getRepo.companyConfig()),

    registerUser: () => new RegisterUserUseCase(getRepo.user()),
    login: () => new LoginUseCase(getRepo.user()),
    authenticateGoogle: () => new AuthenticateGoogleUseCase(googleAuthAdapter, getRepo.user(), getRepo.company()),
    loginVerify2FA: () => new LoginVerify2FAUseCase(getRepo.user(), adapterInstance, getUseCase.validate2FA()),

    getSubscriptionStatus: () => new GetSubscriptionStatusUseCase(
        getRepo.subscription(),
        getRepo.company(),
        getRepo.companyConfig(),
        getRepo.plan()
    ),

    createCompany: () => new CreateCompanyUseCase(getRepo.company(), getRepo.companyConfig(), getRepo.subscription()),
    listCompanies: () => new ListCompaniesUseCase(getRepo.company(), getRepo.subscription()),
    selectCompany: () => new SelectCompanyUseCase(getRepo.company(), adapterInstance, getRepo.user()),
    updateCompany: () => new UpdateCompanyUseCase(getRepo.company()),
    deleteCompany: () => new DeleteCompanyUseCase(getRepo.company(), getRepo.companyConfig()),

    manageProfessionals: () => new ManageProfessionalsUseCase(getRepo.professional()),
    manageBotConfig: () => new ManageBotConfigUseCase(getRepo.companyConfig()),

    checkExpiredSubscriptions: () => new CheckExpiredSubscriptionsUseCase(
        getRepo.subscription(),
        getRepo.user(),
        new SubscriptionNotificationService(mailAdapter)
    ),
};

const getMiddleware = {
    subscription: () => subscriptionMiddleware(getRepo.subscription()),
    usageLimit: () => usageLimitMiddleware(getUseCase.checkUsageLimit()),
};

export const factory = {
    adapters: {
        fastify: () => adapterInstance,
        evolution: () => evolutionAdapter,
        google: () => googleAuthAdapter,
        abacate: () => abacatePayAdapter,
        gemini: () => geminiAdapter,
    },
    repositories: getRepo,
    controller: {
        app: () => new AppController(adapterInstance, getUseCase.getHealthStatus()),
        auth: () => new AuthController(
            adapterInstance,
            getUseCase.generateGoogleAuthUrl(),
            getUseCase.authenticateGoogle(),
            getUseCase.registerUser(),
            getUseCase.login(),
            getUseCase.validate2FA(),
            getUseCase.loginVerify2FA(),
            getUseCase.sendEmailVerification(),
            getUseCase.verifyEmailSetPassword(),
            getUseCase.updateUserConfig(),
            getRepo.user(),
            getRepo.company(),
            getRepo.companyConfig()
        ),
        company: () => new CompanyController(
            adapterInstance,
            getUseCase.listCompanies(),
            getUseCase.createCompany(),
            getUseCase.selectCompany(),
            getUseCase.updateCompany(),
            getUseCase.deleteCompany()
        ),
        appointment: () => new AppointmentController(
            adapterInstance,
            getUseCase.getAppointments(),
            getUseCase.createAppointment(),
            getUseCase.updateAppointment(),
            getUseCase.deleteAppointment()
        ),
        webhook: () => new EvolutionWebhookController(
            adapterInstance,
            getUseCase.handleEvolutionWebhook(),
            getRepo.companyConfig()
        ),
        subscription: () => new SubscriptionController(
            adapterInstance,
            getUseCase.createSubscriptionCheckout(),
            getUseCase.handleAbacatePayWebhook(),
            getUseCase.getSubscriptionStatus(),
            getUseCase.getSubscriptionPaymentHistory(),
            getUseCase.generateInvoicePdf(),
            getRepo.plan(),
            getRepo.paymentMethod()
        ),
        whatsapp: () => new WhatsappController(
            adapterInstance,
            getUseCase.connectWhatsapp(),
            getUseCase.disconnectWhatsapp(),
            getUseCase.getWhatsappStatus()
        ),
        dashboard: () => new DashboardController(adapterInstance, getUseCase.getDashboardStats()),
        user: () => new UserController(
            adapterInstance,
            getUseCase.getUserConfig(),
            getUseCase.updateUserConfig(),
            getUseCase.changePassword(),
            getUseCase.setPassword(),
            getUseCase.toggle2FA(),
            getUseCase.verify2FA(),
            getRepo.company()
        ),
        professional: () => new ProfessionalController(
            adapterInstance,
            getUseCase.manageProfessionals(),
            getUseCase.manageBotConfig()
        ),
        admin: () => new AdminController(adapterInstance),
    },
    queues: {
        notify: () => notifyQueue || (notifyQueue = new NotifyQueue()),
        subscription: () => subscriptionQueue || (subscriptionQueue = new SubscriptionQueue()),
    },
    workers: {
        notify: () => new NotifyWorker(getUseCase.notifyUpcomingAppointments()),
        subscription: () => new SubscriptionWorker(getUseCase.checkExpiredSubscriptions()),
    },
};
