import { Request, Response } from "express";
import { OrderManagementService } from "../services/orderManagement.service";
import { IdentifiableOrderItem } from "../model/Order.model";
import { JsonRequestFactory } from "../mappers/Mapper.factory";
import { BadRequestException } from "../util/exceptions/http/BadRequestException";

export class OrderController {
    constructor(private readonly orderService: OrderManagementService) {}
    // create order
    public async createOrder(req: Request, res: Response) {
        const order: IdentifiableOrderItem = JsonRequestFactory.create(req.body.category).map(req.body);
    if (!order) {
        throw new BadRequestException("Order is required to create order", {
            orderNotDefined: true
        });            
    }
        const newOrder = await this.orderService.createOrder(order);
       res.status(201).json(newOrder);
    }

    // get order
    public async getOrder(req: Request, res: Response) {
        const id = req.params.id;
        if (!id) {
            throw new BadRequestException("Id is required to get order", {
                idNotDefined: true
            });
        }
        const order = await this.orderService.getOrder(id);
        res.status(200).json(order);
    }

    // get all orders
    public async getOrders(req: Request, res: Response) {
        const orders = await this.orderService.getAllOrders();
        res.status(200).json(orders);
    }

    // update order
    public async updateOrder(req: Request, res: Response){
        const id = req.params.id;
        if (!id) {
            throw new BadRequestException("Id is required to update order", {
                idNotDefined: true
            });
        }
        const order: IdentifiableOrderItem = JsonRequestFactory.create(req.body.category).map(req.body);
        if (!order) {
            throw new BadRequestException("Order is required to update order", {
                orderNotDefined: true
            });
        }
        if (order.getId() !== id) {
            throw new BadRequestException("Id in body is different from id in param", {
                idNotSame: true,
                idInBody: order.getId(),
                idInParam: id
            });
        }
        const updatedOrder = await this.orderService.updateOrder(order);
        res.status(200).json(updatedOrder);
    }
    
    // delete order
    public async deleteOrder(req: Request, res: Response) {
        const id = req.params.id;
        if (!id) {
            throw new BadRequestException("Id is required to delete order", {
                idNotDefined: true
            });
        }
        await this.orderService.deleteOrder(id);
        res.status(204).send();
    } 

    // to be implemented in assignment 9
    // get total revenue
    public async getTotalRevenue() {

    }

    // get total orders
    public async getTotalOrders() {

    }
}