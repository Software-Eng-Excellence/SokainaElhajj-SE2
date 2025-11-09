import { CakeMapper } from '../../src/mappers/Cake.mapper';
import { Cake } from '../../src/model/Cake.model';

describe('CakeMapper', () => {
    let mapper: CakeMapper;

    beforeEach(() => {
        mapper = new CakeMapper();
    });

    it('maps a CSV row to a Cake object', () => {
        const csvRow = [
            '1',              // id
            'Sponge',         // type
            'Vanilla',        // flavor
            'Cream',          // filling
            '20',             // size
            '2',              // layers
            'Buttercream',    // frostingType
            'Vanilla',        // frostingFlavor
            'Sprinkles',      // decorationType
            'Multi-color',    // decorationColor
            'Happy Birthday', // customMessage
            'Round',          // shape
            'Nut-Free',       // allergies
            'Organic Ingredients', // specialIngredients
            'Standard Box'    // packagingType
        ];

        const result: Cake = mapper.map(csvRow);

        expect(result.getType()).toBe('Sponge');
        expect(result.getFlavor()).toBe('Vanilla');
        expect(result.getFilling()).toBe('Cream');
        expect(result.getSize()).toBe(20);
        expect(result.getLayers()).toBe(2);
        expect(result.getFrostingType()).toBe('Buttercream');
        expect(result.getFrostingFlavor()).toBe('Vanilla');
        expect(result.getDecorationType()).toBe('Sprinkles');
        expect(result.getDecorationColor()).toBe('Multi-color');
        expect(result.getCustomMessage()).toBe('Happy Birthday');
        expect(result.getShape()).toBe('Round');
        expect(result.getAllergies()).toBe('Nut-Free');
        expect(result.getSpecialIngredients()).toBe('Organic Ingredients');
        expect(result.getPackagingType()).toBe('Standard Box');
    });

    it('maps a (JSON or XML) object to a Cake object', () => {
        const jsonInput = {
            'Type': 'Sponge',
            'Flavor': 'Vanilla',
            'Filling': 'Cream',
            'Size': '20',
            'Layers': '2',
            'Frosting Type': 'Buttercream',
            'Frosting Flavor': 'Vanilla',
            'Decoration Type': 'Sprinkles',
            'Decoration Color': 'Multi-color',
            'Custom Message': 'Happy Birthday',
            'Shape': 'Round',
            'Allergies': 'Nut-Free',
            'Special Ingredients': 'Organic Ingredients',
            'Packaging Type': 'Standard Box'
        };

        const result: Cake = mapper.map(jsonInput);

        expect(result.getType()).toBe('Sponge');
        expect(result.getFlavor()).toBe('Vanilla');
        expect(result.getFilling()).toBe('Cream');
        expect(result.getSize()).toBe(20);
        expect(result.getLayers()).toBe(2);
        expect(result.getFrostingType()).toBe('Buttercream');
        expect(result.getFrostingFlavor()).toBe('Vanilla');
        expect(result.getDecorationType()).toBe('Sprinkles');
        expect(result.getDecorationColor()).toBe('Multi-color');
        expect(result.getCustomMessage()).toBe('Happy Birthday');
        expect(result.getShape()).toBe('Round');
        expect(result.getAllergies()).toBe('Nut-Free');
        expect(result.getSpecialIngredients()).toBe('Organic Ingredients');
        expect(result.getPackagingType()).toBe('Standard Box');
    });

    it('throws error if some fields are missing', () => {
        const jsonInput = {
            'Type': 'Sponge',
            'Flavor': 'Vanilla',
            'Filling': 'Cream'
            // missing other fields
        };

        expect(() => mapper.map(jsonInput)).toThrow();
    });

    it('throws error if some fields types are wrong', () => {
        const jsonInput = {
            'Type': 5,
            'Flavor': 'Vanilla',
            'Filling': 'Cream',
            'Size': 'twenty',
            'Layers': 'two',
            'Frosting Type': 'Buttercream',
            'Frosting Flavor': 'Vanilla',
            'Decoration Type': 'Sprinkles',
            'Decoration Color': 'Multi-color',
            'Custom Message': 'Happy Birthday',
            'Shape': 'Round',
            'Allergies': 'Nut-Free',
            'Special Ingredients': 'Organic Ingredients',
            'Packaging Type': 'Standard Box'
        };

        expect(() => mapper.map(jsonInput)).toThrow();
    });

    it('throws error if input is empty', () => {
        expect(() => mapper.map({})).toThrow();
    });
});
