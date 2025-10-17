export const generateOtpEmail = (name, otp) => {
  const year = new Date().getFullYear();
  return `
  <!DOCTYPE html>
  <html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Your SyncSpace Verification Code</title>
    <style>
      body {
        margin: 0;
        padding: 0;
        background: linear-gradient(135deg, #1a1a2e, #151522);
        font-family: 'Segoe UI', Roboto, Arial, sans-serif;
        color: #e0e0ff;
        line-height: 1.6;
      }

      .container {
        max-width: 600px;
        margin: 50px auto;
        background: rgba(255, 255, 255, 0.05);
        border: 1px solid rgba(255, 255, 255, 0.15);
        border-radius: 20px;
        backdrop-filter: blur(16px);
        box-shadow: 0 0 30px rgba(103, 58, 183, 0.2);
        overflow: hidden;
      }

      .header {
        background: linear-gradient(135deg, #667eea, #764ba2);
        text-align: center;
        padding: 40px 20px;
        color: #fff;
      }

      .header h1 {
        margin: 0;
        font-size: 28px;
        font-weight: 700;
        letter-spacing: 0.5px;
      }

      .header p {
        margin-top: 8px;
        font-size: 15px;
        color: rgba(255, 255, 255, 0.9);
      }

      .content {
        padding: 40px 35px;
      }

      .content p {
        font-size: 15px;
        color: #d3d3ff;
        margin: 0 0 18px;
      }

      .otp-box {
        background: rgba(102, 126, 234, 0.1);
        border: 1px solid rgba(118, 75, 162, 0.3);
        border-radius: 14px;
        padding: 25px;
        margin: 30px 0;
        text-align: center;
      }

      .otp-box h3 {
        margin: 0 0 10px;
        color: #a78bfa;
        font-weight: 600;
        font-size: 16px;
        text-transform: uppercase;
        letter-spacing: 0.5px;
      }

      .otp-code {
        font-family: 'Courier New', monospace;
        font-size: 32px;
        font-weight: bold;
        color: #ffffff;
        background: linear-gradient(90deg, #667eea, #764ba2);
        border-radius: 8px;
        padding: 18px 24px;
        text-align: center;
        display: inline-block;
        letter-spacing: 6px;
      }

      .button {
        display: inline-block;
        margin: 25px 0;
        padding: 14px 34px;
        background: linear-gradient(135deg, #667eea, #764ba2);
        color: #fff !important;
        text-decoration: none;
        font-weight: 600;
        border-radius: 10px;
        letter-spacing: 0.3px;
        transition: opacity 0.3s ease;
      }

      .button:hover {
        opacity: 0.85;
      }

      .footer {
        text-align: center;
        font-size: 13px;
        color: #9999cc;
        border-top: 1px solid rgba(255, 255, 255, 0.1);
        padding: 25px 20px;
        background: rgba(255, 255, 255, 0.02);
      }

      @media (max-width: 600px) {
        .container {
          margin: 20px;
        }
        .content {
          padding: 30px 20px;
        }
        .otp-code {
          font-size: 26px;
        }
      }
    </style>
  </head>
  <body>
    <div class="container">
      <div class="header">
        <h1>🔐 Verification Code</h1>
        <p>Secure your access to <strong>SyncSpace</strong></p>
      </div>

      <div class="content">
        <p>Hey ${name},</p>
        <p>Use the following One-Time Password (OTP) to verify your account or complete your action.</p>

        <div class="otp-box">
          <h3>Your OTP</h3>
          <div class="otp-code">${otp}</div>
        </div>

        <p>This code is valid for <strong>10 minutes</strong>. Please do not share it with anyone for your security.</p>

        <div style="text-align: center;">
          <a href="https://syncspace-client.vercel.app" class="button">Verify Now</a>
        </div>

        <p style="margin-top: 25px;">
          If you didn’t request this code, you can safely ignore this email.
        </p>
      </div>

      <div class="footer">
        <p>&copy; ${year} <strong>SyncSpace</strong>. All rights reserved.</p>
        <p style="margin-top: 8px;">Your collaborative hub for modern teams.</p>
      </div>
    </div>
  </body>
  </html>
  `;
};
