import { Router } from "express";
import { UserController } from "../controllers/user.controller";
import { UserService } from "../services/userManagement.service";
import { asyncHandler } from "../middleware/asyncHandler";

const router = Router();
const userService = new UserService();
const userController = new UserController(userService);

router.route("/")
	.get(asyncHandler(userController.getUsers.bind(userController)))
	.post(asyncHandler(userController.createUser.bind(userController)));

router.route("/:id")
	.get(asyncHandler(userController.getUserById.bind(userController)))
	.put(asyncHandler(userController.updateUser.bind(userController)))
	.delete(asyncHandler(userController.deleteUser.bind(userController)));

export default router;
