import { Router } from "express";
import { logoutUser, registerUser, loginUser, newprofile } from "../controllers/user.controller.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";

const router = Router()

router.route("/register").post(registerUser)
router.route("/login").post(loginUser)
router.route("/profile").post(newprofile)

//secured routes
router.route("/logout").post(verifyJWT, logoutUser)

export default router