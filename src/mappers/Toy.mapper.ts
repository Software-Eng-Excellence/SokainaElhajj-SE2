import { ToyBuilder } from "../model/builders/toy.builder";
import { Toy } from "../model/Toy.model";
import { IMapper } from "./IMapper";

export class ToyMapper implements IMapper<string[] | Record<string, any>, Toy> {
    map(data: string[] | Record<string, any>): Toy {
        const builder = ToyBuilder.newBuilder();

        if (Array.isArray(data)) {
            // CSV: validate types
            if (typeof data[1] !== 'string') throw new Error('Invalid type for Type');
            if (typeof data[2] !== 'string') throw new Error('Invalid type for AgeGroup');
            if (typeof data[3] !== 'string') throw new Error('Invalid type for Brand');
            if (typeof data[4] !== 'string') throw new Error('Invalid type for Material');
            if (typeof data[5] !== 'boolean') throw new Error('Invalid type for BatteryRequired');
            if (typeof data[6] !== 'boolean') throw new Error('Invalid type for Educational');

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
            if (typeof data["Type"] !== 'string') throw new Error('Invalid type for Type');
            if (typeof data["AgeGroup"] !== 'string') throw new Error('Invalid type for AgeGroup');
            if (typeof data["Brand"] !== 'string') throw new Error('Invalid type for Brand');
            if (typeof data["Material"] !== 'string') throw new Error('Invalid type for Material');
            if (typeof data["BatteryRequired"] !== 'boolean') throw new Error('Invalid type for BatteryRequired');
            if (typeof data["Educational"] !== 'boolean') throw new Error('Invalid type for Educational');

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
