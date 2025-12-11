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
import { AnalyticsManagementService } from "../../src/services/analyticsManagement.service";

describe("AnalyticsManagementService", () => {
    let service: AnalyticsManagementService;

    const fakeOrders = [
        { getPrice: () => 10, getQuantity: () => 2 },
        { getPrice: () => 5,  getQuantity: () => 1 } 
    ];

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
    
        mockRepo.getAll.mockResolvedValue(fakeOrders);

        service = new AnalyticsManagementService();
    });

    describe("getTotalOrdersCount", () => {
        it("should get total orders count across all categories", async () => {
            const total = await service.getTotalOrdersCount();

            const numberOfCategories = Object.values(ItemCategory).length;
            const expectedTotal = fakeOrders.length * numberOfCategories;

            expect(total).toBe(expectedTotal);
            expect(RepositoryFactory.create).toHaveBeenCalled();
            expect(mockRepo.getAll).toHaveBeenCalledTimes(numberOfCategories);
        });

        it("should return 0 when there are no orders", async () => {
            mockRepo.getAll.mockResolvedValue([]);

            const total = await service.getTotalOrdersCount();

            expect(total).toBe(0);
        });
    });

    describe("getTotalOrdersByCategory", () => {
        it("should get total orders count for a specific category", async () => {
            const total = await service.getTotalOrdersByCategory(ItemCategory.Book);

            const expectedTotal = fakeOrders.length;

            expect(total).toBe(expectedTotal);
            expect(RepositoryFactory.create).toHaveBeenCalledWith(expect.anything(), ItemCategory.Book);
            expect(mockRepo.getAll).toHaveBeenCalledTimes(1);
        });

        it("should return 0 for category with no orders", async () => {
            mockRepo.getAll.mockResolvedValue([]);

            const total = await service.getTotalOrdersByCategory(ItemCategory.Book);

            expect(total).toBe(0);
        });
    });

    describe("getTotalRevenue", () => {
        it("should calculate total revenue across all categories", async () => {
            const totalRev = await service.getTotalRevenue();
            
            const expectedRevenue = 25 * Object.values(ItemCategory).length;

            expect(totalRev).toBe(expectedRevenue); 
            expect(RepositoryFactory.create).toHaveBeenCalled();
        });

        it("should return 0 when there are no orders", async () => {
            mockRepo.getAll.mockResolvedValue([]);

            const totalRev = await service.getTotalRevenue();

            expect(totalRev).toBe(0);
        });
    });

    describe("getTotalRevenueByCategory", () => {
        it("should calculate total revenue for a specific category", async () => {
            const totalRev = await service.getTotalRevenueByCategory(ItemCategory.CAKE);
            
            expect(totalRev).toBe(25);
            expect(RepositoryFactory.create).toHaveBeenCalledWith(expect.anything(), ItemCategory.CAKE);
        });

        it("should return 0 for category with no orders", async () => {
            mockRepo.getAll.mockResolvedValue([]);

            const totalRev = await service.getTotalRevenueByCategory(ItemCategory.CAKE);

            expect(totalRev).toBe(0);
        });
    });
});