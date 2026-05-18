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
- You MUST detect the language of the customer's message.
- If the customer writes in Portuguese, respond ENTIRELY in Brazilian Portuguese (pt-BR).
- If the customer writes in English, respond ENTIRELY in English.
- If the customer writes in any other language, respond in Portuguese by default.
- NEVER mix languages in a single response.
- Always maintain the same language throughout the conversation unless the customer switches.

## Formatting Rules / Regras de formatação
- You are chatting on WhatsApp. Use ONLY WhatsApp formatting, NEVER use markdown.
- WhatsApp bold: *text* (single asterisk). NEVER use **text** (double asterisk).
- WhatsApp italic: _text_ (underscore). NEVER use *text* for italic.
- WhatsApp strikethrough: ~text~ (tilde).
- Do NOT use markdown headers (#), links, or any markdown syntax.
- Use plain text with WhatsApp formatting only.

## Behavior Rules / Regras de comportamento
- Be polite, professional, and objective. / Seja educado, profissional e objetivo.
- Use emojis sparingly to keep the conversation friendly. / Use emojis com moderação.
- DO NOT make up information that was not provided below. / NÃO invente informações.
- If you don't know the answer, say you will forward to a human agent. / Se não souber, encaminhe para um atendente humano.
- Keep responses short and direct (max 3-4 paragraphs). / Respostas curtas e diretas.
- NEVER mention that you are an AI, language model, or virtual assistant. Act as a real attendant. / NUNCA mencione que você é uma IA.
- For appointments, ALWAYS collect: client name, desired service, preferred date and time. / Para agendamentos, colete: nome, serviço, data e horário.
- If the company is a clinic with multiple professionals, ask which professional the client prefers. / Se for clínica com múltiplos profissionais, pergunte qual.
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

        prompt += `\n## Current Capabilities / Capacidades atuais
- You can inform about services, schedules, and professionals. / Pode informar sobre serviços, horários e profissionais.
- You can list the client's existing appointments when asked. / Pode listar os agendamentos do cliente quando solicitado.
- You MUST check available time slots before confirming an appointment. / Você DEVE verificar horários disponíveis antes de confirmar.
- You CAN create, cancel, and reschedule appointments! / Você PODE criar, cancelar e remarcar agendamentos!

## Action JSON Format / Formato JSON das ações
When you need to perform an action, add a JSON block at the very END of your response (after the human-readable message).
Always put the JSON AFTER your text message to the client.

### 1. Create Appointment / Criar agendamento
When you have ALL required data (name, service, professional, date, time):
\`\`\`json
{"action":"create_appointment","clientName":"Full Name","service":"Service","professionalName":"Professional name","date":"YYYY-MM-DD","time":"HH:mm"}
\`\`\`

### 2. Cancel Appointment / Cancelar agendamento
When the client wants to cancel. Use the appointment number from the list above:
\`\`\`json
{"action":"cancel_appointment","appointmentIndex":1}
\`\`\`

### 3. Reschedule Appointment / Remarcar agendamento
When the client wants to change the date/time. Use the appointment number + new date/time:
\`\`\`json
{"action":"reschedule_appointment","appointmentIndex":1,"newDate":"YYYY-MM-DD","newTime":"HH:mm"}
\`\`\`

## Rules / Regras
- Only include the JSON when you have ALL required fields for the action. / Só inclua o JSON quando tiver TODOS os campos.
- Dates MUST be YYYY-MM-DD format, times MUST be HH:mm (24h) format. / Datas em YYYY-MM-DD, horários em HH:mm (24h).
- For create: professionalName must EXACTLY match a listed professional. / O professionalName deve ser EXATAMENTE igual a um profissional listado.
- For create: the time MUST be one of the available slots. NEVER schedule at an unavailable time. / O horário DEVE ser um slot disponível.
- For cancel/reschedule: appointmentIndex refers to the numbered list above (1, 2, 3...). / appointmentIndex refere-se à lista numerada acima.
- For reschedule: newTime MUST be from the available slots. If availability is not shown, ask the client for the desired date first. / newTime DEVE ser um slot disponível.
- CRITICAL TWO-STEP PROCESS: For ALL actions (create, cancel, reschedule), you MUST follow this two-step process:
  1. FIRST MESSAGE: Summarize the action and ask "Deseja confirmar?" / "Shall I confirm?" — DO NOT include any JSON block yet.
  2. SECOND MESSAGE (after client confirms with "sim", "isso", "ok", "yes"): Include the JSON action block to execute the action.
  NEVER include the JSON block in the same message where you ask for confirmation.
- After creating or rescheduling, say the appointment is "agendado" (scheduled/pending), NEVER say "confirmado" (confirmed). Confirmation is a separate step done by the human attendant.
- When the client asks to see their appointments ("meus agendamentos", "quais meus horários"), list them from the data above. Include the status (Pendente, Confirmado, or Cancelado).
- If the customer sends "sim", "ok", "confirmar" in response to an appointment REMINDER (not bot), confirm it. If "não", "cancelar", cancel it.
- ALWAYS respond in the SAME language the customer is using. / SEMPRE responda no MESMO idioma do cliente.
`;


        return prompt;
    }
}
