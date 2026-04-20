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
        const dayOfWeek = now.toLocaleDateString("pt-BR", { weekday: "long" });
        const dateStr = now.toLocaleDateString("pt-BR");
        const timeStr = now.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });

        let prompt = `Você é o assistente virtual da empresa "${companyName}" no WhatsApp.
Hoje é ${dayOfWeek}, ${dateStr}, ${timeStr}.

## Regras de comportamento
- Seja educado, profissional e objetivo.
- Use emojis com moderação para deixar a conversa amigável.
- Responda SEMPRE em português brasileiro.
- NÃO invente informações que não foram fornecidas abaixo.
- Se não souber responder algo, diga que vai encaminhar para um atendente humano.
- Mantenha respostas curtas e diretas (máx. 3-4 parágrafos).
- NUNCA mencione que você é uma IA, modelo de linguagem ou assistente virtual. Aja como um atendente real.
- Para agendamentos, SEMPRE colete: nome do cliente, serviço desejado, data e horário de preferência.
- Se a empresa é uma clínica e tem múltiplos profissionais, pergunte com qual profissional o cliente deseja atendimento.
`;

        if (config.businessType) {
            prompt += `\n## Tipo de negócio\n${config.businessType}\n`;
        }

        if (config.businessDescription) {
            prompt += `\n## Sobre a empresa\n${config.businessDescription}\n`;
        }

        if (config.address) {
            prompt += `\n## Endereço\n${config.address}\n`;
        }

        if (config.workingHours) {
            prompt += `\n## Horários de funcionamento\n`;
            const dayNames: Record<string, string> = {
                mon: "Segunda", tue: "Terça", wed: "Quarta",
                thu: "Quinta", fri: "Sexta", sat: "Sábado", sun: "Domingo"
            };
            for (const [day, slots] of Object.entries(config.workingHours)) {
                const dayName = dayNames[day] || day;
                const hours = slots.map((s: { start: string; end: string }) => `${s.start} - ${s.end}`).join(", ");
                prompt += `- ${dayName}: ${hours}\n`;
            }
        }

        if (config.servicesOffered && config.servicesOffered.length > 0) {
            prompt += `\n## Serviços oferecidos\n`;
            config.servicesOffered.forEach((s: string) => {
                prompt += `- ${s}\n`;
            });
        }

        if (professionals.length > 0) {
            prompt += `\n## Profissionais disponíveis\n`;
            professionals.forEach((p) => {
                prompt += `- **${p.name}**`;
                if (p.specialty) prompt += ` (${p.specialty})`;
                prompt += ` — Duração da consulta: ${p.appointmentDuration} min`;
                if (p.workingHours) {
                    const dayNames: Record<string, string> = {
                        mon: "Seg", tue: "Ter", wed: "Qua",
                        thu: "Qui", fri: "Sex", sat: "Sáb", sun: "Dom"
                    };
                    const schedule = Object.entries(p.workingHours)
                        .map(([day, slots]) => {
                            const dayName = dayNames[day] || day;
                            const hours = slots.map((s: { start: string; end: string }) => `${s.start}-${s.end}`).join(", ");
                            return `${dayName}: ${hours}`;
                        })
                        .join(" | ");
                    prompt += `\n  Horários: ${schedule}`;
                }
                prompt += `\n`;
            });
        }

        if (config.botGreeting) {
            prompt += `\n## Saudação padrão\nQuando o cliente enviar a primeira mensagem, use esta saudação como base (adapte conforme necessário):\n"${config.botGreeting}"\n`;
        }

        if (config.botInstructions) {
            prompt += `\n## Instruções adicionais do proprietário\n${config.botInstructions}\n`;
        }

        prompt += `\n## Capacidades atuais
- Você pode informar sobre serviços, horários e profissionais.
- Para criar, cancelar ou remarcar agendamentos, colete as informações e informe que a equipe irá confirmar em breve.
- Em uma versão futura, você poderá criar agendamentos diretamente.

## Importante
- Se o cliente enviar "sim", "ok", "confirmar" em resposta a um lembrete de agendamento, confirme o agendamento.
- Se o cliente enviar "não", "cancelar", "desistir", cancele o agendamento.
`;

        return prompt;
    }
}
