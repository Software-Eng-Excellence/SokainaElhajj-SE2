import { OrderRepository } from "./Order.repository"
import { parseJSON, writeJSON } from "../../parsers/jsonParser";
import { OrderMapper } from "../../mappers/Order.mapper";
import { BookMapper } from "../../mappers/Book.mapper";
import { IOrder } from "../../model/IOrder";
import { DbException } from "../../util/exceptions/repositoryExceptions";

export class BookOrderRepository extends OrderRepository {
    private mapper = new OrderMapper(new BookMapper());

    constructor(private readonly filePath: string) {
        super();
    }

    protected async load(): Promise<IOrder[]> {
        try {
            // Read JSON array from file
            const jsonData = await parseJSON(this.filePath);

            // Handle empty file or non-array
            if (!Array.isArray(jsonData)) {
                return [];
            }

            // Map each JSON object to IOrder
            return jsonData.map(this.mapper.map.bind(this.mapper));
        } catch (error: unknown) {
            throw new DbException("Failed to load orders", error as Error);
        }
    }

    protected async save(orders: IOrder[]): Promise<void> {
        try {
            // Convert orders to JSON-friendly objects
            const rawItems = orders.map(this.mapper.reverseMap.bind(this.mapper));

            // Write JSON array to file
            await writeJSON(this.filePath, rawItems);
        } catch (error: unknown) {
            throw new DbException("Failed to save orders", error as Error);
        }
    }
}