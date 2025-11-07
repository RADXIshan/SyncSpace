import axios from "axios";
import dotenv from "dotenv";

dotenv.config();

const EMAIL_SERVICE_URL = process.env.EMAIL_SERVICE_URL || "http://localhost:3001";

class EmailServiceClient {
  constructor() {
    this.client = axios.create({
      baseURL: EMAIL_SERVICE_URL,
      timeout: 15000, // 15 second timeout
      headers: {
        "Content-Type": "application/json"
      }
    });
  }

  async sendEmail({ to, subject, html, from = undefined }) {
    try {
      const response = await this.client.post("/api/send-email", {
        to,
        subject,
        html,
        from
      });

      if (response.data.success) {
        console.log("✅ Email sent successfully through email service");
        return { success: true };
      } else {
        throw new Error(response.data.message || "Failed to send email");
      }
    } catch (error) {
      console.error("❌ Email service error:", {
        message: error?.message,
        code: error?.code,
        response: error?.response?.data,
      });

      // Return a standardized error response
      return {
        success: false,
        error: error?.response?.data?.message || error?.message || "Email service unavailable",
        details: process.env.NODE_ENV === "development" ? error : undefined
      };
    }
  }

  async checkHealth() {
    try {
      const response = await this.client.get("/health");
      return response.data.status === "ok";
    } catch (error) {
      console.error("❌ Email service health check failed:", error?.message);
      return false;
    }
  }
}

// Create a singleton instance
const emailService = new EmailServiceClient();

export default emailService;