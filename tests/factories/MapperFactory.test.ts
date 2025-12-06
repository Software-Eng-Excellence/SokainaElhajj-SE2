import { MapperFactory } from "../../src/mappers/Mapper.factory";
import { ItemCategory } from "../../src/model/IItem";
import { CakeMapper, DatabaseCakeMapper } from "../../src/mappers/Cake.mapper";
import { BookMapper, DatabaseBookMapper } from "../../src/mappers/Book.mapper";
import { ToyMapper, DatabaseToyMapper } from "../../src/mappers/Toy.mapper";
import { OrderMapper, DatabaseOrderMapper } from "../../src/mappers/Order.mapper";

describe("MapperFactory", () => {

    describe("createFileItemMapper", () => {
        it("should create CakeMapper for CAKE category", () => {
            const mapper = MapperFactory.createFileItemMapper(ItemCategory.CAKE);
            expect(mapper).toBeInstanceOf(CakeMapper);
        });

        it("should create BookMapper for Book category", () => {
            const mapper = MapperFactory.createFileItemMapper(ItemCategory.Book);
            expect(mapper).toBeInstanceOf(BookMapper);
        });

        it("should create ToyMapper for Toy category", () => {
            const mapper = MapperFactory.createFileItemMapper(ItemCategory.Toy);
            expect(mapper).toBeInstanceOf(ToyMapper);
        });

        it("should throw error for unsupported category", () => {
            expect(() => {
                MapperFactory.createFileItemMapper("INVALID" as ItemCategory);
            }).toThrow("Unsupported category: INVALID");
        });
    });

    describe("createFileOrderMapper", () => {
        it("should create OrderMapper for CAKE category", () => {
            const mapper = MapperFactory.createFileOrderMapper(ItemCategory.CAKE);
            expect(mapper).toBeInstanceOf(OrderMapper);
        });

        it("should create OrderMapper for Book category", () => {
            const mapper = MapperFactory.createFileOrderMapper(ItemCategory.Book);
            expect(mapper).toBeInstanceOf(OrderMapper);
        });

        it("should create OrderMapper for Toy category", () => {
            const mapper = MapperFactory.createFileOrderMapper(ItemCategory.Toy);
            expect(mapper).toBeInstanceOf(OrderMapper);
        });

        it("should throw error for unsupported category", () => {
            expect(() => {
                MapperFactory.createFileOrderMapper("INVALID" as ItemCategory);
            }).toThrow("Unsupported category: INVALID");
        });
    });

    describe("createDatabaseItemMapper", () => {
        it("should create DatabaseCakeMapper for CAKE category", () => {
            const mapper = MapperFactory.createDatabaseItemMapper(ItemCategory.CAKE);
            expect(mapper).toBeInstanceOf(DatabaseCakeMapper);
        });

        it("should create DatabaseBookMapper for Book category", () => {
            const mapper = MapperFactory.createDatabaseItemMapper(ItemCategory.Book);
            expect(mapper).toBeInstanceOf(DatabaseBookMapper);
        });

        it("should create DatabaseToyMapper for Toy category", () => {
            const mapper = MapperFactory.createDatabaseItemMapper(ItemCategory.Toy);
            expect(mapper).toBeInstanceOf(DatabaseToyMapper);
        });

        it("should throw error for unsupported category", () => {
            expect(() => {
                MapperFactory.createDatabaseItemMapper("INVALID" as ItemCategory);
            }).toThrow("Unsupported category: INVALID");
        });
    });

    describe("createDatabaseOrderMapper", () => {
        it("should create DatabaseOrderMapper", () => {
            const mapper = MapperFactory.createDatabaseOrderMapper();
            expect(mapper).toBeInstanceOf(DatabaseOrderMapper);
        });
    });
});