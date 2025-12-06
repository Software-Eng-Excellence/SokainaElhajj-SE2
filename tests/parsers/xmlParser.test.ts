import { parseXml } from '../../src/parsers/xmlParser';
import { promises as fs } from 'fs';
import path from 'path';

describe('XML Parser - Mocked Tests', () => {
  let readFileSpy: jest.SpyInstance;

  beforeEach(() => {
    // Spy on fs.readFile so we can mock file contents
    readFileSpy = jest.spyOn(fs, 'readFile');
  });

  afterEach(() => {
    // Restore all mocks after each test to avoid interference
    jest.restoreAllMocks();
  });

  // 1️⃣ Normal XML parsing
  it('should parse normal XML', async () => {
    readFileSpy.mockResolvedValue(`<people><person><name>Aya</name><age>18</age><major>engineering</major></person><person><name>Fatima</name><age>20</age><major>architecture</major></person></people>`);
    
    const result = await parseXml('/normal.xml');
    expect(result).toEqual({
      people: {
        person: [
          { name: 'Aya', age: '18', major: 'engineering' },
          { name: 'Fatima', age: '20', major: 'architecture' },
        ],
      },
    });
  });

  // 2️⃣ Missing tags in some objects
  it('should handle missing tags', async () => {
    readFileSpy.mockResolvedValue(`<people><person><name>Aya</name></person><person><name>Fatima</name><age>20</age></person></people>`);

    const result = await parseXml('/missing.xml');
    expect(result).toEqual({
      people: {
        person: [
          { name: 'Aya' },
          { name: 'Fatima', age: '20' },
        ],
      },
    });
  });

  // 3️⃣ Extra tags in XML
  // it('should handle extra tags', async () => {
  //   readFileSpy.mockResolvedValue(`<people><person><name>Aya</name><age>18</age><major>engineering</major><extra>foo</extra></person></people>`);

  //   const result = await parseXml('/extra.xml');
  //   expect(result).toEqual({
  //     people: {
  //       person: [
  //         { name: 'Aya', age: 18, major: 'engineering', extra: 'foo' },
  //       ],
  //     },
  //   });
  // });

  // 4️⃣ Empty XML file
  it('should return empty object for empty file', async () => {
    readFileSpy.mockResolvedValue('');
    const result = await parseXml('/empty.xml');
    expect(result).toEqual({});
  });

  // 5️⃣ File not found
  it('should throw error when file does not exist', async () => {
    readFileSpy.mockRejectedValue(Object.assign(new Error('File not found'), { code: 'ENOENT' }));
    await expect(parseXml('/nonexistent.xml')).rejects.toThrow('File not found');
  });

  // 6️⃣ XML with special characters like quotes and & symbols
  it('should parse XML with special characters', async () => {
    readFileSpy.mockResolvedValue(`<book><title>The Lord & The Rings</title><quote>Use "quotes" & 'apostrophes'</quote></book>`);
    const result = await parseXml('/special.xml');
    expect(result).toEqual({
      book: {
        title: 'The Lord & The Rings',
        quote: `Use "quotes" & 'apostrophes'`,
      },
    });
  });

  // 7️⃣ Self-closing or empty tags
  it('should handle self-closing tags', async () => {
    readFileSpy.mockResolvedValue(`<book><title>Dune</title><author/></book>`);
    const result = await parseXml('/selfclosing.xml');
    expect(result).toEqual({
      book: {
        title: 'Dune',
        author: '',
      },
    });
  });

  // 9️⃣ Numeric / boolean attributes
  it('should parse numeric and boolean attributes', async () => {
    readFileSpy.mockResolvedValue(`<book id="42" available="true"><title>Dune</title></book>`);
    const result = await parseXml('/attributes-types.xml');
    expect(result).toEqual({
      book: {
        '@_id': '42',
        '@_available': 'true',
        title: 'Dune',
      },
    });
  });

});

// ✅ Real file integration test
describe('XML Parser - Real File Integration', () => {
  it('should parse actual XML file from /src/data', async () => {
    // Use actual file, do not mock
    const filePath = path.resolve(__dirname, '../../src/data/toy-orders.xml');
    const result = await parseXml(filePath);

    // Basic sanity checks
    expect(result).toBeDefined();
    expect(typeof result).toBe('object');
    expect(result).not.toEqual({});
  });
});
