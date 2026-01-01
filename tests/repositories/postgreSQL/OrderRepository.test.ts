import { IIdentifiableItem } from "../../../src/model/IItem";
import { OrderRepository } from "../../../src/repository/postgreSQL/Order.repository";
import { IIdentifiableOrderItem } from "../../../src/model/IOrder";
import { IRepository } from "../../../src/repository/IRepository";
import { DbException, InitializationException, ItemNotFoundException } from "../../../src/util/exceptions/repositoryExceptions";
import { PostgreSQLConnectionManager } from "../../../src/repository/postgreSQL/PostgreSQLConnectionManager";

const mockClient = {
    query: jest.fn(),
    release: jest.fn(),
};

const mockPool = {
    connect: jest.fn().mockResolvedValue(mockClient),
    query: jest.fn(),
};

jest.mock("../../../src/repository/postgreSQL/PostgreSQLConnectionManager", () => ({
    PostgreSQLConnectionManager: {
        getPool: jest.fn(() => mockPool),
        // Simply execute the callback
        runInTransaction: jest.fn(async (callback) => await callback()),
        // Execute the callback and provide the mockClient
        runQuery: jest.fn(async (callback) => await callback(mockClient))
    }
}));

const dummyItem = { 
    getId: () => 'item-123', 
    getCategory: () => 'cake' 
} as IIdentifiableItem;

const dummyOrder = { 
    getId: () => 'order-999', 
    getQuantity: () => 2, 
    getPrice: () => 100, 
    getItem: () => dummyItem 
} as IIdentifiableOrderItem;

