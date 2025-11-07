import { IItem } from "../IItem";
import { Order } from "../Order.model";

export class OrderBuilder{

    private item!: IItem;
    private price!: number;
    private quantity!: number;
    private id!: string;

    public static newBuilder(): OrderBuilder {
        return new OrderBuilder();
    }

    setItem(item: IItem): OrderBuilder {
        this.item = item;
        return this;
    }

    setPrice(price: number): OrderBuilder {
        this.price = price;
        return this;
    }

    setQuantity(quantity: number): OrderBuilder {
        this.quantity = quantity;
        return this;
    }

    setId(id: string): OrderBuilder {
        this.id = id;
        return this;
    }

    build(): Order {
        if(!this.item || !this.price || !this.quantity || !this.id){
            throw new Error("Missing required properties to build an order");
        }
        return new Order(this.item, this.price, this.quantity, this.id);
    }

    
}