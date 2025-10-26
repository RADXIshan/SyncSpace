import jwt from "jsonwebtoken";

export const authenticateToken = (req, res, next) => {
  try {
    // Get token from Authorization header or cookies
    const authHeader = req.headers.authorization;
    const token = authHeader?.startsWith('Bearer ') 
      ? authHeader.substring(7) 
      : req.cookies?.jwt;

    if (!token) {
      return res.status(401).json({ message: "Access token required" });
    }

    if (!process.env.JWT_SECRET_KEY) {
      console.error("JWT_SECRET_KEY is not defined in environment variables");
      return res.status(500).json({ message: "Server configuration error" });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET_KEY);
    
    if (!decoded.userId) {
      return res.status(401).json({ message: "Invalid token structure" });
    }

    req.user = {
      userId: decoded.userId,
      email: decoded.email,
      name: decoded.name
    };

    next();
  } catch (error) {
    console.error("Authentication error:", error);
    
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ message: "Token expired" });
    } else if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({ message: "Invalid token" });
    }
    
    return res.status(401).json({ message: "Authentication failed" });
  }
};