const generatePasswordResetEmail = (resetLink) => {
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
    <title>Password Reset - SyncSpace</title>
    <!--[if mso]>
    <noscript>
      <xml>
        <o:OfficeDocumentSettings>
          <o:AllowPNG/>
          <o:PixelsPerInch>96</o:PixelsPerInch>
        </o:OfficeDocumentSettings>
      </xml>
    </noscript>
    <![endif]-->
    <style>
      /* Import Montserrat font */
      @import url('https://fonts.googleapis.com/css2?family=Montserrat:wght@400;500;600;700;800&display=swap');
      
      /* Reset styles for email clients */
      * {
        box-sizing: border-box;
      }
      
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

      .security-badge {
        display: inline-flex;
        align-items: center;
        gap: 8px;
        background: rgba(239, 68, 68, 0.15);
        border: 1px solid rgba(239, 68, 68, 0.3);
        border-radius: 50px;
        padding: 12px 24px;
        font-size: 14px;
        font-weight: 600;
        color: rgba(255, 255, 255, 0.9);
        margin-bottom: 24px;
        backdrop-filter: blur(50px);
        -webkit-backdrop-filter: blur(50px);
        box-shadow: 
          0 12px 40px rgba(239, 68, 68, 0.2),
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

      .reset-button {
        display: inline-block;
        margin: 32px 0;
        padding: 18px 36px;
        background: rgba(239, 68, 68, 0.15);
        border: 1px solid rgba(239, 68, 68, 0.3);
        color: #ffffff !important;
        text-decoration: none;
        font-weight: 600;
        font-size: 16px;
        border-radius: 12px;
        transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        backdrop-filter: blur(30px);
        -webkit-backdrop-filter: blur(30px);
        box-shadow: 
          0 8px 32px rgba(239, 68, 68, 0.3),
          inset 0 1px 0 rgba(255, 255, 255, 0.2);
      }

      .link-container {
        background: rgba(0, 0, 0, 0.02);
        border: 1px solid rgba(255, 255, 255, 0.06);
        border-radius: 16px;
        padding: 24px;
        margin: 24px 0;
        word-break: break-all;
        backdrop-filter: blur(40px);
        -webkit-backdrop-filter: blur(40px);
        box-shadow: 
          0 8px 32px rgba(0, 0, 0, 0.5),
          inset 0 1px 0 rgba(255, 255, 255, 0.12);
      }

      .link-container p {
        margin: 0 0 12px;
        color: rgba(59, 130, 246, 0.8);
        font-weight: 600;
        font-size: 14px;
      }

      .link-container a {
        color: #60a5fa;
        text-decoration: none;
        font-size: 14px;
        line-height: 1.5;
        word-break: break-all;
      }

      .security-notice {
        background: rgba(245, 158, 11, 0.08);
        border: 1px solid rgba(245, 158, 11, 0.2);
        border-radius: 12px;
        padding: 20px;
        margin: 24px 0;
        color: #fcd34d;
        font-size: 14px;
        line-height: 1.6;
      }

      .expiry-notice {
        background: rgba(239, 68, 68, 0.08);
        border: 1px solid rgba(239, 68, 68, 0.2);
        border-radius: 12px;
        padding: 20px;
        margin: 24px 0;
        color: #fecaca;
        text-align: center;
        font-size: 14px;
        line-height: 1.6;
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
        
        .reset-button {
          padding: 16px 28px;
          font-size: 15px;
        }
        
        .link-container {
          padding: 20px 16px;
        }

        .footer {
          padding: 24px 20px;
        }
      }

      /* High contrast mode support */
      @media (prefers-contrast: high) {
        .glass-container {
          border: 2px solid;
        }
        
        .reset-button {
          border: 2px solid;
        }
      }

      /* Reduced motion support */
      @media (prefers-reduced-motion: reduce) {
        * {
          transition: none !important;
          animation: none !important;
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
          <div class="security-badge">
            🔐 Password Reset Request
          </div>
          <h1>Reset Your Password</h1>
          <p>Secure password reset for your account</p>
        </div>

        <div class="glass-content">
          <div class="content-inner">
            <p class="greeting">Hello there!</p>
            
            <p>We received a request to reset the password for your SyncSpace account. This is a security-protected process to ensure your account remains safe and secure.</p>

            <div class="security-notice">
              <strong>🛡️ Security Information:</strong> This password reset request was initiated from your account. If you did not request this change, please contact our support team immediately.
            </div>

            <p>To create a new password for your account, please click the secure button below:</p>

            <div style="text-align: center;">
              <a href="${resetLink}" class="reset-button">
                Reset My Password →
              </a>
            </div>

            <div class="expiry-notice">
              <strong>⏰ Important:</strong> This password reset link expires in 1 hour for your security. Please complete the process promptly.
            </div>

            <p>If the button above doesn't work, you can copy and paste this secure link into your browser:</p>

            <div class="link-container">
              <p>Password Reset Link:</p>
              <a href="${resetLink}">${resetLink}</a>
            </div>

            <p style="margin-top: 32px; font-size: 14px; color: rgba(255, 255, 255, 0.7);">
              <strong>Didn't request this?</strong> If you did not request a password reset, you can safely ignore this email. Your account password will remain unchanged and secure.
            </p>

            <p style="font-size: 14px; color: rgba(255, 255, 255, 0.7);">
              For additional security questions or support, please contact our team through the SyncSpace platform.
            </p>
          </div>
        </div>

        <div class="footer">
          <p class="copyright">&copy; ${year} SyncSpace - Team Collaboration Platform</p>
          <p class="disclaimer">This is an automated security message. Please do not reply to this email.</p>
        </div>
      </div>
    </div>
  </body>
  </html>
  `;
};

export { generatePasswordResetEmail };