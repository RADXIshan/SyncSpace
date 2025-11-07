import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import sql from "../database/db.js";
import { v2 as cloudinary } from "cloudinary";
import dotenv from "dotenv";
import { sendEmailWithRetry } from "../utils/emailUtils.js";
import generateOtpEmail from "../templates/otpEmail.js";
import generateForgotPasswordEmail from "../templates/forgotPasswordEmail.js";

dotenv.config();

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
        "Password must be at least 8 characters long and contain at least one uppercase letter, one lowercase letter, one number, and one special character",
    });
  }

  try {
    // Check if user exists with timeout
    const existingUserPromise = sql`SELECT user_id FROM users WHERE email = ${email}`;
    const existingUser = await Promise.race([
      existingUserPromise,
      new Promise((_, reject) =>
        setTimeout(() => reject(new Error("Database timeout")), 8000)
      ),
    ]);

    if (existingUser.length > 0) {
      return res.status(400).json({ message: "User already exists" });
    }

    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(password, saltRounds);
    const otp = Math.floor(100000 + Math.random() * 900000);
    const otpString = otp.toString();

    // Create user with timeout
    const createUserPromise = sql`INSERT INTO users (name, email, password, otp) 
                      VALUES (${name}, ${email}, ${hashedPassword}, ${otpString})
                      RETURNING user_id, name, email, otp`;

    const [newUser] = await Promise.race([
      createUserPromise,
      new Promise((_, reject) =>
        setTimeout(() => reject(new Error("Database timeout")), 8000)
      ),
    ]);

    const token = jwt.sign(
      {
        userId: newUser.user_id,
        name: newUser.name,
        email: newUser.email,
        photo: null, // New users don't have photos initially
      },
      process.env.JWT_SECRET_KEY,
      {
        expiresIn: "7d",
      }
    );

    res.cookie("jwt", token, {
      maxAge: 7 * 24 * 60 * 60 * 1000,
      httpOnly: true,
      sameSite: "none",
      secure: true,
      path: "/",
    });

    // Create transporter with improved options
    const mailOptions = {
      from: {
        name: "SyncSpace Security",
        address: process.env.EMAIL,
      },
      to: email,
      subject: "Account Verification Code - Action Required",
      html: generateOtpEmail(name, otp),
    };

    try {
      await sendEmailWithRetry(mailOptions);
      console.log("✅ Verification email sent successfully");
    } catch (error) {
      console.error("❌ Failed to send verification email after retries:", {
        message: error?.message,
        code: error?.code,
        stack: error?.stack,
        transporterError: error?.name === 'Error' && error?.message?.includes('ESOCKET'),
      });

      return res.status(201).json({
        success: true,
        message: 
          "User created successfully. Failed to send verification email after multiple attempts.",
        user: {
          user_id: newUser.user_id,
          name: newUser.name,
          email: newUser.email,
        },
        token,
        requiresVerification: true,
        emailError: process.env.NODE_ENV === "development" ? error?.message : undefined,
      });
    }

    res.status(201).json({
      success: true,
      message: "User created successfully. A verification email is being sent.",
      user: {
        user_id: newUser.user_id,
        name: newUser.name,
        email: newUser.email,
      },
      token,
      requiresVerification: true,
    });
  } catch (error) {
    console.error("Error creating user:", error);

    if (error.message === "Database timeout") {
      return res.status(504).json({
        message: "Request timeout. Please try again.",
        error: "TIMEOUT",
      });
    }

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
      await sql`SELECT user_id, name, email, password, user_photo, otp FROM users WHERE email = ${email}`;

    if (!user) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    const isMatch = await bcrypt.compare(password, user.password);

    if (!isMatch) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    // Check if email is verified (otp should be null for verified users)
    if (user.otp !== null) {
      return res.status(403).json({
        message: "Please verify your email before logging in",
        requiresVerification: true,
        email: user.email,
      });
    }

    const token = jwt.sign(
      {
        userId: user.user_id,
        email: user.email,
        name: user.name,
        photo: user.user_photo,
      },
      process.env.JWT_SECRET_KEY,
      {
        expiresIn: "7d",
      }
    );

    res.cookie("jwt", token, {
      maxAge: 7 * 24 * 60 * 60 * 1000,
      httpOnly: true,
      sameSite: "none",
      secure: true,
      path: "/",
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

export const verifyMail = async (req, res) => {
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

  try {
    const [user] = await Promise.race([
      sql`SELECT user_id, name FROM users WHERE email = ${email}`,
      new Promise((_, reject) =>
        setTimeout(() => reject(new Error("Database timeout")), 5000)
      ),
    ]);

    if (!user) {
      return res.status(401).json({ message: "User not found" });
    }

    const resetLink = process.env.CLIENT_URL + `/reset-password/${email}`;

    const mailOptions = {
      from: {
        name: "SyncSpace Security",
        address: process.env.EMAIL,
      },
      to: email,
      subject: "Password Reset Request - Secure Link Inside",
      html: generateForgotPasswordEmail(email, resetLink),
    };

    try {
      await sendEmailWithRetry(mailOptions);
      console.log("✅ Password reset email sent successfully");
      res
        .status(200)
        .json({
          success: true,
          message: `Password reset link sent to ${email}`,
        });
    } catch (error) {
      console.error("❌ Failed to send password reset email:", {
        message: error?.message,
        code: error?.code,
        stack: error?.stack,
      });

      // Don't return 500 — the request itself (finding the user) succeeded.
      // Inform the client that the reset link generation succeeded but email failed.
      return res.status(200).json({
        success: true,
        message: "Password reset link generated, but failed to send email after multiple attempts.",
        emailError: process.env.NODE_ENV === "development" ? error?.message : undefined,
      });
    }

  } catch (error) {
    console.error("Error in forgot password:", error);

    if (error.message === "Database timeout") {
      return res.status(504).json({
        message: "Request timeout. Please try again.",
        error: "TIMEOUT",
      });
    }

    res.status(500).json({ message: "Internal server error" });
  }
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
  try {
    const [user] = await Promise.race([
      sql`SELECT user_id, name FROM users WHERE email = ${email}`,
      new Promise((_, reject) =>
        setTimeout(() => reject(new Error("Database timeout")), 5000)
      ),
    ]);
    if (!user) {
      return res.status(401).json({ message: "User not found" });
    }
    const otp = Math.floor(100000 + Math.random() * 900000);

    await Promise.race([

      sql`UPDATE users SET otp = ${otp} WHERE email = ${email}`,

      new Promise((_, reject) =>

        setTimeout(() => reject(new Error("Database timeout")), 5000)

      ),

    ]);
    
    try {
      console.log("Sending resend OTP email to:", email);
      const mailOptions = {
        from: {
          name: "SyncSpace Security",
          address: process.env.EMAIL,
        },
        to: email,
        subject: "New Verification Code - Please Confirm",
        html: generateOtpEmail(user.name, otp),
      };

      try {
        await sendEmailWithRetry(mailOptions);
        console.log("✅ OTP resend email sent successfully");
      } catch (error) {
        console.error("❌ Failed to send OTP resend email:", {
          message: error?.message,
          code: error?.code,
          stack: error?.stack,
        });

        return res.status(200).json({
          success: true,
          message: "OTP updated but failed to send via email after multiple attempts.",
          emailError: process.env.NODE_ENV === "development" ? error?.message : undefined,
        });
      }

      console.log("Resend OTP email sent successfully");

      res.status(200).json({ success: true, message: "OTP sent successfully" });
    } catch (emailError) {
      console.error("Failed to send resend OTP email:", {
        message: emailError?.message,
        code: emailError?.code,
        stack: emailError?.stack,
      });
      res.status(500).json({
        message: "Failed to resend OTP",
        error: process.env.NODE_ENV === "development" ? emailError?.message : undefined,
      });
    }
  } catch (error) {
    console.error("Error resending OTP:", error);
    if (error.message === "Database timeout") {
      return res.status(504).json({
        message: "Request timeout. Please try again.",
        error: "TIMEOUT",
      });
    }
    res.status(500).json({ message: "Internal server error" });
  }
};


export const updateProfile = async (req, res) => {
  const authToken =
    req.cookies.jwt ||
    req.body.token ||
    req.headers.authorization?.split(" ")[1];
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
      const passwordRegex =
        /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
      if (!passwordRegex.test(password)) {
        return res.status(400).json({
          error:
            "Password must be at least 8 characters long and contain at least one uppercase letter, one lowercase letter, one number, and one special character",
        });
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
      const [existing] =
        await sql`SELECT user_id FROM users WHERE email = ${email} AND user_id <> ${userId}`;
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

    const query = `UPDATE users SET ${setClauses.join(
      ", "
    )} WHERE user_id = $1`;
    await sql.query(query, [userId, ...values]);

    // Get updated user data and create new JWT token
    const [updatedUser] = await sql`
      SELECT user_id, name, email, user_photo
      FROM users
      WHERE user_id = ${userId}
    `;

    const newToken = jwt.sign(
      {
        userId: updatedUser.user_id,
        email: updatedUser.email,
        name: updatedUser.name,
        photo: updatedUser.user_photo,
      },
      process.env.JWT_SECRET_KEY,
      {
        expiresIn: "7d",
      }
    );

    // Set new cookie
    res.cookie("jwt", newToken, {
      maxAge: 7 * 24 * 60 * 60 * 1000,
      httpOnly: true,
      sameSite: "none",
      secure: true,
      path: "/",
    });

    res.status(200).json({
      success: true,
      message: "Profile updated successfully",
      token: newToken,
      user: {
        user_id: updatedUser.user_id,
        name: updatedUser.name,
        email: updatedUser.email,
        photo: updatedUser.user_photo,
      },
    });
  } catch (error) {
    console.error("Error updating profile:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

export const deleteUser = async (req, res) => {
  // Derive user from JWT rather than trusting body input
  const authToken =
    req.cookies.jwt ||
    req.body.token ||
    req.headers.authorization?.split(" ")[1];
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
    res
      .status(200)
      .json({ success: true, message: "User deleted successfully" });
  } catch (error) {
    console.error("Error deleting user:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

export const logout = async (_, res) => {
  try {
    res.clearCookie("jwt", {
      httpOnly: true,
      secure: true,
      sameSite: "none",
      path: "/",
    });
    res.status(200).json({ success: true, message: "Logout successful" });
  } catch (error) {
    console.error("Error logging out:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

export const authUser = async (req, res) => {
  const authToken =
    req.cookies.jwt ||
    req.body.token ||
    req.headers.authorization?.split(" ")[1];

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

  // ✅ FIX: Include org_id and otp in the user select query
  const [user] = await sql`
    SELECT user_id, name, email, user_photo, org_id, otp
    FROM users
    WHERE user_id = ${userId}
  `;

  if (!user) {
    return res.status(401).json({ message: "User not found" });
  }

  // Check if email is verified (otp should be null for verified users)
  if (user.otp !== null) {
    return res.status(403).json({
      message: "Email verification required",
      requiresVerification: true,
      email: user.email,
    });
  }

  // Remove otp from response
  const { otp, ...userResponse } = user;
  return res.json({ user: userResponse });
};

export const refreshToken = async (req, res) => {
  try {
    const authToken =
      req.cookies.jwt ||
      req.body.token ||
      req.headers.authorization?.split(" ")[1];

    if (!authToken) {
      return res.status(401).json({ message: "No token provided" });
    }

    let decoded;
    try {
      decoded = jwt.verify(authToken, process.env.JWT_SECRET_KEY);
    } catch (error) {
      return res.status(401).json({ message: "Invalid token" });
    }

    if (!decoded.userId) {
      return res.status(401).json({ message: "Invalid token structure" });
    }

    // Get fresh user data from database
    const [user] = await sql`
      SELECT user_id, name, email, user_photo, org_id
      FROM users
      WHERE user_id = ${decoded.userId}
    `;

    if (!user) {
      return res.status(401).json({ message: "User not found" });
    }

    // Generate new token with all required fields
    const newToken = jwt.sign(
      {
        userId: user.user_id,
        email: user.email,
        name: user.name,
        photo: user.user_photo,
      },
      process.env.JWT_SECRET_KEY,
      {
        expiresIn: "7d",
      }
    );

    // Set new cookie
    res.cookie("jwt", newToken, {
      maxAge: 7 * 24 * 60 * 60 * 1000,
      httpOnly: true,
      sameSite: "none",
      secure: true,
      path: "/",
    });

    res.status(200).json({
      message: "Token refreshed successfully",
      token: newToken,
      user: {
        user_id: user.user_id,
        name: user.name,
        email: user.email,
        photo: user.user_photo,
        org_id: user.org_id,
      },
    });
  } catch (error) {
    console.error("Error refreshing token:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

export const getUserPhoto = async (req, res) => {
  try {
    const { userId } = req.params;

    // Verify the requesting user is authenticated
    const authToken =
      req.cookies.jwt || req.headers.authorization?.split(" ")[1];

    if (!authToken) {
      return res.status(401).json({ message: "No token provided" });
    }

    try {
      jwt.verify(authToken, process.env.JWT_SECRET_KEY);
    } catch (error) {
      return res.status(401).json({ message: "Invalid token" });
    }

    // Get user photo from database
    const [user] = await sql`
      SELECT user_photo
      FROM users
      WHERE user_id = ${userId}
    `;

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    res.status(200).json({
      photo: user.user_photo,
    });
  } catch (error) {
    console.error("Error fetching user photo:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};
