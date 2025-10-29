import nodemailer from "nodemailer";
import generateOtpEmail from "../templates/otpEmail.js";
import generateForgotPasswordEmail from "../templates/forgotPasswordEmail.js";

class EmailService {
  // Create transporter with Gmail SMTP
  createTransporter() {
    return nodemailer.createTransporter({
      service: "gmail",
      host: "smtp.gmail.com",
      port: 587,
      secure: false,
      auth: {
        user: process.env.EMAIL,
        pass: process.env.MAIL_PASSWORD || process.env.APP_PASSWORD,
      },
      connectionTimeout: 10000, // 10 seconds
      greetingTimeout: 5000,    // 5 seconds
      socketTimeout: 10000,     // 10 seconds
    });
  }

  // Send email with retry logic
  async sendEmail(message, maxRetries = 3) {
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        const transporter = this.createTransporter();
        const info = await Promise.race([
          transporter.sendMail(message),
          new Promise((_, reject) => 
            setTimeout(() => reject(new Error('Email sending timeout')), 25000)
          )
        ]);
        
        // Close the transporter
        transporter.close();
        
        console.log(`✅ Email sent successfully via Gmail SMTP (attempt ${attempt})`);
        console.log("Message ID: %s", info.messageId);
        console.log("📧 Email sent to: %s", message.to);
        return info;
      } catch (error) {
        console.log(`❌ Gmail SMTP attempt ${attempt} failed: ${error.message}`);
        
        if (attempt === maxRetries) {
          console.log("❌ All email attempts failed");
          throw error;
        }
        
        // Wait before retrying (exponential backoff)
        const delay = Math.pow(2, attempt) * 1000; // 2s, 4s, 8s
        console.log(`⏳ Retrying in ${delay/1000} seconds...`);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
  }

  // Send verification email
  async sendVerificationEmail(email, name, otp) {
    const message = {
      from: `SyncSpace Security <${process.env.EMAIL}>`,
      to: email,
      subject: "Account Verification Code - Action Required",
      html: generateOtpEmail(name, otp),
    };

    return await this.sendEmail(message);
  }

  // Send OTP resend email
  async sendOtpResendEmail(email, name, otp) {
    const message = {
      from: `SyncSpace Security <${process.env.EMAIL}>`,
      to: email,
      subject: "New Verification Code - Please Confirm",
      html: generateOtpEmail(name, otp),
    };

    return await this.sendEmail(message);
  }

  // Send password reset email
  async sendPasswordResetEmail(email, name, resetLink) {
    const message = {
      from: `SyncSpace Security <${process.env.EMAIL}>`,
      to: email,
      subject: "Password Reset Request - Secure Link Inside",
      html: generateForgotPasswordEmail(name, resetLink),
    };

    return await this.sendEmail(message);
  }

  // Send team invitation email
  async sendTeamInviteEmail(email, inviterName, teamName, inviteLink) {
    const message = {
      from: `SyncSpace Team <${process.env.EMAIL}>`,
      to: email,
      subject: `You're invited to join ${teamName} on SyncSpace`,
      html: this.generateTeamInviteEmail(inviterName, teamName, inviteLink),
    };

    return await this.sendEmail(message);
  }

