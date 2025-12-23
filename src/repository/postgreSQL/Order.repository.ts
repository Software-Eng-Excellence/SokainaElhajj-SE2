/* eslint-disable @typescript-eslint/no-explicit-any */
import { IIdentifiableOrderItem } from "../../model/IOrder";
import { id, Initializable, IRepository } from "../IRepository";
import { DbException, InitializationException, ItemNotFoundException } from "../../util/exceptions/repositoryExceptions";
import logger from "../../util/logger";
import { IIdentifiableItem } from "../../model/IItem";
import { PostgreSQLConnectionManager } from "./PostgreSQLConnectionManager";
import { PoolClient } from "pg";
import { DatabaseOrderMapper } from "../../mappers/Order.mapper";

const CREATE_TABLE = `CREATE TABLE IF NOT EXISTS "order" (
    id TEXT PRIMARY KEY,
    quantity INTEGER NOT NULL,
    price INTEGER NOT NULL,
    item_category TEXT NOT NULL,
    item_id TEXT NOT NULL
)`; 

const INSERT_ORDER = `INSERT INTO "order" (id, quantity, price, item_category, item_id) VALUES ($1, $2, $3, $4, $5)`;

const SELECT_BY_ID = `SELECT * FROM "order" WHERE id = $1`;

const SELECT_ALL = `SELECT * FROM "order" WHERE item_category = $1`;

const DELETE_ID = `DELETE FROM "order" WHERE id = $1`;

const UPDATE_ID = `UPDATE "order" SET
    quantity = $1,
    price = $2,
    item_category = $3,
    item_id = $4
    WHERE id = $5`;


export class OrderRepository implements IRepository<IIdentifiableOrderItem>, Initializable{
    constructor(private readonly itemRepository: IRepository<IIdentifiableItem> & Initializable){
       
    }

    async init(){
        try {
            const pool = PostgreSQLConnectionManager.getPool();
            await pool.query(CREATE_TABLE);
            await this.itemRepository.init();
            logger.info("Order table initialized");
        } catch (error: unknown) {
            logger.error("Failed to initialize Order table", error as Error);
            throw new InitializationException("Failed to initialize Order table", error as Error);
        }
    }

    async create(order: IIdentifiableOrderItem, client?: any): Promise<id> {
        const pool = PostgreSQLConnectionManager.getPool();
        // use existing client if provided, or create new one
        const dbClient = (client as PoolClient) ?? await pool.connect();        
        // if there's no client, we must handle transaction
        const shouldManageTransaction = !client;

        try {
            if (shouldManageTransaction) {
                await dbClient.query('BEGIN');
            }

            // create the item
            const item_id = await this.itemRepository.create(order.getItem(), dbClient);

            // insert order
            await dbClient.query(INSERT_ORDER, [
                order.getId(),
                order.getQuantity(),
                order.getPrice(),
                order.getItem().getCategory(),
                item_id
            ]);

            if (shouldManageTransaction) {
                await dbClient.query('COMMIT');
            }

            logger.info("Created order with id %s", order.getId());
            return order.getId();

        } catch (error) {
            if (shouldManageTransaction) {
                // undo everything on failure
                await dbClient.query('ROLLBACK');
            }
            logger.error("Failed to create order", error as Error);
            throw new DbException("Failed to create order", error as Error);

        } finally {
            // Release DB connection if we created it
            if (shouldManageTransaction) {
                // returns the connection to the pool (runs even if an error is thrown)
                dbClient.release();
            }
        }
    }

    async get(id: id, client?: any): Promise<IIdentifiableOrderItem> {
        const pool = PostgreSQLConnectionManager.getPool();
        const dbClient = (client as PoolClient) ?? await pool.connect();
        const shouldRelease = !client;

        try {
            const result = await dbClient.query(SELECT_BY_ID, [id]);
            
            if (result.rows.length === 0) {
                throw new ItemNotFoundException("Order of id " + id + " not found");
            }
            
            const orderRow = result.rows[0];

            const item = await this.itemRepository.get(orderRow.item_id, dbClient);
            
            // convert DB rows into model object
            return new DatabaseOrderMapper().map({
                data: orderRow,
                item: item
            });

        } catch (error: unknown) {
            // if it's our known error, pass it through
            if (error instanceof ItemNotFoundException) {
                throw error;
            }
            
            // otherwise, wrap it
            logger.error("Failed to get order of id %s", id, error as Error);
            throw new DbException("Failed to get order of id " + id, error as Error);
        
        } finally {
            if (shouldRelease) {
                dbClient.release();
            }
        }
    }

