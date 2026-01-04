import dotenv from "dotenv";
import path from "path";
import { DBMode } from "./types";
import { StringValue } from "ms";

dotenv.config({ path: path.resolve(process.cwd(), '.env') });

export default {
    isDev: process.env.NODE_ENV === 'development',
    isProduction: process.env.NODE_ENV === 'production',
    logDir: process.env.LOG_DIR || './logs', // Specifies the folder where log files will be saved.
    storagePath: {
        csv: {
            cake: "src/data/cake-orders.csv"
        },
        json: {
            book: "src/data/book-orders.json"
        },
        xml: {
            toy: "src/data/toy-orders.xml"
        },
        sqlite: process.env.DB_URL || "src/data/orders.db",
        postgresql: process.env.DATABASE_URL || '',
    },
    port: process.env.PORT ? parseInt(process.env.PORT) : 3000,
    host: process.env.HOST || "localhost",
    dbMode: DBMode.SQLITE,
    auth: {
        secretKey: process.env.JWT_SECRET_KEY || "secret_1234567890",
        tokenExpiration: (process.env.TOKEN_EXPIRATION || '15m') as StringValue,
        refreshTokenExpiartion: (process.env.REFRESH_TOKEN_EXPIRATION || '7d') as StringValue,
    }
};