import { ICompanyRepository } from "../../repositories/icompany-repository";
import { IProfessionalRepository } from "../../repositories/iprofessional-repository";
import { IScheduleRepository } from "../../repositories/ischedule-repository";
import { IEvolutionService } from "../../ports/ievolution-service";
import { GeminiAdapter } from "../../../infra/adapters/gemini.adapter";
import { ConversationService } from "../conversation.service";
import { AvailabilityService } from "../availability.service";
import { CompanyConfig } from "../../../infra/database/entities/company-config.entity";
import { CreateAppointmentUseCase } from "../../appointment/create-appointment.usecase";
import { ScheduleStatus } from "../../../infra/database/entities/schedule.entity";
import { Professional } from "../../../infra/database/entities/professional.entity";

/**
 * Unified action payload the AI can emit in a ```json block.
 * Supports: create_appointment, cancel_appointment, reschedule_appointment
 */
interface BotAction {
    action: "create_appointment" | "cancel_appointment" | "reschedule_appointment";
    // For create
    clientName?: string;
    service?: string;
    professionalName?: string;
    date?: string; // YYYY-MM-DD
    time?: string; // HH:mm
    // For cancel / reschedule — references appointment by index in the list shown
    appointmentIndex?: number;
    // For reschedule — new date/time
    newDate?: string;
    newTime?: string;
}

export class AIResponseHandler {
    constructor(
        private readonly companyRepository: ICompanyRepository,
        private readonly professionalRepository: IProfessionalRepository,
        private readonly evolutionService: IEvolutionService,
        private readonly geminiAdapter: GeminiAdapter,
        private readonly conversationService: ConversationService,
        private readonly availabilityService: AvailabilityService,
        private readonly scheduleRepository: IScheduleRepository,
        private readonly createAppointment?: CreateAppointmentUseCase
    ) {}

    async handle(
        config: CompanyConfig,
        instanceName: string,
        senderNumber: string,
        fullJid: string,
        text: string
    ): Promise<void> {
        const company = await this.companyRepository.findById(config.companyId);
        const companyName = company?.name || "Empresa";

        const professionals = await this.professionalRepository.findActiveByCompanyId(config.companyId);

        const history = await this.conversationService.getHistory(config.companyId, senderNumber);

        // Detect if the user is asking about a specific date to provide availability context
        const requestedDate = this.detectDate(text, history);

        // Gather contextual data for the AI
        const clientAppointments = await this.availabilityService.getClientAppointments(
            config.companyId,
            senderNumber
        );

        let availability = null;
        if (requestedDate) {
            availability = await this.availabilityService.getAvailability(
                config.companyId,
                professionals,
                requestedDate
            );
        }

        const response = await this.geminiAdapter.chat(
            config,
            companyName,
            professionals,
            history,
            text,
            clientAppointments,
            availability
        );

        // Extract and process action JSON if present
        const { humanMessage, botAction } = this.parseResponse(response.text);

        await this.conversationService.addMessages(config.companyId, senderNumber, text, humanMessage);

        // Send only the human-readable part to WhatsApp
        await this.evolutionService.sendText(instanceName, fullJid, humanMessage);

        // Execute the bot action if present
        if (botAction) {
            await this.executeAction(
                botAction,
                config,
                instanceName,
                fullJid,
                senderNumber,
                professionals,
                clientAppointments
            );
        }
    }

    /**
     * Executes a parsed bot action (create, cancel, reschedule).
     */
    private async executeAction(
        action: BotAction,
        config: CompanyConfig,
        instanceName: string,
        fullJid: string,
        senderNumber: string,
        professionals: Professional[],
        clientAppointments: any[]
    ): Promise<void> {
        try {
            switch (action.action) {
                case "create_appointment":
                    await this.handleCreate(action, config, senderNumber, professionals);
                    break;

                case "cancel_appointment":
                    await this.handleCancel(action, config, instanceName, fullJid, clientAppointments);
                    break;

                case "reschedule_appointment":
                    await this.handleReschedule(action, config, instanceName, fullJid, senderNumber, professionals, clientAppointments);
                    break;

                default:
                    console.warn(`[AIResponseHandler] Unknown action: ${(action as any).action}`);
            }
        } catch (error: any) {
            console.error(`[AIResponseHandler] Action ${action.action} failed:`, error?.message);

            const errorMsg = error?.message?.includes("Já existe")
                ? "⚠️ Desculpe, esse horário acabou de ser preenchido por outra pessoa. Poderia escolher outro horário?"
                : `⚠️ Não foi possível processar a ação. ${error?.message || "Tente novamente."}`;

            await this.evolutionService.sendText(instanceName, fullJid, errorMsg);
        }
    }

