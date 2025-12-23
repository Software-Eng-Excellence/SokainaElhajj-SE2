import dotenv from "dotenv";
import path from "path";
import { DBMode } from "./types";
import { StringValue } from "ms";


dotenv.config({ path: path.join(__dirname, '../../.env') });

const env = process.env.NODE_ENV || 'development';

export default {
    NODE_ENV: env, // Checks if the environment type (e.g., 'production' or 'development') is set; if not, it uses 'development' as default.
    isDev: env === 'development',
    isProduction: env === 'production',
    logDir: './logs', // Specifies the folder where log files will be saved.
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
        sqlite: "src/data/orders.db",
        postgresql: process.env.DATABASE_URL || '',
    },
    port: process.env.PORT ? parseInt(process.env.PORT) : 3000,
    host: process.env.HOST || "localhost",
    dbMode: DBMode.SQLITE,
    auth: {
        secretKey: process.env.SECRET_KEY || "secret_1234567890",
        tokenExpiration: (process.env.TOKEN_EXPIRATION || '15m') as StringValue,
        refreshTokenExpiartion: (process.env.REFRESH_TOKEN_EXPIRATION || '7d') as StringValue,
    }
};