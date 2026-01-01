import dotenv from "dotenv";
import path from "path";


dotenv.config({ path: path.join(__dirname, '../../.env') });

export default {
    NODE_ENV: process.env.NODE_ENV || 'development', // Checks if the environment type (e.g., 'production' or 'development') is set; if not, it uses 'development' as default.
    logDir: 'logs', // Specifies the folder where log files will be saved.
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
        postgresql: process.env.DATABASE_URL || ''
        

    }
};