import { env } from "../config/configs";
import { CompanyConfig } from "../database/entities/company-config.entity";
import { Professional } from "../database/entities/professional.entity";

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
        userMessage: string
    ): Promise<GeminiResponse> {
        if (!this.apiKey) {
            throw new Error("Gemini API key is not configured");
        }

        const systemInstruction = this.buildSystemPrompt(config, companyName, professionals);

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
                maxOutputTokens: 512,
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
        professionals: Professional[]
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
                prompt += `- **${p.name}**`;
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

        prompt += `\n## Current Capabilities / Capacidades atuais
- You can inform about services, schedules, and professionals. / Pode informar sobre serviços, horários e profissionais.
- To create, cancel, or reschedule appointments, collect the information and inform that the team will confirm shortly. / Para criar, cancelar ou remarcar, colete informações e informe que a equipe confirmará.

## Important / Importante
- If the customer sends "sim", "ok", "confirmar", "yes", "confirm" in response to an appointment reminder, confirm the appointment. / Confirme agendamento com palavras de confirmação.
- If the customer sends "não", "cancelar", "no", "cancel" in response to a reminder, cancel the appointment. / Cancele com palavras de cancelamento.
- Remember: ALWAYS respond in the SAME language the customer is using. / SEMPRE responda no MESMO idioma do cliente.
`;

        return prompt;
    }
}
