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

function escapeRegex(keyword: string): string {
    return keyword.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function buildKeywordPattern(keywords: string[]): RegExp {
    const alternatives = keywords.map(escapeRegex).join("|");
    return new RegExp(`(?<![\\p{L}\\p{N}])(?:${alternatives})(?![\\p{L}\\p{N}])`, "iu");
}

const CONFIRMATION_PATTERN = buildKeywordPattern(CONFIRMATION_KEYWORDS);
const CANCELLATION_PATTERN = buildKeywordPattern(CANCELLATION_KEYWORDS);

export class KeywordDetectorService {
    isConfirmation(text: string): boolean {
        return CONFIRMATION_PATTERN.test(text.trim());
    }

    isCancellation(text: string): boolean {
        return CANCELLATION_PATTERN.test(text.trim());
    }

    isDirectResponse(text: string): boolean {
        return this.isConfirmation(text) || this.isCancellation(text);
    }
}
