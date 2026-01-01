import { IIdentifiableOrderItem } from "../../model/IOrder";
import { id, Initializable, IRepository } from "../IRepository";
import { DbException, InitializationException, ItemNotFoundException } from "../../util/exceptions/repositoryExceptions";
import logger from "../../util/logger";
import { IIdentifiableItem } from "../../model/IItem";
import { PostgreSQLConnectionManager } from "./PostgreSQLConnectionManager";
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

    async create(order: IIdentifiableOrderItem): Promise<id> {
        return await PostgreSQLConnectionManager.runInTransaction(async () => {
            try {
                // create the item
                const item_id = await this.itemRepository.create(order.getItem());

                // Execute query within transaction
                await PostgreSQLConnectionManager.runQuery(async (client) => {
                    await client.query(INSERT_ORDER, [
                        order.getId(),
                        order.getQuantity(),
                        order.getPrice(),
                        order.getItem().getCategory(),
                        item_id
                    ]);
                });

                logger.info("Created order with id %s", order.getId());
                return order.getId();

            } catch (error) {
                logger.error("Failed to create order", error as Error);
                throw new DbException("Failed to create order", error as Error);
            } 
        });
    }

    async get(id: id): Promise<IIdentifiableOrderItem> {
        return await PostgreSQLConnectionManager.runQuery(async (client) => {
            try {
                const result = await client.query(SELECT_BY_ID, [id]);
                
                if (result.rows.length === 0) {
                    throw new ItemNotFoundException("Order of id " + id + " not found");
                }
                
                const orderRow = result.rows[0];
                const item = await this.itemRepository.get(orderRow.item_id);
                
                return new DatabaseOrderMapper().map({
                    data: orderRow,
                    item: item
                });

            } catch (error: unknown) {
                if (error instanceof ItemNotFoundException) {
                    throw error;
                }
                
                logger.error("Failed to get order of id %s", id, error as Error);
                throw new DbException("Failed to get order of id " + id, error as Error);
            }
        });
    }

    async getAll(): Promise<IIdentifiableOrderItem[]> {
        return await PostgreSQLConnectionManager.runQuery(async (client) => {
            try {
                const items = await this.itemRepository.getAll();
                
                if (items.length === 0) {
                    return [];
                }
                
                const result = await client.query(SELECT_ALL, [items[0].getCategory()]);
                
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
            }
        });
    }

    async update(order: IIdentifiableOrderItem): Promise<void> {
        return await PostgreSQLConnectionManager.runInTransaction(async () => {
            try {
                await this.itemRepository.update(order.getItem());

                await PostgreSQLConnectionManager.runQuery(async (client) => {
                    const result = await client.query(UPDATE_ID, [
                        order.getQuantity(),
                        order.getPrice(),
                        order.getItem().getCategory(),
                        order.getItem().getId(),
                        order.getId()
                    ]);

                    if (result.rowCount === 0) {
                        throw new ItemNotFoundException("Order of id " + order.getId() + " not found"); 
                    }
                });

                logger.info("Updated order with id %s", order.getId());
                
            } catch (error: unknown) {
                if (error instanceof ItemNotFoundException) {
                    throw error;
                }

                logger.error("Failed to update order", error as Error);
                throw new DbException("Failed to update order", error as Error);
            }
        });
    }

    async delete(id: id): Promise<void> {
        return await PostgreSQLConnectionManager.runInTransaction(async () => {
            try {
                await PostgreSQLConnectionManager.runQuery(async (client) => {
                    const orderResult = await client.query(SELECT_BY_ID, [id]);
                    
                    if (orderResult.rows.length === 0) {
                        throw new ItemNotFoundException("Order of id " + id + " not found");
                    }

                    const itemId = orderResult.rows[0].item_id;
                    await this.itemRepository.delete(itemId);
                    await client.query(DELETE_ID, [id]);
                });

                logger.info("Deleted order with id %s", id);
                
            } catch (error: unknown) {
                if (error instanceof ItemNotFoundException) {
                    throw error;
                }

                logger.error("Failed to delete order", error as Error);
                throw new DbException("Failed to delete order", error as Error);
            }
        });
    }
}