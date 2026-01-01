import { PostgreSQLConnectionManager } from "../../../src/repository/postgreSQL/PostgreSQLConnectionManager";
import { IdentifiableToy } from "../../../src/model/Toy.model";
import { ToyRepository } from "../../../src/repository/postgreSQL/Toy.repository";
import { DbException, InitializationException, ItemNotFoundException } from "../../../src/util/exceptions/repositoryExceptions";

const mockClient = {
    query: jest.fn(),
    release: jest.fn()
};

const mockPool = {
    connect: jest.fn().mockResolvedValue(mockClient),
    query: jest.fn()
};

jest.mock("../../../src/repository/postgreSQL/PostgreSQLConnectionManager", () => ({
    PostgreSQLConnectionManager: {
        getPool: jest.fn(() => mockPool),
        // This simulates the manager providing a client to the repository methods
        runQuery: jest.fn(async (callback) => await callback(mockClient))
    }
}));

const dummyToy = {
    getId: () => "toy-1",
    getType: () => "Action Figure",
    getAgeGroup: () => "8-12",
    getBrand: () => "Hasbro",
    getMaterial: () => "Plastic",
    getBatteryRequired: () => true,
    getEducational: () => false
} as unknown as IdentifiableToy;

const rawToyRow = {
    id: "toy-1",
    type: "Action Figure",
    ageGroup: "8-12",
    brand: "Hasbro",
    material: "Plastic",
    batteryRequired: true,
    educational: false
};

describe("Toy Repository - Unit Tests", () => {
    let repo: ToyRepository;

    beforeEach(() => {
        jest.clearAllMocks();
        (mockPool.connect as jest.Mock).mockResolvedValue(mockClient);
        repo = new ToyRepository();
    });

    describe('init', () => {
        it("should create the toy table", async () => {
            mockPool.query.mockResolvedValue({});

            await expect(repo.init()).resolves.not.toThrow();
            expect(mockPool.query).toHaveBeenCalledWith(
                expect.stringContaining('CREATE TABLE IF NOT EXISTS')
            );
        });

        it("should throw InitializationException when pool.query fails", async () => {
            mockPool.query.mockRejectedValue(new Error("init crash"));

            await expect(repo.init()).rejects.toThrow(InitializationException);
        });
    });

    describe('create', () => {
        it('should insert toy and return id', async () => {
            mockClient.query.mockResolvedValue({ rowCount: 1 });

            const result = await repo.create(dummyToy);

            expect(result).toBe("toy-1");
            expect(mockClient.query).toHaveBeenCalledWith(
                expect.stringContaining('INSERT INTO'),
                expect.arrayContaining(["toy-1", "Action Figure", "Hasbro"])
            );
        });
    });

    describe('get', () => {
        it('should return mapped toy when found', async () => {
            mockClient.query.mockResolvedValue({ rows: [rawToyRow], rowCount: 1 });

            const result = await repo.get("toy-1");

            expect(result.getId()).toBe("toy-1");
            expect(mockClient.query).toHaveBeenCalledWith(
                expect.stringContaining('SELECT'),
                ["toy-1"]
            );
        });

        it("should throw ItemNotFoundException when not found", async () => {
            mockClient.query.mockResolvedValue({ rows: [], rowCount: 0 });

            await expect(repo.get("missing")).rejects.toThrow(ItemNotFoundException);
        });
    });

    describe('getAll', () => {
        it('should return all toys', async () => {
            const row2 = { ...rawToyRow, id: "toy-2" };
            mockClient.query.mockResolvedValue({ rows: [rawToyRow, row2], rowCount: 2 });

            const results = await repo.getAll();

            expect(results).toHaveLength(2);
            expect(results[0].getId()).toBe("toy-1");
            expect(results[1].getId()).toBe("toy-2");
        });

        it('should return empty array when none exist', async () => {
            mockClient.query.mockResolvedValue({ rows: [], rowCount: 0 });

            const results = await repo.getAll();

            expect(results).toEqual([]);
        });
    });

    describe('update', () => {
        it('should update toy successfully', async () => {
            mockClient.query.mockResolvedValue({ rowCount: 1 });

            await expect(repo.update(dummyToy)).resolves.not.toThrow();
            expect(mockClient.query).toHaveBeenCalledWith(
                expect.stringContaining('UPDATE'),
                expect.arrayContaining(["toy-1", "Action Figure", "Hasbro"])
            );
        });

        it('should throw ItemNotFoundException when not found', async () => {
            mockClient.query.mockResolvedValue({ rowCount: 0 });

            await expect(repo.update(dummyToy)).rejects.toThrow(ItemNotFoundException);
        });
    });

    describe('delete', () => {
        it('should delete toy successfully', async () => {
            mockClient.query.mockResolvedValue({ rowCount: 1 });

            await expect(repo.delete("toy-1")).resolves.not.toThrow();
            expect(mockClient.query).toHaveBeenCalledWith(
                expect.stringContaining('DELETE'),
                ["toy-1"]
            );
        });

        it('should throw ItemNotFoundException when not found', async () => {
            mockClient.query.mockResolvedValue({ rowCount: 0 });

            await expect(repo.delete("missing")).rejects.toThrow(ItemNotFoundException);
        });
    });

    describe('Edge Cases & Error Handling', () => {
        it('should wrap database errors in DbException', async () => {
            mockClient.query.mockRejectedValue(new Error('connection lost'));
            await expect(repo.get("toy-1")).rejects.toThrow(DbException);
        });

        it('should propagate connection pool failure from Manager', async () => {
            // Force the Manager to fail before it even calls the callback
            (PostgreSQLConnectionManager.runQuery as jest.Mock).mockRejectedValueOnce(new Error('pool exhausted'));
            await expect(repo.create(dummyToy)).rejects.toThrow('pool exhausted');
        });

        it('should throw DbException on duplicate entry', async () => {
            mockClient.query.mockRejectedValue(new Error('duplicate key violates unique constraint'));
            await expect(repo.create(dummyToy)).rejects.toThrow(DbException);
        });

        it('should handle constraint violations (null values)', async () => {
            mockClient.query.mockRejectedValue(new Error('not-null constraint violation'));
            await expect(repo.create(dummyToy)).rejects.toThrow(DbException);
        });
    });
});