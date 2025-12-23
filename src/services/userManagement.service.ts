import { createUserRepository, UserRepository } from "../repository/sqlite/User.repository";
import { User } from "../model/User.model";
import { id } from "../repository/IRepository";
import { NotFoundException } from "../util/exceptions/http/NotFoundException";

export class UserService {
    private userRepository?: UserRepository;

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

    async validateUser(email: string, password: string): Promise<User>{
        const user: User = await (await this.getRepo()).getByEmail(email);
        if (!user) {
            throw new NotFoundException('User not found via email');
        }
        if (user.password !== password){
            throw new NotFoundException('Invalid password')
        }
        return user;
    }

    private async getRepo() {
        if (!this.userRepository) {
            this.userRepository = await createUserRepository();
        }
        return this.userRepository;
    }
}