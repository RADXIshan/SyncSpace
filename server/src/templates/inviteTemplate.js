export const generateInviteEmail = (organizationName, message, inviteCode) => {
  return `
  <!DOCTYPE html>
  <html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Invitation to Join ${organizationName}</title>
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

      .invite-box {
        background: rgba(102, 126, 234, 0.1);
        border: 1px solid rgba(118, 75, 162, 0.3);
        border-radius: 14px;
        padding: 25px;
        margin: 30px 0;
      }

      .invite-box h3 {
        margin: 0 0 10px;
        color: #a78bfa;
        font-weight: 600;
        font-size: 16px;
        text-transform: uppercase;
        letter-spacing: 0.5px;
      }

      .invite-code {
        font-family: 'Courier New', monospace;
        font-size: 26px;
        font-weight: bold;
        color: #ffffff;
        background: linear-gradient(90deg, #667eea, #764ba2);
        border-radius: 8px;
        padding: 16px;
        text-align: center;
        letter-spacing: 4px;
      }

      ol {
        padding-left: 20px;
        color: #bdbdfd;
      }

      li {
        margin-bottom: 8px;
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
        .invite-code {
          font-size: 22px;
        }
      }
    </style>
  </head>
  <body>
    <div class="container">
      <div class="header">
        <h1>🚀 You’re Invited!</h1>
        <p>Join <strong>${organizationName}</strong> on SyncSpace</p>
      </div>

      <div class="content">
        <p>Hey there 👋,</p>
        <p>${message}</p>

        <div class="invite-box">
          <h3>Invitation Code</h3>
          <div class="invite-code">${inviteCode}</div>
        </div>

        <p><strong>How to join:</strong></p>
        <ol>
          <li>Go to <strong>SyncSpace</strong></li>
          <li>Click <em>"Join Organization"</em></li>
          <li>Enter the invite code above</li>
        </ol>

        <p style="margin-top: 25px;">
          We’re excited to have you join our team — let’s build something amazing together!
        </p>

        <div style="text-align: center;">
          <a href="https://syncspace-client.vercel.app/home/dashboard" class="button">Join Now</a>
        </div>
      </div>

      <div class="footer">
        <p>This email was sent by <strong>SyncSpace</strong> — your collaborative hub for modern teams.</p>
        <p style="margin-top: 8px;">If you didn’t request this, you can safely ignore it.</p>
      </div>
    </div>
  </body>
  </html>
  `;
};
