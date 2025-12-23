import { HttpException } from "./HttpException";

export class AuthenticationException extends HttpException {
    constructor(message: string) {
        super(401, message);
        this.name = "AuthenticationException";
    }
}

export class TokenExpiredException extends AuthenticationException {
    constructor() {
        super("Token expired");
        this.name = "TokenExpiredException";
    }
}

export class InvalidTokenException extends AuthenticationException {
    constructor() {
        super("Invalid token");
        this.name = "InvalidTokenException";
    }
}

export class AuthenticationFailedException extends AuthenticationException {
    constructor() {
        super("Authentication failed");
        this.name = "AuthenticationFailedException";
    }
}