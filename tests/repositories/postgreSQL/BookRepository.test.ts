import { PostgreSQLConnectionManager } from "../../../src/repository/postgreSQL/PostgreSQLConnectionManager";
import { IdentifiableBook } from "../../../src/model/Book.model";
import { BookRepository } from "../../../src/repository/postgreSQL/Book.repository";
import { DbException, InitializationException, ItemNotFoundException } from "../../../src/util/exceptions/repositoryExceptions";

const mockClient = {
    query: jest.fn(),
    release: jest.fn()
};

const mockPool = {
    connect: jest.fn().mockResolvedValue(mockClient),
    query: jest.fn()
};

// UPDATE: Mock runQuery to immediately execute the callback with our mockClient
jest.mock("../../../src/repository/postgreSQL/PostgreSQLConnectionManager", () => ({
    PostgreSQLConnectionManager: {
        getPool: jest.fn(() => mockPool),
        runQuery: jest.fn(async (callback) => await callback(mockClient))
    }
}));

const dummyBook = {
    getId: () => "book-1",
    getTitle: () => "Clean Code",
    getAuthor: () => "Robert Martin",
    getGenre: () => "Programming",
    getFormat: () => "Hardcover",
    getLanguage: () => "English",
    getPublisher: () => "Pearson",
    getSpecialEdition: () => "none",
    getPackaging: () => "box"
} as unknown as IdentifiableBook;

const rawBookRow = {
    id: "book-1",
    title: "Clean Code",
    author: "Robert Martin",
    genre: "Programming",
    format: "Hardcover",
    language: "English",
    publisher: "Pearson",
    specialEdition: "none",
    packaging: "box"
};

describe("Book Repository - Unit Tests", () => {
    let repo: BookRepository;

    beforeEach(() => {
        jest.clearAllMocks();
        (mockPool.connect as jest.Mock).mockResolvedValue(mockClient);
        repo = new BookRepository();
    });

    describe('init', () => {
        it("should create the book table", async () => {
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
        it('should insert book and return id', async () => {
            mockClient.query.mockResolvedValue({ rowCount: 1 });

            const result = await repo.create(dummyBook);

            expect(result).toBe("book-1");
            expect(mockClient.query).toHaveBeenCalledWith(
                expect.stringContaining('INSERT INTO'),
                expect.arrayContaining(["book-1", "Clean Code", "Robert Martin"])
            );
        });
    });

    describe('get', () => {
        it('should return mapped book when found', async () => {
            mockClient.query.mockResolvedValue({ rows: [rawBookRow], rowCount: 1 });

            const result = await repo.get("book-1");

            expect(result.getId()).toBe("book-1");
            expect(mockClient.query).toHaveBeenCalledWith(
                expect.stringContaining('SELECT'),
                ["book-1"]
            );
        });

        it("should throw ItemNotFoundException when not found", async () => {
            mockClient.query.mockResolvedValue({ rows: [], rowCount: 0 });

            await expect(repo.get("missing")).rejects.toThrow(ItemNotFoundException);
        });
    });

    describe('getAll', () => {
        it('should return all books', async () => {
            const row2 = { ...rawBookRow, id: "book-2" };
            mockClient.query.mockResolvedValue({ rows: [rawBookRow, row2], rowCount: 2 });

            const results = await repo.getAll();

            expect(results).toHaveLength(2);
            expect(results[0].getId()).toBe("book-1");
            expect(results[1].getId()).toBe("book-2");
        });

        it('should return empty array when none exist', async () => {
            mockClient.query.mockResolvedValue({ rows: [], rowCount: 0 });

            const results = await repo.getAll();

            expect(results).toEqual([]);
        });
    });

    describe('update', () => {
        it('should update book successfully', async () => {
            mockClient.query.mockResolvedValue({ rowCount: 1 });

            await expect(repo.update(dummyBook)).resolves.not.toThrow();
            expect(mockClient.query).toHaveBeenCalledWith(
                expect.stringContaining('UPDATE'),
                expect.arrayContaining(["book-1", "Clean Code", "Robert Martin"])
            );
        });

        it('should throw ItemNotFoundException when not found', async () => {
            mockClient.query.mockResolvedValue({ rowCount: 0 });

            await expect(repo.update(dummyBook)).rejects.toThrow(ItemNotFoundException);
        });
    });

    describe('delete', () => {
        it('should delete book successfully', async () => {
            mockClient.query.mockResolvedValue({ rowCount: 1 });

            await expect(repo.delete("book-1")).resolves.not.toThrow();
            expect(mockClient.query).toHaveBeenCalledWith(
                expect.stringContaining('DELETE'),
                ["book-1"]
            );
        });

        it('should throw ItemNotFoundException when not found', async () => {
            mockClient.query.mockResolvedValue({ rowCount: 0 });

            await expect(repo.delete("missing")).rejects.toThrow(ItemNotFoundException);
        });
    });

    describe('Edge Cases', () => {
        it('should wrap database errors in DbException', async () => {
            // This fails INSIDE the runQuery callback, so the Repo's catch block catches it
            mockClient.query.mockRejectedValue(new Error('connection lost'));

            await expect(repo.get("book-1")).rejects.toThrow(DbException);
        });

        it('should propagate connection pool failure', async () => {
            // We mock runQuery to throw directly (simulating a pool issue)
            (PostgreSQLConnectionManager.runQuery as jest.Mock).mockRejectedValueOnce(
                new Error('pool exhausted')
            );

            await expect(repo.create(dummyBook)).rejects.toThrow('pool exhausted');
        });

        it('should throw DbException when inserting null required fields', async () => {
            mockClient.query.mockRejectedValue(
                new Error('null value in column "title" violates not-null constraint')
            );

            const bookWithNull = {
                ...dummyBook,
                getTitle: () => null
            } as unknown as IdentifiableBook;

            // We only check for the Exception, not the release() call
            await expect(repo.create(bookWithNull)).rejects.toThrow(DbException);
        });

        it('should throw DbException on duplicate entry', async () => {
            mockClient.query.mockRejectedValue(new Error('duplicate key'));
            
            await expect(repo.create(dummyBook)).rejects.toThrow(DbException);
        });
    });
});