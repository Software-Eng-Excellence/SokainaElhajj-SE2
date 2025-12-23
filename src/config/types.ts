import { Request } from "express";
import { JwtPayload } from "jsonwebtoken";
import { ROLE } from "./roles";

export enum DBMode {
    SQLITE,
    FILE,
    POSTGRESQL
}

export interface UserPayload {
    userId: string;
    role: ROLE
}

export interface TokenPayload extends JwtPayload, UserPayload{
    user: UserPayload
}

export interface AuthRequest extends Request {
    user: UserPayload;
}