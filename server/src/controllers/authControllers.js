import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import nodemailer from "nodemailer";
import sql from "../database/db.js";
import { generateOtpEmail } from "../templates/emailTemplate.js";
import { generatePasswordResetEmail } from "../templates/resetPassword.js";
import { v2 as cloudinary } from "cloudinary";

export const signup = async (req, res) => {
    const { name, email, password } = req.body;

    if (!name || !email || !password) {
        return res.status(400).json({ message: "All fields are required" });
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email?.trim())) {
        return res.status(400).json({ error: "Invalid email format" });
    }

    const passwordRegex =
        /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
    if (!passwordRegex.test(password)) {
        return res.status(400).json({
            error:
                "Password must be at least 8 characters long and contain at least one uppercase letter, one lowercase letter, one number, and one special character"
        });
    }

    try {
        const existingUser =
            await sql`SELECT user_id FROM users WHERE email = ${email}`;
        if (existingUser.length > 0) {
            return res.status(400).json({ message: "User already exists" });
        }

        const saltRounds = 10;
        const hashedPassword = await bcrypt.hash(password, saltRounds);
        const otp = Math.floor(100000 + Math.random() * 900000);

        const otpString = otp.toString();

        const [newUser] =
            await sql`INSERT INTO users (name, email, password, otp) 
                      VALUES (${name}, ${email}, ${hashedPassword}, ${otpString})
                      RETURNING user_id, name, email, otp`;

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

    if (!email?.trim() || !password) {
        return res.status(400).json({ message: "Email and password are required" });
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email.trim())) {
        return res.status(400).json({ error: "Invalid email format" });
    }

    try {
        const [user] =
            await sql`SELECT user_id, name, email, password, user_photo FROM users WHERE email = ${email}`;

        if (!user) {
            return res.status(401).json({ message: "Invalid credentials" });
        }

        const isMatch = await bcrypt.compare(password, user.password);

        if (!isMatch) {
            return res.status(401).json({ message: "Invalid credentials" });
        }

        const token = jwt.sign({ userId: user.user_id }, process.env.JWT_SECRET_KEY, {
            expiresIn: "7d",
        });

        res.cookie("jwt", token, {
            maxAge: 7 * 24 * 60 * 60 * 1000,
            httpOnly: true, 
            sameSite: "strict", 
            secure: false,
        });

        const userResponse = {
            user_id: user.user_id,
            name: user.name,
            email: user.email,
        };

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

export const verifyMail = async(req, res) => {
    const { otp, token } = req.body; 

    if (!otp?.trim()) {
        return res.status(400).json({ message: "OTP is required" });
    }

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

    await sql`UPDATE users SET otp = NULL WHERE user_id = ${userId}`;

    return res.json({ message: "Email verified successfully" });
};

export const forgotPassword = async (req, res) => {
    const { email } = req.body;
    if (!email?.trim()) {
        return res.status(400).json({ message: "Email is required" });
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email.trim())) {
        return res.status(400).json({ error: "Invalid email format" });
    }
    const [user] = await sql`SELECT user_id FROM users WHERE email = ${email}`;
    if (!user) {
        return res.status(401).json({ message: "User not found" });
    }

    const resetLink = process.env.CLIENT_URL + `/reset-password/${email}`;

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
            subject: "SyncSpace Password Reset",
            html: generatePasswordResetEmail(resetLink),
        };    

        try {
            await transporter.sendMail(confirmationMail);
        } catch (error) {
            console.error("Error sending email:", error);
            return res.status(500).json({ message: "Internal server error" });
        }
    return res.json({ message: `Password reset link sent to ${email}` });
};

