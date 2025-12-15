import { AnalyticsManagementService } from "../services/analyticsManagement.service";
import { AnalyticsController } from "../controllers/analytics.controller";
import { Router } from "express";
import { asyncHandler } from "../middleware/asyncHandler";

const analyticsController = new AnalyticsController(new AnalyticsManagementService());
const route = Router();

route.route('/revenue')
     .get(asyncHandler(analyticsController.getTotalRevenue.bind(analyticsController)));
     
route.route('/revenue/:category')
    .get(asyncHandler(analyticsController.getRevenueByCategory.bind(analyticsController)))

route.route('/orders')
    .get(asyncHandler(analyticsController.getTotalOrders.bind(analyticsController)))

route.route('/orders/:category')
    .get(asyncHandler(analyticsController.getTotalOrdersByCategory.bind(analyticsController)))

export default route;