export const generateInviteEmail = (organizationName, message, inviteCode) => {
  const year = new Date().getFullYear();
  return `
  <!DOCTYPE html>
  <html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <meta name="format-detection" content="telephone=no" />
    <meta name="x-apple-disable-message-reformatting" />
    <title>Team Invitation - Join ${organizationName} on SyncSpace</title>
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

      .glass-invite-container {
        background: rgba(34, 197, 94, 0.08);
        border: 1px solid rgba(34, 197, 94, 0.25);
        border-radius: 20px;
        padding: 35px 25px;
        margin: 35px 0;
        text-align: center;
        position: relative;
        overflow: hidden;
      }

      .glass-invite-container::before {
        content: '';
        position: absolute;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background: rgba(255, 255, 255, 0.03);
        border-radius: 20px;
      }

      .invite-label {
        margin: 0 0 15px;
        color: #86efac;
        font-weight: 600;
        font-size: 14px;
        text-transform: uppercase;
        letter-spacing: 1px;
        position: relative;
        z-index: 1;
      }

      .glass-invite-code {
        font-family: 'SF Mono', 'Monaco', 'Inconsolata', 'Roboto Mono', 'Courier New', monospace;
        font-size: 32px;
        font-weight: 800;
        color: #ffffff;
        background: linear-gradient(135deg, #22c55e, #16a34a);
        border-radius: 12px;
        padding: 20px 30px;
        display: inline-block;
        letter-spacing: 6px;
        position: relative;
        z-index: 1;
        box-shadow: 
          0 8px 20px rgba(34, 197, 94, 0.3),
          inset 0 1px 0 rgba(255, 255, 255, 0.2);
      }

      .glass-button {
        display: inline-block;
        margin: 30px 0;
        padding: 16px 40px;
        background: rgba(34, 197, 94, 0.15);
        border: 1px solid rgba(34, 197, 94, 0.3);
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
        background: linear-gradient(135deg, rgba(34, 197, 94, 0.2), rgba(22, 163, 74, 0.2));
        border-radius: 12px;
      }

      .glass-button span {
        position: relative;
        z-index: 1;
      }

      .steps-container {
        background: rgba(59, 130, 246, 0.08);
        border: 1px solid rgba(59, 130, 246, 0.2);
        border-radius: 16px;
        padding: 25px;
        margin: 30px 0;
      }

      .steps-title {
        color: #93c5fd;
        font-weight: 600;
        font-size: 16px;
        margin: 0 0 20px;
        text-align: center;
      }

      .steps-list {
        list-style: none;
        padding: 0;
        margin: 0;
      }

      .steps-list li {
        color: #e8e8ff;
        margin: 12px 0;
        padding-left: 30px;
        position: relative;
        font-size: 15px;
      }

      .steps-list li::before {
        content: counter(step-counter);
        counter-increment: step-counter;
        position: absolute;
        left: 0;
        top: 0;
        background: linear-gradient(135deg, #667eea, #764ba2);
        color: white;
        width: 20px;
        height: 20px;
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 12px;
        font-weight: 600;
      }

      .steps-list {
        counter-reset: step-counter;
      }

      .organization-highlight {
        background: rgba(168, 85, 247, 0.1);
        border: 1px solid rgba(168, 85, 247, 0.3);
        border-radius: 12px;
        padding: 20px;
        margin: 25px 0;
        text-align: center;
      }

      .organization-name {
        color: #c4b5fd;
        font-size: 24px;
        font-weight: 700;
        margin: 0;
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
        
        .glass-invite-code {
          font-size: 24px;
          padding: 15px 20px;
          letter-spacing: 3px;
        }
        
        .glass-button {
          padding: 14px 30px;
        }
        
        .organization-name {
          font-size: 20px;
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
          <h1>🚀 Team Invitation</h1>
          <p>You've been invited to collaborate on <strong>SyncSpace</strong></p>
        </div>

        <div class="glass-content">
          <div class="content-inner">
            <p>Hello there! 👋</p>
            
            <div class="organization-highlight">
              <p class="organization-name">${organizationName}</p>
            </div>
            
            <p>${message}</p>

            <p>You've been invited to join an amazing team workspace where collaboration meets innovation. SyncSpace provides professional-grade tools for seamless team communication and project management.</p>

            <div class="glass-invite-container">
              <div class="invite-label">Your Invitation Code</div>
              <div class="glass-invite-code">${inviteCode}</div>
            </div>

            <div class="steps-container">
              <div class="steps-title">How to Join Your Team</div>
              <ol class="steps-list">
                <li>Visit SyncSpace platform</li>
                <li>Click "Join Organization" button</li>
                <li>Enter your invitation code above</li>
                <li>Complete your profile setup</li>
              </ol>
            </div>

            <p>Ready to get started? Click the button below to join your team workspace:</p>

            <div style="text-align: center;">
              <a href="https://syncspace-client.vercel.app/home/dashboard" class="glass-button">
                <span>Join Team Workspace</span>
              </a>
            </div>

            <p style="margin-top: 30px; color: #d1d5db;">
              This invitation was sent by a team member from ${organizationName}. If you believe this was sent in error, you can safely ignore this email.
            </p>
          </div>
        </div>

        <div class="glass-footer">
          <div class="footer-content">
            <p>&copy; ${year} <strong>SyncSpace</strong> - Professional Team Collaboration Platform</p>
            <p style="margin-top: 8px; font-size: 12px;">This invitation email was sent from SyncSpace. Please do not reply to this email.</p>
          </div>
        </div>
      </div>
    </div>
  </body>
  </html>
  `;
};