/* eslint-disable @typescript-eslint/no-explicit-any */
// src/parsers/csvParser.ts
import fs from 'fs';
import { parse } from 'csv-parse';
import logger from '../util/logger';
import { stringify as csvStringify } from 'csv-stringify';
import { promises as fsPromises } from 'fs';


/**
 * Parse a CSV file and return its content as a 2D array of strings.
 * Handles malformed quotes, trims spaces, skips empty lines, and allows variable column counts.
 */
export const parseCSV = (filePath: string, skipHeader = false): Promise<string[][]> => { // added skipheader
  return new Promise((resolve, reject) => {
    const results: string[][] = []; // will hold all rows of CSV

    // create a readable stream for the CSV file
    const readStream = fs.createReadStream(filePath, { encoding: 'utf-8' });

    // handle file read errors
    readStream.on('error', (error) => {
      if ((error as any).code === 'ENOENT') {
        logger.error('CSV file not found: %s', filePath); // file doesn't exist
      } else {
        logger.error('Error reading CSV file %s: %o', filePath, error); // other read errors
      }
      reject(error);
    });

    // configure the CSV parser
    const parser = parse({
      from_line: skipHeader ? 2 : 1,    // mapper needs to skip header while tester doesnt  
      relax_quotes: true,     // allow malformed quotes without breaking
      trim: true,             // trim spaces around each field
      skip_empty_lines: true, // ignore empty lines
      relax_column_count: true // allow rows with different number of columns
    });

    // pipe file stream into parser
    readStream.pipe(parser);

    // read records as they are parsed
    parser.on('readable', () => {
      let record;
      while ((record = parser.read()) !== null) {
        results.push(record); // add each row to results array
      }
    });

    // handle parsing errors
    parser.on('error', (error) => {
      logger.error('Error parsing CSV file %s: %o', filePath, error);
      reject(error);
    });

    // resolve the promise when parsing is complete
    parser.on('end', () => {
      resolve(results);
    });
  });
};

/**
 * Write a 2D array of strings to a CSV file.
 * Handles proper quoting, escaping, and line breaks.
 */
export const writeCSVFile = async (filePath: string, data: string[][]): Promise<void> => {
  try {
    const csvContent = await new Promise<string>((resolve, reject) => {
      csvStringify(data, (err, output) => {
        if (err) reject (err);
        resolve(output);
      });
    });
    await fsPromises.writeFile(filePath, csvContent, 'utf-8');
  } catch (error) {
    throw new Error(`Error writing CSV file: ${error}`);
  }
};