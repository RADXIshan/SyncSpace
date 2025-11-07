import nodemailer from "nodemailer";

// Create a reusable transporter with improved options
export const createTransporter = () => {
  return nodemailer.createTransport({
    service: "gmail",
    host: "smtp.gmail.com",
    port: 587,
    secure: false,
    auth: {
      user: process.env.EMAIL,
      pass: process.env.APP_PASSWORD,
    },
    // Add connection handling options
    pool: true, // Use pooled connections
    maxConnections: 3,
    maxMessages: 100,
    rateDelta: 1000,
    rateLimit: 5,
    socketTimeout: 10000, // 10 second socket timeout
    // TLS options for better error handling
    tls: {
      rejectUnauthorized: true, // Verify TLS certs
      minVersion: "TLSv1.2"
    }
  });
};

// Helper for retrying with exponential backoff
export const retryWithBackoff = async (fn, maxRetries = 3, baseDelay = 1000) => {
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await fn();
    } catch (err) {
      console.log(`Email attempt ${i + 1} failed:`, err?.message);
      
      if (i === maxRetries - 1) throw err;
      
      // Exponential backoff with jitter
      const delay = baseDelay * Math.pow(2, i) * (0.5 + Math.random() * 0.5);
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
};

// Send email with retries and connection verification
export const sendEmailWithRetry = async (mailOptions) => {
  const transporter = createTransporter();
  
  // First verify SMTP connection
  console.log("Verifying SMTP connection...");
  await retryWithBackoff(() => transporter.verify());
  
  // Then try to send the email with retries
  console.log("Sending email...");
  return await retryWithBackoff(() => transporter.sendMail(mailOptions));
};