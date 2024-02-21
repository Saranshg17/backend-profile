import { Router } from "express";
import { logoutUser, registerUser, loginUser, newprofile, defaultprofile, refreshAccessToken } from "../controllers/user.controller.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";

const router = Router()

router.route("/register").post(registerUser)
router.route("/login").post(loginUser)
router.route("/profile").post(newprofile)
router.route("/default").post(defaultprofile)

//secured routes
router.route("/logout").post(verifyJWT, logoutUser)
router.route("/refreshtoken").post(refreshAccessToken)

export default router