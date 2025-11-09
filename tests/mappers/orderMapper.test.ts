import { OrderMapper } from '../../src/mappers/Order.mapper';

describe('OrderMapper', () => {
    let itemMapperMock: any;
    let mapper: OrderMapper;

    beforeEach(() => {
        // Mock for the item mapper dependency
        itemMapperMock = {
        map: jest.fn(),
        };
        mapper = new OrderMapper(itemMapperMock);
    });

    it('maps a CSV row to an Order object', () => {
        const csvRow = ['ORD123', 'Toy Car', '50', '2'];
        // Return a realistic item structure
        itemMapperMock.map.mockReturnValueOnce({ name: 'Toy Car', quantity: 2, price: 50 });

        const result = mapper.map(csvRow);

        expect(itemMapperMock.map).toHaveBeenCalledWith(csvRow);
        expect(result.getId()).toBe('ORD123');
        expect(result.getPrice()).toBe(50);
        expect(result.getQuantity()).toBe(2);
        expect(result.getItem()).toEqual({ name: 'Toy Car', quantity: 2, price: 50 });
    });

    it('maps a JSON or XML input to an Order object', () => {
        const jsonInput = {
        'Order ID': 456,
        'Price': '75',
        'Quantity': '3',
        'Item': 'Toy Plane'
        };
        itemMapperMock.map.mockReturnValueOnce({ name: 'Toy Plane', quantity: 3, price: 75 });

        const result = mapper.map(jsonInput);

        expect(itemMapperMock.map).toHaveBeenCalledWith(jsonInput);
        expect(result.getId()).toBe(456);
        expect(result.getPrice()).toBe(75);
        expect(result.getQuantity()).toBe(3);
        expect(result.getItem()).toEqual({ name: 'Toy Plane', quantity: 3, price: 75 });
    });

    it('throws error if quantity is missing', () => {
        const input = { 'OrderID': 1, 'Price': '50' };
        itemMapperMock.map.mockReturnValueOnce({ name: 'Toy', price: 50, quantity: 0 });
        expect(() => mapper.map(input)).toThrow();
    });

    it('throws error if price is not a number', () => {
        const input = { 'OrderID': 1, 'Price': 'abc', 'Quantity': '3' };
        itemMapperMock.map.mockReturnValueOnce({ name: 'Toy', quantity: 3, price: NaN });
        expect(() => mapper.map(input)).toThrow();
    });

    it('throws error on empty object', () => {
        const input = {};
        itemMapperMock.map.mockReturnValueOnce(null);
        expect(() => mapper.map(input)).toThrow();
    });

});
