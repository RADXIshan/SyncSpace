import nodemailer from "nodemailer";
import { generateOtpEmail } from "../templates/emailTemplate.js";

class EmailService {
  constructor() {
    this.transporter = null;
    this.isInitialized = false;
  }

  // Initialize the email service with the best working configuration
  async initialize() {
    if (this.isInitialized) return;

    const configs = [
      {
        name: "Standard Gmail SMTP",
        config: {
          service: "gmail",
          host: "smtp.gmail.com",
          port: 587,
          secure: false,
          pool: false,
          connectionTimeout: 15000,
          greetingTimeout: 10000,
          socketTimeout: 15000,
          auth: {
            user: process.env.EMAIL,
            pass: process.env.APP_PASSWORD,
          },
        },
      },
      {
        name: "Gmail SMTP with TLS",
        config: {
          service: "gmail",
          host: "smtp.gmail.com",
          port: 587,
          secure: false,
          pool: false,
          connectionTimeout: 15000,
          greetingTimeout: 10000,
          socketTimeout: 15000,
          auth: {
            user: process.env.EMAIL,
            pass: process.env.APP_PASSWORD,
          },
          tls: {
            rejectUnauthorized: false,
          },
        },
      },
    ];

    for (const { name, config } of configs) {
      try {
        const testTransporter = nodemailer.createTransport(config);
        await testTransporter.verify();
        testTransporter.close();

        this.config = config;
        this.configName = name;
        this.isInitialized = true;
        console.log(`✅ Email service initialized with: ${name}`);
        return;
      } catch (error) {
        console.log(`❌ Failed to initialize with ${name}:`, error.message);
      }
    }

    throw new Error(
      "Failed to initialize email service with any configuration"
    );
  }

  // Create a fresh transporter for each email
  createTransporter() {
    return nodemailer.createTransport(this.config);
  }

  // Send email with retry logic
  async sendEmail(mailOptions, maxRetries = 3) {
    if (!this.isInitialized) {
      await this.initialize();
    }

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        const transporter = this.createTransporter();
        const result = await transporter.sendMail(mailOptions);
        transporter.close();

        console.log(
          `✅ Email sent successfully (attempt ${attempt}):`,
          result.messageId
        );
        return result;
      } catch (error) {
        console.error(`❌ Email attempt ${attempt} failed:`, error.message);

        if (attempt === maxRetries) {
          throw error;
        }

        // Wait before retrying (exponential backoff)
        const delay = Math.pow(2, attempt) * 1000; // 2s, 4s, 8s
        await new Promise((resolve) => setTimeout(resolve, delay));
      }
    }
  }

  // Send verification email
  async sendVerificationEmail(email, name, otp) {
    const mailOptions = {
      from: {
        name: "SyncSpace Security",
        address: process.env.EMAIL,
      },
      replyTo: "noreply@syncspace.com",
      headers: {
        "X-Priority": "1",
        "X-MSMail-Priority": "High",
        Importance: "high",
      },
      to: email,
      subject: "Account Verification Code - Action Required",
      html: generateOtpEmail(name, otp),
    };

    return await this.sendEmail(mailOptions);
  }

  // Send OTP resend email
  async sendOtpResendEmail(email, name, otp) {
    const mailOptions = {
      from: {
        name: "SyncSpace Security",
        address: process.env.EMAIL,
      },
      replyTo: "noreply@syncspace.com",
      headers: {
        "X-Priority": "1",
        "X-MSMail-Priority": "High",
        Importance: "high",
      },
      to: email,
      subject: "New Verification Code - Please Confirm",
      html: generateOtpEmail(name, otp),
    };

    return await this.sendEmail(mailOptions);
  }
}

// Create a singleton instance
const emailService = new EmailService();

export default emailService;
