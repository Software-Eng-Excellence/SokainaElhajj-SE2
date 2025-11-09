import { BookBuilder } from "../model/builders/book.builder";
import { Book } from "../model/Book.model";
import { IMapper } from "./IMapper";

export class BookMapper implements IMapper<string[] | Record<string, any>, Book> {
    map(data: string[] | Record<string, any>): Book {
        const builder = BookBuilder.newBuilder();

        if (Array.isArray(data)) {
            // CSV: validate types 
            if (typeof data[1] !== 'string') throw new Error('Invalid type for title');
            if (typeof data[2] !== 'string') throw new Error('Invalid type for author');
            if (typeof data[3] !== 'string') throw new Error('Invalid type for genre');
            if (typeof data[4] !== 'string') throw new Error('Invalid type for format');
            if (typeof data[5] !== 'string') throw new Error('Invalid type for language');
            if (typeof data[6] !== 'string') throw new Error('Invalid type for publisher');
            if (typeof data[7] !== 'string') throw new Error('Invalid type for specialEdition');
            if (typeof data[8] !== 'string') throw new Error('Invalid type for packaging');

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
            if (typeof data["Book Title"] !== 'string') throw new Error('Invalid type for Book Title');
            if (typeof data["Author"] !== 'string') throw new Error('Invalid type for Author');
            if (typeof data["Genre"] !== 'string') throw new Error('Invalid type for Genre');
            if (typeof data["Format"] !== 'string') throw new Error('Invalid type for Format');
            if (typeof data["Language"] !== 'string') throw new Error('Invalid type for Language');
            if (typeof data["Publisher"] !== 'string') throw new Error('Invalid type for Publisher');
            if (typeof data["Special Edition"] !== 'string') throw new Error('Invalid type for Special Edition');
            if (typeof data["Packaging"] !== 'string') throw new Error('Invalid type for Packaging');

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
}
