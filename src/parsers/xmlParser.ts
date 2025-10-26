import { promises as fs } from 'fs';
import { XMLParser } from 'fast-xml-parser';
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
      ignoreAttributes: false,          // keep attributes in parsed object
      attributeNamePrefix: '@_',        // prefix attributes with "@_" to distinguish from tags
      textNodeName: '#text',            // text inside tags will be under this key
      parseTagValue: true,              // convert tag values to native types (number, boolean, etc.)
      parseAttributeValue: true,        // convert attribute values to native types
      trimValues: true,                 // trim spaces in values
      isArray: (tagName) => tagName === 'person', // force 'person' elements to always be arrays
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
