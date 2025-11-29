import { CakeBuilder } from "../model/builders/cake.builder";
import { Cake } from "../model/Cake.model";
import { IMapper } from "./IMapper";

export class CakeMapper implements IMapper<string[] | Record<string, any>, Cake> {
    map(data: string[] | Record<string, any>): Cake {
        const builder = CakeBuilder.newBuilder();

        if (Array.isArray(data)) {
            // CSV: validate types
            const checks = ['Type', 'Flavor', 'Filling', 'Size', 'Layers', 'Frosting Type', 'Frosting Flavor', 'Decoration Type', 'Decoration Color', 'Custom Message', 'Shape', 'Allergies', 'Special Ingredients', 'Packaging Type'];
            const indices = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14];
            const types = ['string', 'string', 'string', 'number', 'number', 'string', 'string', 'string', 'string', 'string', 'string', 'string', 'string', 'string'];
            
            for (let i = 0; i < checks.length; i++) {
                if (types[i] === 'string') {
                    if (typeof data[indices[i]] !== 'string') {
                        throw new Error(`Invalid type for ${checks[i]}`);
                    }
                } else if (types[i] === 'number') {
                    if (isNaN(parseInt(data[indices[i]]))) {
                        throw new Error(`Invalid type for ${checks[i]}`);
                    }
                }
            }

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
            const checks = ['Type', 'Flavor', 'Filling', 'Size', 'Layers', 'Frosting Type', 'Frosting Flavor', 'Decoration Type', 'Decoration Color', 'Custom Message', 'Shape', 'Allergies', 'Special Ingredients', 'Packaging Type'];
            const types = ['string', 'string', 'string', 'number', 'number', 'string', 'string', 'string', 'string', 'string', 'string', 'string', 'string', 'string'];
            
            for (let i = 0; i < checks.length; i++) {
                if (types[i] === 'string') {
                    if (typeof data[checks[i]] !== 'string') {
                        throw new Error(`Invalid type for ${checks[i]}`);
                    }
                } else if (types[i] === 'number') {
                    if (isNaN(parseInt(data[checks[i]]))) {
                        throw new Error(`Invalid type for ${checks[i]}`);
                    }
                }
            }

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
