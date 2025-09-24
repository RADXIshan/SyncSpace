import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import nodemailer from "nodemailer";
import sql from "../database/db.js";
import { generateOtpEmail } from "../templates/emailTemplate.js";

export const signup = async (req, res) => {
    const { name, email, password } = req.body;

    // 1. Validate required fields
    if (!name || !email || !password) {
        return res.status(400).json({ message: "All fields are required" });
    }

    // 2. Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email?.trim())) {
        return res.status(400).json({ error: "Invalid email format" });
    }

    // 3. Validate password strength
    const passwordRegex =
        /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
    if (!passwordRegex.test(password)) {
        return res.status(400).json({
            error:
                "Password must be at least 8 characters long and contain at least one uppercase letter, one lowercase letter, one number, and one special character"
        });
    }

    try {
        // 4. Check if user already exists
        const existingUser =
            await sql`SELECT user_id FROM users WHERE email = ${email}`;
        if (existingUser.length > 0) {
            return res.status(400).json({ message: "User already exists" });
        }

        // 5. Hash password
        const saltRounds = 10;
        const hashedPassword = await bcrypt.hash(password, saltRounds);
        const otp = Math.floor(100000 + Math.random() * 900000);

        // Convert the otp to a string
        const otpString = otp.toString();

        // 6. Insert user into DB
        const [newUser] =
            await sql`INSERT INTO users (name, email, password, otp) 
                      VALUES (${name}, ${email}, ${hashedPassword}, ${otpString})
                      RETURNING user_id, name, email, otp`;

        // 7. Generate JWT token
        const token = jwt.sign(
            {
                userId: newUser.user_id,
                name: newUser.name,
                email: newUser.email,
            },
            process.env.JWT_SECRET_KEY,
            {
                expiresIn: "7d",
            }
        );

        res.cookie("jwt", token, {
            maxAge: 7 * 24 * 60 * 60 * 1000,
            httpOnly: true,
            sameSite: "strict",
            secure: false,
        });

        const transporter = nodemailer.createTransport({
            service: 'gmail',
            host: "smtp.gmail.com",
            port: 587,
            secure: false,
            auth: {
                user: process.env.EMAIL,
                pass: process.env.APP_PASSWORD,
            },
        });

        const confirmationMail = {
            from: {
                name: "Ishan Roy",
                address: "trickster10ishan@gmail.com"
            },
            to: email,
            subject: "SyncSpace Account Verification",
            html: generateOtpEmail(name, otp),
        };    

        try {
            await transporter.sendMail(confirmationMail);
        } catch (error) {
            console.error("Error sending email:", error);
            return res.status(500).json({ message: "Internal server error" });
        }

        // 8. Respond
        res.status(201).json({
            message: "User created successfully",
            user: newUser,
            token
        });
    } catch (error) {
        console.error("Error creating user:", error);
        res.status(500).json({ message: "Internal server error" });
    }
};

export const login = async (req, res) => {
    const { email, password } = req.body;

    // 1. Validate required fields
    if (!email?.trim() || !password) {
        return res.status(400).json({ message: "Email and password are required" });
    }

    // 2. Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email.trim())) {
        return res.status(400).json({ error: "Invalid email format" });
    }

    try {
        // 3. Find user in the database
        const [user] =
            await sql`SELECT user_id, name, email, password FROM users WHERE email = ${email}`;

        // 4. Handle case where user does not exist
        if (!user) {
            return res.status(401).json({ message: "Invalid credentials" });
        }

        // 5. Compare submitted password with stored hash
        const isMatch = await bcrypt.compare(password, user.password);

        // 6. Handle incorrect password
        if (!isMatch) {
            return res.status(401).json({ message: "Invalid credentials" });
        }

        // 7. Generate JWT token
        const token = jwt.sign({ userId: user.user_id }, process.env.JWT_SECRET_KEY, {
            expiresIn: "7d",
        });

        res.cookie("jwt", token, {
            maxAge: 7 * 24 * 60 * 60 * 1000,
            httpOnly: true, // prevent XSS attacks,
            sameSite: "strict", // prevent CSRF attacks
            secure: false,
        });

        // 8. Prepare user object for response (remove password)
        const userResponse = {
            user_id: user.user_id,
            name: user.name,
            email: user.email,
        };

        // 9. Respond with success
        res.status(200).json({
            message: "Login successful",
            user: userResponse,
            token,
        });
    } catch (error) {
        console.error("Error during login:", error);
        res.status(500).json({ message: "Internal server error" });
    }
};

// Modified verifyMail function
export const verifyMail = async(req, res) => {
    const { otp, token } = req.body; // Accept token in request body as fallback

    if (!otp?.trim()) {
        return res.status(400).json({ message: "OTP is required" });
    }

    // Try to get token from cookie first, then from request body
    const authToken = req.cookies.jwt || token;
    if (!authToken) {
      return res.status(401).json({ message: "No token provided" });
    }

    let userId;
    try {
        const decoded = jwt.verify(authToken, process.env.JWT_SECRET_KEY);
        userId = decoded.userId;
    } catch (error) {
        return res.status(401).json({ message: "Invalid token" });
    }

    const [user] = await sql`SELECT otp FROM users WHERE user_id = ${userId}`;
    if (!user) {
        return res.status(401).json({ message: "User not found" });
    }

    if (user.otp?.toString() !== otp.toString()) {
        return res.status(401).json({ message: "Invalid OTP" });
    }

    // Update user's OTP to null after successful verification
    await sql`UPDATE users SET otp = NULL WHERE user_id = ${userId}`;

    return res.json({ message: "Email verified successfully" });
};

export const forgotPassword = (req, res) => {
    const { email } = req.body;
    if (!email?.trim()) {
        return res.status(400).json({ message: "Email is required" });
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email.trim())) {
        return res.status(400).json({ error: "Invalid email format" });
    }

    // TODO: Implement actual email service integration
    return res.json({ message: `Password reset link sent to ${email}` });
};

export const deleteUser = async (req, res) => {
    const { userId } = req.body;
    try {
        await sql`DELETE FROM users WHERE user_id = ${userId}`;
        res.status(200).json({ success: true, message: "User deleted successfully" });
    } catch (error) {
        console.error("Error deleting user:", error);
        res.status(500).json({ message: "Internal server error" });
    }
};

export const logout = async (_, res) => {
  try {
    res.clearCookie("jwt", { httpOnly: true, secure: true });
    res.status(200).json({ success: true, message: "Logout successful" });
  } catch (error) {
    console.error("Error logging out:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

export const authUser = async (req, res) => {
    const authToken = req.cookies.jwt;
    if (!authToken) {
        return res.status(401).json({ message: "No token provided" });
    }

    let userId;
    try {
        const decoded = jwt.verify(authToken, process.env.JWT_SECRET_KEY);
        userId = decoded.userId;
    } catch (error) {
        return res.status(401).json({ message: "Invalid token" });
    }

    const [user] = await sql`SELECT user_id, name, email FROM users WHERE user_id = ${userId}`;
    if (!user) {
        return res.status(401).json({ message: "User not found" });
    }

    return res.json({ user });
}
