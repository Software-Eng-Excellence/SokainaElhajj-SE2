/* eslint-disable @typescript-eslint/no-explicit-any */
import { CakeBuilder, IdentifiableCakeBuilder } from "../model/builders/cake.builder";
import { Cake, IdentifiableCake } from "../model/Cake.model";
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

    reverseMap(data: Cake): string[] {
       return [
            data.getType(),
            data.getFlavor(),
            data.getFilling(),
            data.getSize().toString(),
            data.getLayers().toString(),
            data.getFrostingType(),
            data.getFrostingFlavor(),
            data.getDecorationType(),
            data.getDecorationColor(),
            data.getCustomMessage(),
            data.getShape(),
            data.getAllergies(),
            data.getSpecialIngredients(),
            data.getPackagingType()
       ] 
    }
}

// Both Databases return the same shape
export interface DatabaseCake {
    id: string;
    type: string;
    flavor: string;
    filling: string;
    size: number;
    layers: number;
    frostingType: string;     
    frostingFlavor: string;
    decorationType: string;
    decorationColor: string;
    customMessage: string;
    shape: string;
    allergies: string;
    specialIngredients: string;
    packagingType: string;
}

export class DatabaseCakeMapper implements IMapper<DatabaseCake, IdentifiableCake> {
    
    map(data: DatabaseCake): IdentifiableCake {
        return IdentifiableCakeBuilder.newBuilder()
            .setId(data.id)
            .setCake(CakeBuilder.newBuilder()
                .setType(data.type)
                .setFlavor(data.flavor)
                .setFilling(data.filling)
                .setSize(data.size)
                .setLayers(data.layers)
                .setFrostingType(data.frostingType)
                .setFrostingFlavor(data.frostingFlavor)
                .setDecorationType(data.decorationType)
                .setDecorationColor(data.decorationColor)
                .setCustomMessage(data.customMessage)
                .setShape(data.shape)
                .setAllergies(data.allergies)
                .setSpecialIngredients(data.specialIngredients)
                .setPackagingType(data.packagingType)
                .build())
            .build();
    }

    reverseMap(data: IdentifiableCake): DatabaseCake {
        return {
            id: data.getId(),
            type: data.getType(),
            flavor: data.getFlavor(),
            filling: data.getFilling(),
            size: data.getSize(),
            layers: data.getLayers(),
            frostingType: data.getFrostingType(),
            frostingFlavor: data.getFrostingFlavor(),
            decorationType: data.getDecorationType(),
            decorationColor: data.getDecorationColor(),
            customMessage: data.getCustomMessage(),
            shape: data.getShape(),
            allergies: data.getAllergies(),
            specialIngredients: data.getSpecialIngredients(),
            packagingType: data.getPackagingType()
        };
    }
}

export class JsonCakeRequestMapper implements IMapper<any, Cake> {
    map(data: any): IdentifiableCake {
        const cake = CakeBuilder.newBuilder()
            .setType(data.type)
            .setFlavor(data.flavor)
            .setFilling(data.filling)
            .setSize(data.size)
            .setLayers(data.layers)
            .setFrostingType(data.frostingType)
            .setFrostingFlavor(data.frostingFlavor)
            .setDecorationType(data.decorationType)
            .setDecorationColor(data.decorationColor)
            .setCustomMessage(data.customMessage)
            .setShape(data.shape)
            .setAllergies(data.allergies)
            .setSpecialIngredients(data.specialIngredients)
            .setPackagingType(data.packagingType)
            .build();
        return IdentifiableCakeBuilder.newBuilder()
            .setCake(cake)
            .setId(data.id)
            .build();
    }

    reverseMap(data: IdentifiableCake): any {
        return {
            id: data.getId(),
            type: data.getType(),
            flavor: data.getFlavor(),
            filling: data.getFilling(),
            size: data.getSize(),
            layers: data.getLayers(),
            froastingType: data.getFrostingType(),
            frostingFlavor: data.getFrostingFlavor(),
            decorationType: data.getDecorationType(),
            decorationColor: data.getDecorationColor(),
            customMessage: data.getCustomMessage(),
            shape: data.getShape(),
            allergies: data.getAllergies(),
            specialIngredients: data.getSpecialIngredients(),
            packagingType: data.getPackagingType()
        };
    }
}
