import { IUserRepository } from "../repositories/iuser-repository";
import { ICompanyRepository } from "../repositories/icompany-repository";
import { ICompanyConfigRepository } from "../repositories/icompany-config-repository";
import { User } from "../../infra/database/entities/user.entity";
import { Company } from "../../infra/database/entities/company.entity";
import { CompanyConfig } from "../../infra/database/entities/company-config.entity";
import * as bcrypt from "bcrypt";

export interface RegisterUserDTO {
    name: string;
    email: string;
    password?: string;
    googleId?: string;
    whatsappNumber: string;
}

export class RegisterUserUseCase {
    constructor(
        private readonly userRepo: IUserRepository,
        private readonly companyRepo: ICompanyRepository,
        private readonly companyConfigRepo: ICompanyConfigRepository
    ) {}

    async execute(data: RegisterUserDTO): Promise<User> {
        const existingUser = await this.userRepo.findByEmail(data.email);
        
        if (existingUser) {
            throw new Error("User already exists");
        }

        const user = new User();
        user.name = data.name;
        user.email = data.email;
        if (data.googleId) {
            user.googleId = data.googleId;
        }

        if (data.password) {
            user.password = await bcrypt.hash(data.password, 10);
        }

        const savedUser = await this.userRepo.save(user);

        // Create default company for user
        const company = new Company();
        company.ownerId = savedUser.id;
        company.name = data.name;
        company.slug = this.generateSlug(data.name);
        const savedCompany = await this.companyRepo.save(company);

        // Create company config with WhatsApp number
        const config = new CompanyConfig();
        config.companyId = savedCompany.id;
        config.whatsappNumber = data.whatsappNumber;
        config.syncEnabled = true;
        await this.companyConfigRepo.save(config);

        return savedUser;
    }

    private generateSlug(name: string): string {
        return name
            .toLowerCase()
            .normalize("NFD")
            .replace(/[\u0300-\u036f]/g, "")
            .replace(/[^a-z0-9]+/g, "-")
            .replace(/(^-|-$)/g, "")
            + "-" + Date.now().toString(36);
    }
}
