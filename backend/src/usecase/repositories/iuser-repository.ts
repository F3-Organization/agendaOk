import { User } from "../../infra/database/entities/user.entity";

export interface IUserRepository {
    save(user: User): Promise<User>;
    findByEmail(email: string): Promise<User | null>;
    findById(id: string): Promise<User | null>;
    findByGoogleId(googleId: string): Promise<User | null>;
    update(id: string, data: Partial<User>): Promise<void>;
}
