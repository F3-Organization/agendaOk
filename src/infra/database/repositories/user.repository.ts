import { Repository } from "typeorm";
import { AppDataSource } from "../../config/data-source";
import { User } from "../entities/user.entity";
import { IUserRepository } from "../../../usecase/repositories/iuser-repository";

export class UserRepository implements IUserRepository {
    private repository: Repository<User>;

    constructor() {
        this.repository = AppDataSource.getRepository(User);
    }

    async save(user: User): Promise<User> {
        return await this.repository.save(user);
    }

    async findByEmail(email: string): Promise<User | null> {
        return await this.repository.findOneBy({ email });
    }

    async findById(id: string): Promise<User | null> {
        return await this.repository.findOneBy({ id });
    }

    async findByGoogleId(googleId: string): Promise<User | null> {
        return await this.repository.findOneBy({ googleId });
    }
}