describe("Order Repository Unit Tests", () => {
    let repo: OrderRepository;
    let mockItemRepo: jest.Mocked<IRepository<IIdentifiableItem> & { init: () => Promise<void> }>;

    beforeEach(() => {
        // reset mocks
        jest.clearAllMocks();

        (mockPool.connect as jest.Mock).mockResolvedValue(mockClient);

        mockItemRepo = {
            init: jest.fn(),
            create: jest.fn(),
            get: jest.fn(),
            getAll: jest.fn(),
            update: jest.fn(),
            delete: jest.fn(),
        } as unknown as jest.Mocked<IRepository<IIdentifiableItem> & { init: () => Promise<void> }>;

        repo = new OrderRepository(mockItemRepo);
    });

    describe('init', () => {
        it('should create the order table and initialize item repository', async () => {
            mockPool.query.mockResolvedValue({});
            mockItemRepo.init.mockResolvedValue();

            await expect(repo.init()).resolves.not.toThrow();

            expect(mockPool.query).toHaveBeenCalledWith(
                expect.stringContaining('CREATE TABLE IF NOT EXISTS')
            );
            expect(mockItemRepo.init).toHaveBeenCalled();
        });

        it('should throw InitializationException when pool.query fails', async () => {
            mockPool.query.mockRejectedValue(new Error('init crash'));

            await expect(repo.init()).rejects.toThrow(InitializationException);
        });

        it('should throw InitializationException when itemRepository.init fails', async () => {
            mockPool.query.mockResolvedValue({});
            mockItemRepo.init.mockRejectedValue(new Error('item repo init failed'));

            await expect(repo.init()).rejects.toThrow(InitializationException);
        });
    });

    describe('create', () => {
        it('should start transaction, create item, create order, and commit', async () => {
            mockItemRepo.create.mockResolvedValue('item-123');
            
            mockClient.query.mockResolvedValue({ rowCount: 1 });

            const result = await repo.create(dummyOrder);

            expect(result).toBe('order-999');
            expect(mockItemRepo.create).toHaveBeenCalledWith(dummyItem); 
            expect(mockClient.query).toHaveBeenCalledWith(expect.stringContaining('INSERT INTO "order"'), expect.any(Array));
        });

        it('should ROLLBACK everything if the database fails', async () => {
            mockClient.query.mockReset(); 

            mockClient.query.mockImplementation((sql: string) => {
                if (sql === 'BEGIN') {
                    return Promise.resolve(); // Start transaction 
                }
                if (sql === 'ROLLBACK') {
                    return Promise.resolve(); // Rollback 
                }
                return Promise.reject(new Error("Crash at Insert")); 
            });

            await expect(repo.create(dummyOrder)).rejects.toThrow(DbException);
        }); 
    });

    describe('get', () => {
        it('should return mapped order if found', async () => {
            const rawRow = { 
                id: 'order-999', 
                quantity: 5, 
                price: 100, 
                item_category: 'cake', 
                item_id: 'item-123' 
            };
            mockClient.query.mockResolvedValue({ rows: [rawRow], rowCount: 1 });

            mockItemRepo.get.mockResolvedValue(dummyItem);

            const result = await repo.get('order-999');

            expect(result.getId()).toBe('order-999');
            expect(result.getItem()).toBe(dummyItem); 
            expect(mockItemRepo.get).toHaveBeenCalledWith('item-123'); 
        });

        it('should throw ItemNotFoundException if order does not exist', async () => {
            mockClient.query.mockResolvedValue({ rows: [], rowCount: 0 });

            await expect(repo.get('missing-id')).rejects.toThrow(ItemNotFoundException);
        });
    });

    describe('getAll', () => {
        it('should return all orders joined with items', async () => {
            const item1 = { getId: () => 'i1', getCategory: () => 'cake' };
            const item2 = { getId: () => 'i2', getCategory: () => 'cake' };
            mockItemRepo.getAll.mockResolvedValue([item1, item2] as any);

            mockClient.query.mockResolvedValue({
                rows: [
                    { id: 'o1', quantity: 1, price: 10, item_id: 'i1', item_category: 'cake' },
                    { id: 'o2', quantity: 2, price: 20, item_id: 'i2', item_category: 'cake' }
                ],
                rowCount: 2
            });

            const results = await repo.getAll();

            expect(results.length).toBe(2);
            expect(results[0].getId()).toBe('o1');
            expect(results[0].getItem().getId()).toBe('i1');
        });

        it('should return empty array if no items exist', async () => {
            mockItemRepo.getAll.mockResolvedValue([]); 

            const results = await repo.getAll();

            expect(results).toEqual([]);
            expect(mockClient.query).not.toHaveBeenCalled();
        });
    });

    describe('update', () => {
        it('should update item and order successfully', async () => {
            mockClient.query.mockResolvedValue({ rowCount: 1 });

            await repo.update(dummyOrder);

            expect(mockItemRepo.update).toHaveBeenCalledWith(dummyOrder.getItem());
            expect(mockClient.query).toHaveBeenCalledWith(expect.stringContaining('UPDATE "order"'), expect.any(Array));
        });

        it('should throw ItemNotFoundException if ID does not exist', async () => {
            mockClient.query.mockReset();
            
            mockClient.query.mockImplementation((sql: string) => {
                if (sql === 'BEGIN') return Promise.resolve();
                if (sql === 'ROLLBACK') return Promise.resolve();
                if (sql.includes('UPDATE')) return Promise.resolve({ rowCount: 0 }); // Nothing updated!
                return Promise.resolve({});
            });

            await expect(repo.update(dummyOrder)).rejects.toThrow(ItemNotFoundException);
        });
    });

    describe('delete', () => {
        it('should delete order and its item successfully', async () => {
            // 1. Mock the SELECT to find the item
            // 2. Mock the DELETE for the order
            mockClient.query
                .mockResolvedValueOnce({ rows: [{ item_id: 'item-123' }], rowCount: 1 }) 
                .mockResolvedValueOnce({ rowCount: 1 });

            await repo.delete('order-999');

            expect(mockItemRepo.delete).toHaveBeenCalledWith('item-123');
            expect(mockClient.query).toHaveBeenCalledWith(expect.stringContaining('DELETE FROM "order"'), expect.any(Array));
        });

        it('should throw ItemNotFoundException if order to delete is missing', async () => {
            // Ensure the query returns a valid object structure but with 0 rows
            mockClient.query.mockResolvedValueOnce({ rows: [], rowCount: 0 });

            await expect(repo.delete('missing-id')).rejects.toThrow(ItemNotFoundException);
        });
    });

    describe('Edge Cases', () => {
        it('should wrap database errors in DbException', async () => {
            // Use mockImplementationOnce to ensure this specific call fails immediately
            mockClient.query.mockImplementationOnce(() => {
                throw new Error('connection lost');
            });

            // We use repo.get or repo.delete; if the DB fails, it must be a DbException
            await expect(repo.get("order-999")).rejects.toThrow(DbException);
        });

        it('should propagate connection pool failure', async () => {
            // We mock the Manager directly here because that's where the pool lives
            (PostgreSQLConnectionManager.runQuery as jest.Mock).mockRejectedValueOnce(new Error('pool exhausted'));

            await expect(repo.getAll()).rejects.toThrow('pool exhausted');
        });

        it('should throw DbException if itemRepository fails during creation', async () => {
            mockItemRepo.create.mockRejectedValue(new Error('ItemRepo Crash'));

            // If the dependency fails, the OrderRepo should wrap it in a DbException
            await expect(repo.create(dummyOrder)).rejects.toThrow(DbException);
        });
    });
});