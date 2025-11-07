import logger from "./util/logger";
import { parseCSV } from "./parsers/csvParser";
import { CSVCakeMapper } from "./mappers/Cake.mapper";
import { CSVOrderMapper } from "./mappers/Order.mapper";

async function main() {
  const data = await parseCSV("src/data/cake-orders.csv");
  const cakeMapper = new CSVCakeMapper();
  const orderMapper = new CSVOrderMapper(cakeMapper);
  const orders = data.map(orderMapper.map.bind(orderMapper));

  logger.info("List of orders: \n %o", orders);
}

main();
