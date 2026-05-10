export class AppError extends Error {
    public readonly statusCode: number;

    constructor(message: string, statusCode = 400) {
        super(message);
        this.statusCode = statusCode;
        
        // Ensure proper prototype chain inheritance for instanceof checks
        Object.setPrototypeOf(this, AppError.prototype);
    }
}
