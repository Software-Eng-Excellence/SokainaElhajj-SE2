// mock factory
jest.mock('../../src/mappers/Mapper.factory', () => ({
    JsonRequestFactory: {
        create: jest.fn()
    }
}));

import { OrderController } from '../../src/controllers/order.controller';
import { OrderManagementService } from '../../src/services/orderManagement.service';
import { Request, Response } from 'express';
import { BadRequestException } from '../../src/util/exceptions/http/BadRequestException';
import { JsonRequestFactory } from '../../src/mappers/Mapper.factory';

const mockRequest = (body = {}, params = {}, query = {}) => {
    return {
        body: body,
        params: params,
        query: query,
    } as unknown as Request;
};

const mockResponse = () => {
    const res: any = {};
    res.status = jest.fn().mockReturnValue(res);
    res.json = jest.fn().mockReturnValue(res);
    res.send = jest.fn().mockReturnValue(res);
    return res as unknown as Response;
};

describe('OrderController', () => {
    let controller: OrderController;
    let mockService: any;

    beforeEach(() => {
        jest.clearAllMocks();

        mockService = {
            createOrder: jest.fn(),
            getOrder: jest.fn(),
            getAllOrders: jest.fn(),
            updateOrder: jest.fn(),
            deleteOrder: jest.fn(),
        };

        controller = new OrderController(mockService as OrderManagementService);
    });

    describe('createOrder', () => {
        it('should create an order and return 201 status', async () => {
            const reqBody = { category: 'Book', price: 100, quantity: 1, id: '123' };
            const req = mockRequest(reqBody);
            const res = mockResponse();

            const mockMapper = {
                map: jest.fn().mockReturnValue(reqBody) 
            };
            (JsonRequestFactory.create as jest.Mock).mockReturnValue(mockMapper);

            mockService.createOrder.mockResolvedValue(reqBody);

            await controller.createOrder(req, res);

            expect(JsonRequestFactory.create).toHaveBeenCalledWith('Book');
            expect(mockService.createOrder).toHaveBeenCalledWith(reqBody);
            expect(res.status).toHaveBeenCalledWith(201);
            expect(res.json).toHaveBeenCalledWith(reqBody);
        });

        it('should throw BadRequestException if order is invalid', async () => {
            const req = mockRequest({});
            const res = mockResponse();

            (JsonRequestFactory.create as jest.Mock).mockReturnValue({
                map: jest.fn().mockReturnValue(null) 
            });

            await expect(controller.createOrder(req, res))
                .rejects
                .toThrow(BadRequestException); 
        });
    });

    describe('getOrder', () => {
        it('should return an order when valid ID is provided', async () => {
            const req = mockRequest({}, { id: '123' });
            const res = mockResponse();
            const mockOrder = { id: '123' };

            mockService.getOrder.mockResolvedValue(mockOrder);

            await controller.getOrder(req, res);

            expect(mockService.getOrder).toHaveBeenCalledWith('123');
            expect(res.status).toHaveBeenCalledWith(200);
            expect(res.json).toHaveBeenCalledWith(mockOrder);
        });

        it('should throw BadRequestException if id is missing', async () => {
            const req = mockRequest({}, { id: '' });
            const res = mockResponse();

            await expect(controller.getOrder(req, res))
                .rejects
                .toThrow(BadRequestException);
        });
    });

    describe('getAllOrders', () => {
        it('should return a list of orders', async () => {
            const req = mockRequest();
            const res = mockResponse();
            const mockList = [{ id: '1' }];

            mockService.getAllOrders.mockResolvedValue(mockList);

            await controller.getOrders(req, res);

            expect(mockService.getAllOrders).toHaveBeenCalled();
            expect(res.status).toHaveBeenCalledWith(200);
            expect(res.json).toHaveBeenCalledWith(mockList);
        });
    });

    describe('updateOrder', () => {
        it('should update successfully when IDs match', async () => {
            const id = '123';
            const reqBody = { category: 'Book', id: id };
            const req = mockRequest(reqBody, { id: id });
            const res = mockResponse();

            const mockOrderObject = { 
                getId: () => '123', 
                ...reqBody 
            };
            
            (JsonRequestFactory.create as jest.Mock).mockReturnValue({
                map: jest.fn().mockReturnValue(mockOrderObject)
            });

            mockService.updateOrder.mockResolvedValue(mockOrderObject);

            await controller.updateOrder(req, res);

            expect(mockService.updateOrder).toHaveBeenCalled();
            expect(res.status).toHaveBeenCalledWith(200);
        });

        it('should throw BadRequestException if ID in body does not match param', async () => {
            const reqBody = { category: 'Book', id: '999' }; // Body has 999
            const req = mockRequest(reqBody, { id: '123' }); // Param has 123
            const res = mockResponse();

            const mockOrderObject = { 
                getId: () => '999', 
                ...reqBody 
            };
            (JsonRequestFactory.create as jest.Mock).mockReturnValue({
                map: jest.fn().mockReturnValue(mockOrderObject)
            });

            await expect(controller.updateOrder(req, res))
                .rejects
                .toThrow(BadRequestException);
        });

        it('should throw BadRequestException if params ID is missing', async () => {
             const req = mockRequest({}, { id: '' });
             const res = mockResponse();
 
             await expect(controller.updateOrder(req, res))
                 .rejects
                 .toThrow(BadRequestException);
        });
    });

    describe('deleteOrder', () => {
        it('should delete order and return 204', async () => {
            const req = mockRequest({}, { id: '123' });
            const res = mockResponse();

            mockService.deleteOrder.mockResolvedValue(undefined);

            await controller.deleteOrder(req, res);

            expect(mockService.deleteOrder).toHaveBeenCalledWith('123');
            expect(res.status).toHaveBeenCalledWith(204);
        });

        it('should throw BadRequestException if ID is missing', async () => {
            const req = mockRequest({}, { id: '' });
            const res = mockResponse();

            await expect(controller.deleteOrder(req, res))
                .rejects
                .toThrow(BadRequestException);
        });
    });
});