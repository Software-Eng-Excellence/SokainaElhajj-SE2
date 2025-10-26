import { parseJSON } from '../src/parsers/jsonParser';
import fs from 'fs/promises';
import path from 'path';

describe('JSON Parser - Mocked Unit Tests', () => {

    beforeEach(() => {
        // Reset all mocks before each test to avoid interference
        jest.resetAllMocks();
    });

    // Normal JSON parsing
    it('should parse normal JSON data', async () => {
        const mockJSON = `[{"name":"Aya","age":18,"major":"engineering"},{"name":"Fatima","age":20,"major":"architecture"}]`;
        jest.spyOn(fs, 'readFile').mockResolvedValue(mockJSON);

        const result = await parseJSON('/normal.json');
        expect(result).toEqual([
            { name: 'Aya', age: 18, major: 'engineering' },
            { name: 'Fatima', age: 20, major: 'architecture' },
        ]);
    });

    // Objects with missing keys
    it('should handle objects with missing keys', async () => {
        const mockJSON = `[{"name":"Aya","age":18},{"name":"Fatima","major":"architecture"}]`;
        jest.spyOn(fs, 'readFile').mockResolvedValue(mockJSON);

        const result = await parseJSON('/missing.json');
        expect(result).toEqual([
            { name: 'Aya', age: 18 },
            { name: 'Fatima', major: 'architecture' },
        ]);
    });

    // Objects with extra keys
    it('should handle objects with extra keys', async () => {
        const mockJSON = `[{"name":"Aya","age":18,"major":"engineering","extra":"foo"},{"name":"Fatima","age":20,"major":"architecture","extra":"bar"}]`;
        jest.spyOn(fs, 'readFile').mockResolvedValue(mockJSON);

        const result = await parseJSON('/extra.json');
        expect(result).toEqual([
            { name: 'Aya', age: 18, major: 'engineering', extra: 'foo' },
            { name: 'Fatima', age: 20, major: 'architecture', extra: 'bar' },
        ]);
    });

    // Empty JSON file should return empty object
    it('should return empty object for empty JSON file', async () => {
        jest.spyOn(fs, 'readFile').mockResolvedValue('');
        const result = await parseJSON('/empty.json');
        expect(result).toEqual({});
    });

    // File not found should throw
    it('should reject when file is not found', async () => {
        jest.spyOn(fs, 'readFile').mockRejectedValue(
            Object.assign(new Error('File not found'), { code: 'ENOENT' })
        );
        await expect(parseJSON('/nonexistent.json')).rejects.toThrow('File not found');
    });

    // Strings containing quotes and commas
    it('should handle strings with quotes and commas', async () => {
        const mockJSON = `[{"name":"Aya, Jr.","major":"engineering, software"}]`;
        jest.spyOn(fs, 'readFile').mockResolvedValue(mockJSON);

        const result = await parseJSON('/quoted.json');
        expect(result).toEqual([{ name: 'Aya, Jr.', major: 'engineering, software' }]);
    });

    // Multiline strings
    it('should handle multiline strings', async () => {
        const mockJSON = `[{"comment":"Hello\\nWorld"}]`;
        jest.spyOn(fs, 'readFile').mockResolvedValue(mockJSON);

        const result = await parseJSON('/multiline.json');
        expect(result).toEqual([{ comment: 'Hello\nWorld' }]);
    });

    // Numeric, boolean, and null values
    it('should correctly parse numeric, boolean, and null values', async () => {
        const mockJSON = `[{"name":"Aya","age":18,"active":true,"comment":null}]`;
        jest.spyOn(fs, 'readFile').mockResolvedValue(mockJSON);

        const result = await parseJSON('/types.json');
        expect(result).toEqual([{ name: 'Aya', age: 18, active: true, comment: null }]);
    });

});

describe('JSON Parser - Real File Integration Test', () => {
    it('should parse actual JSON file from /src/data', async () => {
        // ⚠️ Do NOT mock fs.readFile here, use real file
        const filePath = path.resolve(__dirname, '../src/data/book-orders.json');

        const result = await parseJSON(filePath);

        // Basic sanity checks
        expect(result).toBeDefined();
        expect(typeof result).toBe('object');
        expect(Array.isArray(result)).toBe(true); // assuming the file is an array
        expect(result.length).toBeGreaterThan(0);
    });
});