export const resetPassword = async (req, res) => {
    const { email } = req.params;
    const { password } = req.body;

    if (!email?.trim() || !password) {
        return res.status(400).json({ message: "Email and password are required" });
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email.trim())) {
        return res.status(400).json({ error: "Invalid email format" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    await sql`UPDATE users SET password = ${hashedPassword} WHERE email = ${email}`;

    return res.json({ message: "Password reset successful" });
};

export const resendOtp = async (req, res) => {
    const { email } = req.body;
    if (!email?.trim()) {
        return res.status(400).json({ message: "Email is required" });
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email.trim())) {
        return res.status(400).json({ error: "Invalid email format" });
    }

    const [user] = await sql`SELECT user_id FROM users WHERE email = ${email}`;
    if (!user) {
        return res.status(401).json({ message: "User not found" });
    }

    const otp = Math.floor(100000 + Math.random() * 900000);
    await sql`UPDATE users SET otp = ${otp} WHERE email = ${email}`;

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
        subject: "SyncSpace OTP Resend",
        html: generateOtpEmail(email,otp),
    };    

    try {
        await transporter.sendMail(confirmationMail);
    } catch (error) {
        console.error("Error sending email:", error);
        return res.status(500).json({ message: "Internal server error" });
    }

    return res.json({ message: `OTP sent to ${email}` });
}

export const updateProfile = async (req, res) => {
    const authToken = req.cookies.jwt || req.body.token || req.headers.authorization?.split(" ")[1];
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

    const { name, email, password } = req.body;
    const file = req.file;

    // Build dynamic update object
    const updates = {};
    if (name) updates.name = name;
    if (email) updates.email = email;

    // If image file uploaded, push to Cloudinary and store secure_url
    if (file) {
        try {
            const uploadResult = await cloudinary.uploader.upload(file.path, {
                folder: "syncspace/profiles",
                public_id: `user_${userId}`,
                overwrite: true,
            });
            updates.user_photo = uploadResult.secure_url;
        } catch (err) {
            console.error("Failed to upload profile image:", err);
            return res.status(500).json({ message: "Image upload failed" });
        }
    }

    try {
        if (password) {
            const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
            if (!passwordRegex.test(password)) {
                return res.status(400).json({ error: "Password must be at least 8 characters long and contain at least one uppercase letter, one lowercase letter, one number, and one special character" });
            }
            const hashedPassword = await bcrypt.hash(password, 10);
            updates.password = hashedPassword;
        }

        if (email) {
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (!emailRegex.test(email.trim())) {
                return res.status(400).json({ error: "Invalid email format" });
            }
            // Ensure email uniqueness
            const [existing] = await sql`SELECT user_id FROM users WHERE email = ${email} AND user_id <> ${userId}`;
            if (existing) {
                return res.status(400).json({ error: "Email already in use" });
            }
        }

        // If nothing to update
        if (Object.keys(updates).length === 0) {
            return res.status(400).json({ message: "No fields to update" });
        }

        // Build dynamic SET clause and values for parameterized query
        const setClauses = [];
        const values = [];
        let paramIndex = 2; // $1 will be userId
        for (const [col, val] of Object.entries(updates)) {
            setClauses.push(`${col} = $${paramIndex}`);
            values.push(val);
            paramIndex += 1;
        }

        const query = `UPDATE users SET ${setClauses.join(', ')} WHERE user_id = $1`;
        await sql.query(query, [userId, ...values]);

        res.status(200).json({ success: true, message: "Profile updated successfully" });
    } catch (error) {
        console.error("Error updating profile:", error);
        res.status(500).json({ message: "Internal server error" });
    }
};

export const deleteUser = async (req, res) => {
    // Derive user from JWT rather than trusting body input
    const authToken = req.cookies.jwt || req.body.token || req.headers.authorization?.split(" ")[1];
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

    try {
        await sql`DELETE FROM users WHERE user_id = ${userId}`;
        res.clearCookie("jwt", { httpOnly: true, secure: true });
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
    const authToken = req.cookies.jwt || req.body.token || req.headers.authorization?.split(" ")[1];
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

    const [user] = await sql`SELECT user_id, name, email, user_photo FROM users WHERE user_id = ${userId}`;
    if (!user) {
        return res.status(401).json({ message: "User not found" });
    }

    return res.json({ user });
}
