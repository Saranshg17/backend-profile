import { Router } from "express";
import { logoutUser, registerUser, loginUser, newprofile, defaultprofile, refreshAccessToken, updateProfile } from "../controllers/user.controller.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";

const router = Router()

router.route("/register").post(registerUser)
router.route("/login").post(loginUser)
router.route("/profile").post(newprofile)
router.route("/default").post(defaultprofile)
router.route("/updateprofile").post(updateProfile)
router.route("/refreshtoken").post(refreshAccessToken)

//secured routes
router.route("/logout").post(verifyJWT, logoutUser)

export default router