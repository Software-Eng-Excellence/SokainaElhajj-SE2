import config from "../../config";
import { Database as SqliteDatabase, open} from "sqlite";
import { Database, Statement } from "sqlite3";
import { DatabaseConnectionException } from "../../util/exceptions/DatabaseConnectionException";
import logger from "../../util/logger";


// src/repository/sqlite/ConnectionManager.ts
export class ConnectionManager {

    private static db: SqliteDatabase<Database, Statement> | null = null;

    private constructor() {}

    public static async getConnection(): Promise<SqliteDatabase<Database, Statement>> { 
        if (this.db === null) {
            try {
                this.db = await open({
                    filename: config.storagePath.sqlite,
                    driver: Database
                });    
            } catch (error: unknown) {
                logger.error("Failed to connect to database", error as Error);
                throw new DatabaseConnectionException("Failed to connect to database", error as Error);
            }
        }
        return this.db;
    }
}