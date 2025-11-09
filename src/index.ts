import logger from "./util/logger";
import { parseCSV } from "./parsers/csvParser";
import { CakeMapper } from "./mappers/Cake.mapper";
import { OrderMapper } from "./mappers/Order.mapper";
import { parseJSON } from "./parsers/jsonParser";
import { BookMapper } from "./mappers/Book.mapper";
import { parseXml } from "./parsers/xmlParser";
import { ToyMapper } from "./mappers/Toy.mapper";

async function main() {

  // xml test
  // const xmlData: any = await parseXml("src/data/toy-orders.xml");
  // const toyMapper = new ToyMapper();
  // const xmlOrderMapper = new OrderMapper(toyMapper);
  // const xmlOrders = xmlData.data.row.map(xmlOrderMapper.map.bind(xmlOrderMapper));
  // logger.info("List of toy orders:\n %o", xmlOrders);

  // csv test
  // const csvData = await parseCSV("src/data/cake-orders.csv", true);
  // const cakeMapper = new CakeMapper();
  // const csvOrderMapper = new OrderMapper(cakeMapper);
  // const csvOrders = csvData.map(csvOrderMapper.map.bind(csvOrderMapper));
  // logger.info("List of cake orders:\n %o", csvOrders);

  // //json
  const jsonData = await parseJSON("src/data/book-orders.json");
  const bookMapper = new BookMapper();
  const jsonOrderMapper = new OrderMapper(bookMapper);
  const jsonOrders = jsonData.map(jsonOrderMapper.map.bind(jsonOrderMapper));
  logger.info("List of book orders:\n %o", jsonOrders);
}

main();
