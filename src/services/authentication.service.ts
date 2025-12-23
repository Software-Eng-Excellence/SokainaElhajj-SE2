import jwt from 'jsonwebtoken';
import config from '../config';
import { UserPayload } from '../config/types';
import logger from '../util/logger';
import { InvalidTokenException, TokenExpiredException } from '../util/exceptions/http/AuthenticationException';
import { ServiceException } from '../util/exceptions/http/ServiceException';
import { Response } from 'express';
import ms from 'ms';

export class AuthenticationService {

    constructor(
        private secretKey= config.auth.secretKey,
        private tokenExpiration = config.auth.tokenExpiration,
        private refreshTokenExpiration = config.auth.refreshTokenExpiartion
    ) {}

    // takes a user id and signs it    
    generateToken(payload: UserPayload): string {
        return jwt.sign(
            payload,
            this.secretKey, 
            {expiresIn: this.tokenExpiration}
        );
    }

    generateRefreshToken(payload: UserPayload): string {
        return jwt.sign(
            payload,
            this.secretKey,
            {expiresIn: this.refreshTokenExpiration}
        );
    }

    verify(token: string): UserPayload {
        try {
            return jwt.verify(token, this.secretKey) as UserPayload;
        } catch (error) {
            logger.error('Token verification failed', error);
            if (error instanceof jwt.TokenExpiredError) {
                throw new TokenExpiredException(); // token is old
            }
            if (error instanceof jwt.JsonWebTokenError) {
                throw new InvalidTokenException(); // token is fake or messed with
            }
            throw new ServiceException('Token verification failed');
        }
    }

    refreshToken(refreshToken: string) {
        const payload = this.verify(refreshToken);
        if (!payload) {
            throw new InvalidTokenException();
        }
        return this.generateToken(payload)
    }
    
    setTokenIntoCookie(res: Response, token: string) {
        res.cookie('token', token, {
            httpOnly: true, // prevents js from reading the cookie
            secure: config.isProduction, // cookie is only sent over https
            maxAge: ms(this.tokenExpiration) // how long to keep the cookie
        })
    }

    setRefreshTokenIntoCookie(res: Response, refreshToken: string) {
        res.cookie('refreshToken', refreshToken, {
            httpOnly: true, // prevents js from reading the cookie
            secure: config.isProduction, // cookie is only sent over https
            maxAge: ms(this.refreshTokenExpiration) // how long to keep the cookie
        })
    }

    // logout
    clearTokens (res: Response) {
        res.clearCookie('token');
        res.clearCookie('refreshToken');
    }

     // From: src/services/Authentication.service.ts
    persistAuthentication(res: Response, payload: UserPayload) {
        const token = this.generateToken(payload); // Generate JWT
        const refreshToken = this.generateRefreshToken(payload); // Generate Refresh Token
        this.setTokenIntoCookie(res, token); // Set JWT cookie
        this.setRefreshTokenIntoCookie(res, refreshToken); // Set Refresh Token cookie
    }
}