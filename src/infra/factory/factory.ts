import { FastifyAdapter } from "../adapters/fastfy.adapter";
import { EvolutionApiAdapter } from "../adapters/evolution-api.adapter";
import { GoogleCalendarAdapter } from "../adapters/google-calendar.adapter";
import { AbacatePayAdapter } from "../adapters/abacatepay.adapter";
import { adminMiddleware } from "../middleware/auth.middleware";
import { AppController } from "../controller/app.controller";
import { AuthController } from "../controller/auth.controller";
import { CalendarController } from "../controller/calendar.controller";
import { EvolutionWebhookController } from "../controller/evolution-webhook.controller";
import { SubscriptionController } from "../controller/subscription.controller";
import { GetUserConfigUseCase } from "../../usecase/user/get-user-config.usecase";
import { UpdateUserConfigUseCase } from "../../usecase/user/update-user-config.usecase";
import { ChangePasswordUseCase } from "../../usecase/user/change-password.usecase";
import { Toggle2FAUseCase } from "../../usecase/user/toggle-2fa.usecase";
import { Verify2FAUseCase } from "../../usecase/user/verify-2fa.usecase";
import { Validate2FAUseCase } from "../../usecase/user/validate-2fa.usecase";
import { UserController } from "../controller/user.controller";
import { UserRepository } from "../database/repositories/user.repository";
import { ClientRepository } from "../database/repositories/client.repository";
import { ScheduleRepository } from "../database/repositories/schedule.repository";
import { UserConfigRepository } from "../database/repositories/user-config.repository";
import { SubscriptionRepository } from "../database/repositories/subscription.repository";
import { SubscriptionPaymentRepository } from "../database/repositories/subscription-payment.repository";
import { GenerateGoogleAuthUrlUseCase } from "../../usecase/auth/generate-google-auth-url.usecase";
import { ExchangeGoogleCodeUseCase } from "../../usecase/auth/exchange-google-code.usecase";
import { SyncCalendarUseCase } from "../../usecase/calendar/sync-calendar.usecase";
import { ConfirmAppointmentUseCase } from "../../usecase/calendar/confirm-appointment.usecase";
import { CancelAppointmentUseCase } from "../../usecase/calendar/cancel-appointment.usecase";
import { NotifyUpcomingAppointmentsUseCase } from "../../usecase/notification/notify-upcoming-appointments.usecase";
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
import { GetAppointmentsUseCase } from "../../usecase/calendar/get-appointments.usecase";
import { CreateAppointmentUseCase } from "../../usecase/calendar/create-appointment.usecase";
import { UpdateAppointmentUseCase } from "../../usecase/calendar/update-appointment.usecase";
import { DeleteAppointmentUseCase } from "../../usecase/calendar/delete-appointment.usecase";
import { AcceptInviteUseCase } from "../../usecase/calendar/accept-invite.usecase";
import { RegisterUserUseCase } from "../../usecase/auth/register-user.usecase";
import { LoginUseCase } from "../../usecase/auth/login.usecase";
import { AuthenticateGoogleUseCase } from "../../usecase/auth/authenticate-google.usecase";
import { LoginVerify2FAUseCase } from "../../usecase/auth/login-verify-2fa.usecase";
import { GetSubscriptionStatusUseCase } from "../../usecase/subscription/get-subscription-status.usecase";
import { CheckUsageLimitUseCase } from "../../usecase/subscription/check-usage-limit.usecase";

import { SyncCalendarQueue } from "../queue/sync-calendar.queue";
import { SyncCalendarWorker } from "../queue/sync-calendar.worker";
import { NotifyQueue } from "../queue/notify.queue";
import { NotifyWorker } from "../queue/notify.worker";
import { subscriptionMiddleware } from "../middleware/subscription.middleware";
import { usageLimitMiddleware } from "../middleware/usage-limit.middleware";
import { NodemailerAdapter } from "../adapters/nodemailer.adapter";
import { RedisService } from "../database/redis.service";
import { SendEmailVerificationUseCase } from "../../usecase/auth/send-email-verification.usecase";
import { VerifyEmailSetPasswordUseCase } from "../../usecase/auth/verify-email-set-password.usecase";
import { GetHealthStatusUseCase } from "../../usecase/system/get-health-status.usecase";
import { AppDataSource } from "../config/data-source";

// Singletons (non-TypeORM dependent)
const adapterInstance = new FastifyAdapter();
const evolutionAdapter = new EvolutionApiAdapter();
const googleCalendarAdapter = new GoogleCalendarAdapter();
const abacatePayAdapter = new AbacatePayAdapter();
const mailAdapter = new NodemailerAdapter();
const redisService = new RedisService();

