import { ToyMapper } from '../../src/mappers/Toy.mapper';
import { Toy } from '../../src/model/Toy.model';

describe('ToyMapper', () => {
    let mapper: ToyMapper;

    beforeEach(() => {
        mapper = new ToyMapper();
    });

    it('maps a CSV row to a Toy object', () => {
        const csvRow = [
            '1',           // id
            'Action Figure', // type
            '8-12',        // ageGroup
            'Hasbro',      // brand
            'Plastic',     // material
            'true',         // batteryRequired
            'true'         // educational
        ];

        const result: Toy = mapper.map(csvRow);

        expect(result.getType()).toBe('Action Figure');
        expect(result.getAgeGroup()).toBe('8-12');
        expect(result.getBrand()).toBe('Hasbro');
        expect(result.getMaterial()).toBe('Plastic');
        expect(result.getBatteryRequired()).toBe('true');
        expect(result.getEducational()).toBe('true');
    });

    it('maps a (JSON or XML) object to a Toy object', () => {
        const jsonInput = {
            'Type': 'Action Figure',
            'AgeGroup': '8-12',
            'Brand': 'Hasbro',
            'Material': 'Plastic',
            'BatteryRequired': 'true',
            'Educational': 'true'
        };

        const result: Toy = mapper.map(jsonInput);

        expect(result.getType()).toBe('Action Figure');
        expect(result.getAgeGroup()).toBe('8-12');
        expect(result.getBrand()).toBe('Hasbro');
        expect(result.getMaterial()).toBe('Plastic');
        expect(result.getBatteryRequired()).toBe('true');
        expect(result.getEducational()).toBe('true');
    });

    it('throws error if some fields are missing', () => {
        const jsonInput = {
            'Type': 'Action Figure',
            'AgeGroup': '8-12',
            'Brand': 'Hasbro'
            // missing other fields
        };

        expect(() => mapper.map(jsonInput)).toThrow();
    });

    it('throws error if some fields types are wrong', () => {
        const jsonInput = {
            'Type': 5,
            'AgeGroup': '8-12',
            'Brand': 'Hasbro',
            'Material': 'Plastic',
            'BatteryRequired': true,
            'Educational': true
        };

        expect(() => mapper.map(jsonInput)).toThrow();
    });

    it('throws error if input is empty', () => {
        expect(() => mapper.map({})).toThrow();
    });
});
