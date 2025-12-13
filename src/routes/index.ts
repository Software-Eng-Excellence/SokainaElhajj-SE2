import { Router } from "express";
import OrderRoutes from "./order.route";

const routes = Router();

routes.get('/', (req, res) => {
    res.json({ message: 'Hello World'});
});

routes.use('/orders', OrderRoutes);
export default routes;