// Lazy Instances
let userRepository: UserRepository;
let clientRepository: ClientRepository;
let scheduleRepository: ScheduleRepository;
let userConfigRepository: UserConfigRepository;
let subscriptionRepository: SubscriptionRepository;
let subscriptionPaymentRepository: SubscriptionPaymentRepository;

let syncCalendarQueue: SyncCalendarQueue;
let notifyQueue: NotifyQueue;

const getRepo = {
    user: () => userRepository || (userRepository = new UserRepository()),
    client: () => clientRepository || (clientRepository = new ClientRepository()),
    schedule: () => scheduleRepository || (scheduleRepository = new ScheduleRepository()),
    userConfig: () => userConfigRepository || (userConfigRepository = new UserConfigRepository()),
    subscription: () => subscriptionRepository || (subscriptionRepository = new SubscriptionRepository()),
    subscriptionPayment: () => subscriptionPaymentRepository || (subscriptionPaymentRepository = new SubscriptionPaymentRepository())
};

const getUseCase = {
    getHealthStatus: () => new GetHealthStatusUseCase(
        AppDataSource,
        redisService,
        evolutionAdapter
    ),
    generateGoogleAuthUrl: () => new GenerateGoogleAuthUrlUseCase(googleCalendarAdapter),

    exchangeGoogleCode: () => new ExchangeGoogleCodeUseCase(googleCalendarAdapter, getRepo.userConfig()),
    syncCalendar: () => new SyncCalendarUseCase(
        googleCalendarAdapter, 
        getRepo.schedule(), 
        getRepo.userConfig(),
        getRepo.user(),
        evolutionAdapter,
        getUseCase.checkUsageLimit()
    ),
    
    checkUsageLimit: () => new CheckUsageLimitUseCase(
        getRepo.subscription(),
        getRepo.schedule()
    ),

    notifyUpcomingAppointments: () => new NotifyUpcomingAppointmentsUseCase(
        getRepo.schedule(),
        getRepo.userConfig(),
        getRepo.client(),
        getRepo.subscription(),
        evolutionAdapter,
        getUseCase.checkUsageLimit()
    ),
    confirmAppointment: () => new ConfirmAppointmentUseCase(
        getRepo.schedule(),
        getRepo.userConfig(),
        googleCalendarAdapter
    ),
    cancelAppointment: () => new CancelAppointmentUseCase(
        getRepo.schedule(),
        getRepo.userConfig(),
        googleCalendarAdapter
    ),
    handleEvolutionWebhook: () => new HandleEvolutionWebhookUseCase(
        getRepo.userConfig(),
        getRepo.schedule(),
        getUseCase.confirmAppointment(),
        getUseCase.cancelAppointment(),
        getUseCase.acceptInvite(),
        evolutionAdapter,
        getUseCase.checkUsageLimit()
    ),
    createSubscriptionCheckout: () => new CreateSubscriptionCheckoutUseCase(
        getRepo.user(),
        getRepo.subscription(),
        getRepo.userConfig(),
        abacatePayAdapter,
        getRepo.subscriptionPayment()
    ),
    handleAbacatePayWebhook: () => new HandleAbacatePayWebhookUseCase(
        getRepo.subscription(),
        getRepo.subscriptionPayment()
    ),
    getSubscriptionPaymentHistory: () => new GetSubscriptionPaymentHistoryUseCase(
        getRepo.subscription(),
        getRepo.subscriptionPayment()
    ),
    generateInvoicePdf: () => new GenerateInvoicePdfUseCase(
        getRepo.subscriptionPayment(),
        getRepo.user()
    ),
    connectWhatsapp: () => new ConnectWhatsappUseCase(
        getRepo.userConfig(),
        evolutionAdapter
    ),
    disconnectWhatsapp: () => new DisconnectWhatsappUseCase(
        getRepo.userConfig(),
        evolutionAdapter
    ),
    getWhatsappStatus: () => new GetWhatsappStatusUseCase(
        getRepo.userConfig(),
        evolutionAdapter
    ),
    sendEmailVerification: () => new SendEmailVerificationUseCase(
        mailAdapter,
        redisService
    ),
    verifyEmailSetPassword: () => new VerifyEmailSetPasswordUseCase(
        getRepo.user(),
        redisService
    ),
    getUserConfig: () => new GetUserConfigUseCase(getRepo.user(), getRepo.userConfig()),
    updateUserConfig: () => new UpdateUserConfigUseCase(getRepo.user(), getRepo.userConfig(), evolutionAdapter),
    changePassword: () => new ChangePasswordUseCase(getRepo.user()),
    toggle2FA: () => new Toggle2FAUseCase(getRepo.user()),
    verify2FA: () => new Verify2FAUseCase(getRepo.user()),
    validate2FA: () => new Validate2FAUseCase(getRepo.user()),
    getDashboardStats: () => new GetDashboardStatsUseCase(getRepo.schedule(), getRepo.userConfig()),
    getAppointments: () => new GetAppointmentsUseCase(
        getRepo.schedule()
    ),
    createAppointment: () => new CreateAppointmentUseCase(
        googleCalendarAdapter,
        getRepo.schedule(),
        getRepo.userConfig()
    ),
    updateAppointment: () => new UpdateAppointmentUseCase(
        googleCalendarAdapter,
        getRepo.schedule(),
        getRepo.userConfig()
    ),
    deleteAppointment: () => new DeleteAppointmentUseCase(
        googleCalendarAdapter,
        getRepo.schedule(),
        getRepo.userConfig()
    ),
    acceptInvite: () => new AcceptInviteUseCase(
        googleCalendarAdapter,
        getRepo.schedule(),
        getRepo.userConfig()
    ),
    registerUser: () => new RegisterUserUseCase(
        getRepo.user(),
        getRepo.userConfig()
    ),
    login: () => new LoginUseCase(
        getRepo.user()
    ),
    authenticateGoogle: () => new AuthenticateGoogleUseCase(
        googleCalendarAdapter,
        getRepo.user(),
        getUseCase.exchangeGoogleCode()
    ),
    loginVerify2FA: () => new LoginVerify2FAUseCase(
        getRepo.user(),
        adapterInstance,
        getUseCase.validate2FA()
    ),
    getSubscriptionStatus: () => new GetSubscriptionStatusUseCase(
        getRepo.subscription(),
        getRepo.schedule()
    )
};

