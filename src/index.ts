import path from 'path';
import { parseCSV } from './parsers/csvParser';
import { parseJSON } from './parsers/jsonParser';
import { parseXml } from './parsers/xmlParser';
import logger from './util/logger';

async function main() {
  // Resolve file paths
  const csvFile = path.resolve(__dirname, './data/cake-orders.csv');
  const jsonFile = path.resolve(__dirname, './data/book-orders.json');
  const xmlFile  = path.resolve(__dirname, './data/toy-orders.xml');

  try {
    // CSV 
    const csvProducts = await parseCSV(csvFile);
    logger.info('===== CSV Products =====');
    csvProducts.forEach((row, index) => {
      logger.info(`${index + 1}: ${row.join(', ')}`);
    });

    // JSON
    const jsonProducts = await parseJSON(jsonFile);
    logger.info('===== JSON Products =====');
    if (Array.isArray(jsonProducts)) {
      jsonProducts.forEach((item, index) => {
        logger.info(`${index + 1}: ${JSON.stringify(item)}`);
      });
    } else {
      logger.info(JSON.stringify(jsonProducts, null, 2));
    }

    // XML
    const xmlProducts = await parseXml(xmlFile);
    logger.info('===== XML Products =====');
    logger.info(JSON.stringify(xmlProducts, null, 2));

  } catch (error: any) {
    logger.error('Error occurred while parsing files: %o', error);
  }
}

main();

// import path from 'path';
// import {parseCSV} from './parsers/csvParser'
// import logger from './util/logger';

// const filePath = path.resolve(__dirname, './data/Cake orders.csv');

// async function main() {
//     try {
//         const products = await parseCSV(filePath)
//         for (const product of products) {
//             logger.info(product + '\n');
//         }
//     } catch(error) {
//         logger.error(error)
//     }
// }

// main();
