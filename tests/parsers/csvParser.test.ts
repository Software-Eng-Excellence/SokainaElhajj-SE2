import { parseCSV } from "../../src/parsers/csvParser";
import fs from 'fs';
import { Readable } from 'stream';
import path from "path";

// Helper function to create a mock readable stream from a string
function createMockStream(text: string) {
    return Readable.from([text]);
}

describe("CSV Parser - Tests", () => {

    beforeEach(() => {
        // Restore all mocked functions before each test
        jest.restoreAllMocks();
    });

    // Normal CSV parsing
    it("should parse normal CSV data", async () => {
        const mockCSVData = `name,age,major
Aya,18,engineering
Fatima,20,architecture`;

        jest.spyOn(fs, 'createReadStream').mockReturnValue(createMockStream(mockCSVData) as any);

        const result = await parseCSV('/test.csv');

        expect(result).toEqual([
            ['name', 'age', 'major'],
            ['Aya', '18', 'engineering'],
            ['Fatima', '20', 'architecture']
        ]);
    });

    // Handling missing fields in rows
    it("should handle rows with missing fields", async () => {
        const mockCSVData = `name,age,major
Aya,,engineering
,20,`;

        jest.spyOn(fs, 'createReadStream').mockReturnValue(createMockStream(mockCSVData) as any);

        const result = await parseCSV('/test.csv');

        expect(result).toEqual([
            ['name', 'age', 'major'],
            ['Aya', '', 'engineering'],
            ['', '20', '']
        ]);
    });

    // Handling extra fields in rows
    it("should handle rows with extra fields", async () => {
        const mockCSVData = `name,age
Aya,18,engineering,extra
Fatima,20,architecture,extra`;

        jest.spyOn(fs, 'createReadStream').mockReturnValue(createMockStream(mockCSVData) as any);

        const result = await parseCSV('/test.csv');

        expect(result).toEqual([
            ['name', 'age'],
            ['Aya', '18', 'engineering', 'extra'],
            ['Fatima', '20', 'architecture', 'extra']
        ]);
    });

    // Empty CSV file
    it("should return empty array for empty CSV file", async () => {
        jest.spyOn(fs, 'createReadStream').mockReturnValue(createMockStream('') as any);

        const result = await parseCSV('/empty.csv');

        expect(result).toEqual([]);
    });

    // File not found
    it("should reject when file is not found", async () => {
        jest.spyOn(fs, 'createReadStream').mockImplementation(() => {
            throw Object.assign(new Error("File not found"), { code: 'ENOENT' });
        });

        await expect(parseCSV('/nonexistent.csv')).rejects.toThrow("File not found");
    });

    // Extra empty lines should be ignored
    it("should ignore extra empty lines", async () => {
        const mockCSVData = `name,age,major

Aya,18,engineering


Fatima,20,architecture

`;

        jest.spyOn(fs, 'createReadStream').mockReturnValue(createMockStream(mockCSVData) as any);

        const result = await parseCSV('/test.csv');

        expect(result).toEqual([
            ['name', 'age', 'major'],
            ['Aya', '18', 'engineering'],
            ['Fatima', '20', 'architecture']
        ]);
    });

    // Trim spaces around fields
    it("should trim spaces around fields", async () => {
        const mockCSVData = `name, age , major
Aya , 18 , engineering
 Fatima , 20 , architecture `;

        jest.spyOn(fs, 'createReadStream').mockReturnValue(createMockStream(mockCSVData) as any);

        const result = await parseCSV('/test.csv');

        expect(result).toEqual([
            ['name', 'age', 'major'],
            ['Aya', '18', 'engineering'],
            ['Fatima', '20', 'architecture']
        ]);
    });

    // Handle quoted fields containing commas
    it("should handle quoted fields with commas", async () => {
        const mockCSVData = `name,age,major
"Aya, Jr.",18,"engineering, software"`;

        jest.spyOn(fs, 'createReadStream').mockReturnValue(createMockStream(mockCSVData) as any);

        const result = await parseCSV('/test.csv');

        expect(result).toEqual([
            ['name', 'age', 'major'],
            ['Aya, Jr.', '18', 'engineering, software']
        ]);
    });

    // Handle escaped quotes inside fields
    it("should handle escaped quotes inside fields", async () => {
        const mockCSVData = `name,quote
Aya,"She said, ""Hello!"""`;

        jest.spyOn(fs, 'createReadStream').mockReturnValue(createMockStream(mockCSVData) as any);

        const result = await parseCSV('/test.csv');

        expect(result).toEqual([
            ['name', 'quote'],
            ['Aya', 'She said, "Hello!"']
        ]);
    });

    // Handle multiline quoted fields
    it("should handle multiline quoted fields", async () => {
        const mockCSVData = `name,comment
Aya,"Hello
World"`;

        jest.spyOn(fs, 'createReadStream').mockReturnValue(createMockStream(mockCSVData) as any);

        const result = await parseCSV('/test.csv');

        expect(result).toEqual([
            ['name', 'comment'],
            ['Aya', 'Hello\nWorld']
        ]);
    });

    // Preserve numeric and boolean-looking values as strings
    it("should preserve numeric and boolean-looking fields as strings", async () => {
        const mockCSVData = `name,age,active
Aya,18,true
Fatima,20,false`;

        jest.spyOn(fs, 'createReadStream').mockReturnValue(createMockStream(mockCSVData) as any);

        const result = await parseCSV('/test.csv');

        expect(result).toEqual([
            ['name', 'age', 'active'],
            ['Aya', '18', 'true'],
            ['Fatima', '20', 'false']
        ]);
    });

    // Integration test with a real CSV file
    describe('CSV Parser - Real File', () => {
        it('should parse actual CSV file', async () => {
            const filePath = path.resolve(__dirname, '../../src/data/cake-orders.csv'); // absolute path to test data
            const rows = await parseCSV(filePath);
            expect(rows.length).toBeGreaterThan(0); // basic check that file is not empty
        });
    });
});
