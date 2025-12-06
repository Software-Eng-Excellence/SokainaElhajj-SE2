import { RepositoryFactory, DBMode } from "../../src/repository/Repository.factory";
import { ItemCategory } from "../../src/model/IItem";
import { OrderRepository as SqliteOrderRepository } from "../../src/repository/sqlite/Order.repository";
import { CakeOrderRepository } from "../../src/repository/file/Cake.order.repository";
import { BookOrderRepository } from "../../src/repository/file/Book.order.repository";
import { ToyOrderRepository } from "../../src/repository/file/Toy.order.repository";
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
        it("should create CakeOrderRepository", async () => {
            const repo = await RepositoryFactory.create(DBMode.FILE, ItemCategory.CAKE);
            expect(repo).toBeInstanceOf(CakeOrderRepository);
        });

        it("should create BookOrderRepository", async () => {
            const repo = await RepositoryFactory.create(DBMode.FILE, ItemCategory.Book);
            expect(repo).toBeInstanceOf(BookOrderRepository);
        });

        it("should create ToyOrderRepository", async () => {
            const repo = await RepositoryFactory.create(DBMode.FILE, ItemCategory.Toy);
            expect(repo).toBeInstanceOf(ToyOrderRepository);
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