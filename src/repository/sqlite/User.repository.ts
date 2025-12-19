import { User } from "../../model/User.model";
import { id, InitializableRepository } from "../IRepository";
import { DbException, InitializationException } from "../../util/exceptions/repositoryExceptions";
import logger from "../../util/logger";
import { ConnectionManager } from "./ConnectionManager";
import { Database } from "sqlite";


const CREATE_TABLE = `CREATE TABLE IF NOT EXISTS users (
    name TEXT NOT NULL,
    email TEXT NOT NULL UNIQUE,
    password TEXT NOT NULL,
    id TEXT PRIMARY KEY
)`;

const INSERT_USER = `INSERT INTO users (id, name, email, password) VALUES (?, ?, ?, ?)`;
const SELECT_BY_ID = `SELECT * FROM users WHERE id = ?`;
const SELECT_ALL = `SELECT * FROM users`;
const UPDATE_USER = `UPDATE users SET name = ?, email = ?, password = ? WHERE id = ?`;
const DELETE_USER = `DELETE FROM users WHERE id = ?`;

export class UserRepository implements InitializableRepository<User> {
    private db: Database | null = null;
    
    async init(): Promise<void> {
        try {
            this.db = await ConnectionManager.getConnection();
            await this.db.exec(CREATE_TABLE);
            logger.info("User table initialized");
        } catch (error: unknown) {
            logger.error("Failed to initialize User table", error as Error);
            throw new InitializationException("Failed to initialize User table", error as Error);
        }
    }

    async create(user: User): Promise<id> {
        if (!this.db) { 
            throw new Error("DB not initialized");
        }
        try {
            const userId = user.id;
            await this.db.run(INSERT_USER, userId, user.name, user.email, user.password);
            return userId;
        } catch (error) {
            throw new Error(`Failed to create user: ${(error as Error).message}`);
        }
    }

    async get(id: id): Promise<User> {
        if (!this.db) { 
            throw new Error("DB not initialized");
        }

        try {
            const user = await this.db.get(SELECT_BY_ID, id);
            if (!user) {
                throw new Error("User not found");
            }
                return new User(user.name, user.email, user.password, user.id);        } catch (error: unknown) {
            if ((error as Error).message === "User not found") {
                throw error;
            }
            throw new Error("Failed to get user of id " + id + ": " + (error as Error).message);
        }
    }

    async getAll(): Promise<User[]> {
        if (!this.db) { 
            throw new Error("DB not initialized");
        }
        try {
            const rows = await this.db.all(SELECT_ALL);
            return rows.map(user => new User(user.name, user.email, user.password, user.id));        } catch (error: unknown) {
            throw new Error("Failed to get all users: " + (error as Error).message);
        }
    }

    async update(user: User): Promise<void> {
        if (!this.db) { 
            throw new Error("DB not initialized");
        }
        try {
            const userId = user.getId();
            const result = await this.db.run(UPDATE_USER, user.name, user.email, user.password, userId);
            if (result.changes === 0) {
                throw new Error("User not found");
            }
        } catch (error) {
            if ((error as Error).message === "User not found") {
                throw error;
            }
            throw new Error("Failed to update user of id " + user.getId() + ": " + (error as Error).message);
        }
    }

    async delete(id: id): Promise<void> {
        if (!this.db) {
            throw new Error("DB not initialized");
        }
        try {
            const result = await this.db.run(DELETE_USER, id);
            if (result.changes === 0) {
                throw new Error("User not found");
            }
        } catch (error) {
            if ((error as Error).message === "User not found") {
                throw error;
            }
            throw new Error("Failed to delete user of id " + id + ": " + (error as Error).message);
        }
    }
}

export async function createUserRepository(): Promise<UserRepository> {
    const userRepository = new UserRepository();
    await userRepository.init();
    return userRepository;
}   