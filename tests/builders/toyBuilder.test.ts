import { ToyBuilder } from "../../src/model/builders/toy.builder";
import { Toy } from "../../src/model/Toy.model";
import logger from "../../src/util/logger";

jest.mock("../../src/util/logger", () => ({
  error: jest.fn(),
}));

describe("Toy Builder", () => {
    it("should build a toy when all inputs are set correctly", () => {
        const toy = new ToyBuilder()
        .setType("Plush Toy")
        .setAgeGroup("13+")
        .setBrand("FunTime")
        .setMaterial("Fabric")
        .setBatterRequired(true)
        .setEducational(true)
        .build()
            
        expect(toy).toBeInstanceOf(Toy);
        expect(toy.getAgeGroup()).toBe("13+");
        expect(toy.getBatteryRequired()).toBe(true);
        expect(toy.getType()).toBe("Plush Toy");    
    });

    it("should throw an error if a required field is empty", () => {
        const toy = new ToyBuilder()
            .setAgeGroup("3+")
            .setBatterRequired(false)
           
        expect(() => toy.build()).toThrow("Missing required properties");
        
        expect(logger.error).toHaveBeenCalledWith(
            "Missing required properties, could not build a toy"
        );
    });

    // for incorrect data types, we already handled this issue in the builder
})