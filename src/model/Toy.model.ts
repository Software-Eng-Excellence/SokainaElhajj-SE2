import { Item, ItemCategory } from "./Item.model";

export class Toy implements Item{

    private type: string;
    private ageGroup: string;
    private brand: string;
    private material: string;
    private batteryRequired: boolean;
    private educational: boolean;

    constructor(
        type: string,
        ageGroup: string,
        brand: string,
        material: string,
        batteryRequired: boolean,
        educational: boolean
    ){
        this.type = type;
        this.ageGroup =ageGroup;
        this.brand = brand;
        this.material = material;
        this.batteryRequired = batteryRequired;
        this.educational = educational;
    }

    getCategory(): ItemCategory {
        return ItemCategory.Toy;    
    }

    getType(): string {
        return this.type;
    }

    getAgeGroup(): string {
        return this.ageGroup;
    }

    getBrand(): string {
        return this.brand;
    }

    getMaterial(): string {
        return this.material;
    }

    getBatteryRequired(): boolean {
        return this.batteryRequired;
    }

    getEducational(): boolean {
        return this.educational;
    }
}