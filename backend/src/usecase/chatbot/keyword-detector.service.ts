const CONFIRMATION_KEYWORDS = [
    // Portuguese
    "sim", "confirmado", "ok", "com certeza", "pode confirmar", "confirmar", "perfeito", "topo",
    // English
    "yes", "confirmed", "confirm", "sure", "absolutely", "of course", "perfect",
];

const CANCELLATION_KEYWORDS = [
    // Portuguese
    "não", "nao", "cancelar", "desistir", "remarcar", "não vou", "nao vou", "cancela",
    // English
    "no", "cancel", "reschedule", "won't go", "can't make it", "not going",
];

export class KeywordDetectorService {
    isConfirmation(text: string): boolean {
        const normalized = text.toLowerCase().trim();
        return CONFIRMATION_KEYWORDS.some(k => normalized.includes(k));
    }

    isCancellation(text: string): boolean {
        const normalized = text.toLowerCase().trim();
        return CANCELLATION_KEYWORDS.some(k => normalized.includes(k));
    }

    isDirectResponse(text: string): boolean {
        return this.isConfirmation(text) || this.isCancellation(text);
    }
}
