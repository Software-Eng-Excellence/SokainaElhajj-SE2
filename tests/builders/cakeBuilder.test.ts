import { CakeBuilder } from "../../src/model/builders/cake.builder";
import { Cake } from "../../src/model/Cake.model";
import logger from "../../src/util/logger";

jest.mock("../../src/util/logger", () => ({
  error: jest.fn(),
}));

describe("Cake Builder", () => {
    it("should build a cake when all inputs are set correctly", () => {
        const cake = new CakeBuilder()
        .setType("Fruit")
        .setFlavor("Vanilla")
        .setFilling("Jam")
        .setSize(15)
        .setLayers(3)
        .setFrostingType("Whipped Cream")
        .setFrostingFlavor("Chocolate")
        .setDecorationType("Fruit Slices")
        .setDecorationColor("Yellow")
        .setCustomMessage("Happy Birthday")
        .setShape("Circle")
        .setAllergies("None")
        .setSpecialIngredients("None")
        .setPackagingType("Standard Box")
        .build();

        expect(cake).toBeInstanceOf(Cake);
        expect(cake.getAllergies()).toBe("None");
        expect(cake.getShape()).toBe("Circle");
        expect(cake.getCustomMessage()).toBe("Happy Birthday");    
    });

    it("should throw an error if a required field is empty", () => {
        const cake = new CakeBuilder()
            .setFlavor("Oreo")
            .setPackagingType("Luxury Box")
            .setFilling("Gannache");

        expect(() => cake.build()).toThrow("Missing required properties");

        expect(logger.error).toHaveBeenCalledWith(
            "Missing required properties, could not build a cake"
        );
    });

    // for incorrect data types, we already handled this issue in the builder
})