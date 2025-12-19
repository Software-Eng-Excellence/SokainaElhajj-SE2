import { Request, Response } from "express";
import { UserService } from "../services/userManagement.service";
import { BadRequestException } from "../util/exceptions/http/BadRequestException";
import { User } from "../model/User.model";
import { generateUUID } from "../util/index";
import { NotFoundException } from "../util/exceptions/http/NotFoundException";
import { ServiceException } from "../util/exceptions/http/ServiceException";
import logger from "../util/logger";

export class UserController {
    constructor(private readonly userService: UserService) {}

    // Create user
    public async createUser(req: Request, res: Response): Promise<void> {
        try {
            const { name, email, password } = req.body;
            if (!name || !email || !password) {
                console.error("Validation error: Missing fields", { name, email, password });
                throw new BadRequestException("Name, email, and password are required to create user", {
                    name: !name,
                    email: !email,
                    password: !password
                });
            }

            // validate email format
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (!emailRegex.test(email)) {
                console.error("Validation error: Invalid email format", { email });
                throw new BadRequestException("Invalid email format");
            }

            const newUser = new User(name, email, password, generateUUID("user"));
            const userId = await this.userService.createUser(newUser);

            try {
                const createUser = await this.userService.getUserById(userId);
                res.status(201).json(createUser);
            } catch (err) {
                res.status(201).json({ message: "User created but failed to retrieve", id: userId });
            }
        } catch (error) {
            logger.error("Error creating user:", error);
            throw new ServiceException("Error creating user");
        }
    }

    // Get user by id
    public async getUserById(req: Request, res: Response) {
        const id = req.params.id;
        if(!id) {
            throw new BadRequestException("Id is required in the path");
        }
        try {
            const user = await this.userService.getUserById(id);
            res.status(200).json(user);
        } catch (error) {
            logger.error("Error fetching user:", error);
            throw new NotFoundException("User not found");
        }
    }

    // Get all users
    public async getUsers(req: Request, res: Response) {
        try {
            const users = await this.userService.getAllUsers();
            res.status(200).json(users);
        } catch (error) {
            throw new ServiceException("Error fetching users");
        }
    }

    // Update user
    public async updateUser(req: Request, res: Response) {
        try {
            const id = req.params.id;
            const { name, email, password } = req.body;
            
            if (!id) {
                throw new BadRequestException("Id is required to update user");
            }
            
            // validate request
            if (!name && !email && !password) {
                console.error("Validation error: No fields provided for update", { name, email, password });
                throw new BadRequestException("At least one field (name, email, or password) is required to update user", {
                    name: !name,
                    email: !email,
                    password: !password
                });
            }

            // get existing user
            const existingUser = await this.userService.getUserById(id);

            // update fields
            const updatedUser = new User(
                name || existingUser.name,
                email || existingUser.email,
                password || existingUser.password,
                id
            );

            await this.userService.updateUser(updatedUser);

            const result = await this.userService.getUserById(id);
            res.status(200).json(result);
        } catch (error) {
            logger.error("Error updating user:", error);
            if (error instanceof BadRequestException) {
                throw error;
            }
            if ((error as Error).message === "User not found") {
                throw new NotFoundException("User not found");
            } 
            throw new ServiceException("Error updating user");
        }
    }

    // Delete user
    public async deleteUser(req: Request, res: Response) {
        try {
            const id = req.params.id;
            if (!id) {
                throw new BadRequestException("Id is required to delete user");
            }

            await this.userService.deleteUser(id);
            res.status(200).send();
        } catch (error) {
            logger.error("Error deleting user:", error);
            if (error instanceof BadRequestException) {
                throw error;
            }
            if ((error as Error).message === "User not found") {
                throw new NotFoundException("User not found");
            } 
            throw new ServiceException("Error deleting user");
        }
    }
}