    private async handleCreate(
        action: BotAction,
        config: CompanyConfig,
        senderNumber: string,
        professionals: Professional[]
    ): Promise<void> {
        if (!this.createAppointment || !action.clientName || !action.date || !action.time || !action.professionalName) {
            return;
        }

        const professional = this.matchProfessional(professionals, action.professionalName);
        const startAt = new Date(`${action.date}T${action.time}:00`);
        const durationMinutes = professional?.appointmentDuration || 30;
        const endAt = new Date(startAt.getTime() + durationMinutes * 60 * 1000);

        await this.createAppointment.execute({
            companyId: config.companyId,
            clientName: action.clientName,
            clientPhone: senderNumber,
            title: action.service || "Consulta",
            startAt,
            endAt,
            professionalId: professional?.id,
            notes: `Agendamento via Bot IA - Profissional: ${action.professionalName}`,
        });

        console.log(`[AIResponseHandler] Appointment created: ${action.clientName} → ${action.professionalName} at ${action.date} ${action.time}`);
    }

    private async handleCancel(
        action: BotAction,
        config: CompanyConfig,
        instanceName: string,
        fullJid: string,
        clientAppointments: any[]
    ): Promise<void> {
        const idx = (action.appointmentIndex ?? 1) - 1; // 1-indexed to 0-indexed
        const appointment = clientAppointments[idx];

        if (!appointment) {
            await this.evolutionService.sendText(instanceName, fullJid,
                "⚠️ Não encontrei o agendamento indicado. Poderia confirmar qual deseja cancelar?"
            );
            return;
        }

        await this.scheduleRepository.update(appointment.id, { status: ScheduleStatus.CANCELLED });
        console.log(`[AIResponseHandler] Appointment cancelled: ${appointment.id}`);
    }

    private async handleReschedule(
        action: BotAction,
        config: CompanyConfig,
        instanceName: string,
        fullJid: string,
        senderNumber: string,
        professionals: Professional[],
        clientAppointments: any[]
    ): Promise<void> {
        const idx = (action.appointmentIndex ?? 1) - 1;
        const appointment = clientAppointments[idx];

        if (!appointment) {
            await this.evolutionService.sendText(instanceName, fullJid,
                "⚠️ Não encontrei o agendamento indicado. Poderia confirmar qual deseja alterar?"
            );
            return;
        }

        if (!action.newDate || !action.newTime) {
            await this.evolutionService.sendText(instanceName, fullJid,
                "⚠️ Preciso da nova data e horário para remarcar."
            );
            return;
        }

        const newStartAt = new Date(`${action.newDate}T${action.newTime}:00`);
        const professional = professionals.find(p => p.id === appointment.professionalId);
        const durationMinutes = professional?.appointmentDuration || 30;
        const newEndAt = new Date(newStartAt.getTime() + durationMinutes * 60 * 1000);

        // Check for conflicts at the new time
        const hasConflict = await this.scheduleRepository.hasConflict(
            config.companyId,
            newStartAt,
            newEndAt,
            appointment.professionalId,
            appointment.id
        );

        if (hasConflict) {
            await this.evolutionService.sendText(instanceName, fullJid,
                "⚠️ Esse novo horário já está ocupado. Poderia escolher outro?"
            );
            return;
        }

        await this.scheduleRepository.update(appointment.id, {
            startAt: newStartAt,
            endAt: newEndAt,
            status: ScheduleStatus.PENDING,
        });

        console.log(`[AIResponseHandler] Appointment rescheduled: ${appointment.id} → ${action.newDate} ${action.newTime}`);
    }

