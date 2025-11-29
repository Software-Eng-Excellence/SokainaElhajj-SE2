import { BookBuilder } from "../model/builders/book.builder";
import { Book } from "../model/Book.model";
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
