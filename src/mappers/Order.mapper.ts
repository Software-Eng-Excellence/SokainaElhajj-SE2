import { OrderBuilder } from "../model/builders/order.builder";
import { IOrder } from "../model/IOrder";
import { IMapper } from "./IMapper";
import { IItem } from "../model/IItem";

export class OrderMapper implements IMapper<string [] | Record<string, any>, IOrder>{
    constructor(private itemMapper: IMapper<string[] | Record<string, any>, IItem>){

    }
    map(data: string[] | Record<string, any>): IOrder {
        const builder = OrderBuilder.newBuilder();
        let item: IItem;

        if (Array.isArray(data)){
            // csv format
            item = this.itemMapper.map(data);
            
            return builder
                .setId(data[0])
                .setQuantity(parseInt(data[data.length - 1]))
                .setPrice(parseInt(data[data.length - 2]))
                .setItem(item)
                .build();
        } else {
            // json or xml format
            item = this.itemMapper.map(data);

            // OrderID for toys(xml), Order ID for books(json)
            const id = data["OrderID"] ?? data["Order ID"];

            return builder
                .setId(id)
                .setPrice(parseInt(data["Price"]))
                .setQuantity(parseInt(data["Quantity"]))
                .setItem(item)
                .build();
        }
    }
}