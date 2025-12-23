import { NextFunction, Request, Response } from "express";
import logger from "../util/logger";

const requestLogger = (req: Request, res: Response, next: NextFunction) => {
    const startTime = Date.now();
    
    res.on('finish', () => {
        const responeTime = Date.now() - startTime; 
        const status = res.statusCode;
        const {method, originalUrl} = req; 
        const level = status >= 500? 'error' : status >= 400? 'warn' : 'info';
        logger.log({level, message: `${method} ${status} ${originalUrl} ${responeTime}ms`});
    });
    next();
};

export default requestLogger;