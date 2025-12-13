import { BookBuilder, IdentifiableBookBuilder } from "../model/builders/book.builder";
import { Book, IdentifiableBook } from "../model/Book.model";
import { IMapper } from "./IMapper";

export class BookMapper implements IMapper<string[] | Record<string, any>, Book> {
    map(data: string[] | Record<string, any>): Book {
        const builder = BookBuilder.newBuilder();

        if (Array.isArray(data)) {
            // CSV: validate types 
            const csvChecks = ['bookTitle', 'author', 'genre', 'format', 'language', 'publisher', 'specialEdition', 'packaging'];
            for (let i = 0; i < csvChecks.length; i++){
                if (typeof data[i + 1] !== 'string'){
                    throw new Error(`Invalid type for ${csvChecks[i]}`);
                }
            }

            return builder
                .setTitle(data[1])
                .setAuthor(data[2])
                .setGenre(data[3])
                .setFormat(data[4])
                .setLanguage(data[5])
                .setPublisher(data[6])
                .setSpecialEdition(data[7])
                .setPackaging(data[8])
                .build();
        } else {
            // JSON or XML: validate types
            const jsonChecks = ['Book Title', 'Author', 'Genre', 'Format', 'Language', 'Publisher', 'Special Edition', 'Packaging'];
            for (const field of jsonChecks) {
                if (typeof data[field] !== 'string') {
                    throw new Error(`Invalid type for ${field}`);
                }
            }

            return builder
                .setTitle(data["Book Title"])
                .setAuthor(data["Author"])
                .setGenre(data["Genre"])
                .setFormat(data["Format"])
                .setLanguage(data["Language"])
                .setPublisher(data["Publisher"])
                .setSpecialEdition(data["Special Edition"])
                .setPackaging(data["Packaging"])
                .build();
        }
    }
    reverseMap(data: Book): string[] {
        return [
            data.getTitle(),
            data.getAuthor(),
            data.getGenre(),
            data.getFormat(),
            data.getLanguage(),
            data.getPublisher(),
            data.getSpecialEdition(),
            data.getPackaging()
        ];
    }
}

export interface DatabaseBook {
    id: string;
    title: string,
    author: string,
    genre: string,
    format: string,
    language: string,
    publisher: string,
    specialEdition: string,
    packaging: string
};

export class DatabaseBookMapper implements IMapper<DatabaseBook, IdentifiableBook> {
    map(data: DatabaseBook): IdentifiableBook {
        return IdentifiableBookBuilder.newBuilder()
            .setId(data.id)
            .setBook(BookBuilder.newBuilder()
                .setTitle(data.title)
                .setAuthor(data.author)
                .setGenre(data.genre)
                .setFormat(data.format)
                .setLanguage(data.language)
                .setPublisher(data.publisher)
                .setSpecialEdition(data.specialEdition)
                .setPackaging(data.packaging)
                .build())
            .build();
    }

    reverseMap(data: IdentifiableBook): DatabaseBook {
        return {
            id: data.getId(),
            title: data.getTitle(),
            author: data.getAuthor(),
            genre: data.getGenre(),
            format: data.getFormat(),
            language: data.getLanguage(),
            publisher: data.getPublisher(),
            specialEdition: data.getSpecialEdition(),
            packaging: data.getPackaging()
        };
    }
}

export class JsonRequestBookMapper implements IMapper<any, IdentifiableBook> {
    map(data: any): IdentifiableBook {
        const book = BookBuilder.newBuilder()
            .setTitle(data.title)
            .setAuthor(data.author)
            .setGenre(data.genre)
            .setFormat(data.format)
            .setLanguage(data.language)
            .setPublisher(data.publisher)
            .setSpecialEdition(data.specialEdition)
            .setPackaging(data.packaging)
            .build();
        return IdentifiableBookBuilder.newBuilder()
            .setBook(book)
            .setId(data.id)
            .build();
    }

    reverseMap(data: IdentifiableBook): any {
        return {
            id: data.getId(),
            title: data.getTitle(),
            author: data.getAuthor(),
            genre: data.getGenre(),
            format: data.getFormat(),
            language: data.getLanguage(),
            publisher: data.getPublisher(),
            specialEdition: data.getSpecialEdition(),
            packaging: data.getPackaging()
        };
    }
}
