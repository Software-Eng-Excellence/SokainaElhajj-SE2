import { ToyBuilder } from "../model/builders/toy.builder";
import { Toy } from "../model/Toy.model";
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
            // JSON or XML: validate types
            const checks = ['Type', 'AgeGroup', 'Brand', 'Material', 'BatteryRequired', 'Educational'];
            for (let i = 0; i < checks.length; i++) {
                if (typeof data[checks[i]] !== 'string') {
                    throw new Error(`Invalid type for ${checks[i]}`);
                }
            }

            return builder
                .setType(data["Type"])
                .setAgeGroup(data["AgeGroup"])
                .setBrand(data["Brand"])
                .setMaterial(data["Material"])
                .setBatteryRequired(data["BatteryRequired"])
                .setEducational(data["Educational"])
                .build();
        }
    }
}
