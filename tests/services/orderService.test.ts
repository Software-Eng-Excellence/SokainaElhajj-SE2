jest.mock("../../src/config", () => ({
    __esModule: true,
    default: { dbMode: "TEST_MODE" }
}));

jest.mock("../../src/repository/Repository.factory", () => ({
    RepositoryFactory: {
        create: jest.fn() 
    }
}));

import { RepositoryFactory } from "../../src/repository/Repository.factory";
import { ItemCategory } from "../../src/model/IItem";
import { OrderManagementService } from "../../src/services/orderManagement.service";
import { BadRequestException } from "../../src/util/exceptions/http/BadRequestException";
import { NotFoundException } from "../../src/util/exceptions/http/NotFoundException";

describe("OrderManagementService", () => {
    let service: OrderManagementService;

    const mockItem = {
        getCategory: jest.fn().mockReturnValue(ItemCategory.Book)
    };

    const fakeOrder = {
        getId: () => "order-123",
        getItem: () => mockItem,
        getPrice: () => 10,
        getQuantity: () => 2
    };

    const fakeOrder2 = {
        getId: () => "order-456",
        getItem: () => mockItem,
        getPrice: () => 5,
        getQuantity: () => 1
    };

    const mockRepo = {
        get: jest.fn(),
        getAll: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
        delete: jest.fn()
    };

    beforeEach(() => {
        jest.clearAllMocks();
        
        (RepositoryFactory.create as jest.Mock).mockResolvedValue(mockRepo);
        
        mockRepo.getAll.mockResolvedValue([fakeOrder, fakeOrder2]);

        service = new OrderManagementService();
    });

    describe("createOrder", () => {
        it("should create a valid order", async () => {
            mockRepo.create.mockResolvedValue(undefined);

            const result = await service.createOrder(fakeOrder as any);

            expect(result).toBe(fakeOrder);
            expect(mockRepo.create).toHaveBeenCalledWith(fakeOrder);
            expect(RepositoryFactory.create).toHaveBeenCalledWith(
                expect.anything(), 
                ItemCategory.Book
            );
        });

        it("should throw error for invalid order - no item", async () => {
            const invalidOrder = {
                ...fakeOrder,
                getItem: () => null
            };

            await expect(service.createOrder(invalidOrder as any))
                .rejects
                .toThrow(BadRequestException);
            
            expect(mockRepo.create).not.toHaveBeenCalled();
        });

        it("should throw error for invalid order - price <= 0", async () => {
            const invalidOrder = {
                ...fakeOrder,
                getPrice: () => 0
            };

            await expect(service.createOrder(invalidOrder as any))
                .rejects
                .toThrow(BadRequestException);
            
            expect(mockRepo.create).not.toHaveBeenCalled();
        });

        it("should throw error for invalid order - quantity <= 0", async () => {
            const invalidOrder = {
                ...fakeOrder,
                getQuantity: () => -1
            };

            await expect(service.createOrder(invalidOrder as any))
                .rejects
                .toThrow(BadRequestException);
            
            expect(mockRepo.create).not.toHaveBeenCalled();
        });
    });

    describe("getOrder", () => {
        it("should get an existing order", async () => {
            mockRepo.get.mockResolvedValue(fakeOrder);

            const result = await service.getOrder("order-123");

            expect(result).toBe(fakeOrder);
            expect(mockRepo.get).toHaveBeenCalledWith("order-123");
        });

        it("should return null when order not found", async () => {
            mockRepo.get.mockResolvedValue(null);

            const result = await service.getOrder("non-existent");
            
            expect(result).toBeNull();
        });
    });

    describe("updateOrder", () => {
        it("should update a valid order", async () => {
            mockRepo.update.mockResolvedValue(undefined);

            await service.updateOrder(fakeOrder as any);

            expect(mockRepo.update).toHaveBeenCalledWith(fakeOrder);
            expect(RepositoryFactory.create).toHaveBeenCalledWith(
                expect.anything(), 
                ItemCategory.Book
            );
        });

        it("should throw error when updating invalid order", async () => {
            const invalidOrder = {
                ...fakeOrder,
                getPrice: () => 0
            };

            await expect(service.updateOrder(invalidOrder as any))
                .rejects
                .toThrow(BadRequestException);
            
            expect(mockRepo.update).not.toHaveBeenCalled();
        });
    });

    describe("deleteOrder", () => {
        it("should delete an existing order", async () => {
            mockRepo.get.mockResolvedValue(fakeOrder);
            mockRepo.delete.mockResolvedValue(undefined);

            await service.deleteOrder("order-123");

            expect(mockRepo.get).toHaveBeenCalledWith("order-123");
            expect(mockRepo.delete).toHaveBeenCalledWith("order-123");
        });

        it("should throw error when deleting non-existent order", async () => {
            mockRepo.get.mockResolvedValue(null);

            await expect(service.deleteOrder("non-existent"))
                .rejects
                .toThrow(NotFoundException);
            
            expect(mockRepo.delete).not.toHaveBeenCalled();
        });
    });

    describe("getAllOrders", () => {
        it("should get all orders from all categories", async () => {
            const result = await service.getAllOrders();

            const numberOfCategories = Object.values(ItemCategory).length;
            const expectedLength = 2 * numberOfCategories;

            expect(result).toHaveLength(expectedLength);
            expect(mockRepo.getAll).toHaveBeenCalledTimes(numberOfCategories);
            expect(RepositoryFactory.create).toHaveBeenCalled();
        });

        it("should return empty array when no orders exist", async () => {
            mockRepo.getAll.mockResolvedValue([]);

            const result = await service.getAllOrders();

            expect(result).toEqual([]);
        });
    });

    describe("getTotalRevenue", () => {
        it("should calculate total revenue correctly", async () => {
            const result = await service.getTotalRevenue();

            const numberOfCategories = Object.values(ItemCategory).length;
            const expectedRevenue = 25 * numberOfCategories;

            expect(result).toBe(expectedRevenue);
            expect(RepositoryFactory.create).toHaveBeenCalled();
        });

        it("should return 0 when no orders exist", async () => {
            mockRepo.getAll.mockResolvedValue([]);

            const result = await service.getTotalRevenue();

            expect(result).toBe(0);
        });
    });

    describe("getTotalOrders", () => {
        it("should count total orders correctly", async () => {
            const result = await service.getTotalOrders();

            const numberOfCategories = Object.values(ItemCategory).length;
            const expectedTotal = 2 * numberOfCategories;

            expect(result).toBe(expectedTotal);
            expect(RepositoryFactory.create).toHaveBeenCalled();
        });

        it("should return 0 when no orders exist", async () => {
            mockRepo.getAll.mockResolvedValue([]);

            const result = await service.getTotalOrders();

            expect(result).toBe(0);
        });
    });
});