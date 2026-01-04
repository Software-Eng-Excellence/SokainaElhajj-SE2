import { Request, Response, Router } from "express";
import OrderRoutes from "./order.route";
import AnalyticsRoutes from "./analytics.route";
import UserRoutes from "./user.route";
import AuthRoutes from "./auth.route";
import { authenticate } from "../middleware/auth";
import logger from "../util/logger";
import { ConnectionManager } from "../repository/sqlite/ConnectionManager";

const routes = Router();

routes.use('/orders', authenticate, OrderRoutes);
routes.use('/analytics', authenticate, AnalyticsRoutes);
routes.use('/users', UserRoutes);
routes.use('/auth', AuthRoutes);

// Health check for application status
routes.use('/health/status', (req: Request, res: Response) => {
    res.status(200).json({ status: "OK", message: "Application is healthy" });
});

// Health check for database connection
routes.use('/health/db', async (req: Request, res: Response) => {
    try {
        const dbHealth = await checkDatabaseConnection();
        if (dbHealth) {
            res.status(200).json({ status: "OK", message: "Database connection is healthy" });
        } else {
            res.status(500).json({ status: "FAIL", message: "Database connection is not healthy" });
        }
    } catch (error) {
        logger.error("Database health check failed:", error);
        res.status(500).json({ status: "FAIL", message: "Error checking database health" });
    }
});

async function checkDatabaseConnection(): Promise<boolean> {
    return ConnectionManager.getConnection().then(() => true).catch(() => false);
    
}

export default routes;