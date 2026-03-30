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
import { UserRepository } from "../database/repositories/user.repository";
import { ClientRepository } from "../database/repositories/client.repository";
import { ScheduleRepository } from "../database/repositories/schedule.repository";
import { UserConfigRepository } from "../database/repositories/user-config.repository";
import { SubscriptionRepository } from "../database/repositories/subscription.repository";
import { GenerateGoogleAuthUrlUseCase } from "../../usecase/auth/generate-google-auth-url.usecase";
import { ExchangeGoogleCodeUseCase } from "../../usecase/auth/exchange-google-code.usecase";
import { SyncCalendarUseCase } from "../../usecase/calendar/sync-calendar.usecase";
import { ConfirmAppointmentUseCase } from "../../usecase/calendar/confirm-appointment.usecase";
import { CancelAppointmentUseCase } from "../../usecase/calendar/cancel-appointment.usecase";
import { NotifyUpcomingAppointmentsUseCase } from "../../usecase/notification/notify-upcoming-appointments.usecase";
import { HandleEvolutionWebhookUseCase } from "../../usecase/notification/handle-evolution-webhook.usecase";
import { CreateSubscriptionCheckoutUseCase } from "../../usecase/subscription/create-checkout.usecase";
import { HandleAbacatePayWebhookUseCase } from "../../usecase/subscription/handle-abacate-webhook.usecase";
import { ConnectWhatsappUseCase } from "../../usecase/notification/connect-whatsapp.usecase";
import { DisconnectWhatsappUseCase } from "../../usecase/notification/disconnect-whatsapp.usecase";
import { WhatsappController } from "../controller/whatsapp.controller";
import { SyncCalendarQueue } from "../queue/sync-calendar.queue";
import { SyncCalendarWorker } from "../queue/sync-calendar.worker";
import { NotifyQueue } from "../queue/notify.queue";
import { NotifyWorker } from "../queue/notify.worker";
import { subscriptionMiddleware } from "../middleware/subscription.middleware";
import { NodemailerAdapter } from "../adapters/nodemailer.adapter";
import { RedisService } from "../database/redis.service";
import { SendEmailVerificationUseCase } from "../../usecase/auth/send-email-verification.usecase";
import { VerifyEmailSetPasswordUseCase } from "../../usecase/auth/verify-email-set-password.usecase";


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

let syncCalendarQueue: SyncCalendarQueue;
let notifyQueue: NotifyQueue;

const getRepo = {
    user: () => userRepository || (userRepository = new UserRepository()),
    client: () => clientRepository || (clientRepository = new ClientRepository()),
    schedule: () => scheduleRepository || (scheduleRepository = new ScheduleRepository()),
    userConfig: () => userConfigRepository || (userConfigRepository = new UserConfigRepository()),
    subscription: () => subscriptionRepository || (subscriptionRepository = new SubscriptionRepository())
};

const getUseCase = {
    generateGoogleAuthUrl: () => new GenerateGoogleAuthUrlUseCase(googleCalendarAdapter),
    exchangeGoogleCode: () => new ExchangeGoogleCodeUseCase(googleCalendarAdapter, getRepo.userConfig()),
    syncCalendar: () => new SyncCalendarUseCase(googleCalendarAdapter, getRepo.schedule(), getRepo.userConfig()),
    notifyUpcomingAppointments: () => new NotifyUpcomingAppointmentsUseCase(
        getRepo.schedule(),
        getRepo.userConfig(),
        getRepo.client(),
        evolutionAdapter
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
        getUseCase.confirmAppointment(),
        getUseCase.cancelAppointment(),
        evolutionAdapter
    ),
    createSubscriptionCheckout: () => new CreateSubscriptionCheckoutUseCase(
        getRepo.user(),
        getRepo.subscription(),
        getRepo.userConfig(),
        abacatePayAdapter
    ),
    handleAbacatePayWebhook: () => new HandleAbacatePayWebhookUseCase(
        getRepo.subscription()
    ),
    connectWhatsapp: () => new ConnectWhatsappUseCase(
        getRepo.userConfig(),
        evolutionAdapter
    ),
    disconnectWhatsapp: () => new DisconnectWhatsappUseCase(
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
    )
};


const getMiddleware = {
    subscription: () => subscriptionMiddleware(getRepo.subscription())
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
        app: () => new AppController(adapterInstance),
        auth: () => new AuthController(
            adapterInstance,
            getUseCase.generateGoogleAuthUrl(),
            getUseCase.exchangeGoogleCode(),
            getRepo.user(),
            googleCalendarAdapter,
            getUseCase.sendEmailVerification(),
            getUseCase.verifyEmailSetPassword()
        ),

        calendar: () => new CalendarController(
            adapterInstance,
            factory.queues.sync(),
            factory.queues.notify(),
            getRepo.schedule(),
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
            getRepo.subscription()
        ),
        whatsapp: () => new WhatsappController(
            adapterInstance,
            getUseCase.connectWhatsapp(),
            getUseCase.disconnectWhatsapp(),
            getMiddleware.subscription(),
            adminMiddleware
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