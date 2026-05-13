import { isWithinSilentWindow } from "../../shared/utils/time.util";
import { CompanyConfig } from "../../infra/database/entities/company-config.entity";

/**
 * Defaults aligned with CompanyConfig entity defaults (22:00–08:00).
 */
const DEFAULT_START = "22:00";
const DEFAULT_END = "08:00";

export class SilentWindowService {
    /**
     * Checks whether the current time falls within the company's silent window.
     * Uses entity defaults if the config values are missing.
     */
    isSilent(config: CompanyConfig): boolean {
        const start = config.silentWindowStart ?? DEFAULT_START;
        const end = config.silentWindowEnd ?? DEFAULT_END;
        return isWithinSilentWindow(start, end);
    }
}
