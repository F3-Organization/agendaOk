import { IScheduleRepository } from "../repositories/ischedule-repository";
import { Professional } from "../../infra/database/entities/professional.entity";
import { Schedule } from "../../infra/database/entities/schedule.entity";

export interface AvailableSlot {
    start: string; // HH:mm
    end: string;   // HH:mm
}

export interface DayAvailability {
    professional: string;
    date: string; // YYYY-MM-DD
    availableSlots: AvailableSlot[];
}

export class AvailabilityService {
    constructor(
        private readonly scheduleRepository: IScheduleRepository
    ) {}

    /**
     * Gets available time slots for all professionals of a company on a given date.
     * Calculates slots based on the professional's working hours minus existing appointments.
     */
    async getAvailability(
        companyId: string,
        professionals: Professional[],
        dateStr: string // YYYY-MM-DD
    ): Promise<DayAvailability[]> {
        const dayStart = new Date(`${dateStr}T00:00:00`);
        const dayEnd = new Date(`${dateStr}T23:59:59`);

        // Get all existing appointments for this date
        const existingAppointments = await this.scheduleRepository.findByDateRange(
            companyId, dayStart, dayEnd
        );

        const result: DayAvailability[] = [];

        for (const professional of professionals) {
            if (!professional.active) continue;

            const dayOfWeek = this.getDayOfWeek(dayStart);
            const workingSlots = professional.workingHours?.[dayOfWeek];

            if (!workingSlots || workingSlots.length === 0) {
                // Professional doesn't work this day
                result.push({
                    professional: professional.name,
                    date: dateStr,
                    availableSlots: [],
                });
                continue;
            }

            // Filter appointments for this professional
            const profAppointments = existingAppointments.filter(
                a => a.professionalId === professional.id
            );

            const available = this.calculateAvailableSlots(
                workingSlots,
                profAppointments,
                professional.appointmentDuration,
                dateStr
            );

            result.push({
                professional: professional.name,
                date: dateStr,
                availableSlots: available,
            });
        }

        return result;
    }

    /**
     * Gets the client's upcoming appointments.
     */
    async getClientAppointments(
        companyId: string,
        clientPhone: string
    ): Promise<Schedule[]> {
        return this.scheduleRepository.findByClientPhone(companyId, clientPhone);
    }

    /**
     * Calculates available time slots given working hours and existing appointments.
     */
    private calculateAvailableSlots(
        workingSlots: Array<{ start: string; end: string }>,
        appointments: Schedule[],
        durationMinutes: number,
        dateStr: string
    ): AvailableSlot[] {
        const available: AvailableSlot[] = [];

        for (const workSlot of workingSlots) {
            const workStart = this.timeToMinutes(workSlot.start);
            const workEnd = this.timeToMinutes(workSlot.end);

            // Generate all possible slots within this work period
            for (let slotStart = workStart; slotStart + durationMinutes <= workEnd; slotStart += durationMinutes) {
                const slotEnd = slotStart + durationMinutes;

                const slotStartDate = new Date(`${dateStr}T${this.minutesToTime(slotStart)}:00`);
                const slotEndDate = new Date(`${dateStr}T${this.minutesToTime(slotEnd)}:00`);

                // Skip slots in the past
                if (slotStartDate < new Date()) continue;

                // Check if this slot conflicts with any existing appointment
                const hasConflict = appointments.some(appt => {
                    const apptStart = appt.startAt.getTime();
                    const apptEnd = (appt.endAt || new Date(apptStart + durationMinutes * 60000)).getTime();
                    return slotStartDate.getTime() < apptEnd && slotEndDate.getTime() > apptStart;
                });

                if (!hasConflict) {
                    available.push({
                        start: this.minutesToTime(slotStart),
                        end: this.minutesToTime(slotEnd),
                    });
                }
            }
        }

        return available;
    }

    /**
     * Converts day-of-week (0=Sunday) to the key used in workingHours JSON.
     */
    private getDayOfWeek(date: Date): string {
        const days = ["sun", "mon", "tue", "wed", "thu", "fri", "sat"];
        return days[date.getDay()];
    }

    /**
     * Converts "HH:mm" to total minutes since midnight.
     */
    private timeToMinutes(time: string): number {
        const [h, m] = time.split(":").map(Number);
        return h * 60 + m;
    }

    /**
     * Converts total minutes since midnight to "HH:mm".
     */
    private minutesToTime(minutes: number): string {
        const h = Math.floor(minutes / 60).toString().padStart(2, "0");
        const m = (minutes % 60).toString().padStart(2, "0");
        return `${h}:${m}`;
    }
}
