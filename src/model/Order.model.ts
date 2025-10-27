import { Item } from "./Item.model";

export interface Order {
    getItem(): Item;
    getPrice(): number;
    getQuantity(): number;
    getId(): string;
}