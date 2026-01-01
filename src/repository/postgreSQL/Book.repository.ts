import { IdentifiableBook } from "../../model/Book.model";
import { ItemCategory } from "../../model/IItem";
import { id, Initializable, IRepository } from "../IRepository";
import { DbException, InitializationException, ItemNotFoundException } from "../../util/exceptions/repositoryExceptions";
import logger from "../../util/logger";
import { PostgreSQLConnectionManager } from "./PostgreSQLConnectionManager";
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
    "specialEdition" TEXT NOT NULL,
    packaging TEXT NOT NULL
)`;

const INSERT_BOOK = `INSERT INTO ${tableName} (
    id, title, author, genre, format, language, publisher, "specialEdition", packaging
) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`;

const SELECT_BY_ID = `SELECT * FROM ${tableName} WHERE id = $1`;

const SELECT_ALL = `SELECT * FROM ${tableName}`;

const DELETE_ID = `DELETE FROM ${tableName} WHERE id = $1`;

const UPDATE_ID = `UPDATE ${tableName} SET
    title = $1,
    author = $2,
    genre = $3,
    format = $4,
    language = $5,
    publisher = $6,
    "specialEdition" = $7,
    packaging = $8
    WHERE id = $9`;


export class BookRepository implements IRepository<IdentifiableBook>, Initializable{
    async init(){
        try {
            const pool = PostgreSQLConnectionManager.getPool();
            await pool.query(CREATE_TABLE);
            logger.info("Book table initialized");
        } catch (error: unknown) {
            logger.error("Failed to initialize Book table", error as Error);
            throw new InitializationException("Failed to initialize Book table", error as Error);
        }
    }

    async create(item: IdentifiableBook): Promise<id> {
        return await PostgreSQLConnectionManager.runQuery(async (client) => {
            try {
                await client.query(INSERT_BOOK, [
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
        });
    }

    async get(id: id): Promise<IdentifiableBook> {
        return await PostgreSQLConnectionManager.runQuery(async (client) => {
            try {
                const result = await client.query(SELECT_BY_ID, [id]);

                if (result.rows.length === 0) {
                    throw new ItemNotFoundException("Book of id " + id + " not found");
                }
                
                return new DatabaseBookMapper().map(result.rows[0]);

            } catch (error: unknown) {
                if (error instanceof ItemNotFoundException) {
                    throw error;  
                }
                
                logger.error("Failed to get book", error as Error);
                throw new DbException("Failed to get book", error as Error);
            }
        });
    }

    async getAll(): Promise<IdentifiableBook[]> {
        return await PostgreSQLConnectionManager.runQuery(async (client) => {
            try {
                const result = await client.query(SELECT_ALL);
                const mapper = new DatabaseBookMapper();

                return result.rows.map((row) => mapper.map(row as DatabaseBook));
                
            } catch (error: unknown) {
                logger.error("Failed to get all books", error as Error);
                throw new DbException("Failed to get all books", error as Error);
            }
        });
    }

    async update(item: IdentifiableBook): Promise<void> {
        return await PostgreSQLConnectionManager.runQuery(async (client) => {
            try {
                const result = await client.query(UPDATE_ID, [
                    item.getTitle(),
                    item.getAuthor(),
                    item.getGenre(),
                    item.getFormat(),
                    item.getLanguage(),
                    item.getPublisher(),
                    item.getSpecialEdition(),
                    item.getPackaging(),
                    item.getId()
                ]);

                if (result.rowCount === 0) {
                    throw new ItemNotFoundException("Book of id " + item.getId() + " not found");
                }
                
                logger.info("Updated book Successfully");

            } catch (error: unknown) {
                if (error instanceof ItemNotFoundException) {
                    throw error;  
                }
                
                logger.error("Failed to update book", error as Error);
                throw new DbException("Failed to update book", error as Error);
            }
        });
    }

    async delete(id: id): Promise<void> {
        return await PostgreSQLConnectionManager.runQuery(async (client) => {
            try {
                const result = await client.query(DELETE_ID, [id]);

                if (result.rowCount === 0) {
                    throw new ItemNotFoundException("Book of id " + id + " not found");
                }

                logger.info("Deleted book with id %s", id);

            } catch (error: unknown) {
                if (error instanceof ItemNotFoundException) {
                    throw error;  
                }
                
                logger.error("Failed to delete book", error as Error);
                throw new DbException("Failed to delete book", error as Error);
            }
        });
    }
}