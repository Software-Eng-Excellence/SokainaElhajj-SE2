import { BookMapper } from '../../src/mappers/Book.mapper';
import { Book } from '../../src/model/Book.model';

describe('BookMapper', () => {
    let mapper: BookMapper;

    beforeEach(() => {
        mapper = new BookMapper();
    });

    it('maps a CSV row to a Book object', () => {
        const csvRow = [
        '1',                         // id
        'The Kite Runner',           // title
        'Khaled Hosseini',           // author
        'Drama',                     // genre
        'Paperback',                 // format
        'English',                   // language
        'Riverhead Books',           // publisher
        '10th edition',              // specialEdition
        'Box'                        // packaging
        ];

        const result: Book = mapper.map(csvRow);

        expect(result.getTitle()).toBe('The Kite Runner');
        expect(result.getAuthor()).toBe('Khaled Hosseini');
        expect(result.getGenre()).toBe('Drama');
        expect(result.getFormat()).toBe('Paperback');
        expect(result.getLanguage()).toBe('English');
        expect(result.getPublisher()).toBe('Riverhead Books');
        expect(result.getSpecialEdition()).toBe('10th edition');
        expect(result.getPackaging()).toBe('Box');
    });

  it('maps a (JSON or XML) object to a Book object', () => {
    const jsonInput = {
      'Book Title': 'The Kite Runner',
      'Author': 'Khaled Hosseini',
      'Genre': 'Drama',
      'Format': 'Paperback',
      'Language': 'English',
      'Publisher': 'Riverhead Books',
      'Special Edition': '10th edition',
      'Packaging': 'Box'
    };

    const result: Book = mapper.map(jsonInput);

    expect(result.getTitle()).toBe('The Kite Runner');
    expect(result.getAuthor()).toBe('Khaled Hosseini');
    expect(result.getGenre()).toBe('Drama');
    expect(result.getFormat()).toBe('Paperback');
    expect(result.getLanguage()).toBe('English');
    expect(result.getPublisher()).toBe('Riverhead Books');
    expect(result.getSpecialEdition()).toBe('10th edition');
    expect(result.getPackaging()).toBe('Box');
  });

   it('throws error if some fileds are missing', () => {
        const jsonInput = {
        'Book Title': 'The Kite Runner',
        'Author': 'Khaled Hosseini',
        'Language': 'English',
        'Special Edition': '10th edition',
        'Packaging': 'Box'
        };

        expect(() => mapper.map(jsonInput)).toThrow();
    });

    it('throws error if some fileds types are wrong', () => {
        const jsonInput = {
            'Book Title': 4,
            'Author': 'Khaled Hosseini',
            'Genre': 'Drama',
            'Format': 8,
            'Language': 'English',
            'Publisher': 'Riverhead Books',
            'Special Edition': 7,
            'Packaging': 'Box'
        };

        expect(() => mapper.map(jsonInput)).toThrow();
    });

    it('throws error if input is empty', () => {
        expect(() => mapper.map({})).toThrow();
    });

});
