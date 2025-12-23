/* eslint-disable @typescript-eslint/no-explicit-any */
import { promises as fs } from 'fs';
import { XMLBuilder, XMLParser } from 'fast-xml-parser';
import logger from '../util/logger';

/**
 * Parse an XML file and convert it into a JavaScript object.
 * Handles empty files, missing files, and converts XML attributes and values properly.
 */
export async function parseXml(filePath: string): Promise<object> {
  try {
    // Read XML file content asynchronously
    const fileContent = await fs.readFile(filePath, 'utf-8');

    // Trim leading/trailing whitespace
    const trimmed = fileContent.trim();
    if (!trimmed) {
      logger.warn(`XML file ${filePath} is empty`);
      return {}; // return empty object if XML is empty
    }

    // Configure XML parser
    const parser = new XMLParser({
      ignoreAttributes: false,
      attributeNamePrefix: '@_',
      textNodeName: '#text',
      parseTagValue: false,
      parseAttributeValue: false,
      trimValues: true,
      isArray: (tagName) => tagName === 'row',  // ← Changed from 'order' to 'row'
    });

    // Parse the XML string into a JS object
    const jsonObj = parser.parse(trimmed);
    return jsonObj ?? {}; // fallback to empty object if parser returns null/undefined
  } catch (err: any) {
    // Handle file not found
    if (err.code === 'ENOENT') {
      logger.error(`XML file not found: ${filePath}`);
      throw new Error('File not found');
    }
    // Handle other parsing errors
    logger.error(`Error parsing XML file ${filePath}: ${err.message}`);
    throw err; // re-throw error for caller to handle
  }
}

/**
 * Write a JavaScript object/array to an XML file.
 * Handles proper formatting and structure.
 */
export async function writeXml(filePath: string, data: any, rootName: string = 'data'): Promise<void> {
    try {
        const builder = new XMLBuilder({
            ignoreAttributes: false,
            attributeNamePrefix: '@_',
            textNodeName: '#text',
            format: true,
            indentBy: '  ',
            suppressEmptyNode: true,
        });

        const wrappedData = { [rootName]: { row: data } };

        const xmlContent = builder.build(wrappedData);
        const xmlWithDeclaration = `<?xml version="1.0" encoding="UTF-8"?>\n${xmlContent}`;

        await fs.writeFile(filePath, xmlWithDeclaration, 'utf-8');

        logger.info(`Successfully wrote XML to ${filePath}`);
    } catch (err: any) {
        logger.error(`Error writing XML file ${filePath}: ${err.message}`);
        throw new Error(`Failed to write XML file: ${err.message}`);
    }
}