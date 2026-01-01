// Mock config
jest.mock("../../src/config", () => ({
    __esModule: true,
    default: { dbMode: "TEST_MODE" }
}));

// Mock logger
jest.mock("../../src/util/logger", () => ({
    __esModule: true,
    default: {
        info: jest.fn(),
        error: jest.fn(),
        warn: jest.fn(),
        debug: jest.fn()
    }
}));

// Mock the database connections to prevent actual DB initialization
jest.mock("../../src/repository/sqlite/Order.repository", () => {
    const actual = jest.requireActual("../../src/repository/sqlite/Order.repository");
    return {
        ...actual,
        OrderRepository: class MockSqliteOrderRepository {
            async init() { return; }
            async create() { return; }
            async get() { return null; }
            async getAll() { return []; }
            async update() { return; }
            async delete() { return; }
        }
    };
});

// Mock repository
jest.mock("../../src/repository/postgreSQL/Order.repository", () => {
    const actual = jest.requireActual("../../src/repository/postgreSQL/Order.repository");
    return {
        ...actual,
        OrderRepository: class MockPostgreOrderRepository {
            async init() { return; }
            async create() { return; }
            async get() { return null; }
            async getAll() { return []; }
            async update() { return; }
            async delete() { return; }
        }
    };
});

import { RepositoryFactory, DBMode } from "../../src/repository/Repository.factory";
import { ItemCategory } from "../../src/model/IItem";
import { OrderRepository as SqliteOrderRepository } from "../../src/repository/sqlite/Order.repository";
import { OrderRepository as PostgreOrderRepository } from "../../src/repository/postgreSQL/Order.repository";

describe("RepositoryFactory", () => {

    describe("SQLite Mode", () => {
        it("should create SQLite OrderRepository for CAKE", async () => {
            const repo = await RepositoryFactory.create(DBMode.SQLITE, ItemCategory.CAKE);
            expect(repo).toBeInstanceOf(SqliteOrderRepository);
        });

        it("should create SQLite OrderRepository for Book", async () => {
            const repo = await RepositoryFactory.create(DBMode.SQLITE, ItemCategory.Book);
            expect(repo).toBeInstanceOf(SqliteOrderRepository);
        });

        it("should create SQLite OrderRepository for Toy", async () => {
            const repo = await RepositoryFactory.create(DBMode.SQLITE, ItemCategory.Toy);
            expect(repo).toBeInstanceOf(SqliteOrderRepository);
        });
    });

    describe("FILE Mode", () => {
        it("should throw error for CAKE (FILE mode is deprecated)", async () => {
            await expect(async () => {
                await RepositoryFactory.create(DBMode.FILE, ItemCategory.CAKE);
            }).rejects.toThrow("File mode is deprecated");
        });

        it("should throw error for Book (FILE mode is deprecated)", async () => {
            await expect(async () => {
                await RepositoryFactory.create(DBMode.FILE, ItemCategory.Book);
            }).rejects.toThrow("File mode is deprecated");
        });

        it("should throw error for Toy (FILE mode is deprecated)", async () => {
            await expect(async () => {
                await RepositoryFactory.create(DBMode.FILE, ItemCategory.Toy);
            }).rejects.toThrow("File mode is deprecated");
        });
    });

    describe("PostgreSQL Mode", () => {
        it("should create PostgreOrderRepository for CAKE", async () => {
            const repo = await RepositoryFactory.create(DBMode.POSTGRESQL, ItemCategory.CAKE);
            expect(repo).toBeInstanceOf(PostgreOrderRepository);
        });

        it("should create PostgreOrderRepository for Book", async () => {
            const repo = await RepositoryFactory.create(DBMode.POSTGRESQL, ItemCategory.Book);
            expect(repo).toBeInstanceOf(PostgreOrderRepository);
        });

        it("should create PostgreOrderRepository for Toy", async () => {
            const repo = await RepositoryFactory.create(DBMode.POSTGRESQL, ItemCategory.Toy);
            expect(repo).toBeInstanceOf(PostgreOrderRepository);
        });
    });

    describe("Errors", () => {
        it("should throw error for unsupported category in SQLite", async () => {
            await expect(async () => {
                await RepositoryFactory.create(DBMode.SQLITE, "INVALID" as ItemCategory);
            }).rejects.toThrow("Unsupported category for SQLite");
        });

        it("should throw error for unsupported DB mode", async () => {
            await expect(async () => {
                await RepositoryFactory.create(999 as DBMode, ItemCategory.CAKE);
            }).rejects.toThrow("Unsupported DB mode");
        });
    });
});