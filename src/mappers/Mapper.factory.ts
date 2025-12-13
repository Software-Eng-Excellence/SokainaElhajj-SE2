import { ItemCategory } from "../model/IItem";
import { IMapper } from "./IMapper";

// Item Mappers (for FILE: CSV, JSON, XML)
import { CakeMapper } from "./Cake.mapper";
import { BookMapper } from "./Book.mapper";
import { ToyMapper } from "./Toy.mapper";

// Database Item Mappers (for SQLite, PostgreSQL)
import { DatabaseCakeMapper } from "./Cake.mapper";
import { DatabaseBookMapper } from "./Book.mapper";
import { DatabaseToyMapper } from "./Toy.mapper";

// Order Mappers
import { OrderMapper, DatabaseOrderMapper } from "./Order.mapper";

export class MapperFactory {

    // ============ FILE MAPPERS ============

    /**
     * Creates a FILE item mapper (for CSV, JSON, XML)
     */
    public static createFileItemMapper(category: ItemCategory): IMapper<any, any> {
        switch (category) {
            case ItemCategory.CAKE:
                return new CakeMapper();
            case ItemCategory.Book:
                return new BookMapper();
            case ItemCategory.Toy:
                return new ToyMapper();
            default:
                throw new Error(`Unsupported category: ${category}`);
        }
    }

    /**
     * Creates a FILE order mapper (wraps item mapper inside)
     */
    public static createFileOrderMapper(category: ItemCategory): OrderMapper {
        const itemMapper = this.createFileItemMapper(category);
        return new OrderMapper(itemMapper);
    }

    // ============ DATABASE MAPPERS ============

    /**
     * Creates a DATABASE item mapper (for SQLite, PostgreSQL)
     */
    public static createDatabaseItemMapper(category: ItemCategory): IMapper<any, any> {
        switch (category) {
            case ItemCategory.CAKE:
                return new DatabaseCakeMapper();
            case ItemCategory.Book:
                return new DatabaseBookMapper();
            case ItemCategory.Toy:
                return new DatabaseToyMapper();
            default:
                throw new Error(`Unsupported category: ${category}`);
        }
    }

    /**
     * Creates a DATABASE order mapper
     * Note: Same mapper for all categories (Cake, Book, Toy)
     * because it only maps order data, not item data
     */
    public static createDatabaseOrderMapper(): DatabaseOrderMapper {
        return new DatabaseOrderMapper();
    }
}

import { JsonRequestOrderMapper } from "./Order.mapper";
import { JsonCakeRequestMapper } from "./Cake.mapper";
import { JsonRequestBookMapper } from "./Book.mapper";
import { JsonRequestToyMapper } from "./Toy.mapper";

export class JsonRequestFactory {
    public static create(type: ItemCategory): JsonRequestOrderMapper {
        switch (type) {
            case ItemCategory.CAKE:
                return new JsonRequestOrderMapper(new JsonCakeRequestMapper());
            case ItemCategory.Book:
                return new JsonRequestOrderMapper(new JsonRequestBookMapper());
            case ItemCategory.Toy:
                return new JsonRequestOrderMapper(new JsonRequestToyMapper());
            default: 
                throw new Error("Unsupported type");
        }
    }
}