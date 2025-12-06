import { OrderRepository } from "./Order.repository"
import { OrderMapper } from "../../mappers/Order.mapper";
import { ToyMapper } from "../../mappers/Toy.mapper";
import { IOrder } from "../../model/IOrder";
import { DbException } from "../../util/exceptions/repositoryExceptions";
import { parseXml, writeXml } from "../../parsers/xmlParser";
import { Toy } from "../../model/Toy.model";

export class ToyOrderRepository extends OrderRepository {
    private mapper = new OrderMapper(new ToyMapper());

    constructor(private readonly filePath: string) {
        super();
    }

    protected async load(): Promise<IOrder[]> {
        try {
            const xmlData = await parseXml(this.filePath) as any;

            // Handle your format: <data><row>...</row></data>
            if (!xmlData.data?.row) {
                return [];
            }

            const orders = Array.isArray(xmlData.data.row) 
                ? xmlData.data.row 
                : [xmlData.data.row];

            return orders.map(this.mapper.map.bind(this.mapper));
        } catch (error: unknown) {
            throw new DbException("Failed to load orders", error as Error);
        }
    }

    protected async save(orders: IOrder[]): Promise<void> {
        try {
            const rawItems = orders.map(order => {
                const item = order.getItem() as Toy;
                return {
                    OrderID: order.getId(),
                    Type: item.getType(),
                    AgeGroup: item.getAgeGroup(),
                    Brand: item.getBrand(),
                    Material: item.getMaterial(),
                    BatteryRequired: item.getBatteryRequired() ? 'Yes' : 'No',
                    Educational: item.getEducational() ? 'Yes' : 'No',
                    Price: order.getPrice().toString(),
                    Quantity: order.getQuantity().toString()
                };
            });

            await writeXml(this.filePath, rawItems, 'data');
        } catch (error: unknown) {
            throw new DbException("Failed to save orders", error as Error);
        }
    }
}