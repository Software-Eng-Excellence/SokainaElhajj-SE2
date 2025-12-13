import { HttpException } from "./HttpException"

export class BadRequestException extends HttpException {
    constructor(message: string = "Bad Request", details?: Record<string, unknown>) {
        super(404, message, details);
        this.name = "BadRequestException";
    }
}