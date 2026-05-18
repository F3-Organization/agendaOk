import { env } from "../config/configs";
import { CompanyConfig } from "../database/entities/company-config.entity";
import { Professional } from "../database/entities/professional.entity";
import { Schedule } from "../database/entities/schedule.entity";
import { DayAvailability } from "../../usecase/chatbot/availability.service";

export interface ChatMessage {
    role: "user" | "model";
    parts: Array<{ text: string }>;
}

export interface GeminiResponse {
    text: string;
}

export class GeminiAdapter {
    private apiKey: string;
    private model: string;
    private baseUrl: string;

    constructor() {
        this.apiKey = env.gemini.apiKey;
        this.model = env.gemini.model;
        this.baseUrl = `https://generativelanguage.googleapis.com/v1beta/models/${this.model}`;
    }

    async chat(
        config: CompanyConfig,
        companyName: string,
        professionals: Professional[],
        history: ChatMessage[],
        userMessage: string,
        clientAppointments?: Schedule[],
        availability?: DayAvailability[] | null
    ): Promise<GeminiResponse> {
        if (!this.apiKey) {
            throw new Error("Gemini API key is not configured");
        }

        const systemInstruction = this.buildSystemPrompt(config, companyName, professionals, clientAppointments, availability);

        const contents: ChatMessage[] = [
            ...history,
            { role: "user", parts: [{ text: userMessage }] }
        ];

        const body = {
            system_instruction: {
                parts: [{ text: systemInstruction }]
            },
            contents,
            generationConfig: {
                temperature: 0.7,
                topP: 0.9,
                topK: 40,
                maxOutputTokens: 1024,
            },
            safetySettings: [
                { category: "HARM_CATEGORY_HARASSMENT", threshold: "BLOCK_ONLY_HIGH" },
                { category: "HARM_CATEGORY_HATE_SPEECH", threshold: "BLOCK_ONLY_HIGH" },
                { category: "HARM_CATEGORY_SEXUALLY_EXPLICIT", threshold: "BLOCK_ONLY_HIGH" },
                { category: "HARM_CATEGORY_DANGEROUS_CONTENT", threshold: "BLOCK_ONLY_HIGH" },
            ]
        };

        try {
            const response = await fetch(
                `${this.baseUrl}:generateContent?key=${this.apiKey}`,
                {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify(body),
                }
            );

            if (!response.ok) {
                const errorBody = await response.text();
                console.error(`[GeminiAdapter] API error ${response.status}: ${errorBody}`);
                throw new Error(`Gemini API returned ${response.status}`);
            }

            const data: any = await response.json();

            const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;
            if (!text) {
                console.error("[GeminiAdapter] No text in response:", JSON.stringify(data));
                throw new Error("No text in Gemini response");
            }

            return { text: text.trim() };
        } catch (error) {
            console.error("[GeminiAdapter] Error calling Gemini:", error);
            throw error;
        }
    }