    async getAll(client?: any): Promise<IIdentifiableOrderItem[]> {
        const pool = PostgreSQLConnectionManager.getPool();
        const dbClient = (client as PoolClient) ?? await pool.connect();
        const shouldRelease = !client;

        try {
            const items = await this.itemRepository.getAll(dbClient);
            
            if (items.length === 0) {
                return [];
            }
            
            const result = await dbClient.query(SELECT_ALL, [items[0].getCategory()]);
            
            const orders = result.rows.map(orderRow => {
                const item = items.find(item => item.getId() === orderRow.item_id);
                if (!item) {
                    throw new ItemNotFoundException("Item of id " + orderRow.item_id + " not found"); 
                }
                
                return new DatabaseOrderMapper().map({
                    data: orderRow,
                    item: item
                });
            });
            
            return orders;

        } catch (error: unknown) {
            if (error instanceof ItemNotFoundException) {
                throw error;
            }

            logger.error("Failed to get all orders", error as Error);
            throw new DbException("Failed to get all orders", error as Error);
        
        } finally {
            if (shouldRelease) {
                dbClient.release();
            }
        }
    }

    async update(order: IIdentifiableOrderItem, client?: any): Promise<void> {
        const pool = PostgreSQLConnectionManager.getPool();
        const dbClient = (client as PoolClient) ?? await pool.connect();
        const shouldManageTransaction = !client;

        try {
            if (shouldManageTransaction) {
                await dbClient.query('BEGIN');
            }

            await this.itemRepository.update(order.getItem(), dbClient);

            const result = await dbClient.query(UPDATE_ID, [
                order.getQuantity(),
                order.getPrice(),
                order.getItem().getCategory(),
                order.getItem().getId(),
                order.getId()
            ]);

            if (result.rowCount === 0) {
                throw new ItemNotFoundException("Order of id " + order.getId() + " not found"); 
            }

            if (shouldManageTransaction) {
                await dbClient.query('COMMIT');
            }

            logger.info("Updated order with id %s", order.getId());
            
        } catch (error: unknown) {
            if (shouldManageTransaction) {
                await dbClient.query('ROLLBACK');
            }
            
            if (error instanceof ItemNotFoundException) {
                throw error;
            }

            logger.error("Failed to update order", error as Error);
            throw new DbException("Failed to update order", error as Error);
        
        } finally {
            if (shouldManageTransaction) {
                dbClient.release();
            }
        }
    }

    async delete(id: id, client?: any): Promise<void> {
        const pool = PostgreSQLConnectionManager.getPool();
        const dbClient = (client as PoolClient) ?? await pool.connect();
        const shouldManageTransaction = !client;

        try {
            if (shouldManageTransaction) {
                await dbClient.query('BEGIN');
            }

            const orderResult = await dbClient.query(SELECT_BY_ID, [id]);
            
            if (orderResult.rows.length === 0) {
                throw new ItemNotFoundException("Order of id " + id + " not found");
            }

            const itemId = orderResult.rows[0].item_id;

            await this.itemRepository.delete(itemId, dbClient);

            await dbClient.query(DELETE_ID, [id]);

            if (shouldManageTransaction) {
                await dbClient.query('COMMIT');
            }

            logger.info("Deleted order with id %s", id);
            
        } catch (error: unknown) {
            if (shouldManageTransaction) {
                await dbClient.query('ROLLBACK');
            }

            if (error instanceof ItemNotFoundException) {
                throw error;
            }

            logger.error("Failed to delete order", error as Error);
            throw new DbException("Failed to delete order", error as Error);
        
        } finally {
            if (shouldManageTransaction) {
                dbClient.release();
            }
        }
    }
}