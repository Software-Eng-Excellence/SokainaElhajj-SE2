import { createUserRepository } from "../repository/sqlite/User.repository";
import { User } from "../model/User.model";
import { InitializableRepository, id } from "../repository/IRepository";

export class UserService {
    private userRepository?: InitializableRepository<User>;

    async createUser(user: User): Promise<id> {
        return (await this.getRepo()).create(user);
    }

    async getUserById(userId: id): Promise<User> {
        return (await this.getRepo()).get(userId);
    }

    async getAllUsers(): Promise<User[]> {
        return (await this.getRepo()).getAll();
    }

    async updateUser(user: User): Promise<void> {
        return (await this.getRepo()).update(user);
    }

    async deleteUser(userId: id): Promise<void> {
        return (await this.getRepo()).delete(userId);
    }

    private async getRepo() {
        if (!this.userRepository) {
            this.userRepository = await createUserRepository();
        }
        return this.userRepository;
    }
}