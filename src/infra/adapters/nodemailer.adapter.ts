import * as nodemailer from "nodemailer";
import { IMailService } from "../../usecase/ports/imail-service";
import { env } from "../config/configs";

export class NodemailerAdapter implements IMailService {
    private transporter: nodemailer.Transporter;

    constructor() {
        this.transporter = nodemailer.createTransport({
            host: env.smtp.host,
            port: env.smtp.port,
            secure: env.smtp.port === 465,
            auth: {
                user: env.smtp.user,
                pass: env.smtp.pass,
            },
        });
    }

    async sendMail(to: string, subject: string, body: string): Promise<void> {
        try {
            await this.transporter.sendMail({
                from: env.smtp.from,
                to,
                subject,
                html: body,
            });
        } catch (error) {
            console.error("[NodemailerAdapter] Error sending email:", error);
            throw new Error("Failed to send email");
        }
    }
}
