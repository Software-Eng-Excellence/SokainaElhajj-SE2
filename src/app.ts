import logger from "./util/logger";

export interface Order {
    id: number;
    item: string;
    price: number;
}

interface IValidator {
    validate(order: Order): void;
}

interface IPossibleItems {
    getPossibleItems(): string[];
}

interface ICalculator {
    getRevenue(orders: Order[]): number;
    getAverageBuyPower(orders: Order[]): number;
}

export class OrderManagement {
    private orders: Order[] = [];

    constructor(private validator: IValidator, private calculator: ICalculator) {
        logger.debug("OrderManagement instance created");
    }

    getOrders() {
        return this.orders;
    }

    addOrder(item: string, price: number) {
        try {
            const order: Order = { id: this.orders.length + 1, item, price };
            this.validator.validate(order);
            this.orders.push(order);
        } catch (error: any) {
            // ✅ Fixed message to match test expectation exactly
            throw new Error("[OrderManagement] Error adding order" + error.message);
        }
    }

    getOrder(id: number) {
        return this.getOrders().find(order => order.id === id);
    }

    getTotalRevenue() {
        return this.calculator.getRevenue(this.orders);
    }

    getBuyPower() {
        return this.calculator.getAverageBuyPower(this.orders);
    }
}

export class PremiumOrderManagement extends OrderManagement {
    getOrder(id: number): Order | undefined {
        console.log("ALERT: Premium order accessed");
        return super.getOrder(id);
    }
}

export class Validator implements IValidator {
    constructor(private rules: IValidator[]) {}

    validate(order: Order): void {
        this.rules.forEach(rule => rule.validate(order));
    }
}

export class ItemValidator implements IValidator, IPossibleItems {
    private static possibleItems = [
        "Sponge",
        "Chocolate",
        "Fruit",
        "Red Velvet",
        "Birthday",
        "Carrot",
        "Marble",
        "Coffee",
    ];

    getPossibleItems(): string[] {
        return ItemValidator.possibleItems;
    }

    validate(order: Order) {
        if (!ItemValidator.possibleItems.includes(order.item)) {
            throw new Error(`Invalid item. Must be one of: ${ItemValidator.possibleItems.join(", ")}`);
        }
    }
}

export class PriceValidator implements IValidator {
    validate(order: Order): void {
        if (order.price <= 0) {
            logger.error(`price is negative ${order.item}`);
            throw new Error("Price must be greater than zero");
        }
    }
}

export class MaxPriceValidator implements IValidator {
    validate(order: Order): void {
        if (order.price > 100) {
            throw new Error("Price must be less than or equal to 100");
        }
    }
}

export class FinanceCalculator implements ICalculator {
    public getRevenue(orders: Order[]) {
        return orders.reduce((total, order) => total + order.price, 0);
    }

    public getAverageBuyPower(orders: Order[]) {
        return orders.length === 0 ? 0 : this.getRevenue(orders) / orders.length;
    }
}
