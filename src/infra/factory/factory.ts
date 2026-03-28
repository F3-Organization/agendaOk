import { FastifyAdapter } from "../adapters/fastfy.adapter";
import { EvolutionApiAdapter } from "../adapters/evolution-api.adapter";
import { GoogleCalendarAdapter } from "../adapters/google-calendar.adapter";
import { AppController } from "../controller/app.controller";
import { AuthController } from "../controller/auth.controller";
import { CalendarController } from "../controller/calendar.controller";
import { EvolutionWebhookController } from "../controller/evolution-webhook.controller";
import { UserRepository } from "../database/repositories/user.repository";
import { ClientRepository } from "../database/repositories/client.repository";
import { ScheduleRepository } from "../database/repositories/schedule.repository";
import { UserConfigRepository } from "../database/repositories/user-config.repository";
import { GenerateGoogleAuthUrlUseCase } from "../../usecase/auth/generate-google-auth-url.usecase";
import { ExchangeGoogleCodeUseCase } from "../../usecase/auth/exchange-google-code.usecase";
import { SyncCalendarUseCase } from "../../usecase/calendar/sync-calendar.usecase";
import { ConfirmAppointmentUseCase } from "../../usecase/calendar/confirm-appointment.usecase";
import { NotifyUpcomingAppointmentsUseCase } from "../../usecase/notification/notify-upcoming-appointments.usecase";
import { HandleEvolutionWebhookUseCase } from "../../usecase/notification/handle-evolution-webhook.usecase";
import { SyncCalendarQueue } from "../queue/sync-calendar.queue";
import { SyncCalendarWorker } from "../queue/sync-calendar.worker";
import { NotifyQueue } from "../queue/notify.queue";
import { NotifyWorker } from "../queue/notify.worker";

const adapterInstance = new FastifyAdapter();
const evolutionAdapter = new EvolutionApiAdapter();
const googleCalendarAdapter = new GoogleCalendarAdapter();
const userRepository = new UserRepository();
const clientRepository = new ClientRepository();
const scheduleRepository = new ScheduleRepository();
const userConfigRepository = new UserConfigRepository();

// UseCases
const generateGoogleAuthUrlUseCase = new GenerateGoogleAuthUrlUseCase(googleCalendarAdapter);
const exchangeGoogleCodeUseCase = new ExchangeGoogleCodeUseCase(googleCalendarAdapter, userConfigRepository);
const syncCalendarUseCase = new SyncCalendarUseCase(googleCalendarAdapter, scheduleRepository, userConfigRepository);
const notifyUpcomingAppointmentsUseCase = new NotifyUpcomingAppointmentsUseCase(
    scheduleRepository,
    userConfigRepository,
    evolutionAdapter
);
const confirmAppointmentUseCase = new ConfirmAppointmentUseCase(
    scheduleRepository,
    userConfigRepository,
    googleCalendarAdapter
);
const handleEvolutionWebhookUseCase = new HandleEvolutionWebhookUseCase(
    userConfigRepository,
    confirmAppointmentUseCase
);

// Queues & Workers
const syncCalendarQueue = new SyncCalendarQueue();
const syncCalendarWorker = new SyncCalendarWorker(syncCalendarUseCase);
const notifyQueue = new NotifyQueue();
const notifyWorker = new NotifyWorker(notifyUpcomingAppointmentsUseCase, userConfigRepository);

const repositories = {
    user: () => userRepository,
    client: () => clientRepository,
    schedule: () => scheduleRepository,
    userConfig: () => userConfigRepository
}

const adapters = {
    fastify: () => adapterInstance,
    evolution: () => evolutionAdapter,
    google: () => googleCalendarAdapter
}

const controllers = {
    app: () => new AppController(adapterInstance),
    auth: () => new AuthController(
        adapterInstance,
        generateGoogleAuthUrlUseCase,
        exchangeGoogleCodeUseCase,
        userRepository
    ),
    calendar: () => new CalendarController(
        adapterInstance,
        syncCalendarQueue,
        notifyQueue
    ),
    webhook: () => new EvolutionWebhookController(
        adapterInstance,
        handleEvolutionWebhookUseCase
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