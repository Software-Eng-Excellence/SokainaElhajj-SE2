import { ItemCategory } from "../model/IItem";
import { IOrder } from "../model/IOrder";
import { Initializable, IRepository } from "./IRepository";
import { CakeOrderRepository } from "./file/Cake.order.repository";
import config from "../config";
import { CakeRepository } from "./sqlite/Cake.order.repository";
import { OrderRepository } from "./sqlite/Order.repository";

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
                        default:
                            throw new Error("Unsupported category");
                    }
                await repository.init();
                return repository;
            case DBMode.FILE:
                switch (category) {
                    case ItemCategory.CAKE:
                        return new CakeOrderRepository(config.storagePath.csv.cake);
                    default:
                        throw new Error("Unsupported category");
                }
            default:
                throw new Error("Unsupported DB mode");
        } 

    }
}