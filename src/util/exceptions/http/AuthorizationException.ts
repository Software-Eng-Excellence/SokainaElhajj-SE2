import { HttpException } from "./HttpException";

export class AuthorizationException extends HttpException {
    constructor(message: string) {
        super(403, message);
        this.name = "AuthorizationException";
    }
}

export class InvalidRoleException extends AuthorizationException {
    constructor(role: string) {
        super('Invalid Role: ' + role);
        this.name = "InvalidRoleException";
    }
}

export class InsufficientPermissionException extends AuthorizationException {
    constructor() {
        super("Insufficient Permission");
        this.name = "InsufficientPermissionException";
    }
}