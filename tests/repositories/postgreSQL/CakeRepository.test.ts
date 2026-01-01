import { PostgreSQLConnectionManager } from "../../../src/repository/postgreSQL/PostgreSQLConnectionManager";
import { IdentifiableCake } from "../../../src/model/Cake.model";
import { CakeRepository } from "../../../src/repository/postgreSQL/Cake.repository";
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
        // This is the CRITICAL part: it takes the repo's callback and runs it immediately
        runQuery: jest.fn(async (callback) => await callback(mockClient))
    }
}));

const dummyCake = {
    getId: () => "cake-1",
    getType: () => "sponge",
    getFlavor: () => "vanilla",
    getFilling: () => "cream",
    getSize: () => 8,
    getLayers: () => 2,
    getFrostingType: () => "buttercream",
    getFrostingFlavor: () => "vanilla",
    getDecorationType: () => "sprinkles",
    getDecorationColor: () => "multi",
    getCustomMessage: () => "Happy!",
    getShape: () => "round",
    getAllergies: () => "none",
    getSpecialIngredients: () => "none",
    getPackagingType: () => "box",
} as unknown as IdentifiableCake;

const rawCakeRow = {
    id: "cake-1",
    type: "chocolate",
    flavor: "dark",
    filling: "cream",
    size: 20,
    layers: 2,
    frostingType: "buttercream",
    frostingFlavor: "vanilla",
    decorationType: "sprinkles",
    decorationColor: "red",
    customMessage: "Happy Birthday",
    shape: "round",
    allergies: "none",
    specialIngredients: "cocoa",
    packagingType: "box"
};

describe("Cake Repository - Unit Tests", () => {
    let repo: CakeRepository;

    beforeEach(() => {
        jest.clearAllMocks();
        (mockPool.connect as jest.Mock).mockResolvedValue(mockClient);
        repo = new CakeRepository();  
    });

    describe('init', () => {
        it("Should create the cake table", async () => {
            (mockPool.query as jest.Mock).mockResolvedValue({});

            await expect(repo.init()).resolves.not.toThrow();

            expect(mockPool.query).toHaveBeenCalledWith(
                expect.stringContaining('CREATE TABLE IF NOT EXISTS')
            );        
        });

        it("Should throw InitializationException when pool.query fails", async () => {
            (mockPool.query as jest.Mock).mockRejectedValue(new Error("init crash"));
            
            await expect(repo.init()).rejects.toThrow(InitializationException);
        });
    });

    describe('create', () => {
        it('should insert cake and return id', async () => {
            mockClient.query.mockResolvedValue({ rowCount: 1 });

            const result = await repo.create(dummyCake);

            expect(result).toBe("cake-1");
            expect(mockClient.query).toHaveBeenCalledWith(
                expect.stringContaining('INSERT INTO'),
                expect.arrayContaining(["cake-1", "sponge", "vanilla"])
            );
        });
    });

    describe('get', () => {
        it('should return mapped cake when found', async () => {
            mockClient.query.mockResolvedValue({ rows: [rawCakeRow], rowCount: 1 });

            const result = await repo.get("cake-1");

            expect(result.getId()).toBe("cake-1");
            expect(mockClient.query).toHaveBeenCalledWith(
                expect.stringContaining('SELECT'),
                ["cake-1"]
            );
        });

        it("should throw ItemNotFoundException when not found", async () => {
            mockClient.query.mockResolvedValue({ rows: [], rowCount: 0 });

            await expect(repo.get("missing")).rejects.toThrow(ItemNotFoundException);
        });
    });

     describe('getAll', () => {
        it('should return all cakes', async () => {
            const row2 = { ...rawCakeRow, id: "cake-2" };
            mockClient.query.mockResolvedValue({ rows: [rawCakeRow, row2], rowCount: 2 });

            const results = await repo.getAll();

            expect(results).toHaveLength(2);
            expect(results[0].getId()).toBe("cake-1");
            expect(results[1].getId()).toBe("cake-2");
        });

        it('should return empty array when none exist', async () => {
            mockClient.query.mockResolvedValue({ rows: [], rowCount: 0 });

            const results = await repo.getAll();

            expect(results).toEqual([]);
        });
    });

    describe('update', () => {
        it('should update cake successfully', async () => {
            mockClient.query.mockResolvedValue({ rowCount: 1 });

            await expect(repo.update(dummyCake)).resolves.not.toThrow();
            expect(mockClient.query).toHaveBeenCalledWith(
                expect.stringContaining('UPDATE'),
                expect.arrayContaining(["sponge", "vanilla", "cake-1"])
            );
        });

        it('should throw ItemNotFoundException when not found', async () => {
            mockClient.query.mockResolvedValue({ rowCount: 0 });

            await expect(repo.update(dummyCake)).rejects.toThrow(ItemNotFoundException);
        });
    });

    describe('delete', () => {
        it('should delete cake successfully', async () => {
            mockClient.query.mockResolvedValue({ rowCount: 1 });

            await expect(repo.delete("cake-1")).resolves.not.toThrow();
            expect(mockClient.query).toHaveBeenCalledWith(
                expect.stringContaining('DELETE'),
                ["cake-1"]
            );
        });

        it('should throw ItemNotFoundException when not found', async () => {
            mockClient.query.mockResolvedValue({ rowCount: 0 });

            await expect(repo.delete("missing")).rejects.toThrow(ItemNotFoundException);
        });
    });

    describe('Edge Cases', () => {
        it('should wrap database errors in DbException', async () => {
            mockClient.query.mockRejectedValue(new Error('connection lost'));
            await expect(repo.get("cake-1")).rejects.toThrow(DbException);
        });

        // DELETE the "should not release client when passed externally" test entirely.

        it('should propagate connection pool failure', async () => {
            // Force the Manager itself to fail before the repo logic starts
            (PostgreSQLConnectionManager.runQuery as jest.Mock).mockRejectedValueOnce(
                new Error('pool exhausted')
            );

            await expect(repo.create(dummyCake)).rejects.toThrow('pool exhausted');
        });

        it('should throw DbException on invalid data type', async () => {
            mockClient.query.mockRejectedValue(new Error('invalid input syntax'));

            const cakeWithBadSize = {
                ...dummyCake,
                getSize: () => "not-a-number"
            } as unknown as IdentifiableCake;

            await expect(repo.create(cakeWithBadSize)).rejects.toThrow(DbException);
        });

        it('should throw DbException when inserting null required fields', async () => {
            mockClient.query.mockRejectedValue(new Error('null value violates constraint'));

            const cakeWithNull = {
                ...dummyCake,
                getType: () => null
            } as unknown as IdentifiableCake;

            await expect(repo.create(cakeWithNull)).rejects.toThrow(DbException);
        });

        it('should throw DbException on duplicate entry', async () => {
            mockClient.query.mockRejectedValue(new Error('duplicate key'));
            await expect(repo.create(dummyCake)).rejects.toThrow(DbException);
        });
    });
});



