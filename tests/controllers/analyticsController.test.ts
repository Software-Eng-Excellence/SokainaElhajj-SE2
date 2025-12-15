import { AnalyticsController } from '../../src/controllers/analytics.controller'; 
import { AnalyticsManagementService } from '../../src/services/analyticsManagement.service';
import { Request, Response } from 'express';
import { ItemCategory } from '../../src/model/IItem';
import { BadRequestException } from '../../src/util/exceptions/http/BadRequestException';

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

describe('AnalyticsController', () => {
    let controller: AnalyticsController;
    let mockService: any;

    beforeEach(() => {
        mockService = {
            getTotalRevenueByCategory: jest.fn(),
            getTotalOrdersByCategory: jest.fn(),
            getTotalRevenue: jest.fn(),
            getTotalOrdersCount: jest.fn(),
        };
        controller = new AnalyticsController(mockService as AnalyticsManagementService);
    });

    describe('getRevenueByCategory', () => {
        it('should return revenue when a valid category is passed in params', async () => {
            const validCategory = Object.values(ItemCategory)[0]; 
            const req = mockRequest({}, { category: validCategory }); 
            const res = mockResponse();
            const expectedRevenue = 5000;

            mockService.getTotalRevenueByCategory.mockResolvedValue(expectedRevenue);

            await controller.getRevenueByCategory(req, res);

            expect(mockService.getTotalRevenueByCategory).toHaveBeenCalledWith(validCategory);
            expect(res.status).toHaveBeenCalledWith(200);
            expect(res.json).toHaveBeenCalledWith(expectedRevenue);
        });

        it('should throw BadRequestException if category is invalid', async () => {
            const req = mockRequest({}, { category: 'Food' });
            const res = mockResponse();

            await expect(controller.getRevenueByCategory(req, res))
                .rejects
                .toThrow(BadRequestException);
        });

        it('should throw BadRequestException if category is missing', async () => {
            const req = mockRequest({}, {}); 
            const res = mockResponse();

            await expect(controller.getRevenueByCategory(req, res))
                .rejects
                .toThrow(BadRequestException);
        });
    });

    describe('getTotalRevenue', () => {
        it('should return the total revenue', async () => {
            const req = mockRequest();
            const res = mockResponse();
            const expectedRevenue = 10000;

            mockService.getTotalRevenue.mockResolvedValue(expectedRevenue);

            await controller.getTotalRevenue(req, res);

            expect(mockService.getTotalRevenue).toHaveBeenCalled();
            expect(res.status).toHaveBeenCalledWith(200);
            expect(res.json).toHaveBeenCalledWith(expectedRevenue);
        });
    });

    describe('getTotalOrders', () => {
        it('should return the total order count', async () => {
            const req = mockRequest();
            const res = mockResponse();
            const expectedCount = 50;

            mockService.getTotalOrdersCount.mockResolvedValue(expectedCount);

            await controller.getTotalOrders(req, res);

            expect(mockService.getTotalOrdersCount).toHaveBeenCalled();
            expect(res.status).toHaveBeenCalledWith(200);
            expect(res.json).toHaveBeenCalledWith(expectedCount);
        });
    });

    describe('getTotalOrdersByCategory', () => {
        it('should return order count when a valid category is passed', async () => {
            const validCategory = Object.values(ItemCategory)[0];
            const req = mockRequest({}, { category: validCategory });
            const res = mockResponse();
            const expectedCount = 15;

            mockService.getTotalOrdersByCategory.mockResolvedValue(expectedCount);

            await controller.getTotalOrdersByCategory(req, res);

            expect(mockService.getTotalOrdersByCategory).toHaveBeenCalledWith(validCategory);
            expect(res.status).toHaveBeenCalledWith(200);
            expect(res.json).toHaveBeenCalledWith(expectedCount);
        });

        it('should throw BadRequestException if category is invalid', async () => {
            const req = mockRequest({}, { category: 'Food' });
            const res = mockResponse();

            await expect(controller.getTotalOrdersByCategory(req, res))
                .rejects
                .toThrow(BadRequestException);
            
            expect(mockService.getTotalOrdersByCategory).not.toHaveBeenCalled();
        });

        it('should throw BadRequestException if category is missing', async () => {
            const req = mockRequest({}, {}); 
            const res = mockResponse();

            await expect(controller.getTotalOrdersByCategory(req, res))
                .rejects
                .toThrow(BadRequestException);
        });
    });
});