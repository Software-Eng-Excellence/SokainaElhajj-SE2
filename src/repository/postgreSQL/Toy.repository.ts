import { ItemCategory } from "../../model/IItem";
import { IdentifiableToy } from "../../model/Toy.model";
import { id, Initializable, IRepository } from "../IRepository";
import { DbException, InitializationException, ItemNotFoundException } from "../../util/exceptions/repositoryExceptions";
import logger from "../../util/logger";
import { PostgreSQLConnectionManager } from "./PostgreSQLConnectionManager";
import { DatabaseToy, DatabaseToyMapper } from "../../mappers/Toy.mapper";

const tableName = ItemCategory.Toy;

const CREATE_TABLE = `CREATE TABLE IF NOT EXISTS ${tableName} (
    id TEXT PRIMARY KEY,
    type TEXT NOT NULL,
    "ageGroup" TEXT NOT NULL,
    brand TEXT NOT NULL,
    material TEXT NOT NULL,
    "batteryRequired" BOOLEAN NOT NULL,
    educational BOOLEAN NOT NULL
)`;

const INSERT_TOY = `INSERT INTO ${tableName} (
    id, type, "ageGroup", brand, material, "batteryRequired", educational
) VALUES ($1, $2, $3, $4, $5, $6, $7)`;

const SELECT_BY_ID = `SELECT * FROM ${tableName} WHERE id = $1`;

const SELECT_ALL = `SELECT * FROM ${tableName}`;

const DELETE_ID = `DELETE FROM ${tableName} WHERE id = $1`;

const UPDATE_ID = `UPDATE ${tableName} SET
    type = $1,
    "ageGroup" = $2,
    brand = $3,
    material = $4,
    "batteryRequired" = $5,
    educational = $6
    WHERE id = $7`;


export class ToyRepository implements IRepository<IdentifiableToy>, Initializable{
    async init(){
        try {
            const pool = PostgreSQLConnectionManager.getPool();
            await pool.query(CREATE_TABLE);
            logger.info("Toy table initialized");
        } catch (error: unknown) {
            logger.error("Failed to initialize Toy table", error as Error);
            throw new InitializationException("Failed to initialize Toy table", error as Error);
        }
    }

    async create(item: IdentifiableToy): Promise<id> {
        return await PostgreSQLConnectionManager.runQuery(async (client) => {
            try {
                await client.query(INSERT_TOY, [
                    item.getId(),
                    item.getType(),
                    item.getAgeGroup(),
                    item.getBrand(),
                    item.getMaterial(),
                    item.getBatteryRequired(),
                    item.getEducational()
                ]);
                logger.info("Created toy with id %s", item.getId());
                return item.getId();

            } catch (error) {
                logger.error("Failed to create toy", error as Error);
                throw new DbException("Failed to create toy", error as Error);
            }
        });
    }

    async get(id: id): Promise<IdentifiableToy> {
        return await PostgreSQLConnectionManager.runQuery(async (client) => {
            try {
                const result = await client.query(SELECT_BY_ID, [id]);

                if (result.rows.length === 0) {
                    throw new ItemNotFoundException("Toy of id " + id + " not found");
                }
                
                return new DatabaseToyMapper().map(result.rows[0]);

            } catch (error: unknown) {
                if (error instanceof ItemNotFoundException) {
                    throw error;  
                }
                
                logger.error("Failed to get toy", error as Error);
                throw new DbException("Failed to get toy", error as Error);
            }
        });
    }

    async getAll(): Promise<IdentifiableToy[]> {
        return await PostgreSQLConnectionManager.runQuery(async (client) => {
            try {
                const result = await client.query(SELECT_ALL);
                const mapper = new DatabaseToyMapper();

                return result.rows.map((row) => mapper.map(row as DatabaseToy));
                
            } catch (error: unknown) {
                logger.error("Failed to get all toys", error as Error);
                throw new DbException("Failed to get all toys", error as Error);
            }
        });
    }

    async update(item: IdentifiableToy): Promise<void> {
        return await PostgreSQLConnectionManager.runQuery(async (client) => {
            try {
                const result = await client.query(UPDATE_ID, [
                    item.getType(),
                    item.getAgeGroup(),
                    item.getBrand(),
                    item.getMaterial(),
                    item.getBatteryRequired(),
                    item.getEducational(),          
                    item.getId()
                ]);

                if (result.rowCount === 0) {
                    throw new ItemNotFoundException("Toy of id " + item.getId() + " not found");
                }
                
                logger.info("Updated toy Successfully");

            } catch (error: unknown) {
                if (error instanceof ItemNotFoundException) {
                    throw error;  
                }
                
                logger.error("Failed to update toy", error as Error);
                throw new DbException("Failed to update toy", error as Error);
            }
        });
    }

    async delete(id: id): Promise<void> {
        return await PostgreSQLConnectionManager.runQuery(async (client) => {
            try {
                const result = await client.query(DELETE_ID, [id]);

                if (result.rowCount === 0) {
                    throw new ItemNotFoundException("Toy of id " + id + " not found");
                }

                logger.info("Deleted toy with id %s", id);

            } catch (error: unknown) {
                if (error instanceof ItemNotFoundException) {
                    throw error;  
                }
                
                logger.error("Failed to delete toy", error as Error);
                throw new DbException("Failed to delete toy", error as Error);
            }
        });
    }
    
}