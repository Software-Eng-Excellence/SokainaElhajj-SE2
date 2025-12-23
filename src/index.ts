import config from './config';
import express from 'express';
import logger from './util/logger';
import helmet from 'helmet';
import bodyParser from 'body-parser';
import cors from 'cors';
import requestLogger from './middleware/requestLogger';
import routes from './routes';
import { Request, Response } from "express";
import { HttpException } from './util/exceptions/http/HttpException';
import cookieParser from 'cookie-parser';

const app = express()

// config helmet
app.use(helmet());

// config body parser
app.use(bodyParser.json())
app.use(bodyParser.urlencoded({ extended: true }));

// config cors
app.use(cors());

// add middleware
app.use(requestLogger);

// cookie parser
app.use(cookieParser());

// config routes
app.use('/', routes);

// config 404 handler
app.use((req, res) => {
    res.status(404).json({ error: "Not Found "});
})

// When you define a function with 4 arguments, Express identifies it as an Error Handling Middleware, run it if you call next(error)
// After: Enhanced Global Error Handler
app.use((err: Error, req: Request, res: Response) => {
    if ( err instanceof HttpException) {
        const httpException = err as HttpException;
        // Log includes name, status, message, and details
        logger.error(" %s [%d] \"%s\" %o", httpException.name, httpException.status, httpException.message, httpException.details || {});
        // Response includes message and details
        res.status(httpException.status).json({
            message: httpException.message,
            details: httpException.details || undefined
        });
    } else {
        logger.error("Unhandled Error: %s", err.message);
        res.status(500).json({ 
            message: "Internal Server Error"
        });
    }
})

app.listen(config.port, config.host, () => {
    logger.info('Server is running on http://%s:%d', config.host, config.port)
});