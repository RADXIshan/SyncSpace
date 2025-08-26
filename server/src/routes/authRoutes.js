import { Router } from "express";
import { signup, login, forgotPassword, verifyMail } from "../controllers/authControllers.js";

const router = Router();

router.post("/signup", signup);
router.post("/login", login);
router.post("/verify-mail", verifyMail);
router.post("/forgot-password", forgotPassword);

export default router;