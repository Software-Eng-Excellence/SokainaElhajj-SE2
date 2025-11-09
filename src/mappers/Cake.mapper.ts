import { CakeBuilder } from "../model/builders/cake.builder";
import { Cake } from "../model/Cake.model";
import { IMapper } from "./IMapper";

export class CakeMapper implements IMapper<string[] | Record<string, any>, Cake> {
    map(data: string[] | Record<string, any>): Cake {
        const builder = CakeBuilder.newBuilder();

        if (Array.isArray(data)) {
            // CSV: validate types
            if (typeof data[1] !== 'string') throw new Error('Invalid type for Type');
            if (typeof data[2] !== 'string') throw new Error('Invalid type for Flavor');
            if (typeof data[3] !== 'string') throw new Error('Invalid type for Filling');
            if (isNaN(parseInt(data[4]))) throw new Error('Invalid type for Size');
            if (isNaN(parseInt(data[5]))) throw new Error('Invalid type for Layers');
            if (typeof data[6] !== 'string') throw new Error('Invalid type for Frosting Type');
            if (typeof data[7] !== 'string') throw new Error('Invalid type for Frosting Flavor');
            if (typeof data[8] !== 'string') throw new Error('Invalid type for Decoration Type');
            if (typeof data[9] !== 'string') throw new Error('Invalid type for Decoration Color');
            if (typeof data[10] !== 'string') throw new Error('Invalid type for Custom Message');
            if (typeof data[11] !== 'string') throw new Error('Invalid type for Shape');
            if (typeof data[12] !== 'string') throw new Error('Invalid type for Allergies');
            if (typeof data[13] !== 'string') throw new Error('Invalid type for Special Ingredients');
            if (typeof data[14] !== 'string') throw new Error('Invalid type for Packaging Type');

            return builder
                .setType(data[1])
                .setFlavor(data[2])
                .setFilling(data[3])
                .setSize(parseInt(data[4]))
                .setLayers(parseInt(data[5]))
                .setFrostingType(data[6])
                .setFrostingFlavor(data[7])
                .setDecorationType(data[8])
                .setDecorationColor(data[9])
                .setCustomMessage(data[10])
                .setShape(data[11])
                .setAllergies(data[12])
                .setSpecialIngredients(data[13])
                .setPackagingType(data[14])
                .build();
        } else {
            // JSON or XML: validate types
            if (typeof data["Type"] !== 'string') throw new Error('Invalid type for Type');
            if (typeof data["Flavor"] !== 'string') throw new Error('Invalid type for Flavor');
            if (typeof data["Filling"] !== 'string') throw new Error('Invalid type for Filling');
            if (isNaN(parseInt(data["Size"]))) throw new Error('Invalid type for Size');
            if (isNaN(parseInt(data["Layers"]))) throw new Error('Invalid type for Layers');
            if (typeof data["Frosting Type"] !== 'string') throw new Error('Invalid type for Frosting Type');
            if (typeof data["Frosting Flavor"] !== 'string') throw new Error('Invalid type for Frosting Flavor');
            if (typeof data["Decoration Type"] !== 'string') throw new Error('Invalid type for Decoration Type');
            if (typeof data["Decoration Color"] !== 'string') throw new Error('Invalid type for Decoration Color');
            if (typeof data["Custom Message"] !== 'string') throw new Error('Invalid type for Custom Message');
            if (typeof data["Shape"] !== 'string') throw new Error('Invalid type for Shape');
            if (typeof data["Allergies"] !== 'string') throw new Error('Invalid type for Allergies');
            if (typeof data["Special Ingredients"] !== 'string') throw new Error('Invalid type for Special Ingredients');
            if (typeof data["Packaging Type"] !== 'string') throw new Error('Invalid type for Packaging Type');

            return builder
                .setType(data["Type"])
                .setFlavor(data["Flavor"])
                .setFilling(data["Filling"])
                .setSize(parseInt(data["Size"]))
                .setLayers(parseInt(data["Layers"]))
                .setFrostingType(data["Frosting Type"])
                .setFrostingFlavor(data["Frosting Flavor"])
                .setDecorationType(data["Decoration Type"])
                .setDecorationColor(data["Decoration Color"])
                .setCustomMessage(data["Custom Message"])
                .setShape(data["Shape"])
                .setAllergies(data["Allergies"])
                .setSpecialIngredients(data["Special Ingredients"])
                .setPackagingType(data["Packaging Type"])
                .build();
        }
    }
}
