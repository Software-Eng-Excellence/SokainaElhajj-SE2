import { Router } from "express";
import { asyncHandler } from "../middleware/asyncHandler";
import { AuthenticationService } from "../services/authentication.service";
import { UserService } from "../services/userManagement.service";
import { AuthenticationController } from "../controllers/auth.controller";
import { authenticate } from "../middleware/auth";

const router = Router();

const authService = new AuthenticationService();
const userService = new UserService();

const authController = new AuthenticationController(
    authService,
    userService
);

router.route("/login")
    .post(asyncHandler(authController.login.bind(authController)));

router.route("/logout")
    .get(authenticate, authController.logout.bind(authController));

export default router;
