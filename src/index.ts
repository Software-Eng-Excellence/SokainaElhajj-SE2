import logger from "./util/logger";
import { OrderMapper } from "./mappers/Order.mapper";
import { parseXml } from "./parsers/xmlParser";
import { ToyMapper } from "./mappers/Toy.mapper";

async function main() {

  // xml test
  const xmlData: any = await parseXml("src/data/toy-orders.xml");
  const toyMapper = new ToyMapper();
  const xmlOrderMapper = new OrderMapper(toyMapper);
  const xmlOrders = xmlData.data.row.map(xmlOrderMapper.map.bind(xmlOrderMapper));
  logger.info("List of toy orders:\n %o", xmlOrders);
}

main();
