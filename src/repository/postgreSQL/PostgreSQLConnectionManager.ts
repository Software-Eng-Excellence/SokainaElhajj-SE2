import config from "../../config";
import logger from "../../util/logger";
import { Pool, PoolClient } from 'pg';
import { AsyncLocalStorage } from "async_hooks";
import { DatabaseConnectionException } from "../../util/exceptions/DatabaseConnectionException";

export class PostgreSQLConnectionManager {
    private static pool: Pool | null = null;
    private static storage = new AsyncLocalStorage<PoolClient>();

    private constructor() {}

    public static getPool(): Pool {
        if (this.pool == null){
            try {
                this.pool = new Pool({
                    connectionString: config.storagePath.postgresql,
                    ssl: { rejectUnauthorized: false }  
                });
                logger.info("PostgreSQL Connection Established")
            } catch (error: unknown) {
                logger.error("Failed to connect to PostgreSQL", error as Error);
                throw new DatabaseConnectionException("Failed to connect to PostgreSQL", error as Error);
            }
        }
        return this.pool;
    }

    // Get client from transaction context
    private static async getClient(): Promise<PoolClient> {
        const client = this.storage.getStore();
        if (client) {
            return client; // We're inside a transaction
        }
        
        // Not in transaction, get a client from pool
        return await this.getPool().connect();
    }

    // Check if we're currently in a transaction
    public static isInTransaction(): boolean {
        return this.storage.getStore() !== undefined;
    }

    // Run a callback inside a transaction
    public static async runInTransaction<T>(callback: () => Promise<T>): Promise<T> {
        const pool = this.getPool();
        const client = await pool.connect();

        try {
            await client.query('BEGIN');
            return await this.storage.run(client, async () => {
                const result = await callback();
                await client.query('COMMIT');
                return result;
            });
        } catch (error) {
            await client.query('ROLLBACK');
            throw error;
        } finally {
            client.release();
        }
    }

    // Safe query execution - automatically handles client lifecycle
    public static async runQuery<T>(callback: (client: PoolClient) => Promise<T>): Promise<T> {
        // If already in transaction, use that client
        const transactionClient = this.storage.getStore();
        if (transactionClient) {
            return await callback(transactionClient);
        }

        // Not in transaction, get a temporary client
        const client = await this.getPool().connect();
        try {
            return await callback(client);
        } finally {
            client.release(); // Always release
        }
    }
}