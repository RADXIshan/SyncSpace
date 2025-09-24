import { Router } from "express";
import { signup, login, logout, deleteUser, verifyMail, forgotPassword, authUser, resetPassword, resendOtp, updateProfile } from "../controllers/authControllers.js";

const router = Router();

router.post("/signup", signup);
router.post("/login", login);
router.post("/verify-mail", verifyMail);
router.post("/forgot-password", forgotPassword);
router.post("/reset-password/:email", resetPassword);
router.post("/resend-otp", resendOtp);
router.post("/logout", logout);
router.delete("/delete", deleteUser);
router.post("/getMe", authUser);
router.patch("/updateProfile", updateProfile);

export default router;