    private buildSystemPrompt(
        config: CompanyConfig,
        companyName: string,
        professionals: Professional[],
        clientAppointments?: Schedule[],
        availability?: DayAvailability[] | null
    ): string {
        const now = new Date();
        const dayOfWeekPt = now.toLocaleDateString("pt-BR", { weekday: "long" });
        const dayOfWeekEn = now.toLocaleDateString("en-US", { weekday: "long" });
        const datePt = now.toLocaleDateString("pt-BR");
        const dateEn = now.toLocaleDateString("en-US");
        const timeStr = now.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });

        let prompt = `You are the virtual assistant for the company "${companyName}" on WhatsApp.
Today is ${dayOfWeekPt} (${dayOfWeekEn}), ${datePt} (${dateEn}), ${timeStr}.

## CRITICAL LANGUAGE RULE
- Detect the language of the customer's message.
- If Portuguese → respond in Brazilian Portuguese (pt-BR).
- If English → respond in English.
- Otherwise → default to Portuguese.
- NEVER mix languages.

## MESSAGING STYLE — THIS IS CRITICAL
You are chatting on WhatsApp. Your messages must feel like a real human receptionist texting — short, warm, and scannable.

### Format rules:
- Use WhatsApp formatting ONLY: *bold* (single asterisk), _italic_ (underscore). NEVER use markdown (**bold**, # headers, links).
- Keep messages SHORT. Maximum 4-6 lines total. Clients are on their phones.
- Use line breaks to separate sections visually. Never write walls of text.
- Use emojis strategically as visual anchors (🕐 for times, 📋 for details, ✅ for confirmations, ❌ for cancellations).
- When listing time slots, use one emoji bullet per line: 🕐 09:00 — 09:30
- NEVER write long paragraphs. Each "section" of your message should be 1-2 lines max.
- End with a short friendly question or closing phrase.

### Good example (PT):
Olá! 😊 A Dra. Ana tem os seguintes horários na terça:

🕐 09:00 — 09:30
🕐 11:00 — 11:30
🕐 15:00 — 15:30

Qual horário é melhor para você?

### Good confirmation example (PT):
✅ Consulta agendada!

📋 Dra. Ana Silva
📅 Terça, 22 de abril
🕐 15:00 — 15:30

Enviaremos um lembrete no dia. Até lá! 💜

### Bad example (DO NOT write like this):
"Olá! Fico feliz em ajudá-lo com o agendamento. A Dra. Ana tem disponibilidade na terça-feira nos seguintes horários: das 09:00 às 09:30, das 11:00 às 11:30 e das 15:00 às 15:30. Por favor, me informe qual horário seria mais conveniente para você e eu irei realizar o agendamento."

## Behavior Rules
- Be warm, professional, and concise. Sound human, not robotic.
- Use emojis sparingly (2-3 per message max).
- DO NOT make up information not provided below.
- If you don't know, say you'll forward to a human attendant.
- NEVER mention you are an AI or virtual assistant. Act as a real receptionist.
- For appointments, collect: client name, desired service, preferred date/time, and professional (if multiple).
`;


        if (config.businessType) {
            prompt += `\n## Business Type / Tipo de negócio\n${config.businessType}\n`;
        }

        if (config.businessDescription) {
            prompt += `\n## About the company / Sobre a empresa\n${config.businessDescription}\n`;
        }

        if (config.address) {
            prompt += `\n## Address / Endereço\n${config.address}\n`;
        }

        if (config.workingHours) {
            prompt += `\n## Working Hours / Horários de funcionamento\n`;
            const dayNames: Record<string, string> = {
                mon: "Segunda/Monday", tue: "Terça/Tuesday", wed: "Quarta/Wednesday",
                thu: "Quinta/Thursday", fri: "Sexta/Friday", sat: "Sábado/Saturday", sun: "Domingo/Sunday"
            };
            for (const [day, slots] of Object.entries(config.workingHours)) {
                const dayName = dayNames[day] || day;
                const hours = slots.map((s: { start: string; end: string }) => `${s.start} - ${s.end}`).join(", ");
                prompt += `- ${dayName}: ${hours}\n`;
            }
        }

        if (config.servicesOffered && config.servicesOffered.length > 0) {
            prompt += `\n## Services Offered / Serviços oferecidos\n`;
            config.servicesOffered.forEach((s: string) => {
                prompt += `- ${s}\n`;
            });
        }

        if (professionals.length > 0) {
            prompt += `\n## Available Professionals / Profissionais disponíveis\n`;
            professionals.forEach((p) => {
                prompt += `- *${p.name}*`;
                if (p.specialty) prompt += ` (${p.specialty})`;
                prompt += ` — Appointment duration / Duração da consulta: ${p.appointmentDuration} min`;
                if (p.workingHours) {
                    const dayNames: Record<string, string> = {
                        mon: "Mon/Seg", tue: "Tue/Ter", wed: "Wed/Qua",
                        thu: "Thu/Qui", fri: "Fri/Sex", sat: "Sat/Sáb", sun: "Sun/Dom"
                    };
                    const schedule = Object.entries(p.workingHours)
                        .map(([day, slots]) => {
                            const dayName = dayNames[day] || day;
                            const hours = slots.map((s: { start: string; end: string }) => `${s.start}-${s.end}`).join(", ");
                            return `${dayName}: ${hours}`;
                        })
                        .join(" | ");
                    prompt += `\n  Schedule / Horários: ${schedule}`;
                }
                prompt += `\n`;
            });
        }

        if (config.botGreeting) {
            prompt += `\n## Default Greeting / Saudação padrão\nWhen the customer sends the first message, use this greeting as a base (adapt as needed). If the customer writes in English, translate and adapt it:\n"${config.botGreeting}"\n`;
        }

        if (config.botInstructions) {
            prompt += `\n## Owner's Additional Instructions / Instruções adicionais do proprietário\n${config.botInstructions}\n`;
        }

        // Client's existing appointments context
        if (clientAppointments && clientAppointments.length > 0) {
            prompt += `\n## Client's Current Appointments / Agendamentos atuais do cliente\nThis client already has the following upcoming appointments (numbered for reference):\n`;
            for (let i = 0; i < clientAppointments.length; i++) {
                const appt = clientAppointments[i];
                const date = new Date(appt.startAt).toLocaleDateString("pt-BR");
                const time = new Date(appt.startAt).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });
                const statusLabel = appt.status === "CONFIRMED" ? "✅ Confirmado" : appt.status === "PENDING" ? "⏳ Pendente" : appt.status;
                prompt += `${i + 1}. ${date} às ${time} — ${appt.title} (${statusLabel})\n`;
            }
            prompt += `\nUse the number (1, 2, 3...) to reference specific appointments in actions.\n`;
        } else {
            prompt += `\n## Client's Current Appointments / Agendamentos atuais do cliente\nThis client has NO upcoming appointments. / Este cliente NÃO possui agendamentos futuros.\n`;
        }

        // Availability context
        if (availability && availability.length > 0) {
            prompt += `\n## Available Time Slots / Horários disponíveis\n`;
            prompt += `Below are the available slots for the requested date. ONLY offer these times to the client. Do NOT suggest unavailable times.\n`;
            prompt += `Abaixo estão os horários disponíveis para a data solicitada. Ofereça SOMENTE estes horários ao cliente. NÃO sugira horários indisponíveis.\n\n`;
            for (const dayAvail of availability) {
                prompt += `*${dayAvail.professional}* (${dayAvail.date}):\n`;
                if (dayAvail.availableSlots.length === 0) {
                    prompt += `  ❌ No available slots / Sem horários disponíveis\n`;
                } else {
                    const slotList = dayAvail.availableSlots.map(s => `${s.start}-${s.end}`).join(", ");
                    prompt += `  ✅ ${slotList}\n`;
                }
            }
            prompt += `\nIMPORTANT: If the client requests a time that is NOT in the list above, tell them that time is unavailable and suggest alternatives from the list.\n`;
            prompt += `IMPORTANTE: Se o cliente pedir um horário que NÃO está na lista acima, diga que está indisponível e sugira alternativas da lista.\n`;
        }

        prompt += `\n## Current Capabilities
- Inform about services, schedules, and professionals.
- List the client's existing appointments.
- Create, cancel, and reschedule appointments via JSON actions.

## Listing Appointments
When the client asks about their appointments ("meus agendamentos", "quais meus horários"), list them using this visual format:

### Example:
📋 Seus agendamentos:

1️⃣ Corte de cabelo
📅 18/05/2026
🕐 15:00
⏳ Pendente

2️⃣ Coloração
📅 20/05/2026
🕐 10:00
✅ Confirmado

DO NOT include any JSON block when listing appointments. This is information only.

## Action JSON Format
ONLY when you need to EXECUTE an action (create, cancel, reschedule), add a JSON block at the END of your message.

### 1. Create Appointment
\`\`\`json
{"action":"create_appointment","clientName":"Full Name","service":"Service","professionalName":"Professional name","date":"YYYY-MM-DD","time":"HH:mm"}
\`\`\`

### 2. Cancel Appointment
\`\`\`json
{"action":"cancel_appointment","appointmentIndex":1}
\`\`\`

### 3. Reschedule Appointment
\`\`\`json
{"action":"reschedule_appointment","appointmentIndex":1,"newDate":"YYYY-MM-DD","newTime":"HH:mm"}
\`\`\`

## CRITICAL RULES FOR JSON ACTIONS

### When to NEVER include JSON:
- ❌ When listing appointments
- ❌ When answering questions about services, hours, or prices
- ❌ When greeting the client
- ❌ When asking clarifying questions
- ❌ When the client hasn't explicitly requested an action

### When to include JSON:
- ✅ ONLY when executing a confirmed action (create, cancel, reschedule)
- ✅ ONLY after the client has confirmed ("sim", "ok", "yes", "isso")

### TWO-STEP CONFIRMATION (MANDATORY):
For ALL actions, follow this process:

Step 1 — Summarize and ask:
✅ Agendamento:

📋 Corte de cabelo
👤 Dra. Ana
📅 Terça, 22 de abril
🕐 15:00

Deseja confirmar?

(NO JSON in this message)

Step 2 — After client confirms ("sim", "ok"):
Include the JSON block to execute.

### Other rules:
- Dates: YYYY-MM-DD. Times: HH:mm (24h).
- professionalName must EXACTLY match a listed professional name.
- The time MUST be from the available slots. Never schedule unavailable times.
- appointmentIndex refers to the numbered list (1, 2, 3...).
- After creating/rescheduling, say "agendado" (pending). NEVER say "confirmado" — confirmation is done by the human attendant later.
- If the customer replies "sim"/"ok" to an appointment REMINDER, confirm it. If "não"/"cancelar", cancel it.
`;


        return prompt;
    }
}
