import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import sql from "../database/db.js";
import { v2 as cloudinary } from "cloudinary";
import nodemailer from "nodemailer";
import dotenv from "dotenv";

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

    // Validate environment variables
    if (!process.env.EMAIL || !process.env.APP_PASSWORD) {
      console.error("Missing email configuration for signup:", {
        hasEmail: !!process.env.EMAIL,
        hasAppPassword: !!process.env.APP_PASSWORD,
      });
      return res.status(500).json({
        message: "Email service not configured properly",
      });
    }

    const transporter = nodemailer.createTransport({
      service: "gmail",
      host: "smtp.gmail.com",
      port: 587,
      secure: false,
      auth: {
        user: process.env.EMAIL,
        pass: process.env.APP_PASSWORD,
      },
    });

    // Verify transporter configuration
    try {
      await transporter.verify();
      console.log("Email transporter verified successfully for signup");
    } catch (verifyError) {
      console.error(
        "Email transporter verification failed for signup:",
        verifyError
      );
      return res.status(500).json({
        message: "Email service configuration error",
      });
    }

    const mailOptions = {
      from: {
        name: "SyncSpace",
        address: process.env.EMAIL,
      },
      to: email,
      subject: "Verify Your Email for SyncSpace",
      html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #7c3aed;">Welcome to SyncSpace, ${name}!</h2>
            <p>Thank you for signing up. Please verify your email address to complete your registration.</p>
            <div style="background-color: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0;">
              <h3 style="margin: 0 0 10px 0;">Your Verification Code:</h3>
              <p style="font-size: 32px; font-weight: bold; color: #7c3aed; margin: 0; letter-spacing: 4px; text-align: center;">${otpString}</p>
            </div>
            <p>Enter this code in the verification screen to activate your account.</p>
            <p style="color: #666; font-size: 12px;">This code will expire in 10 minutes. If you didn't create an account, please ignore this email.</p>
          </div>
        `,
      text: `Welcome to SyncSpace, ${name}!\n\nThank you for signing up. Please verify your email address to complete your registration.\n\nYour Verification Code: ${otpString}\n\nEnter this code in the verification screen to activate your account.\n\nThis code will expire in 10 minutes.`,
    };

    try {
      console.log("Sending signup verification email to:", email);
      const result = await transporter.sendMail(mailOptions);
      console.log("Signup email sent successfully:", result.messageId);

      res.status(201).json({
        success: true,
        message: "User created successfully. Please verify your email.",
        user: {
          user_id: newUser.user_id,
          name: newUser.name,
          email: newUser.email,
        },
        token,
        requiresVerification: true,
      });
    } catch (emailError) {
      console.error("Failed to send signup email:", emailError);
      res.status(500).json({
        message: "Failed to send verification email",
        error:
          process.env.NODE_ENV === "development"
            ? emailError.message
            : undefined,
      });
    }
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
      sql`SELECT user_id FROM users WHERE email = ${email}`,
      new Promise((_, reject) =>
        setTimeout(() => reject(new Error("Database timeout")), 5000)
      ),
    ]);

    if (!user) {
      return res.status(401).json({ message: "User not found" });
    }

    const resetLink = process.env.CLIENT_URL + `/reset-password/${email}`;

    // Validate environment variables
    if (!process.env.EMAIL || !process.env.APP_PASSWORD) {
      console.error("Missing email configuration for forgot password:", {
        hasEmail: !!process.env.EMAIL,
        hasAppPassword: !!process.env.APP_PASSWORD,
      });
      return res.status(500).json({
        message: "Email service not configured properly",
      });
    }

    const transporter = nodemailer.createTransport({
      service: "gmail",
      host: "smtp.gmail.com",
      port: 587,
      secure: false,
      auth: {
        user: process.env.EMAIL,
        pass: process.env.APP_PASSWORD,
      },
    });

    // Verify transporter configuration
    try {
      await transporter.verify();
      console.log(
        "Email transporter verified successfully for forgot password"
      );
    } catch (verifyError) {
      console.error(
        "Email transporter verification failed for forgot password:",
        verifyError
      );
      return res.status(500).json({
        message: "Email service configuration error",
      });
    }

    const mailOptions = {
      from: {
        name: "SyncSpace",
        address: process.env.EMAIL,
      },
      to: email,
      subject: "Reset Your SyncSpace Password",
      html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #7c3aed;">Password Reset Request</h2>
            <p>You requested to reset your password for your SyncSpace account.</p>
            <div style="background-color: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0;">
              <p style="margin: 0 0 15px 0;">Click the button below to reset your password:</p>
              <a href="${resetLink}" style="display: inline-block; background-color: #7c3aed; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold;">Reset Password</a>
            </div>
            <p>Or copy and paste this link in your browser:</p>
            <p style="word-break: break-all; color: #7c3aed;">${resetLink}</p>
            <p style="color: #666; font-size: 12px;">If you didn't request this password reset, please ignore this email. Your password will remain unchanged.</p>
          </div>
        `,
      text: `Password Reset Request\n\nYou requested to reset your password for your SyncSpace account.\n\nClick this link to reset your password: ${resetLink}\n\nIf you didn't request this password reset, please ignore this email.`,
    };

    try {
      console.log("Sending password reset email to:", email);
      const result = await transporter.sendMail(mailOptions);
      console.log("Password reset email sent successfully:", result.messageId);
      res
        .status(200)
        .json({
          success: true,
          message: `Password reset link sent to ${email}`,
        });
    } catch (emailError) {
      console.error("Failed to send password reset email:", emailError);
      res.status(500).json({
        message: "Failed to send reset link",
        error:
          process.env.NODE_ENV === "development"
            ? emailError.message
            : undefined,
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

    // Validate environment variables
    if (!process.env.EMAIL || !process.env.APP_PASSWORD) {
      console.error("Missing email configuration for resend OTP:", {
        hasEmail: !!process.env.EMAIL,
        hasAppPassword: !!process.env.APP_PASSWORD,
      });
      return res.status(500).json({
        message: "Email service not configured properly",
      });
    }

    const transporter = nodemailer.createTransport({
      service: "gmail",
      host: "smtp.gmail.com",
      port: 587,
      secure: false,
      auth: {
        user: process.env.EMAIL,
        pass: process.env.APP_PASSWORD,
      },
    });

    // Verify transporter configuration
    try {
      await transporter.verify();
      console.log("Email transporter verified successfully for resend OTP");
    } catch (verifyError) {
      console.error(
        "Email transporter verification failed for resend OTP:",
        verifyError
      );
      return res.status(500).json({
        message: "Email service configuration error",
      });
    }

    const mailOptions = {
      from: {
        name: "SyncSpace",
        address: process.env.EMAIL,
      },
      to: email,
      subject: "Your New Verification Code for SyncSpace",
      html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #7c3aed;">New Verification Code</h2>
            <p>Hi ${user.name},</p>
            <p>You requested a new verification code for your SyncSpace account.</p>
            <div style="background-color: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0;">
              <h3 style="margin: 0 0 10px 0;">Your New Verification Code:</h3>
              <p style="font-size: 32px; font-weight: bold; color: #7c3aed; margin: 0; letter-spacing: 4px; text-align: center;">${otp}</p>
            </div>
            <p>Enter this code in the verification screen to activate your account.</p>
            <p style="color: #666; font-size: 12px;">This code will expire in 10 minutes. If you didn't request this code, please ignore this email.</p>
          </div>
        `,
      text: `New Verification Code\n\nHi ${user.name},\n\nYou requested a new verification code for your SyncSpace account.\n\nYour New Verification Code: ${otp}\n\nEnter this code in the verification screen to activate your account.\n\nThis code will expire in 10 minutes.`,
    };

    try {
      console.log("Sending resend OTP email to:", email);
      const result = await transporter.sendMail(mailOptions);
      console.log("Resend OTP email sent successfully:", result.messageId);
      res.status(200).json({ success: true, message: "OTP sent successfully" });
    } catch (emailError) {
      console.error("Failed to send resend OTP email:", emailError);
      res.status(500).json({
        message: "Failed to send OTP",
        error:
          process.env.NODE_ENV === "development"
            ? emailError.message
            : undefined,
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
