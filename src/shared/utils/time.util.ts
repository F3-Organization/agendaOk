/**
 * Checks if the current time is within a given "silent window" range.
 * Supports standard ranges (e.g., 08:00 to 18:00) and overnight ranges (e.g., 22:00 to 07:00).
 * 
 * @param start HH:mm format
 * @param end HH:mm format
 * @returns boolean
 */
export function isWithinSilentWindow(start: string, end: string): boolean {
    const now = new Date();
    const currentTime = now.getHours() * 60 + now.getMinutes();

    const [startHour, startMin] = start.split(':').map(Number);
    const [endHour, endMin] = end.split(':').map(Number);
    
    if (startHour === undefined || startMin === undefined || endHour === undefined || endMin === undefined) return false;

    const startTime = startHour * 60 + startMin;
    const endTime = endHour * 60 + endMin;

    if (startTime < endTime) {
        // Standard range (e.g., 08:00 to 20:00)
        return currentTime >= startTime && currentTime <= endTime;
    } else {
        // Overnight range (e.g., 22:00 to 08:00)
        return currentTime >= startTime || currentTime <= endTime;
    }
}
