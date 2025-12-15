import { Request, Response } from "express";
import { ItemCategory } from "../model/IItem";
import { AnalyticsManagementService } from "../services/analyticsManagement.service";
import { BadRequestException } from "../util/exceptions/http/BadRequestException";

export class AnalyticsController {
    constructor (private readonly analyticsService: AnalyticsManagementService) {}

    // get total revenue
    public async getTotalRevenue(req: Request, res: Response) {
        const revenue = await this.analyticsService.getTotalRevenue();
        res.status(200).json(revenue);
    }

    // get total revenue by category 
    public async getRevenueByCategory(req: Request, res: Response) {
        const category = this.validateCategory(req);

        const revenue = await this.analyticsService.getTotalRevenueByCategory(category);
        res.status(200).json(revenue);
    }


    // get total orders
    public async getTotalOrders(req: Request, res: Response) {
        const count = await this.analyticsService.getTotalOrdersCount();
        res.status(200).json(count);
    } 

    // get orders count by category
    public async getTotalOrdersByCategory(req: Request, res: Response) {
        const category = this.validateCategory(req);

        const orders = await this.analyticsService.getTotalOrdersByCategory(category);
        res.status(200).json(orders);
    }

    // helper function for category 
    private validateCategory(req: Request): ItemCategory {
        const category = req.params.category as string;

        if (!category) {
            throw new BadRequestException("Category is required", {
                categoryNotDefined: true
            });   
        }

        if (!Object.values(ItemCategory).includes(category as ItemCategory)) {
            throw new BadRequestException("Invalid Category provided", { 
                invalidCategory: category,
                allowed: Object.values(ItemCategory)
            });
        }

        return category as ItemCategory;
    }
}