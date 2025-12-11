import config from "../config";
import { ItemCategory } from "../model/IItem"
import { IIdentifiableOrderItem } from "../model/IOrder";
import { IRepository } from "../repository/IRepository";
import { RepositoryFactory } from "../repository/Repository.factory";

export class AnalyticsManagementService {

    // total order count
    public async getTotalOrdersCount(): Promise<number>{
        const categories = Object.values(ItemCategory);        
        let total = 0;
        for (const category of categories) {
            const repo = await this.getRepo(category);
            const orders = await repo.getAll();
            total += orders.length;
        }
        return total;
    }

    // get total of orders by category
    public async getTotalOrdersByCategory(category: ItemCategory): Promise<number>{
        const repo = await this.getRepo(category);

        const orders = await repo.getAll();

        return orders.length;
    }

    // get total revenue
    public async getTotalRevenue(): Promise<number> {
        const categories = Object.values(ItemCategory);        
        let total = 0;
        for (const category of categories) {
            const repo = await this.getRepo(category);
            const orders = await repo.getAll();
            const categoryRevenue = orders.reduce((sum, order) => {
                return sum + (order.getPrice() * order.getQuantity());
            }, 0);
            total += categoryRevenue;
        }
        return total;
    }

    // get total revenue by category
    public async getTotalRevenueByCategory(category: ItemCategory): Promise<number> {
        const repo = await this.getRepo(category);
        
        const orders = await repo.getAll();

        const total = orders.reduce((sum, order) => {
            return sum + (order.getPrice() * order.getQuantity());
        }, 0);

        return total;
    }

    private async getRepo(category: ItemCategory): Promise<IRepository<IIdentifiableOrderItem>> {
        return RepositoryFactory.create(config.dbMode, category);
    }
}