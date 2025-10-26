// src/parsers/jsonParser.ts
import fs from 'fs/promises';
import logger from '../util/logger';

/**
 * Parse a JSON file and convert it into a JavaScript object.
 * Handles empty files, invalid JSON, and missing files gracefully.
 */
export const parseJSON = async (filePath: string): Promise<any> => {
    try {
        // Read file content asynchronously
        const content = await fs.readFile(filePath, 'utf-8').catch(() => {
            throw new Error('File not found'); // throw if file doesn't exist
        });

        // Trim leading/trailing whitespace
        const trimmed = content.trim();

        // Check for empty file
        if (!trimmed) {
            logger.warn(`JSON file ${filePath} is empty`);
            return {}; // return empty object for empty JSON
        }

        try {
            // Attempt to parse JSON string into JS object
            const parsed = JSON.parse(trimmed);

            // Defensive check: null or undefined parsed content
            if (parsed == null) {
                logger.warn(`JSON file ${filePath} contains null`);
                return {};
            }

            return parsed; // successfully parsed object
        } catch (parseErr: any) {
            // JSON was malformed
            logger.error(
                `Invalid JSON format in file ${filePath}: ${parseErr}`
            );
            throw parseErr;
        }
    } catch (err: any) {
        // Catch file not found or other unexpected errors
        if (err.message.includes('not found')) {
            logger.error(`JSON file not found: ${filePath}`);
        } else {
            logger.error(`Error parsing JSON file ${filePath}: ${err.message}`);
        }
        throw err; // re-throw error for caller to handle
    }
};
