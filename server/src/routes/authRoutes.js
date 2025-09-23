import { Router } from "express";
import { signup, login, logout } from "../controllers/authControllers.js";

const router = Router();

router.post("/signup", signup);
router.post("/login", login);
// router.post("/verify-mail", verifyMail);
// router.post("/forgot-password", forgotPassword);
router.post("/logout", logout);

export default router;