import logger from "./util/logger";
import { CakeBuilder, IdentifiableCakeBuilder } from "./model/builders/cake.builder";
import { IdentifiableOrderItemBuilder, OrderBuilder } from "./model/builders/order.builder";
import { BookBuilder, IdentifiableBookBuilder } from "./model/builders/book.builder";
import { ToyBuilder, IdentifiableToyBuilder } from "./model/builders/toy.builder";
import { DBMode, RepositoryFactory } from "./repository/Repository.factory";
import { ItemCategory } from "./model/IItem";

async function main() {
    // CAKE
    logger.info("========== TESTING CAKE ORDERS ==========");
    
    const cakeRepo = await RepositoryFactory.create(DBMode.POSTGRESQL, ItemCategory.CAKE);

    const cake = CakeBuilder.newBuilder()
        .setType("Birthday")
        .setFlavor("Chocolate")
        .setFilling("Vanilla")
        .setSize(8)
        .setLayers(3)
        .setFrostingType("Buttercream")
        .setFrostingFlavor("Chocolate")
        .setDecorationType("Sprinkles")
        .setDecorationColor("Red")
        .setCustomMessage("Happy Birthday!")
        .setShape("Round")
        .setAllergies("Nuts")
        .setSpecialIngredients("Dark Chocolate")
        .setPackagingType("Box")
        .build();

    const idCake = IdentifiableCakeBuilder.newBuilder()
        .setCake(cake)
        .setId(Math.random().toString(36).substring(2, 15))
        .build();

    const cakeOrder = OrderBuilder.newBuilder()
        .setPrice(100)
        .setItem(cake)
        .setQuantity(1)
        .setId(Math.random().toString(36).substring(2, 15))
        .build();

    const idCakeOrder = IdentifiableOrderItemBuilder.newBuilder()
        .setItem(idCake)
        .setOrder(cakeOrder)
        .build();

    await cakeRepo.create(idCakeOrder);
    await cakeRepo.update(idCakeOrder);

    const allCakeOrders = await cakeRepo.getAll();
    logger.info("Current Cake Orders: %o", allCakeOrders);


    // BOOK 
    logger.info("========== TESTING BOOK ORDERS ==========");
    const bookOrderRepo = await RepositoryFactory.create(DBMode.POSTGRESQL, ItemCategory.Book);

    const book = BookBuilder.newBuilder()
        .setTitle("Clean Code")
        .setAuthor("Robert Martin")
        .setGenre("Programming")
        .setFormat("Hardcover")
        .setLanguage("English")
        .setPublisher("Pearson")
        .setSpecialEdition("First Edition")
        .setPackaging("Box")
        .build();

    const idBook = IdentifiableBookBuilder.newBuilder()
        .setBook(book)
        .setId(Math.random().toString(36).substring(2, 15))
        .build();

    const bookOrder = OrderBuilder.newBuilder()
        .setPrice(50)
        .setItem(book)
        .setQuantity(2)
        .setId(Math.random().toString(36).substring(2, 15))
        .build();

    const idBookOrder = IdentifiableOrderItemBuilder.newBuilder()
        .setItem(idBook)
        .setOrder(bookOrder)
        .build();

    await bookOrderRepo.create(idBookOrder);
    await bookOrderRepo.update(idBookOrder);

    const allBookOrders = await bookOrderRepo.getAll();
    logger.info("Current Book Orders: %o", allBookOrders);


    // TOY
    logger.info("========== TESTING TOY ORDERS ==========");

    const toyOrderRepo = await RepositoryFactory.create(DBMode.POSTGRESQL, ItemCategory.Toy);

    const toy = ToyBuilder.newBuilder()
        .setType("Action Figure")
        .setAgeGroup("8-12")
        .setBrand("Hasbro")
        .setMaterial("Plastic")
        .setBatteryRequired(true)
        .setEducational(false)
        .build();

    const idToy = IdentifiableToyBuilder.newBuilder()
        .setToy(toy)
        .setId(Math.random().toString(36).substring(2, 15))
        .build();

    const toyOrder = OrderBuilder.newBuilder()
        .setPrice(30)
        .setItem(toy)
        .setQuantity(3)
        .setId(Math.random().toString(36).substring(2, 15))
        .build();

    const idToyOrder = IdentifiableOrderItemBuilder.newBuilder()
        .setItem(idToy)
        .setOrder(toyOrder)
        .build();

    await toyOrderRepo.create(idToyOrder);
    await toyOrderRepo.update(idToyOrder);

    const allToyOrders = await toyOrderRepo.getAll();
    logger.info("Current Toy Orders: %o", allToyOrders);


    // SUMMARY 
    logger.info("========== ALL TESTS COMPLETED ==========");
    logger.info("Cake Orders: %d", allCakeOrders.length);
    logger.info("Book Orders: %d", allBookOrders.length);
    logger.info("Toy Orders: %d", allToyOrders.length);
}

main();
