import { ItemCategory } from "../model/IItem";
import { IOrder } from "../model/IOrder";
import { Initializable, IRepository } from "./IRepository";
import config from "../config";

// SQLite
import { CakeRepository } from "./sqlite/Cake.order.repository";
import { OrderRepository } from "./sqlite/Order.repository";
import { BookRepository } from "./sqlite/Book.order.repository";
import { ToyRepository } from "./sqlite/Toy.order.repository";

// File
import { BookOrderRepository } from "./file/Book.order.repository";
import { ToyOrderRepository } from "./file/Toy.order.repository";
import { CakeOrderRepository } from "./file/Cake.order.repository";

// PostgreSQL
import { OrderRepository as PostgreOrderRepository } from "./postgreSQL/Order.repository";
import { CakeRepository as PostgreCakeRepository } from "./postgreSQL/Cake.repository";
import { BookRepository as PostgreBookRepository } from "./postgreSQL/Book.repository";
import { ToyRepository as PostgreToyRepository } from "./postgreSQL/Toy.repository";

export enum DBMode {
    SQLITE,
    FILE,
    POSTGRESQL
}

export class RepositoryFactory {
    public static async create(mode : DBMode, category: ItemCategory): Promise<IRepository<IOrder>> {

        switch (mode) {
            case DBMode.SQLITE: 
                let repository: IRepository<IOrder> & Initializable;
                switch (category) {
                    case ItemCategory.CAKE:
                        repository = new OrderRepository(new CakeRepository());
                        break;
                    case ItemCategory.Book:
                        repository = new OrderRepository(new BookRepository());
                        break;
                    case ItemCategory.Toy:
                        repository = new OrderRepository(new ToyRepository());
                        break;
                        default:
                            throw new Error("Unsupported category for SQLite");
                    }
                await repository.init();
                return repository;

            case DBMode.FILE:
                switch (category) {
                    case ItemCategory.CAKE:
                        return new CakeOrderRepository(config.storagePath.csv.cake);
                    case ItemCategory.Book:
                        return new BookOrderRepository(config.storagePath.json.book);
                    case ItemCategory.Toy:
                        return new ToyOrderRepository(config.storagePath.xml.toy);
                    default:
                        throw new Error("Unsupported category for File");
                }

            case DBMode.POSTGRESQL:
                let repo: IRepository<IOrder> & Initializable;
                switch (category) {
                    case ItemCategory.CAKE:
                        repo = new PostgreOrderRepository(new PostgreCakeRepository());
                        break;
                    case ItemCategory.Book:
                        repo = new PostgreOrderRepository(new PostgreBookRepository());
                        break;
                    case ItemCategory.Toy:
                        repo = new PostgreOrderRepository(new PostgreToyRepository());
                        break;
                    default:
                        throw new Error("Unsupported category for PostgreSQL");
                }

                await repo.init();
                return repo;
                
            default:
                throw new Error("Unsupported DB mode");
        } 

    }
}