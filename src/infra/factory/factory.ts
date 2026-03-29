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

const adapterInstance = new FastifyAdapter();
const evolutionAdapter = new EvolutionApiAdapter();
const googleCalendarAdapter = new GoogleCalendarAdapter();
const abacatePayAdapter = new AbacatePayAdapter();

const userRepository = new UserRepository();
const clientRepository = new ClientRepository();
const scheduleRepository = new ScheduleRepository();
const userConfigRepository = new UserConfigRepository();
const subscriptionRepository = new SubscriptionRepository();

const generateGoogleAuthUrlUseCase = new GenerateGoogleAuthUrlUseCase(googleCalendarAdapter);
const exchangeGoogleCodeUseCase = new ExchangeGoogleCodeUseCase(googleCalendarAdapter, userConfigRepository);

const syncCalendarUseCase = new SyncCalendarUseCase(googleCalendarAdapter, scheduleRepository, userConfigRepository);
const notifyUpcomingAppointmentsUseCase = new NotifyUpcomingAppointmentsUseCase(
    scheduleRepository,
    userConfigRepository,
    clientRepository,
    evolutionAdapter
);
const confirmAppointmentUseCase = new ConfirmAppointmentUseCase(
    scheduleRepository,
    userConfigRepository,
    googleCalendarAdapter
);
const cancelAppointmentUseCase = new CancelAppointmentUseCase(
    scheduleRepository,
    userConfigRepository,
    googleCalendarAdapter
);
const handleEvolutionWebhookUseCase = new HandleEvolutionWebhookUseCase(
    userConfigRepository,
    confirmAppointmentUseCase,
    cancelAppointmentUseCase,
    evolutionAdapter
);

const createSubscriptionCheckoutUseCase = new CreateSubscriptionCheckoutUseCase(
    userRepository,
    subscriptionRepository,
    userConfigRepository,
    abacatePayAdapter
);
const handleAbacatePayWebhookUseCase = new HandleAbacatePayWebhookUseCase(
    subscriptionRepository
);

const connectWhatsappUseCase = new ConnectWhatsappUseCase(
    userConfigRepository,
    evolutionAdapter
);

const disconnectWhatsappUseCase = new DisconnectWhatsappUseCase(
    userConfigRepository,
    evolutionAdapter
);

const syncCalendarQueue = new SyncCalendarQueue();
const syncCalendarWorker = new SyncCalendarWorker(syncCalendarUseCase);
const notifyQueue = new NotifyQueue();
const notifyWorker = new NotifyWorker(notifyUpcomingAppointmentsUseCase, userConfigRepository);

const subMiddleware = subscriptionMiddleware(subscriptionRepository);

const repositories = {
    user: () => userRepository,
    client: () => clientRepository,
    schedule: () => scheduleRepository,
    userConfig: () => userConfigRepository,
    subscription: () => subscriptionRepository
}

const adapters = {
    fastify: () => adapterInstance,
    evolution: () => evolutionAdapter,
    google: () => googleCalendarAdapter,
    abacate: () => abacatePayAdapter
}

const controllers = {
    app: () => new AppController(adapterInstance),
    auth: () => new AuthController(
        adapterInstance,
        generateGoogleAuthUrlUseCase,
        exchangeGoogleCodeUseCase,
        userRepository,
        googleCalendarAdapter
    ),
    calendar: () => new CalendarController(
        adapterInstance,
        syncCalendarQueue,
        notifyQueue,
        scheduleRepository,
        subMiddleware
    ),
    webhook: () => new EvolutionWebhookController(
        adapterInstance,
        handleEvolutionWebhookUseCase
    ),
    subscription: () => new SubscriptionController(
        adapterInstance,
        createSubscriptionCheckoutUseCase,
        handleAbacatePayWebhookUseCase,
        subscriptionRepository
    ),
    whatsapp: () => new WhatsappController(
        adapterInstance,
        connectWhatsappUseCase,
        disconnectWhatsappUseCase,
        subMiddleware,
        adminMiddleware
    )
}

export const factory = {
    adapters: adapters,
    repositories: repositories,
    controller: controllers,
    queues: {
        sync: () => syncCalendarQueue,
        notify: () => notifyQueue
    }
}