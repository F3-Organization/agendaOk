import { z } from "zod";

const workingHoursSchema = z.record(
    z.enum(["mon", "tue", "wed", "thu", "fri", "sat", "sun"]),
    z.array(z.object({
        start: z.string().regex(/^\d{2}:\d{2}$/),
        end: z.string().regex(/^\d{2}:\d{2}$/)
    }))
).optional();

export const createProfessionalSchema = z.object({
    name: z.string().min(1),
    specialty: z.string().optional(),
    workingHours: workingHoursSchema,
    appointmentDuration: z.number().min(5).max(480).optional(),
});

export const updateProfessionalSchema = z.object({
    name: z.string().min(1).optional(),
    specialty: z.string().optional(),
    workingHours: workingHoursSchema,
    appointmentDuration: z.number().min(5).max(480).optional(),
    active: z.boolean().optional(),
});

export const updateBotConfigSchema = z.object({
    businessType: z.string().optional(),
    businessDescription: z.string().optional(),
    botGreeting: z.string().optional(),
    botInstructions: z.string().optional(),
    address: z.string().optional(),
    workingHours: workingHoursSchema,
    servicesOffered: z.array(z.string()).optional(),
    botEnabled: z.boolean().optional(),
});
