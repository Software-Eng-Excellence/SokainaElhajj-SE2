import { OrderBuilder } from "../model/builders/order.builder";
import { IOrder } from "../model/IOrder";
import { IMapper } from "./IMapper";
import { IItem } from "../model/IItem";

export class CSVOrderMapper implements IMapper<string [], IOrder>{
    constructor(private itemMapper: IMapper<string[], IItem>){

    }
    map(data: string[]): IOrder {
        const item: IItem = this.itemMapper.map(data);
        return OrderBuilder.newBuilder()
                    .setId(data[0])
                    .setQuantity(parseInt(data[data.length - 1]))
                    .setPrice(parseInt(data[data.length - 2]))
                    .setItem(item)
                    .build();

    }

}