  // Generate team invite email template
  generateTeamInviteEmail(inviterName, teamName, inviteLink) {
    const year = new Date().getFullYear();
    return `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8" />
      <meta name="viewport" content="width=device-width, initial-scale=1.0" />
      <meta name="format-detection" content="telephone=no" />
      <meta name="x-apple-disable-message-reformatting" />
      <meta name="color-scheme" content="light dark" />
      <meta name="supported-color-schemes" content="light dark" />
      <title>Team Invitation - SyncSpace</title>
      <style>
        /* Import Montserrat font */
        @import url('https://fonts.googleapis.com/css2?family=Montserrat:wght@400;500;600;700;800&display=swap');
        
        /* Reset styles for email clients */
        * { box-sizing: border-box; }
        
        body, table, td, p, a, li, blockquote {
          -webkit-text-size-adjust: 100%;
          -ms-text-size-adjust: 100%;
        }
        
        table, td {
          mso-table-lspace: 0pt;
          mso-table-rspace: 0pt;
        }
        
        img {
          -ms-interpolation-mode: bicubic;
          border: 0;
          height: auto;
          line-height: 100%;
          outline: none;
          text-decoration: none;
        }

        /* Base styles */
        body {
          margin: 0 !important;
          padding: 0 !important;
          font-family: 'Montserrat', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
          line-height: 1.6;
          min-height: 100vh;
          -webkit-font-smoothing: antialiased;
          -moz-osx-font-smoothing: grayscale;
        }

        /* Dark mode (default) */
        body {
          background: linear-gradient(135deg, #0f0d2a 0%, #1a1654 25%, #0f1a3a 50%, #0f1629 75%, #0f0d2a 100%);
          color: #ffffff;
        }

        .email-container {
          max-width: 600px;
          margin: 0 auto;
          background: transparent;
        }

        .brand-container {
          text-align: center;
          padding: 40px 20px 20px;
        }

        .brand-logo {
          display: inline-flex;
          align-items: center;
          gap: 12px;
          text-decoration: none;
          color: inherit;
        }

        .brand-icon {
          width: 48px;
          height: 48px;
          background: linear-gradient(135deg, #a855f7 0%, #3b82f6 100%);
          border-radius: 16px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 24px;
          font-weight: 800;
          color: white;
          box-shadow: 0 8px 32px rgba(168, 85, 247, 0.3);
        }

        .brand-name {
          font-size: 28px;
          font-weight: 700;
          background: linear-gradient(135deg, #a855f7 0%, #3b82f6 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
          margin: 0;
        }

        .glass-container {
          background: rgba(255, 255, 255, 0.01);
          border: 1px solid rgba(255, 255, 255, 0.1);
          border-radius: 24px;
          margin: 20px;
          overflow: hidden;
          box-shadow: 
            0 8px 32px rgba(0, 0, 0, 0.3),
            0 2px 8px rgba(0, 0, 0, 0.15),
            inset 0 1px 0 rgba(255, 255, 255, 0.15),
            inset 0 -1px 0 rgba(255, 255, 255, 0.03);
          backdrop-filter: blur(40px);
          -webkit-backdrop-filter: blur(40px);
        }

        .glass-header {
          text-align: center;
          padding: 40px 30px;
          background: rgba(255, 255, 255, 0.008);
          border-bottom: 1px solid rgba(255, 255, 255, 0.1);
          position: relative;
        }

        .invite-badge {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          background: rgba(34, 197, 94, 0.15);
          border: 1px solid rgba(34, 197, 94, 0.3);
          border-radius: 50px;
          padding: 12px 24px;
          font-size: 14px;
          font-weight: 600;
          color: rgba(255, 255, 255, 0.9);
          margin-bottom: 24px;
          backdrop-filter: blur(50px);
          -webkit-backdrop-filter: blur(50px);
          box-shadow: 
            0 12px 40px rgba(34, 197, 94, 0.2),
            inset 0 1px 0 rgba(255, 255, 255, 0.4);
        }

        .glass-header h1 {
          margin: 0 0 12px 0;
          font-size: 32px;
          font-weight: 700;
          color: #ffffff;
          letter-spacing: -0.5px;
        }

        .glass-header p {
          margin: 0;
          font-size: 16px;
          color: rgba(255, 255, 255, 0.8);
          font-weight: 500;
        }

        .glass-content {
          padding: 40px;
          background: rgba(0, 0, 0, 0.02);
          position: relative;
        }

        .content-inner p {
          font-size: 16px;
          color: rgba(255, 255, 255, 0.9);
          margin: 0 0 20px;
          line-height: 1.7;
          font-weight: 400;
        }

        .greeting {
          font-weight: 600;
          color: #ffffff;
        }

        .team-info {
          background: rgba(0, 0, 0, 0.02);
          border: 1px solid rgba(255, 255, 255, 0.06);
          border-radius: 16px;
          padding: 24px;
          margin: 24px 0;
          text-align: center;
          backdrop-filter: blur(40px);
          -webkit-backdrop-filter: blur(40px);
          box-shadow: 
            0 8px 32px rgba(0, 0, 0, 0.5),
            inset 0 1px 0 rgba(255, 255, 255, 0.12);
        }

        .team-name {
          font-size: 24px;
          font-weight: 700;
          color: #ffffff;
          margin: 0 0 8px 0;
        }

        .inviter-name {
          font-size: 16px;
          color: rgba(168, 85, 247, 0.8);
          font-weight: 600;
        }

        .join-button {
          display: inline-block;
          margin: 32px 0;
          padding: 18px 36px;
          background: rgba(34, 197, 94, 0.15);
          border: 1px solid rgba(34, 197, 94, 0.3);
          color: #ffffff !important;
          text-decoration: none;
          font-weight: 600;
          font-size: 16px;
          border-radius: 12px;
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
          backdrop-filter: blur(30px);
          -webkit-backdrop-filter: blur(30px);
          box-shadow: 
            0 8px 32px rgba(34, 197, 94, 0.3),
            inset 0 1px 0 rgba(255, 255, 255, 0.2);
        }

        .footer {
          text-align: center;
          padding: 32px 40px;
          border-top: 1px solid rgba(255, 255, 255, 0.08);
          background: rgba(0, 0, 0, 0.1);
        }

        .footer p {
          margin: 0 0 8px 0;
          font-size: 14px;
          color: rgba(255, 255, 255, 0.6);
          font-weight: 500;
        }

        .footer .copyright {
          font-weight: 600;
          color: rgba(255, 255, 255, 0.8);
        }

        .footer .disclaimer {
          font-size: 12px;
          color: rgba(255, 255, 255, 0.5);
          margin-top: 8px;
        }

        /* Light mode - keeping dark theme for consistency */
        @media (prefers-color-scheme: light) {
          /* Keep the same dark styling for light mode */
        }

        /* Mobile responsiveness */
        @media only screen and (max-width: 600px) {
          .glass-container {
            margin: 10px;
            border-radius: 16px;
          }
          
          .brand-container {
            padding: 20px 15px 15px;
          }

          .brand-icon {
            width: 40px;
            height: 40px;
            font-size: 20px;
          }

          .brand-name {
            font-size: 24px;
          }
          
          .glass-header {
            padding: 30px 20px;
          }
          
          .glass-header h1 {
            font-size: 28px;
          }
          
          .glass-content {
            padding: 30px 20px;
          }
          
          .join-button {
            padding: 16px 28px;
            font-size: 15px;
          }

          .footer {
            padding: 24px 20px;
          }
        }
      </style>
    </head>
    <body>
      <div class="email-container">
        <!-- Brand Header -->
        <div class="brand-container">
          <a href="https://syncspace-client.vercel.app" class="brand-logo">
            <div class="brand-icon">S</div>
            <h1 class="brand-name">SyncSpace</h1>
          </a>
        </div>

        <!-- Main Content -->
        <div class="glass-container">
          <div class="glass-header">
            <div class="invite-badge">
              👥 Team Invitation
            </div>
            <h1>You're Invited!</h1>
            <p>Join your team on SyncSpace</p>
          </div>

          <div class="glass-content">
            <div class="content-inner">
              <p class="greeting">Hello there!</p>
              
              <p><strong>${inviterName}</strong> has invited you to join their team on SyncSpace. Start collaborating with your team members in a modern, efficient workspace.</p>

              <div class="team-info">
                <div class="team-name">${teamName}</div>
                <div class="inviter-name">Invited by ${inviterName}</div>
              </div>

              <p>SyncSpace brings your team together with powerful collaboration tools, real-time communication, and seamless project management. Join thousands of teams already using SyncSpace to work better together.</p>

              <div style="text-align: center;">
                <a href="${inviteLink}" class="join-button">
                  Join Team →
                </a>
              </div>

              <p style="margin-top: 32px; font-size: 14px; color: rgba(255, 255, 255, 0.7);">
                This invitation was sent to you by ${inviterName}. If you don't want to join this team, you can safely ignore this email.
              </p>
            </div>
          </div>

          <div class="footer">
            <p class="copyright">&copy; ${year} SyncSpace - Team Collaboration Platform</p>
            <p class="disclaimer">This is an automated invitation. Please do not reply to this email.</p>
          </div>
        </div>
      </div>
    </body>
    </html>
    `;
  }
}

// Create a singleton instance
const emailService = new EmailService();

export default emailService;
