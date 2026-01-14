import logger from "../../util/logger";
import { Toy } from "../Toy.model";

export class ToyBuilder {

    private type!: string;
    private ageGroup!: string;
    private brand!: string;
    private material!: string;
    private batteryRequired!: boolean;
    private educational!: boolean;
    // added function
    public static newBuilder(): ToyBuilder {
        return new ToyBuilder();
    }

    setType(type: string): ToyBuilder {
        this.type = type;
        return this;
    }

    setAgeGroup(ageGroup: string): ToyBuilder {
        this.ageGroup = ageGroup;
        return this;
    }

    setBrand(brand: string): ToyBuilder {
        this.brand = brand;
        return this;
    }

    setMaterial(material: string): ToyBuilder {
        this.material = material;
        return this;
    }

    setBatteryRequired(batteryRequired: boolean): ToyBuilder {
        this.batteryRequired = batteryRequired;
        return this;
    }

    setEducational(educational: boolean): ToyBuilder {
        this.educational = educational;
        return this;
    }

    build(): Toy {
        const requiredProperties = [
            this.type,
            this.ageGroup,
            this.brand,
            this.material,
            this.batteryRequired,
            this.educational
        ];

        for (const property of requiredProperties) {
            if (!property) {
                logger.error("Missing required properties, could not build a toy");
                throw new Error("Missing required properties");
            }
        }

        return new Toy (
            this.type,
            this.ageGroup,
            this.brand,
            this.material,
            this.batteryRequired,
            this.educational
        );
    }
}