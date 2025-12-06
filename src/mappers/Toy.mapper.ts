import { IdentifiableToyBuilder, ToyBuilder } from "../model/builders/toy.builder";
import { IdentifiableToy, Toy } from "../model/Toy.model";
import { IMapper } from "./IMapper";

export class ToyMapper implements IMapper<string[] | Record<string, any>, Toy> {
    map(data: string[] | Record<string, any>): Toy {
        const builder = ToyBuilder.newBuilder();

        if (Array.isArray(data)) {
            // CSV: validate types
            const checks = ['Type', 'AgeGroup', 'Brand', 'Material', 'BatteryRequired', 'Educational'];
            for (let i = 0; i < checks.length; i++) {
                if (typeof data[i + 1] !== 'string') {
                    throw new Error(`Invalid type for ${checks[i]}`);
                }
            }

            return builder
                .setType(data[1])
                .setAgeGroup(data[2])
                .setBrand(data[3])
                .setMaterial(data[4])
                .setBatteryRequired(data[5])
                .setEducational(data[6])
                .build();
        } else {
            // JSON or XML: validate only string fields
            const stringChecks = ['Type', 'AgeGroup', 'Brand', 'Material'];
            for (const field of stringChecks) {
                if (typeof data[field] !== 'string') {
                    throw new Error(`Invalid type for ${field}`);
                }
            }

            // In the else block (JSON/XML)
            const batteryRequired = typeof data["BatteryRequired"] === 'boolean' 
                ? data["BatteryRequired"] 
                : data["BatteryRequired"] === 'true' || data["BatteryRequired"] === 'Yes';

            const educational = typeof data["Educational"] === 'boolean'
                ? data["Educational"]
                : data["Educational"] === 'true' || data["Educational"] === 'Yes';

            return builder
                .setType(data["Type"])
                .setAgeGroup(data["AgeGroup"])
                .setBrand(data["Brand"])
                .setMaterial(data["Material"])
                .setBatteryRequired(batteryRequired)
                .setEducational(educational)
                .build();
        }
    }

    reverseMap(data: Toy): string[] {
        return [
            data.getType(),
            data.getAgeGroup(),
            data.getBrand(),
            data.getMaterial(),
            data.getBatteryRequired().toString(),
            data.getEducational().toString()
        ];
    }
}

export interface DatabaseToy {
    id: string;
    type: string;
    ageGroup: string;
    brand: string;
    material: string;
    batteryRequired: boolean;
    educational: boolean;
}

export class DatabaseToyMapper implements IMapper<DatabaseToy, IdentifiableToy>{
    map(data: DatabaseToy): IdentifiableToy {
        return IdentifiableToyBuilder.newBuilder()
            .setId(data.id)
            .setToy(ToyBuilder.newBuilder()
                .setType(data.type)
                .setAgeGroup(data.ageGroup)
                .setBrand(data.brand)
                .setMaterial(data.material)
                .setBatteryRequired(Boolean(data.batteryRequired))  // Works for postgre and sqlite
                .setEducational(Boolean(data.educational))         
                .build())
            .build();
    }

    reverseMap(data: IdentifiableToy): DatabaseToy {
        return {
            id: data.getId(),
            type: data.getType(),
            ageGroup: data.getAgeGroup(),
            brand: data.getBrand(),
            material: data.getMaterial(),
            batteryRequired: data.getBatteryRequired(),
            educational: data.getEducational()
        }
    }
}