import { AuthRequest } from "../config/types";
import { NextFunction, Request, Response } from "express";
import { AuthenticationService } from "../services/authentication.service";
import { AuthenticationFailedException, TokenExpiredException } from "../util/exceptions/http/AuthenticationException";

// todo add a singleton to the authentication service
// From: src/middleware/auth.ts
const authService = new AuthenticationService();

// From: src/middleware/auth.ts (Simplified)
export function authenticate(req: Request, res: Response, next: NextFunction) {
    let token = req.cookies.token;
    const refreshToken = req.cookies.refreshToken;

    if (!token) {
        if (!refreshToken) return next(new AuthenticationFailedException());
            try {
                const newToken = authService.refreshToken(refreshToken);
                authService.setTokenIntoCookie(res, newToken);
                token = newToken;
            } catch (error) {
                authService.clearTokens(res);
                return next(error);
            }
        }

        try {
            const payload = authService.verify(token);
            (req as AuthRequest).user = payload;
            next();
        } catch (error) {
            if (error instanceof TokenExpiredException && refreshToken) {
                try {
                    const newToken = authService.refreshToken(refreshToken);
                    authService.setTokenIntoCookie(res, newToken);
                    const newPayload = authService.verify(newToken);
                    (req as AuthRequest).user = newPayload;
                    return next();
                } catch (refreshError) {
                    authService.clearTokens(res);
                    return next(refreshError);
                }
            }
            authService.clearTokens(res);
            return next(error);
        }
}