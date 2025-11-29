import { IdentifiableOrderItemBuilder, OrderBuilder } from "../model/builders/order.builder";
import { IOrder } from "../model/IOrder";
import { IMapper } from "./IMapper";
import { IIdentifiableItem, IItem } from "../model/IItem";
import { IdentifiableOrderItem } from "model/Order.model";

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
    reverseMap(data: IOrder): string[] {
        const item = this.itemMapper.reverseMap(data.getItem()) as string[];
        return [
            data.getId(),
            ...item,
            data.getPrice().toString(),
            data.getQuantity().toString()
        ]
    }
}


export class SQLiteOrderMapper implements IMapper<{data:SQLiteOrder, item: IIdentifiableItem}, IdentifiableOrderItem> {
    // constructor (private itemMapper: IMapper<string[], IItem>){

    // }
    map({data, item}: {data:SQLiteOrder, item: IIdentifiableItem}): IdentifiableOrderItem {
        const order = OrderBuilder.newBuilder().setId(data.id)
        .setPrice(data.price)
        .setQuantity(data.quantity)
        .setItem(item)
        .build();
        return IdentifiableOrderItemBuilder.newBuilder().setOrder(order).setItem(item).build();
    }
    reverseMap(data: IdentifiableOrderItem): {data:SQLiteOrder, item: IIdentifiableItem} {
        return {
            data: {
                id: data.getId(),
                price: data.getPrice(),
                quantity: data.getQuantity(),
                item_category: data.getItem().getCategory(),
                item_id: data.getItem().getId()
            },
            item: data.getItem()
        }
    }
}

export interface SQLiteOrder {
    id: string;
    quantity: number;
    price: number;
    item_category: string;
    item_id: string;
}

