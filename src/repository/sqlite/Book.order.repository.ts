import { IdentifiableBook } from "../../model/Book.model";
import { id, Initializable, IRepository } from "../IRepository";
import { DbException, InitializationException, ItemNotFoundException } from "../../util/exceptions/repositoryExceptions";
import logger from "../../util/logger";
import { ConnectionManager } from "./ConnectionManager";
import { ItemCategory } from "../../model/IItem";
import { DatabaseBook, DatabaseBookMapper } from "../../mappers/Book.mapper";


const tableName = ItemCategory.Book;


const CREATE_TABLE = `CREATE TABLE IF NOT EXISTS ${tableName} (
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    author TEXT NOT NULL,
    genre TEXT NOT NULL,
    format TEXT NOT NULL,
    language TEXT NOT NULL,
    publisher TEXT NOT NULL,
    specialEdition TEXT NOT NULL,
    packaging TEXT NOT NULL
)`;

const INSERT_BOOK = `INSERT INTO ${tableName} (
    id, title, author, genre, format, language, publisher, specialEdition, packaging
) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`;

const SELECT_BY_ID = `SELECT * FROM ${tableName} WHERE id = ?`;

const SELECT_ALL = `SELECT * FROM ${tableName}`;

const DELETE_ID = `DELETE FROM ${tableName} WHERE id = ?`;

const UPDATE_ID = `UPDATE ${tableName} SET
    title = ?,
    author = ?,
    genre = ?,
    format = ?,
    language = ?,
    publisher = ?,
    specialEdition = ?,
    packaging = ?
    WHERE id = ?;`



export class BookRepository implements IRepository<IdentifiableBook>, Initializable{
    
    async init(): Promise<void> {
        try {
            const conn = await ConnectionManager.getConnection();

            await conn.exec(CREATE_TABLE);
            logger.info("Book table initialized");
        } catch (error: unknown) {
            logger.error("Failed to initialize Book table", error as Error);
            throw new InitializationException("Failed to initialize Book table", error as Error);
        }    
    }
    
    async create(item: IdentifiableBook): Promise<id> {
        // it is expected that a transaction has been initiated before this method is called
        try {
            const conn = await ConnectionManager.getConnection();
            await conn.run(INSERT_BOOK, [
                item.getId(),
                item.getTitle(),
                item.getAuthor(),
                item.getGenre(),
                item.getFormat(),
                item.getLanguage(),
                item.getPublisher(),
                item.getSpecialEdition(),
                item.getPackaging()
            ]);
            logger.info("Created book with id %s", item.getId());
            return item.getId();
        } catch (error: unknown) {
            logger.error("Failed to create book", error as Error);
           throw new DbException("Failed to create book", error as Error); 
        } 
    }

    async get(id: id): Promise<IdentifiableBook> {
        try {
            const conn = await ConnectionManager.getConnection();
            const result = await conn.get<DatabaseBook>(SELECT_BY_ID, id);
            if (!result){
                throw new ItemNotFoundException("Book of id " + id + " not found");
            }
            return new DatabaseBookMapper().map(result); // TODO must remove and map
        } catch (error: unknown) {
            if (error instanceof ItemNotFoundException) {
                throw error;  
            }

            logger.error("Failed to get book of id %s %o", id, error as Error);
            throw new DbException("Failed to get book of id" + id, error as Error);
        }
    }    

    async getAll(): Promise<IdentifiableBook[]> {
        try {
            const conn = await ConnectionManager.getConnection();
            const result = await conn.all<DatabaseBook[]>(SELECT_ALL);
            const mapper = new DatabaseBookMapper();
            return result.map((book) => mapper.map(book));
        } catch (error: unknown) {
            logger.error("Failed to get all books", error as Error); 
            throw new DbException("Failed to get all books", error as Error);
        }
    }

    async update(item: IdentifiableBook): Promise<void> {
        try {
            const conn = await ConnectionManager.getConnection();
            await conn.run(UPDATE_ID, [
                item.getTitle(),
                item.getAuthor(),
                item.getGenre(),
                item.getFormat(),
                item.getLanguage(),
                item.getPublisher(),
                item.getSpecialEdition(),
                item.getPackaging(),
                item.getId(), // WHERE id = ?
            ]);
            logger.info("Updated book with id %s", item.getId());
        } catch (error: unknown) {
            logger.error("Failed to update book of id %s %o", item.getId(), error as Error);
            throw new DbException("Failed to update book of id " + item.getId(), error as Error);
        }
    }

    async delete(id: id): Promise<void> {
        try {
            const conn = await ConnectionManager.getConnection();
            await conn.run(DELETE_ID, id);
            logger.info("Deleted book with id %s", id);
        } catch (error: unknown) {
            logger.error("Failed to delete book of id %s", id, error as Error);
            throw new DbException("Failed to delete book of id " + id, error as Error);
        }
    }
}