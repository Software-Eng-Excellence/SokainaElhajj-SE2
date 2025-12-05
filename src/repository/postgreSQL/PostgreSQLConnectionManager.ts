import config from "../../config";
import logger from "../../util/logger";
import { Pool } from 'pg';
import { DatabaseConnectionException } from "../../util/exceptions/DatabaseConnectionException";

export class PostgreSQLConnectionManager {
    private static pool: Pool | null = null;

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
}