const getMiddleware = {
    subscription: () => subscriptionMiddleware(getRepo.subscription()),
    usageLimit: () => usageLimitMiddleware(getUseCase.checkUsageLimit())
};

export const factory = {
    adapters: {
        fastify: () => adapterInstance,
        evolution: () => evolutionAdapter,
        google: () => googleCalendarAdapter,
        abacate: () => abacatePayAdapter
    },
    repositories: getRepo,
    controller: {
        app: () => new AppController(
            adapterInstance,
            getUseCase.getHealthStatus()
        ),
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
            getRepo.userConfig()
        ),
        calendar: () => new CalendarController(
            adapterInstance,
            factory.queues.sync(),
            factory.queues.notify(),
            getUseCase.getAppointments(),
            getUseCase.createAppointment(),
            getUseCase.updateAppointment(),
            getUseCase.deleteAppointment(),
            getUseCase.acceptInvite(),
            getMiddleware.subscription()
        ),
        webhook: () => new EvolutionWebhookController(
            adapterInstance,
            getUseCase.handleEvolutionWebhook()
        ),
        subscription: () => new SubscriptionController(
            adapterInstance,
            getUseCase.createSubscriptionCheckout(),
            getUseCase.handleAbacatePayWebhook(),
            getUseCase.getSubscriptionStatus(),
            getUseCase.getSubscriptionPaymentHistory(),
            getUseCase.generateInvoicePdf()
        ),
        whatsapp: () => new WhatsappController(
            adapterInstance,
            getUseCase.connectWhatsapp(),
            getUseCase.disconnectWhatsapp(),
            getUseCase.getWhatsappStatus()
        ),
        dashboard: () => new DashboardController(
            adapterInstance,
            getUseCase.getDashboardStats()
        ),
        user: () => new UserController(
            adapterInstance,
            getUseCase.getUserConfig(),
            getUseCase.updateUserConfig(),
            getUseCase.changePassword(),
            getUseCase.toggle2FA(),
            getUseCase.verify2FA()
        )
    },
    queues: {
        sync: () => syncCalendarQueue || (syncCalendarQueue = new SyncCalendarQueue()),
        notify: () => notifyQueue || (notifyQueue = new NotifyQueue())
    },
    workers: {
        sync: () => new SyncCalendarWorker(getUseCase.syncCalendar()),
        notify: () => new NotifyWorker(getUseCase.notifyUpcomingAppointments(), getRepo.userConfig())
    }
};