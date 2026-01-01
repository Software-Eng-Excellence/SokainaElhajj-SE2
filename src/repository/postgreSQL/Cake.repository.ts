/* eslint-disable @typescript-eslint/no-explicit-any */
import { ItemCategory } from "../../model/IItem";
import { id, Initializable, IRepository } from "../IRepository";
import { DbException, InitializationException, ItemNotFoundException } from "../../util/exceptions/repositoryExceptions";
import logger from "../../util/logger";
import { PostgreSQLConnectionManager } from "./PostgreSQLConnectionManager";
import { IdentifiableCake } from "../../model/Cake.model";
import { DatabaseCakeMapper, DatabaseCake } from "../../mappers/Cake.mapper";

const tableName = ItemCategory.CAKE;

const CREATE_TABLE = `CREATE TABLE IF NOT EXISTS ${tableName} (
    id TEXT PRIMARY KEY,
    type TEXT NOT NULL,
    flavor TEXT NOT NULL,
    filling TEXT NOT NULL,
    size INTEGER NOT NULL,
    layers INTEGER NOT NULL,
    "frostingType" TEXT NOT NULL,
    "frostingFlavor" TEXT NOT NULL,
    "decorationType" TEXT NOT NULL,
    "decorationColor" TEXT NOT NULL,
    "customMessage" TEXT NOT NULL,
    shape TEXT NOT NULL, 
    allergies TEXT NOT NULL,
    "specialIngredients" TEXT NOT NULL,
    "packagingType" TEXT NOT NULL
)`; 

    const INSERT_CAKE = `INSERT INTO ${tableName} (
        id, type, flavor, filling, size, layers, "frostingType", "frostingFlavor",
        "decorationType", "decorationColor", "customMessage", shape, allergies,
        "specialIngredients", "packagingType") 
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15)`;

    const SELECT_BY_ID = `SELECT * FROM ${tableName} WHERE id = $1`;

    const SELECT_ALL = `SELECT * FROM ${tableName}`;


    const DELETE_ID = `DELETE FROM ${tableName} WHERE id = $1`;

    const UPDATE_ID = `UPDATE ${tableName} SET
        type = $1,
        flavor = $2,
        filling = $3,
        size = $4,
        layers = $5,
        "frostingType" = $6,
        "frostingFlavor" = $7,
        "decorationType" = $8,
        "decorationColor" = $9,
        "customMessage" = $10,
        shape = $11,
        allergies = $12,
        "specialIngredients" = $13,
        "packagingType" = $14
        WHERE id = $15`;
    
export class CakeRepository implements IRepository<IdentifiableCake>, Initializable{

    async init(){
        try {
            const pool = PostgreSQLConnectionManager.getPool();
            await pool.query(CREATE_TABLE);
            logger.info("Cake table initialized");
        } catch (error: unknown) {
            logger.error("Failed to initialize Cake table", error as Error);
            throw new InitializationException("Failed to initialize Cake table", error as Error);
        }
    }
    
    async create(item: IdentifiableCake): Promise<id> {
        return await PostgreSQLConnectionManager.runQuery(async (client) => {
            try {
                await client.query(INSERT_CAKE, [
                    item.getId(),
                    item.getType(),
                    item.getFlavor(),
                    item.getFilling(),
                    item.getSize(),
                    item.getLayers(),
                    item.getFrostingType(),
                    item.getFrostingFlavor(),
                    item.getDecorationType(),
                    item.getDecorationColor(),
                    item.getCustomMessage(),
                    item.getShape(),
                    item.getAllergies(),
                    item.getSpecialIngredients(),
                    item.getPackagingType()            
                ]);
                logger.info("Created cake with id %s", item.getId());
                return item.getId();
            } catch (error: unknown) {
                logger.error("Failed to create cake", error as Error);
                throw new DbException("Failed to create cake", error as Error);
            }
        });
    }

    async get(id: id): Promise<IdentifiableCake> {
        return await PostgreSQLConnectionManager.runQuery(async (client) => {
            try {
                const result = await client.query(SELECT_BY_ID, [id]);

                if (result.rows.length === 0) {
                    throw new ItemNotFoundException("Cake of id " + id + " not found");
                }
                
                return new DatabaseCakeMapper().map(result.rows[0]);

            } catch (error: unknown) {
                if (error instanceof ItemNotFoundException) {
                    throw error;  
                }
                
                logger.error("Failed to get cake", error as Error);
                throw new DbException("Failed to get cake", error as Error);
            }
        });
    }

    async getAll(): Promise<IdentifiableCake[]> {
         return await PostgreSQLConnectionManager.runQuery(async (client) => {
            try {
                const result = await client.query(SELECT_ALL);
                const mapper = new DatabaseCakeMapper();

                return result.rows.map((row) => mapper.map(row as DatabaseCake));
                
            } catch (error: unknown) {
                logger.error("Failed to get all cakes", error as Error);
                throw new DbException("Failed to get all cakes", error as Error);
            }
        });
    }

    async update(item: IdentifiableCake): Promise<void> {
        return await PostgreSQLConnectionManager.runQuery(async (client) => {
            try {
                const result = await client.query(UPDATE_ID, [
                    item.getType(),
                    item.getFlavor(),
                    item.getFilling(),
                    item.getSize(),
                    item.getLayers(),
                    item.getFrostingType(),
                    item.getFrostingFlavor(),
                    item.getDecorationType(),
                    item.getDecorationColor(),
                    item.getCustomMessage(),
                    item.getShape(),
                    item.getAllergies(),
                    item.getSpecialIngredients(),
                    item.getPackagingType(), 
                    item.getId()
                ]);

                if (result.rowCount === 0) {
                    throw new ItemNotFoundException("Item of id " + item.getId() + " not found");
                }
                
                logger.info("Updated cake Successfully");
            } catch (error: unknown) {
                if (error instanceof ItemNotFoundException) {
                    throw error;  
                }

                logger.error("Failed to update cake", error as Error);
                throw new DbException("Failed to update cake", error as Error);
            }
        });
    }

    async delete(id: id): Promise<void> {
       return await PostgreSQLConnectionManager.runQuery(async (client) => {
            try {
                const result = await client.query(DELETE_ID, [id]);

                if (result.rowCount === 0) {
                    throw new ItemNotFoundException("Cake of id " + id + " not found");
                }

                logger.info("Deleted cake with id %s", id);
            } catch (error: unknown) {
                if (error instanceof ItemNotFoundException) {
                    throw error;  
                }

                logger.error("Failed to delete cake", error as Error);
                throw new DbException("Failed to delete cake", error as Error);
            }
        });
    }
}