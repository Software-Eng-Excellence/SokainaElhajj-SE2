import { Request, Response } from "express";
import { AuthenticationService } from "../services/authentication.service";
import { BadRequestException } from "../util/exceptions/http/BadRequestException";
import { UserService } from "../services/userManagement.service";
import { AuthRequest, UserPayload } from "../config/types";
import { toRole } from "../config/roles";

export class AuthenticationController {
    constructor(
        private authService: AuthenticationService, 
        private userService: UserService) {}

    async login(req: Request, res: Response) {
        const {email, password} = req.body;
        if (!email || !password) {
            throw new BadRequestException('Email and password are required', {
                emailMissing: !email,
                passwordMissing: !password
            });
        }

        // validate user
        try {
            const user = await this.userService.validateUser(email, password);
            const userPayload: UserPayload = {userId: user.id, role: toRole(user.role)};
            this.authService.persistAuthentication(res, userPayload);
            res.status(200).json({
                message: 'Login successful',
            });
        } catch (error) {
            if ((error as Error).message === 'User not found'){
                throw new BadRequestException('Invalid email or password');
            }
            throw error;
        }
    }

    logout(req: Request, res: Response) {
        this.authService.clearTokens(res);
        res.status(200).json({
            message: 'Logout successful',
        });
    }
}