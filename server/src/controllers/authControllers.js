import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import sql from "../database/db.js";

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

        // 6. Insert user into DB
        const [newUser] =
            await sql`INSERT INTO users (name, email, password) 
                      VALUES (${name}, ${email}, ${hashedPassword})
                      RETURNING user_id, name, email`;

        // 7. Generate JWT token
        const token = jwt.sign({ userId: newUser.user_id }, process.env.JWT_SECRET_KEY, {
            expiresIn: "7d",
        });

        res.cookie("jwt", token, {
            maxAge: 7 * 24 * 60 * 60 * 1000,
            httpOnly: true, // prevent XSS attacks,
            sameSite: "strict", // prevent CSRF attacks
            secure: process.env.NODE_ENV === "production",
        });

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
            secure: process.env.NODE_ENV === "production",
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

export const logout = (_, res) => {
    try {
        res.clearCookie("jwt");
        res.status(200).json({ success: true, message: "Logout successful" });
    } catch (error) {
        console.error("Error logging out:", error);
        res.status(500).json({ message: "Internal server error" });
    }
};