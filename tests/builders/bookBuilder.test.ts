import { BookBuilder } from "../../src/model/builders/book.builder";
import { Book } from "../../src/model/Book.model";
import logger from "../../src/util/logger";

jest.mock("../../src/util/logger", () => ({
  error: jest.fn(),
}));

describe("Book Builder", () => {
    it("Should build a book when all inputs are set correctly", () => {
        const book = new BookBuilder()
            .setTitle("The Kite Runner")
            .setAuthor("Khaled Hosseini")
            .setGenre("Drama")
            .setFormat("Paperback")
            .setLanguage("English")
            .setPublisher("Riverhead Books")
            .setSpecialEdition("10th edition")
            .setPackaging("Box")
            .build();

        expect(book).toBeInstanceOf(Book);
        expect(book.getTitle()).toBe("The Kite Runner");
        expect(book.getGenre()).toBe("Drama");
        expect(book.getPackaging()).toBe("Box");    
    });

    it("should throw an error if a required field is empty", () => {
        const book = new BookBuilder()
            .setTitle("The Kite Runner")
            .setAuthor("Khaled Hosseini")
            .setGenre("Drama");

        expect(() => book.build()).toThrow("Missing required properties");

        expect(logger.error).toHaveBeenCalledWith(
            "Missing required properties, could not build a book"
        );
    });

    // for incorrect data types, we already handled this issue in the builder
})