export const generateOtpEmail = (name, otp) => {
  const year = new Date().getFullYear();
  return `
  <!DOCTYPE html>
  <html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <meta name="format-detection" content="telephone=no" />
    <meta name="x-apple-disable-message-reformatting" />
    <title>Account Verification - SyncSpace Security Code</title>
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
      /* Reset styles for email clients */
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

      body {
        margin: 0 !important;
        padding: 0 !important;
        background: linear-gradient(135deg, #0f0f23 0%, #1a1a2e 50%, #16213e 100%);
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
        color: #ffffff;
        line-height: 1.6;
        min-height: 100vh;
      }

      .email-container {
        max-width: 600px;
        margin: 0 auto;
        background: transparent;
      }

      .glass-container {
        background: rgba(255, 255, 255, 0.02);
        border: 1px solid rgba(255, 255, 255, 0.1);
        border-radius: 24px;
        margin: 40px 20px;
        overflow: hidden;
        box-shadow: 
          0 20px 40px rgba(0, 0, 0, 0.4),
          0 8px 16px rgba(0, 0, 0, 0.2),
          inset 0 1px 0 rgba(255, 255, 255, 0.15),
          inset 0 -1px 0 rgba(255, 255, 255, 0.05);
      }

      .glass-header {
        background: linear-gradient(135deg, rgba(102, 126, 234, 0.9), rgba(118, 75, 162, 0.9));
        text-align: center;
        padding: 50px 30px;
        color: #ffffff;
        position: relative;
      }

      .glass-header::before {
        content: '';
        position: absolute;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background: rgba(255, 255, 255, 0.05);
        border-bottom: 1px solid rgba(255, 255, 255, 0.1);
      }

      .glass-header h1 {
        margin: 0;
        font-size: 32px;
        font-weight: 700;
        letter-spacing: 0.5px;
        position: relative;
        z-index: 1;
      }

      .glass-header p {
        margin: 12px 0 0 0;
        font-size: 16px;
        color: rgba(255, 255, 255, 0.95);
        position: relative;
        z-index: 1;
      }

      .glass-content {
        padding: 50px 40px;
        background: rgba(255, 255, 255, 0.01);
        position: relative;
      }

      .glass-content::before {
        content: '';
        position: absolute;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background: rgba(255, 255, 255, 0.02);
        border-radius: 0 0 24px 24px;
      }

      .content-inner {
        position: relative;
        z-index: 1;
      }

      .content-inner p {
        font-size: 16px;
        color: #e8e8ff;
        margin: 0 0 20px;
        line-height: 1.7;
      }

      .glass-otp-container {
        background: rgba(102, 126, 234, 0.08);
        border: 1px solid rgba(118, 75, 162, 0.25);
        border-radius: 20px;
        padding: 35px 25px;
        margin: 35px 0;
        text-align: center;
        position: relative;
        overflow: hidden;
      }

      .glass-otp-container::before {
        content: '';
        position: absolute;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background: rgba(255, 255, 255, 0.03);
        border-radius: 20px;
      }

      .otp-label {
        margin: 0 0 15px;
        color: #c4b5fd;
        font-weight: 600;
        font-size: 14px;
        text-transform: uppercase;
        letter-spacing: 1px;
        position: relative;
        z-index: 1;
      }

      .glass-otp-code {
        font-family: 'SF Mono', 'Monaco', 'Inconsolata', 'Roboto Mono', 'Courier New', monospace;
        font-size: 36px;
        font-weight: 800;
        color: #ffffff;
        background: linear-gradient(135deg, #667eea, #764ba2);
        border-radius: 12px;
        padding: 20px 30px;
        display: inline-block;
        letter-spacing: 8px;
        position: relative;
        z-index: 1;
        box-shadow: 
          0 8px 20px rgba(102, 126, 234, 0.3),
          inset 0 1px 0 rgba(255, 255, 255, 0.2);
      }

      .glass-button {
        display: inline-block;
        margin: 30px 0;
        padding: 16px 40px;
        background: rgba(102, 126, 234, 0.15);
        border: 1px solid rgba(118, 75, 162, 0.3);
        color: #ffffff !important;
        text-decoration: none;
        font-weight: 600;
        border-radius: 12px;
        letter-spacing: 0.5px;
        position: relative;
        overflow: hidden;
        transition: all 0.3s ease;
      }

      .glass-button::before {
        content: '';
        position: absolute;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background: linear-gradient(135deg, rgba(102, 126, 234, 0.2), rgba(118, 75, 162, 0.2));
        border-radius: 12px;
      }

      .glass-button span {
        position: relative;
        z-index: 1;
      }

      .security-notice {
        background: rgba(239, 68, 68, 0.08);
        border: 1px solid rgba(239, 68, 68, 0.2);
        border-radius: 12px;
        padding: 20px;
        margin: 25px 0;
        color: #fecaca;
      }

      .glass-footer {
        text-align: center;
        font-size: 14px;
        color: #a1a1aa;
        border-top: 1px solid rgba(255, 255, 255, 0.08);
        padding: 30px 40px;
        background: rgba(0, 0, 0, 0.1);
        position: relative;
      }

      .glass-footer::before {
        content: '';
        position: absolute;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background: rgba(255, 255, 255, 0.01);
      }

      .footer-content {
        position: relative;
        z-index: 1;
      }

      /* Mobile responsiveness */
      @media only screen and (max-width: 600px) {
        .glass-container {
          margin: 20px 10px;
          border-radius: 16px;
        }
        
        .glass-header {
          padding: 30px 20px;
        }
        
        .glass-header h1 {
          font-size: 24px;
        }
        
        .glass-content {
          padding: 30px 25px;
        }
        
        .glass-otp-code {
          font-size: 28px;
          padding: 15px 20px;
          letter-spacing: 4px;
        }
        
        .glass-button {
          padding: 14px 30px;
        }
      }

      /* Dark mode support */
      @media (prefers-color-scheme: dark) {
        .glass-container {
          background: rgba(255, 255, 255, 0.03);
        }
      }
    </style>
  </head>
  <body>
    <div class="email-container">
      <div class="glass-container">
        <div class="glass-header">
          <h1>🔐 Account Verification</h1>
          <p>Secure access to your <strong>SyncSpace</strong> account</p>
        </div>

        <div class="glass-content">
          <div class="content-inner">
            <p>Hello ${name},</p>
            <p>Thank you for using SyncSpace. Please use the verification code below to complete your account security verification. This is an important security step to protect your account.</p>

            <div class="glass-otp-container">
              <div class="otp-label">Your Verification Code</div>
              <div class="glass-otp-code">${otp}</div>
            </div>

            <div class="security-notice">
              <strong>⚠️ Security Notice:</strong> This verification code expires in 10 minutes. Never share this code with anyone. SyncSpace support will never ask for your verification code.
            </div>

            <p>To complete your verification, please enter this code in your SyncSpace application or click the button below:</p>

            <div style="text-align: center;">
              <a href="https://syncspace-client.vercel.app" class="glass-button">
                <span>Complete Verification</span>
              </a>
            </div>

            <p style="margin-top: 30px; color: #d1d5db;">
              If you did not request this verification code, please ignore this email. Your account remains secure and no action is required.
            </p>
          </div>
        </div>

        <div class="glass-footer">
          <div class="footer-content">
            <p>&copy; ${year} <strong>SyncSpace</strong> - Professional Team Collaboration Platform</p>
            <p style="margin-top: 8px; font-size: 12px;">This is an automated security notification from SyncSpace. Please do not reply to this email.</p>
          </div>
        </div>
      </div>
    </div>
  </body>
  </html>
  `;
};