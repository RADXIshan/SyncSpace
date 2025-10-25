import { Router } from "express";
import { upload } from "../configs/multer.js";
import { signup, login, logout, deleteUser, verifyMail, forgotPassword, authUser, resetPassword, resendOtp, updateProfile, refreshToken } from "../controllers/authControllers.js";

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
router.post("/refresh-token", refreshToken);
router.patch("/updateProfile", upload.single("profilePicture"), updateProfile);

export default router;