    /**
     * Detects if the user message or recent history mentions a specific date.
     * Returns YYYY-MM-DD or null.
     */
    private detectDate(text: string, history: { role: string; parts: Array<{ text: string }> }[]): string | null {
        const now = new Date();
        const lowerText = text.toLowerCase();

        // Check for "today" / "hoje"
        if (/\b(hoje|today)\b/.test(lowerText)) {
            return this.formatDate(now);
        }

        // Check for "tomorrow" / "amanhã"
        if (/\b(amanh[aã]|tomorrow)\b/.test(lowerText)) {
            const tomorrow = new Date(now);
            tomorrow.setDate(tomorrow.getDate() + 1);
            return this.formatDate(tomorrow);
        }

        // Check for day-of-week mentions (pt-BR and en)
        const dayMap: Record<string, number> = {
            "domingo": 0, "sunday": 0,
            "segunda": 1, "monday": 1,
            "terça": 2, "terca": 2, "tuesday": 2,
            "quarta": 3, "wednesday": 3,
            "quinta": 4, "thursday": 4,
            "sexta": 5, "friday": 5,
            "sábado": 6, "sabado": 6, "saturday": 6,
        };

        for (const [name, dayNum] of Object.entries(dayMap)) {
            if (lowerText.includes(name)) {
                const target = new Date(now);
                const currentDay = now.getDay();
                let diff = dayNum - currentDay;
                if (diff <= 0) diff += 7;
                target.setDate(target.getDate() + diff);
                return this.formatDate(target);
            }
        }

        // Check for explicit date patterns: DD/MM, DD/MM/YYYY, YYYY-MM-DD
        const slashMatch = lowerText.match(/(\d{1,2})\/(\d{1,2})(?:\/(\d{2,4}))?/);
        if (slashMatch) {
            const day = parseInt(slashMatch[1]);
            const month = parseInt(slashMatch[2]) - 1;
            const year = slashMatch[3] ? (slashMatch[3].length === 2 ? 2000 + parseInt(slashMatch[3]) : parseInt(slashMatch[3])) : now.getFullYear();
            const date = new Date(year, month, day);
            if (!isNaN(date.getTime())) {
                return this.formatDate(date);
            }
        }

        const isoMatch = lowerText.match(/(\d{4})-(\d{2})-(\d{2})/);
        if (isoMatch) {
            return isoMatch[0];
        }

        // Check recent history for date mentions (last 4 messages)
        const recentHistory = history.slice(-4);
        for (const msg of recentHistory) {
            for (const part of msg.parts) {
                const histDate = this.detectDate(part.text, []);
                if (histDate) return histDate;
            }
        }

        return null;
    }

    private formatDate(date: Date): string {
        const y = date.getFullYear();
        const m = (date.getMonth() + 1).toString().padStart(2, "0");
        const d = date.getDate().toString().padStart(2, "0");
        return `${y}-${m}-${d}`;
    }

    /**
     * Parses the AI response to extract the human message and optional bot action JSON.
     * Handles both ```json ... ``` blocks and raw JSON objects in the text.
     */
    private parseResponse(responseText: string): { humanMessage: string; botAction: BotAction | null } {
        const validActions = ["create_appointment", "cancel_appointment", "reschedule_appointment"];

        // Strategy 1: ```json ... ``` block
        const jsonBlockRegex = /```json\s*(\{[\s\S]*?\})\s*```/;
        const blockMatch = responseText.match(jsonBlockRegex);
        if (blockMatch) {
            const result = this.tryParseAction(blockMatch[1], validActions);
            if (result) {
                const humanMessage = responseText.replace(jsonBlockRegex, "").trim();
                return { humanMessage, botAction: result };
            }
        }

        // Strategy 2: Raw JSON with "action" field (no backticks)
        // Matches {"action":"...", ...} anywhere in the text
        const rawJsonRegex = /(\{"action"\s*:\s*"[^"]+?"[\s\S]*?\})/;
        const rawMatch = responseText.match(rawJsonRegex);
        if (rawMatch) {
            const result = this.tryParseAction(rawMatch[1], validActions);
            if (result) {
                const humanMessage = responseText.replace(rawJsonRegex, "").trim();
                return { humanMessage, botAction: result };
            }
        }

        // Strategy 3: Legacy format — {"appointment": {...}}
        const legacyRegex = /(\{"appointment"\s*:\s*\{[\s\S]*?\}\s*\})/;
        const legacyMatch = responseText.match(legacyRegex);
        if (legacyMatch) {
            try {
                const parsed = JSON.parse(legacyMatch[1]);
                if (parsed.appointment?.clientName) {
                    const humanMessage = responseText.replace(legacyRegex, "").trim();
                    return {
                        humanMessage,
                        botAction: {
                            action: "create_appointment",
                            clientName: parsed.appointment.clientName,
                            service: parsed.appointment.service,
                            professionalName: parsed.appointment.professionalName,
                            date: parsed.appointment.date,
                            time: parsed.appointment.time,
                        }
                    };
                }
            } catch { /* ignore */ }
        }

        return { humanMessage: responseText.trim(), botAction: null };
    }

    /**
     * Tries to parse a JSON string as a valid BotAction.
     */
    private tryParseAction(jsonStr: string, validActions: string[]): BotAction | null {
        try {
            const parsed = JSON.parse(jsonStr);
            if (parsed.action && validActions.includes(parsed.action)) {
                return parsed as BotAction;
            }
        } catch { /* ignore */ }
        return null;
    }

    /**
     * Finds a professional by name (case-insensitive partial match).
     */
    private matchProfessional(professionals: Professional[], name: string): Professional | undefined {
        const normalizedName = name.toLowerCase().trim();
        return professionals.find(p =>
            p.name.toLowerCase().trim() === normalizedName ||
            p.name.toLowerCase().trim().includes(normalizedName) ||
            normalizedName.includes(p.name.toLowerCase().trim())
        );
    }
}
