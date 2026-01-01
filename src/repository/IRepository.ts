/* eslint-disable @typescript-eslint/no-explicit-any */
export type id = string;

export interface ID {
    getId(): id;
}


export interface Initializable {
    /**
     * Initializes the creation of required tables and establishes a connection.
     * 
     * @throws InitializationException if initialization fails.
     * 
     * @returns A promise that resolves when the initialization is complete.
     */
    init(): Promise<void>;
}

export interface IRepository <T extends ID> {

    /**
     * Create a new item in the repository.
     * 
     * @parm item - The item to be created.
     * @returns A promise that resolves to the ID of the created item.
     * @throws {InvalidItemException} - Thrown when an invalid item is encountered.
     * @throws {DbException} - Thrown when an error occurs while interacting with the database.
     */
    create(item: T): Promise<id>;

    /**
     * Retrieve an item from the repository by its ID.
     * 
     * @param id - The ID of the item to be retrieved.
     * @returns A promise that resolves to be the item with the specified ID.
     * @throws {ItemNotFoundException} - Thrown when an item with the specified ID is not found.
     */
    get(id: id): Promise<T>;

    /**
     * Retrieve all items from the repository.
     *
     * @returns A promise that resolves to an array of all items in the repository.
     * @throws {DbException} - Thrown when an error occurs while interacting with the database.
     */
    getAll(): Promise<T[]>;

    
    /**
     * Update an existing item in the repository.
     *
     * @param item - The item with updated data.
     * @returns A promise that resolves when the update is complete.
     * @throws {ItemNotFoundException} - Thrown when the item to update does not exist.
     * @throws {InvalidItemException} - Thrown when the provided item is invalid.
     * @throws {DbException} - Thrown when an error occurs while interacting with the database.
     */
    update(item: T): Promise<void>;

    /**
     * Delete an item from the repository by its ID.
     *
     * @param id - The ID of the item to be deleted.
     * @returns A promise that resolves when the deletion is complete.
     * @throws {ItemNotFoundException} - Thrown when the item to delete does not exist.
     * @throws {DbException} - Thrown when an error occurs while interacting with the database.
     */
    delete(id: id): Promise<void>;
}

export interface InitializableRepository<T extends ID> extends IRepository<T>, Initializable {

}