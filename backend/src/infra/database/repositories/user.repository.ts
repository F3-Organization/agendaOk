import { Repository } from "typeorm";
import { AppDataSource } from "../../config/data-source";
import { User } from "../entities/user.entity";
import { IUserRepository } from "../../../usecase/repositories/iuser-repository";
import { encrypt, decrypt } from "../../../shared/utils/cryptography";

export class UserRepository implements IUserRepository {
    private repository: Repository<User>;

    constructor() {
        this.repository = AppDataSource.getRepository(User);
    }

    private mapUser(user: User | null): User | null {
        if (!user) return null;
        if (user.twoFactorSecret) {
            user.twoFactorSecret = decrypt(user.twoFactorSecret);
        }
        return user;
    }

    async save(user: User): Promise<User> {
        if (user.twoFactorSecret) {
            user.twoFactorSecret = encrypt(user.twoFactorSecret);
        }
        const savedUser = await this.repository.save(user);
        return this.mapUser(savedUser)!;
    }

    async findByEmail(email: string): Promise<User | null> {
        const user = await this.repository.findOneBy({ email });
        return this.mapUser(user);
    }

    async findById(id: string): Promise<User | null> {
        const user = await this.repository.findOneBy({ id });
        return this.mapUser(user);
    }

    async findByGoogleId(googleId: string): Promise<User | null> {
        const user = await this.repository.findOneBy({ googleId });
        return this.mapUser(user);
    }

    async update(id: string, data: Partial<User>): Promise<void> {
        if (data.twoFactorSecret) {
            data.twoFactorSecret = encrypt(data.twoFactorSecret);
        }
        await this.repository.update(id, data);
    }
}
