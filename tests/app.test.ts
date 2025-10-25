import {FinanceCalculator, OrderManagement, Validator} from "../src/app";

describe("OrderManagement Class", () => {
    // before all, new validator, new calculator
    // before each, new order management
    // after each, reset order management
    // after all, reset validator, reset calculator

    interface Order { id: number; item: string; price: number; }

    let validator: Validator;
    let calculator: FinanceCalculator;
    let orderManager: OrderManagement;
    let baseValidator: (order: Order) => void;

    beforeAll(() => {
        validator = new Validator([]);
        calculator = new FinanceCalculator();
    });

    beforeEach(() => {
        baseValidator = validator.validate; // Save the original validate method
        validator.validate = jest.fn(); // Mock the validate method
        orderManager = new OrderManagement(validator, calculator);
    });

    afterEach(() => {
        validator.validate = baseValidator; // Restore the original validate method
    });

    it("should add an order", () => {
        // Arrange
        const item = "Sponge";
        const price = 15;

        // Act
        orderManager.addOrder(item, price);

        // Assert
        expect(orderManager.getOrders()).toEqual([{ id: 1, item, price }]);
    });

    it("should get an order by ID", () => {
        // Arrange
        const item = "Sponge";
        const price = 15;
        orderManager.addOrder(item, price); // Add an order to retrieve later

        // Act
        const order = orderManager.getOrder(1); 
        
        // Assert
        expect(order).toEqual({ id: 1, item, price });
    });

    it("should make sure finance calculator is called when getting total revenue", () => {
        // Arrange
        const item = "Chocolate";
        const price = 20;
        orderManager.addOrder(item, price);
        const spy = jest.spyOn(calculator, 'getRevenue');

        // Act
        orderManager.getTotalRevenue();

        // Assert
        expect(spy).toHaveBeenCalled(); // Checks that the method calculator.getRevenue() was called at least once.
        expect(spy).toHaveBeenCalledWith([{ id: 1, item, price }]); // Checks what arguments the method was called with.
        expect(spy).toHaveReturnedWith(20); // Checks what the method returned.
    });

    it ("should throw addition exception if validator does not pass", () => {
        // Arrange
        const item = "Sponge";
        const price = 10;
        (validator.validate as jest.Mock).mockImplementation(() => {
            throw new Error("Validation failed");
        });
        
        // Act & Assert
        expect(() => orderManager.addOrder(item, price)).toThrow("[OrderManagement] Error adding orderValidation failed");  

    });

});

describe("FinanceCalculator Class", () => {
    it("should calculate total revenue", () => {
        // Arrange  
        const calculator = new FinanceCalculator();
        const orders = [
            { id: 1, item: "Sponge", price: 15 },
            { id: 2, item: "Chocolate", price: 20 },
            { id: 3, item: "Fruit", price: 0 } // Free item
        ];


        // Act
        const totalRevenue = calculator.getRevenue(orders);

        // Assert
        expect(totalRevenue).toBe(35);
    });

    it("should calculate average buy power", () => {
        // Arrange  
        const calculator = new FinanceCalculator();
        const orders = [
            { id: 1, item: "Sponge", price: 15 },
            { id: 2, item: "Chocolate", price: 10 },
            { id: 3, item: "Fruit", price: 10 }
        ];  

        // Act
        const averageBuyPower = calculator.getAverageBuyPower(orders);

        // Assert
        expect(averageBuyPower).toBeCloseTo(11.67, 2); 
    });
});
