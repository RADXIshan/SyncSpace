import emailService from "./emailServiceClient.js";

// Helper for retrying with exponential backoff
const retryWithBackoff = async (fn, maxRetries = 3, baseDelay = 1000) => {
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

// Send email with retries using the email service
export const sendEmailWithRetry = async (mailOptions) => {
  // First check email service health
  console.log("Checking email service health...");
  const isHealthy = await emailService.checkHealth();
  
  if (!isHealthy) {
    throw new Error("Email service is not available");
  }
  
  // Then try to send the email with retries
  console.log("Sending email through service...");
  const result = await retryWithBackoff(() => emailService.sendEmail(mailOptions));
  
  if (!result.success) {
    throw new Error(result.error || "Failed to send email");
  }
  
  return result;
};