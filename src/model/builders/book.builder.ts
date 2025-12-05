import logger from "../../util/logger";
import { Book, IdentifiableBook } from "../Book.model";

export class BookBuilder{

    private title!: string;
    private author!: string;
    private genre!: string;
    private format!: string;
    private language!: string;
    private publisher!: string;
    private specialEdition!: string;
    private packaging!: string;
    // added function
    public static newBuilder(): BookBuilder {
        return new BookBuilder();
    }

    setTitle(title: string): BookBuilder {
        this.title = title;
        return this;
    }

    setAuthor(author: string):BookBuilder {
        this.author = author;
        return this;
    }

    setGenre(genre: string): BookBuilder {
        this.genre = genre;
        return this;
    }

    setFormat(format: string): BookBuilder {
        this.format = format;
        return this;
    }

    setLanguage(language: string): BookBuilder {
        this.language = language;
        return this;
    }

    setPublisher(publisher: string): BookBuilder {
        this.publisher = publisher;
        return this;
    }

    setSpecialEdition(specialEdition: string): BookBuilder {
        this.specialEdition = specialEdition;
        return this;
    }

    setPackaging(packaging: string): BookBuilder {
        this.packaging = packaging;
        return this;
    }

    build(): Book {
        const requiredProperties = [
            this.title,
            this.author,
            this.genre,
            this.format,
            this.language,
            this.publisher,
            this.specialEdition,
            this.packaging
        ];

        for (const property of requiredProperties) {
            if (!property) {
                logger.error("Missing required properties, could not build a book");
                throw new Error("Missing required properties");
            }
        }

        return new Book(
            this.title,
            this.author,
            this.genre,
            this.format,
            this.language,
            this.publisher,
            this.specialEdition,
            this.packaging
        )
    } 
}

export class IdentifiableBookBuilder {
    private id!: string;
    private book!: Book;

    static newBuilder(): IdentifiableBookBuilder {
        return new IdentifiableBookBuilder();
    }

    setId(id: string): IdentifiableBookBuilder {
        this.id = id;
        return this;
    }

    setBook(book: Book): IdentifiableBookBuilder {
        this.book = book;
        return this;
    }

    build(): IdentifiableBook {
        if (!this.id || !this.book){
            logger.error("Missing required properties, could not build an identifiable book");
            throw new Error("Missing required properties");
        }
        return new IdentifiableBook(
            this.id,
            this.book.getTitle(),
            this.book.getAuthor(),
            this.book.getGenre(),
            this.book.getFormat(),
            this.book.getLanguage(),
            this.book.getPublisher(),
            this.book.getSpecialEdition(),
            this.book.getPackaging()
        );
    }
}